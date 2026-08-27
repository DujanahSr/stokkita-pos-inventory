import express, { Request, Response } from "express";
import pool from "../db.js";
import { clearCache } from "../redisClient.js";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const result = await pool.query(`
      SELECT t.*, w.name as warehouse_name, u.name as kasir_name 
      FROM transactions t
      JOIN warehouses w ON t.warehouse_id = w.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.tenant_id = $1
      ORDER BY t.created_at DESC
      LIMIT 50
    `, [tenant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id, id: user_id } = req.user as any;
    const { warehouse_id, type, items } = req.body;
    
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
    
    // Insert Transaction
    const tRes = await client.query(`
      INSERT INTO transactions (tenant_id, warehouse_id, user_id, type, total_amount)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [tenant_id, warehouse_id, user_id, type, total_amount]);
    
    const trxId = tRes.rows[0].id;
    
    // Insert Items
    for (let item of items) {
      await client.query(`
        INSERT INTO transaction_items (transaction_id, variant_id, qty, price, subtotal)
        VALUES ($1, $2, $3, $4, $5)
      `, [trxId, item.variant_id, item.qty, item.price, item.qty * item.price]);
    }
    
    await client.query("COMMIT"); // COMMIT TRANSACTION
    
    // INVALIDATE CACHE REDIS
    await clearCache(`inventory:${warehouse_id}`);
    
    res.json({ message: "Transaksi sukses", transaction_id: trxId });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

export default router;
