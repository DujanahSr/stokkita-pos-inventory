import express, { Request, Response } from "express";
import pool from "../db.js";
import { clearCache } from "../redisClient.js";
import { logAudit } from "../utils/auditLogger.js";
import { createNotification } from "../utils/notificationHelper.js";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { warehouse_id } = req.query;

    let query = `
      SELECT t.*, w.name as warehouse_name, u.name as kasir_name 
      FROM transactions t
      JOIN warehouses w ON t.warehouse_id = w.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.tenant_id = $1
    `;
    const params: any[] = [tenant_id];

    if (warehouse_id) {
      query += ` AND t.warehouse_id = $2`;
      params.push(warehouse_id);
    }

    query += ` ORDER BY t.created_at DESC LIMIT 50`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/lookup-receipt", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ message: "Nomor struk atau kode transaksi diperlukan" });
    }

    const cleanQuery = query.trim();

    const trxRes = await pool.query(`
      SELECT t.*, w.name as warehouse_name, u.name as kasir_name 
      FROM transactions t
      JOIN warehouses w ON t.warehouse_id = w.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.tenant_id = $1 AND (t.id::text ILIKE $2 OR t.id::text = $3)
      ORDER BY t.created_at DESC LIMIT 1
    `, [tenant_id, `${cleanQuery}%`, cleanQuery]);

    if (trxRes.rows.length === 0) {
      return res.status(404).json({ message: `Transaksi dengan kode "${cleanQuery}" tidak ditemukan!` });
    }

    const trx = trxRes.rows[0];

    const itemsRes = await pool.query(`
      SELECT ti.*, p.name as product_name, v.sku, v.size, v.color
      FROM transaction_items ti
      JOIN variants v ON ti.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE ti.transaction_id = $1
    `, [trx.id]);

    res.json({
      transaction: trx,
      items: itemsRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mencari data struk transaksi" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id, id: user_id } = req.user as any;
    const { warehouse_id, type = "Penjualan", items, payment_method = "Tunai", payment_details = {} } = req.body;
    
    if (!warehouse_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Data transaksi atau item keranjang tidak valid" });
    }

    await client.query("BEGIN"); // START TRANSACTION (Concurrency Control)
    
    let total_amount = 0;
    for (let item of items) {
      total_amount += (item.qty * item.price);
      
      // MENGGUNAKAN ROW-LEVEL LOCKING (FOR UPDATE) UNTUK MENCEGAH RACE CONDITION
      const invCheck = await client.query(`
        SELECT id, qty FROM inventory 
        WHERE warehouse_id = $1 AND variant_id = $2 
        FOR UPDATE
      `, [warehouse_id, item.variant_id]);
      
      if (invCheck.rows.length === 0) {
        throw new Error(`Item ${item.variant_id} tidak ditemukan di gudang ini`);
      }
      
      const currentQty = invCheck.rows[0].qty;
      if (type === "Penjualan" && currentQty < item.qty) {
        throw new Error(`Stok tidak mencukupi untuk item ${item.variant_id}. Sisa stok: ${currentQty}`);
      }
      
      const newQty = type === "Penjualan" ? currentQty - item.qty : currentQty + item.qty;
      
      await client.query("UPDATE inventory SET qty = $1 WHERE id = $2", [newQty, invCheck.rows[0].id]);
    }
    
    // Insert Transaction with Payment Method & Details
    const member_id = req.body.member_id;
    const discount_points = Number(req.body.discount_points) || 0;
    const redeemed_points = Number(req.body.redeemed_points) || 0;
    const final_amount = Math.max(0, total_amount - discount_points);
    const earned_points = type === "Penjualan" ? Math.floor(final_amount / 10000) : 0;

    const enrichedPaymentDetails = {
      ...payment_details,
      member_id: member_id || null,
      member_name: req.body.member_name || null,
      discount_points,
      redeemed_points,
      earned_points
    };

    const tRes = await client.query(`
      INSERT INTO transactions (tenant_id, warehouse_id, user_id, type, total_amount, payment_method, payment_details)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at
    `, [tenant_id, warehouse_id, user_id, type, final_amount, payment_method, JSON.stringify(enrichedPaymentDetails)]);
    
    const trxId = tRes.rows[0].id;
    const createdAt = tRes.rows[0].created_at;
    
    // Insert Items
    for (let item of items) {
      await client.query(`
        INSERT INTO transaction_items (transaction_id, variant_id, qty, price, subtotal)
        VALUES ($1, $2, $3, $4, $5)
      `, [trxId, item.variant_id, item.qty, item.price, item.qty * item.price]);
    }

    // Update Member Points and Total Spent if member exists
    if (member_id) {
      if (type === "Penjualan") {
        await client.query(`
          UPDATE members 
          SET 
            points = GREATEST(0, points - $1 + $2),
            total_spent = total_spent + $3
          WHERE id = $4 AND tenant_id = $5
        `, [redeemed_points, earned_points, final_amount, member_id, tenant_id]);
      } else if (type === "Retur") {
        await client.query(`
          UPDATE members 
          SET 
            total_spent = GREATEST(0, total_spent - $1)
          WHERE id = $2 AND tenant_id = $3
        `, [final_amount, member_id, tenant_id]);
      }
    }

    // Update Cashier Shift if active
    const shiftRes = await client.query(
      "SELECT id FROM cashier_shifts WHERE tenant_id = $1 AND warehouse_id = $2 AND user_id = $3 AND status = 'OPEN' LIMIT 1",
      [tenant_id, warehouse_id, user_id]
    );
    const activeShiftId = shiftRes.rows[0]?.id;

    if (type === "Penjualan" && activeShiftId) {
      let cashPart = 0;
      let nonCashPart = 0;

      if (payment_method === "Tunai") {
        cashPart = final_amount;
      } else if (payment_method === "Split" && payment_details?.split) {
        const cashSplit = payment_details.split.find((s: any) => s.method === "Tunai");
        cashPart = cashSplit ? Number(cashSplit.amount) : 0;
        nonCashPart = final_amount - cashPart;
      } else {
        nonCashPart = final_amount;
      }

      await client.query(`
        UPDATE cashier_shifts
        SET 
          total_sales = total_sales + $1,
          total_cash_sales = total_cash_sales + $2,
          total_non_cash_sales = total_non_cash_sales + $3
        WHERE id = $4
      `, [final_amount, cashPart, nonCashPart, activeShiftId]);
    } else if (type === "Retur" && activeShiftId) {
      // Retur: Pengembalian dana tunai (Cash Refund) memotong kas laci & mencatat mutasi kas keluar
      const returnReason = req.body.return_reason || req.body.payment_details?.return_reason || "Pengembalian barang pelanggan";
      
      if (payment_method === "Tunai") {
        await client.query(`
          UPDATE cashier_shifts
          SET 
            total_sales = GREATEST(0, total_sales - $1),
            total_cash_sales = GREATEST(0, total_cash_sales - $1)
          WHERE id = $2
        `, [final_amount, activeShiftId]);

        // Catat otomatis ke cash_movements sebagai CASH_OUT (Refund)
        await client.query(`
          INSERT INTO cash_movements (tenant_id, warehouse_id, shift_id, user_id, type, amount, reason, created_at)
          VALUES ($1, $2, $3, $4, 'CASH_OUT', $5, $6, NOW())
        `, [tenant_id, warehouse_id, activeShiftId, user_id, final_amount, `Refund Retur: ${returnReason}`]);
      }
    }
    
    await client.query("COMMIT"); // COMMIT TRANSACTION
    
    // Clear Redis Cache
    await clearCache(`inventory:${warehouse_id}`);

    // Non-blocking Audit Logging
    logAudit({
      tenantId: tenant_id,
      userId: user_id,
      action: `POS_TRANSACTION_${type.toUpperCase()}`,
      module: "POS",
      details: {
        transaction_id: trxId,
        type,
        payment_method,
        total_amount,
        items_count: items.length
      },
      ipAddress: req.ip || "127.0.0.1"
    });

    // Check for Low Stock (ROP Trigger) and dispatch alerts
    if (type === "Penjualan") {
      setImmediate(async () => {
        try {
          for (const item of items) {
            const check = await pool.query(`
              SELECT i.qty, v.rop, v.sku, p.name as product_name, w.name as warehouse_name
              FROM inventory i
              JOIN variants v ON i.variant_id = v.id
              JOIN products p ON v.product_id = p.id
              JOIN warehouses w ON i.warehouse_id = w.id
              WHERE i.warehouse_id = $1 AND i.variant_id = $2
            `, [warehouse_id, item.variant_id]);

            if (check.rows.length > 0) {
              const row = check.rows[0];
              const remaining = Number(row.qty);
              const ropLimit = Number(row.rop) || 10;
              if (remaining <= ropLimit) {
                createNotification({
                  tenantId: tenant_id,
                  type: "STOCK_LOW_ROP",
                  title: `⚠️ Stok Kritis: ${row.product_name} (${row.sku})`,
                  message: `Sisa stok di ${row.warehouse_name} tinggal ${remaining} pcs (Batas aman ROP: ${ropLimit} pcs). Segera terbitkan Purchase Order ke supplier!`,
                  link: "/reorder"
                });
              }
            }
          }
        } catch (nErr) {
          console.error("[ROP NOTIFICATION TRIGGER ERROR]:", nErr);
        }
      });
    }
    
    res.status(201).json({ 
      message: "Transaksi berhasil", 
      transaction_id: trxId,
      created_at: createdAt,
      payment_method,
      payment_details,
      total_amount
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

export default router;
