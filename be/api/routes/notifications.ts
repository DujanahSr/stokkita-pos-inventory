import express, { Request, Response } from "express";
import pool from "../db.js";

const router = express.Router();

// GET /api/notifications - List recent notifications, auto-sync stock alerts, and unread count
router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;

    // Auto-detect currently critical / deficit stock and ensure proactive notifications exist
    try {
      const criticalStockRes = await pool.query(`
        SELECT 
          i.qty,
          COALESCE(v.rop, 10) as rop,
          v.sku,
          p.name as product_name,
          w.name as warehouse_name
        FROM inventory i
        JOIN variants v ON i.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        JOIN warehouses w ON i.warehouse_id = w.id
        WHERE p.tenant_id = $1 
          AND (i.qty <= COALESCE(v.rop, 10))
        ORDER BY i.qty ASC
        LIMIT 10
      `, [tenant_id]);

      for (const row of criticalStockRes.rows) {
        const title = `⚠️ Stok Kritis: ${row.product_name} (${row.sku})`;
        
        // Prevent duplicate alert within last 6 hours
        const existCheck = await pool.query(`
          SELECT id FROM notifications 
          WHERE tenant_id = $1 AND title = $2 AND created_at >= NOW() - INTERVAL '6 hours'
          LIMIT 1
        `, [tenant_id, title]);

        if (existCheck.rows.length === 0) {
          const limit = Number(row.rop) || 10;
          const msg = `Sisa stok di ${row.warehouse_name} saat ini ${row.qty} pcs (Batas aman: ${limit} pcs). Segera lakukan Purchase Order!`;
          await pool.query(`
            INSERT INTO notifications (tenant_id, type, title, message, is_read, link, created_at)
            VALUES ($1, 'STOCK_LOW_ROP', $2, $3, false, '/reorder', NOW())
          `, [tenant_id, title, msg]);
        }
      }
    } catch (syncErr) {
      console.error("[AUTO-NOTIFICATION SYNC ERROR]:", syncErr);
    }

    const [listRes, countRes] = await Promise.all([
      pool.query(`
        SELECT * FROM notifications 
        WHERE tenant_id = $1 
        ORDER BY created_at DESC 
        LIMIT 30
      `, [tenant_id]),
      pool.query(`
        SELECT COUNT(*) as unread_count 
        FROM notifications 
        WHERE tenant_id = $1 AND is_read = false
      `, [tenant_id])
    ]);

    res.json({
      notifications: listRes.rows,
      unread_count: Number(countRes.rows[0]?.unread_count || 0)
    });
  } catch (err: any) {
    console.error("GET /api/notifications error:", err);
    res.status(500).json({ message: "Gagal mengambil notifikasi" });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put("/read-all", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    await pool.query(`
      UPDATE notifications SET is_read = true WHERE tenant_id = $1 AND is_read = false
    `, [tenant_id]);

    res.json({ message: "Semua notifikasi ditandai telah dibaca" });
  } catch (err: any) {
    console.error("PUT /api/notifications/read-all error:", err);
    res.status(500).json({ message: "Gagal memperbarui notifikasi" });
  }
});

// PUT /api/notifications/:id/read - Mark one as read
router.put("/:id/read", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { id } = req.params;

    await pool.query(`
      UPDATE notifications SET is_read = true WHERE id = $1 AND tenant_id = $2
    `, [id, tenant_id]);

    res.json({ message: "Notifikasi telah dibaca" });
  } catch (err: any) {
    console.error("PUT /api/notifications/:id/read error:", err);
    res.status(500).json({ message: "Gagal memperbarui notifikasi" });
  }
});

export default router;
