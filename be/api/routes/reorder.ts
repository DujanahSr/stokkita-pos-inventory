import express, { Request, Response } from "express";
import pool from "../db.js";
import redisClient from "../redisClient.js";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    
    // Gabungkan PO nyata dan Saran Restock
    const result = await pool.query(`
      SELECT 
        po.id::text,
        po.kode_po,
        p.name as produk,
        v.sku as variant,
        w.name as warehouse,
        po.supplier,
        po.qty,
        po.total,
        po.status,
        po.created_at as tanggal
      FROM purchase_orders po
      JOIN variants v ON po.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN warehouses w ON po.warehouse_id = w.id
      WHERE po.tenant_id = $1
      
      UNION ALL
      
      SELECT 
        'SUG-' || i.id::text as id,
        'SUGGESTION' as kode_po,
        p.name as produk, 
        v.sku as variant,
        w.name as warehouse,
        'Supplier Pusat' as supplier,
        v.eoq as qty,
        (v.eoq * v.price_buy) as total,
        'Disarankan' as status,
        NOW() as tanggal
      FROM inventory i
      JOIN variants v ON i.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN warehouses w ON i.warehouse_id = w.id
      WHERE w.tenant_id = $1 
        AND i.qty <= v.rop
        -- Jangan sarankan jika sudah ada PO 'Menunggu' untuk varian dan gudang yang sama
        AND NOT EXISTS (
            SELECT 1 FROM purchase_orders po2 
            WHERE po2.variant_id = i.variant_id 
              AND po2.warehouse_id = i.warehouse_id 
              AND po2.status = 'Menunggu'
        )
      ORDER BY tanggal DESC
    `, [tenant_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
    try {
        const { tenant_id } = req.user as any;
        const { variant_id, warehouse_id, qty } = req.body;
        
        // Dapatkan harga beli varian
        const vRes = await pool.query('SELECT price_buy FROM variants WHERE id = $1', [variant_id]);
        if (vRes.rows.length === 0) return res.status(404).json({ message: "Varian tidak ditemukan" });
        const price = vRes.rows[0].price_buy;
        const total = price * qty;
        
        const kode_po = `PO-${Date.now()}`;
        
        await pool.query(`
            INSERT INTO purchase_orders (tenant_id, warehouse_id, variant_id, qty, total, kode_po)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [tenant_id, warehouse_id, variant_id, qty, total, kode_po]);
        
        res.json({ message: "PO berhasil dibuat" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.put("/:id/:action", async (req: Request, res: Response) => {
    try {
        const { tenant_id } = req.user as any;
        const id = req.params.id as string;
        const action = req.params.action as string;
        
        if (id.startsWith('SUG-')) {
            // Ini saran otomatis yang diterima
            if (action !== 'terima') return res.status(400).json({ message: "Saran hanya bisa diterima" });
            
            const inv_id = id.replace('SUG-', '');
            // Dapatkan detail inventori
            const iRes = await pool.query(`
                SELECT i.warehouse_id, i.variant_id, v.eoq, v.price_buy 
                FROM inventory i 
                JOIN variants v ON i.variant_id = v.id 
                WHERE i.id = $1
            `, [inv_id]);
            
            if (iRes.rows.length === 0) return res.status(404).json({ message: "Saran tidak valid" });
            
            const inv = iRes.rows[0];
            const qty = inv.eoq;
            const total = qty * inv.price_buy;
            const kode_po = `PO-${Date.now()}`;
            
            await pool.query('BEGIN');
            
            // 1. Buat PO Selesai
            await pool.query(`
                INSERT INTO purchase_orders (tenant_id, warehouse_id, variant_id, qty, total, kode_po, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'Selesai')
            `, [tenant_id, inv.warehouse_id, inv.variant_id, qty, total, kode_po]);
            
            // 2. Tambah stok
            await pool.query(`
                UPDATE inventory SET qty = qty + $1 WHERE id = $2
            `, [qty, inv_id]);
            
            await pool.query('COMMIT');
            
            if (redisClient.isOpen) {
                await redisClient.del(`inventory:${inv.warehouse_id}`);
            }
            
            return res.json({ message: "Saran diterima, stok bertambah" });
        }
        
        // PO Manual
        const poRes = await pool.query('SELECT * FROM purchase_orders WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);
        if (poRes.rows.length === 0) return res.status(404).json({ message: "PO tidak ditemukan" });
        const po = poRes.rows[0];
        
        if (po.status !== 'Menunggu') return res.status(400).json({ message: "PO sudah diproses" });
        
        if (action === 'terima') {
            await pool.query('BEGIN');
            await pool.query('UPDATE purchase_orders SET status = $1 WHERE id = $2', ['Selesai', id]);
            await pool.query('UPDATE inventory SET qty = qty + $1 WHERE warehouse_id = $2 AND variant_id = $3', [po.qty, po.warehouse_id, po.variant_id]);
            await pool.query('COMMIT');
            
            if (redisClient.isOpen) {
                await redisClient.del(`inventory:${po.warehouse_id}`);
            }
        } else if (action === 'batal') {
            await pool.query('UPDATE purchase_orders SET status = $1 WHERE id = $2', ['Batal', id]);
        }
        
        res.json({ message: "PO diproses" });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
