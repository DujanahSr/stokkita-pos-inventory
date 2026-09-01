import express, { Request, Response } from "express";
import pool from "../db.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();

// Auto create store_settings table if not exists
const initSettingsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID UNIQUE NOT NULL,
        store_name VARCHAR(255) DEFAULT 'StokKita Store',
        slogan VARCHAR(255) DEFAULT 'Solusi Manajemen Sepatu & Retail UMKM',
        phone VARCHAR(50) DEFAULT '081234567890',
        address TEXT DEFAULT 'Jl. Sudirman No. 123, Jakarta',
        receipt_header TEXT DEFAULT 'Selamat Datang di Toko Kami',
        receipt_footer TEXT DEFAULT 'Barang yang sudah dibeli dapat ditukar maksimal 3 hari dengan menyertakan struk ini. Terima kasih atas kunjungan Anda!',
        instagram VARCHAR(100) DEFAULT '@stokkita_official',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error("Init store_settings table error:", err);
  }
};

initSettingsTable();

// GET /api/settings - Get store settings for current tenant
router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;

    let result = await pool.query(
      "SELECT * FROM store_settings WHERE tenant_id = $1",
      [tenant_id]
    );

    if (result.rows.length === 0) {
      // Auto insert default settings for this tenant
      const defaultRes = await pool.query(`
        INSERT INTO store_settings (tenant_id, store_name)
        VALUES ($1, 'StokKita Store')
        RETURNING *
      `, [tenant_id]);
      return res.json(defaultRes.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("GET /api/settings error:", err);
    res.status(500).json({ message: "Gagal mengambil pengaturan toko" });
  }
});

// PUT /api/settings - Update store settings (Admin only)
router.put("/", requireRole("Admin"), async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { 
      store_name, slogan, phone, address, 
      receipt_header, receipt_footer, instagram 
    } = req.body;

    const result = await pool.query(`
      INSERT INTO store_settings (
        tenant_id, store_name, slogan, phone, address, 
        receipt_header, receipt_footer, instagram, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        store_name = EXCLUDED.store_name,
        slogan = EXCLUDED.slogan,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        receipt_header = EXCLUDED.receipt_header,
        receipt_footer = EXCLUDED.receipt_footer,
        instagram = EXCLUDED.instagram,
        updated_at = NOW()
      RETURNING *
    `, [
      tenant_id,
      store_name || "StokKita Store",
      slogan || "",
      phone || "",
      address || "",
      receipt_header || "",
      receipt_footer || "",
      instagram || ""
    ]);

    res.json({
      message: "Pengaturan profil toko & struk thermal berhasil disimpan!",
      settings: result.rows[0]
    });
  } catch (err: any) {
    console.error("PUT /api/settings error:", err);
    res.status(500).json({ message: "Gagal menyimpan pengaturan toko" });
  }
});

export default router;
