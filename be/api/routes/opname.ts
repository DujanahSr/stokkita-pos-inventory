import express, { Request, Response } from "express";
import pool from "../db.js";
import redisClient from "../redisClient.js";

const router = express.Router();

// GET riwayat opname (Audit Trail)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { warehouse_id } = req.query;

    let query = `
      SELECT 
        sa.id,
        sa.warehouse_id,
        w.name as warehouse_name,
        p.name as product_name,
        v.sku,
        v.size,
        v.color,
        sa.expected_qty,
        sa.actual_qty,
        sa.difference,
        sa.reason,
        u.name as created_by_name,
        sa.created_at
      FROM stock_adjustments sa
      JOIN variants v ON sa.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN warehouses w ON sa.warehouse_id = w.id
      LEFT JOIN users u ON sa.created_by = u.id
      WHERE sa.tenant_id = $1
    `;
    const params: any[] = [tenant_id];

    if (warehouse_id) {
      query += ` AND sa.warehouse_id = $2`;
      params.push(warehouse_id);
    }

    query += ` ORDER BY sa.created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil riwayat stock opname" });
  }
});

// GET riwayat opname berdasarkan warehouse_id
router.get("/:warehouse_id", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { warehouse_id } = req.params;

    const result = await pool.query(`
      SELECT 
        sa.id,
        sa.warehouse_id,
        w.name as warehouse_name,
        p.name as product_name,
        v.sku,
        v.size,
        v.color,
        sa.expected_qty,
        sa.actual_qty,
        sa.difference,
        sa.reason,
        u.name as created_by_name,
        sa.created_at
      FROM stock_adjustments sa
      JOIN variants v ON sa.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN warehouses w ON sa.warehouse_id = w.id
      LEFT JOIN users u ON sa.created_by = u.id
      WHERE sa.tenant_id = $1 AND sa.warehouse_id = $2
      ORDER BY sa.created_at DESC
      LIMIT 100
    `, [tenant_id, warehouse_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil riwayat stock opname gudang" });
  }
});

// POST submit opname baru
router.post("/", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id, id: user_id } = req.user as any;
    const { warehouse_id, variant_id, actual_qty, reason } = req.body;

    if (!warehouse_id || !variant_id || actual_qty === undefined || actual_qty === null || Number(actual_qty) < 0) {
      return res.status(400).json({ message: "Data tidak lengkap atau kuantitas fisik tidak valid" });
    }

    await client.query('BEGIN');

    // Ambil stok sistem saat ini dengan lock
    const invRes = await client.query(
      'SELECT id, qty FROM inventory WHERE warehouse_id = $1 AND variant_id = $2 FOR UPDATE',
      [warehouse_id, variant_id]
    );

    let expected_qty = 0;
    let inv_id = null;

    if (invRes.rows.length > 0) {
      expected_qty = invRes.rows[0].qty;
      inv_id = invRes.rows[0].id;
    }

    const difference = Number(actual_qty) - expected_qty;

    if (difference === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Tidak ada selisih, opname tidak diperlukan (stok fisik sama dengan stok sistem)" });
    }

    // Insert history ke tabel stock_adjustments
    await client.query(`
      INSERT INTO stock_adjustments (tenant_id, warehouse_id, variant_id, expected_qty, actual_qty, difference, reason, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [tenant_id, warehouse_id, variant_id, expected_qty, Number(actual_qty), difference, reason || 'Opname fisik rutin', user_id || null]);

    // Update atau Insert stok di inventory
    if (inv_id) {
      await client.query(`UPDATE inventory SET qty = $1 WHERE id = $2`, [Number(actual_qty), inv_id]);
    } else {
      await client.query(`
        INSERT INTO inventory (warehouse_id, variant_id, qty)
        VALUES ($1, $2, $3)
      `, [warehouse_id, variant_id, Number(actual_qty)]);
    }

    await client.query('COMMIT');

    // Invalidate Redis Cache untuk gudang ini
    if (redisClient.isOpen) {
      await redisClient.del(`inventory:${warehouse_id}`);
    }

    res.json({ message: "Stock Opname berhasil disimpan dan stok disinkronkan", difference });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
  } finally {
    client.release();
  }
});

export default router;
