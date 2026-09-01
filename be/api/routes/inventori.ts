import express, { Request, Response } from "express";
import pool from "../db.js";
import redisClient from "../redisClient.js";

const router = express.Router();

router.get("/warehouses", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const cacheKey = `warehouses:${tenant_id}`;
    
    // REDIS CACHE GET
    if (redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log("Cache Hit:", cacheKey);
            return res.json(JSON.parse(cached));
        }
    }

    const result = await pool.query("SELECT * FROM warehouses WHERE tenant_id = $1", [tenant_id]);
    
    // REDIS CACHE SET (Expires in 1 Hour)
    if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(result.rows));
        console.log("Cache Miss, Data set to Redis:", cacheKey);
    }
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/inventory/:warehouse_id", async (req: Request, res: Response) => {
  try {
    const { warehouse_id } = req.params;
    const cacheKey = `inventory:${warehouse_id}`;
    
    // REDIS CACHE GET
    if (redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log("Cache Hit:", cacheKey);
            return res.json(JSON.parse(cached));
        }
    }

    const result = await pool.query(`
      SELECT 
        i.id,
        p.name as product_name,
        v.sku,
        v.price_sell,
        v.id as variant_id,
        v.size,
        v.color,
        i.qty,
        v.rop,
        v.eoq
      FROM inventory i
      JOIN variants v ON i.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE i.warehouse_id = $1
    `, [warehouse_id]);
    
    // REDIS CACHE SET (Expires in 5 Mins)
    if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows));
        console.log("Cache Miss, Data set to Redis:", cacheKey);
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/variants", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT v.id, p.name as produk, v.sku as variant 
      FROM variants v 
      JOIN products p ON v.product_id = p.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/transfer", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id } = req.user as any;
    const { from_warehouse_id, to_warehouse_id, variant_id, qty } = req.body;

    if (!from_warehouse_id || !to_warehouse_id || !variant_id || !qty || qty <= 0) {
      return res.status(400).json({ message: "Invalid transfer parameters" });
    }

    if (from_warehouse_id === to_warehouse_id) {
      return res.status(400).json({ message: "Gudang asal dan tujuan tidak boleh sama" });
    }

    await client.query('BEGIN');

    // Cek stok asal
    const checkStock = await client.query(
      `SELECT qty FROM inventory WHERE warehouse_id = $1 AND variant_id = $2 FOR UPDATE`,
      [from_warehouse_id, variant_id]
    );

    if (checkStock.rows.length === 0 || checkStock.rows[0].qty < qty) {
      throw new Error("Stok tidak mencukupi");
    }

    // Kurangi stok asal
    await client.query(
      `UPDATE inventory SET qty = qty - $1 WHERE warehouse_id = $2 AND variant_id = $3`,
      [qty, from_warehouse_id, variant_id]
    );

    // Tambah/Buat stok tujuan
    await client.query(
      `INSERT INTO inventory (warehouse_id, variant_id, qty)
       VALUES ($1, $2, $3)
       ON CONFLICT (warehouse_id, variant_id) DO UPDATE
       SET qty = inventory.qty + EXCLUDED.qty`,
      [to_warehouse_id, variant_id, qty]
    );

    // Catat mutasi
    await client.query(
      `INSERT INTO stock_transfers (tenant_id, from_warehouse_id, to_warehouse_id, variant_id, qty)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenant_id, from_warehouse_id, to_warehouse_id, variant_id, qty]
    );

    await client.query('COMMIT');
    
    // Invalidate Cache
    if (redisClient.isOpen) {
        await redisClient.del(`inventory:${from_warehouse_id}`);
        await redisClient.del(`inventory:${to_warehouse_id}`);
    }

    res.json({ message: "Mutasi berhasil" });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: err.message || "Server error" });
  } finally {
    client.release();
  }
});

router.get("/transfers", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const result = await pool.query(`
      SELECT 
        st.id, st.qty, st.status, st.created_at,
        w1.name as from_warehouse,
        w2.name as to_warehouse,
        p.name as product_name,
        v.sku, v.size, v.color
      FROM stock_transfers st
      JOIN warehouses w1 ON st.from_warehouse_id = w1.id
      JOIN warehouses w2 ON st.to_warehouse_id = w2.id
      JOIN variants v ON st.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE st.tenant_id = $1
      ORDER BY st.created_at DESC
      LIMIT 50
    `, [tenant_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/opname/:warehouse_id", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { warehouse_id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        sa.id,
        p.name as product_name,
        v.sku,
        sa.expected_qty,
        sa.actual_qty,
        sa.difference,
        sa.reason,
        sa.created_at
      FROM stock_adjustments sa
      JOIN variants v ON sa.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE sa.tenant_id = $1 AND sa.warehouse_id = $2
      ORDER BY sa.created_at DESC
      LIMIT 50
    `, [tenant_id, warehouse_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/opname", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id, id: user_id } = req.user as any;
    const { warehouse_id, variant_id, actual_qty, reason } = req.body;

    if (!warehouse_id || !variant_id || actual_qty === undefined || actual_qty < 0) {
      return res.status(400).json({ message: "Parameter tidak lengkap" });
    }

    await client.query('BEGIN');

    // Dapatkan stok sistem saat ini
    const invRes = await client.query(
      `SELECT id, qty FROM inventory WHERE warehouse_id = $1 AND variant_id = $2 FOR UPDATE`,
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
      return res.status(400).json({ message: "Tidak ada selisih stok (stok sudah akurat)" });
    }

    // Catat riwayat opname ke stock_adjustments
    await client.query(`
      INSERT INTO stock_adjustments (tenant_id, warehouse_id, variant_id, expected_qty, actual_qty, difference, reason, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [tenant_id, warehouse_id, variant_id, expected_qty, Number(actual_qty), difference, reason || 'Opname rutin', user_id || null]);

    if (inv_id) {
      await client.query(`UPDATE inventory SET qty = $1 WHERE id = $2`, [Number(actual_qty), inv_id]);
    } else {
      await client.query(`
        INSERT INTO inventory (warehouse_id, variant_id, qty)
        VALUES ($1, $2, $3)
      `, [warehouse_id, variant_id, Number(actual_qty)]);
    }

    await client.query('COMMIT');

    if (redisClient.isOpen) {
      await redisClient.del(`inventory:${warehouse_id}`);
    }

    res.json({ message: "Stock Opname berhasil disimpan, stok disesuaikan", difference });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// GET /api/master/cross-branch-stock - Cashier Stock Checker across all branches (Read-Only, HPP Hidden)
router.get("/cross-branch-stock", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { search } = req.query;

    let query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.category,
        v.id as variant_id,
        v.sku,
        v.size,
        v.color,
        v.price_sell,
        w.id as warehouse_id,
        w.name as warehouse_name,
        COALESCE(i.qty, 0) as stock_qty
      FROM products p
      JOIN variants v ON p.id = v.product_id
      CROSS JOIN warehouses w
      LEFT JOIN inventory i ON v.id = i.variant_id AND w.id = i.warehouse_id
      WHERE p.tenant_id = $1 AND w.tenant_id = $1
    `;
    const params: any[] = [tenant_id];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR v.sku ILIKE $${params.length} OR v.color ILIKE $${params.length} OR v.size ILIKE $${params.length} OR w.name ILIKE $${params.length})`;
    }

    query += ` ORDER BY p.name ASC, v.sku ASC, w.name ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error("GET /cross-branch-stock error:", err);
    res.status(500).json({ message: "Gagal mengambil data stok lintas cabang" });
  }
});

export default router;
