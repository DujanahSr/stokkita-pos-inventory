import express, { Request, Response } from "express";
import pool from "../db.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();

// Auto create vouchers table if not exists
const initVouchersTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        code VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'PERCENT', -- 'PERCENT' or 'FIXED'
        discount_value NUMERIC(15, 2) NOT NULL,
        min_spend NUMERIC(15, 2) DEFAULT 0,
        max_discount NUMERIC(15, 2) DEFAULT 0,
        quota INT DEFAULT 100,
        used_count INT DEFAULT 0,
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, code)
      );
    `);
  } catch (err) {
    console.error("Init vouchers table error:", err);
  }
};

initVouchersTable();

// GET /api/vouchers - List all vouchers for current tenant
router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const result = await pool.query(
      "SELECT * FROM vouchers WHERE tenant_id = $1 ORDER BY created_at DESC",
      [tenant_id]
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error("GET /api/vouchers error:", err);
    res.status(500).json({ message: "Gagal mengambil daftar voucher" });
  }
});

// POST /api/vouchers - Create new voucher (Admin only)
router.post("/", requireRole("Admin"), async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { code, type = "PERCENT", discount_value, min_spend = 0, max_discount = 0, quota = 100, valid_until } = req.body;

    if (!code || !discount_value || Number(discount_value) <= 0) {
      return res.status(400).json({ message: "Kode voucher dan nilai diskon wajib diisi!" });
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

    const result = await pool.query(`
      INSERT INTO vouchers (
        tenant_id, code, type, discount_value, min_spend, max_discount, quota, valid_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      tenant_id,
      cleanCode,
      type,
      Number(discount_value),
      Number(min_spend) || 0,
      Number(max_discount) || 0,
      Number(quota) || 100,
      valid_until ? new Date(valid_until) : null
    ]);

    res.status(201).json({
      message: `Voucher promo "${cleanCode}" berhasil dibuat!`,
      voucher: result.rows[0]
    });
  } catch (err: any) {
    console.error("POST /api/vouchers error:", err);
    if (err.code === "23505") {
      return res.status(400).json({ message: "Kode voucher sudah pernah dibuat" });
    }
    res.status(500).json({ message: "Gagal membuat voucher" });
  }
});

// DELETE /api/vouchers/:id - Delete voucher
router.delete("/:id", requireRole("Admin"), async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { id } = req.params;

    await pool.query("DELETE FROM vouchers WHERE id = $1 AND tenant_id = $2", [id, tenant_id]);
    res.json({ message: "Voucher berhasil dihapus" });
  } catch (err: any) {
    console.error("DELETE /api/vouchers error:", err);
    res.status(500).json({ message: "Gagal menghapus voucher" });
  }
});

// POST /api/vouchers/validate - Validate & calculate voucher discount for POS Cashier
router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { code, cart_total } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Masukkan kode voucher" });
    }

    const cleanCode = code.trim().toUpperCase();
    const result = await pool.query(
      "SELECT * FROM vouchers WHERE tenant_id = $1 AND code = $2 AND is_active = TRUE",
      [tenant_id, cleanCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Kode voucher "${cleanCode}" tidak valid atau sudah tidak aktif` });
    }

    const voucher = result.rows[0];

    // Check expiration
    if (voucher.valid_until && new Date(voucher.valid_until) < new Date()) {
      return res.status(400).json({ message: "Voucher telah kedaluwarsa" });
    }

    // Check quota
    if (voucher.quota > 0 && voucher.used_count >= voucher.quota) {
      return res.status(400).json({ message: "Kuota penggunaan voucher telah habis" });
    }

    // Check min spend
    const currentTotal = Number(cart_total) || 0;
    if (voucher.min_spend > 0 && currentTotal < Number(voucher.min_spend)) {
      return res.status(400).json({ 
        message: `Minimal belanja untuk voucher ini adalah Rp ${new Intl.NumberFormat("id-ID").format(voucher.min_spend)}` 
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (voucher.type === "PERCENT") {
      discountAmount = (currentTotal * Number(voucher.discount_value)) / 100;
      if (voucher.max_discount > 0 && discountAmount > Number(voucher.max_discount)) {
        discountAmount = Number(voucher.max_discount);
      }
    } else {
      // FIXED
      discountAmount = Math.min(currentTotal, Number(voucher.discount_value));
    }

    res.json({
      valid: true,
      voucher_id: voucher.id,
      code: voucher.code,
      type: voucher.type,
      discount_amount: Math.round(discountAmount),
      discount_value: voucher.discount_value,
      message: `Voucher "${voucher.code}" berhasil diterapkan! Hemat Rp ${new Intl.NumberFormat("id-ID").format(discountAmount)}`
    });
  } catch (err: any) {
    console.error("POST /api/vouchers/validate error:", err);
    res.status(500).json({ message: "Gagal memvalidasi voucher" });
  }
});

export default router;
