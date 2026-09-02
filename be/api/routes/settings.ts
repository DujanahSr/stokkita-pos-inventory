import express, { Request, Response } from "express";
import pool from "../db.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();

// Auto create & migrate store_settings table if not exists
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
        enable_tax BOOLEAN DEFAULT FALSE,
        tax_rate NUMERIC(5, 2) DEFAULT 11.0,
        tax_type VARCHAR(20) DEFAULT 'EXCLUSIVE', -- 'EXCLUSIVE' (tambah PPN) or 'INCLUSIVE' (sudah termasuk PPN)
        enable_service_charge BOOLEAN DEFAULT FALSE,
        service_charge_rate NUMERIC(5, 2) DEFAULT 0.0,
        enable_cash_rounding BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Add columns if they don't exist yet
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='store_settings' AND column_name='enable_tax') THEN
          ALTER TABLE store_settings ADD COLUMN enable_tax BOOLEAN DEFAULT FALSE;
          ALTER TABLE store_settings ADD COLUMN tax_rate NUMERIC(5, 2) DEFAULT 11.0;
          ALTER TABLE store_settings ADD COLUMN tax_type VARCHAR(20) DEFAULT 'EXCLUSIVE';
          ALTER TABLE store_settings ADD COLUMN enable_service_charge BOOLEAN DEFAULT FALSE;
          ALTER TABLE store_settings ADD COLUMN service_charge_rate NUMERIC(5, 2) DEFAULT 0.0;
          ALTER TABLE store_settings ADD COLUMN enable_cash_rounding BOOLEAN DEFAULT TRUE;
        END IF;
      END $$;
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
      receipt_header, receipt_footer, instagram,
      enable_tax, tax_rate, tax_type,
      enable_service_charge, service_charge_rate,
      enable_cash_rounding
    } = req.body;

    const result = await pool.query(`
      INSERT INTO store_settings (
        tenant_id, store_name, slogan, phone, address, 
        receipt_header, receipt_footer, instagram,
        enable_tax, tax_rate, tax_type,
        enable_service_charge, service_charge_rate,
        enable_cash_rounding, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      ON CONFLICT (tenant_id) DO UPDATE SET
        store_name = EXCLUDED.store_name,
        slogan = EXCLUDED.slogan,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        receipt_header = EXCLUDED.receipt_header,
        receipt_footer = EXCLUDED.receipt_footer,
        instagram = EXCLUDED.instagram,
        enable_tax = EXCLUDED.enable_tax,
        tax_rate = EXCLUDED.tax_rate,
        tax_type = EXCLUDED.tax_type,
        enable_service_charge = EXCLUDED.enable_service_charge,
        service_charge_rate = EXCLUDED.service_charge_rate,
        enable_cash_rounding = EXCLUDED.enable_cash_rounding,
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
      instagram || "",
      Boolean(enable_tax),
      Number(tax_rate) || 11.0,
      tax_type || "EXCLUSIVE",
      Boolean(enable_service_charge),
      Number(service_charge_rate) || 0.0,
      enable_cash_rounding !== undefined ? Boolean(enable_cash_rounding) : true
    ]);

    res.json({
      message: "Pengaturan toko & kebijakan finansial berhasil disimpan!",
      settings: result.rows[0]
    });
  } catch (err: any) {
    console.error("PUT /api/settings error:", err);
    res.status(500).json({ message: "Gagal menyimpan pengaturan toko" });
  }
});

// GET /api/settings/backup - Export Full Tenant Database to JSON
router.get("/backup", requireRole("Admin"), async (req: Request, res: Response) => {
  try {
    const { tenant_id, tenant_name } = req.user as any;

    const [
      productsRes,
      variantsRes,
      inventoryRes,
      warehousesRes,
      membersRes,
      vouchersRes,
      suppliersRes,
      transactionsRes,
      settingsRes
    ] = await Promise.all([
      pool.query("SELECT * FROM products WHERE tenant_id = $1", [tenant_id]),
      pool.query("SELECT v.* FROM variants v JOIN products p ON v.product_id = p.id WHERE p.tenant_id = $1", [tenant_id]),
      pool.query("SELECT i.* FROM inventory i JOIN warehouses w ON i.warehouse_id = w.id WHERE w.tenant_id = $1", [tenant_id]),
      pool.query("SELECT * FROM warehouses WHERE tenant_id = $1", [tenant_id]),
      pool.query("SELECT * FROM members WHERE tenant_id = $1", [tenant_id]),
      pool.query("SELECT * FROM vouchers WHERE tenant_id = $1", [tenant_id]),
      pool.query("SELECT * FROM suppliers WHERE tenant_id = $1", [tenant_id]),
      pool.query("SELECT * FROM transactions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 500", [tenant_id]),
      pool.query("SELECT * FROM store_settings WHERE tenant_id = $1", [tenant_id])
    ]);

    const backupData = {
      system: "StokKita Enterprise POS",
      version: "2.0.0",
      backup_date: new Date().toISOString(),
      tenant_id,
      tenant_name,
      settings: settingsRes.rows[0] || null,
      warehouses: warehousesRes.rows,
      products: productsRes.rows,
      variants: variantsRes.rows,
      inventory: inventoryRes.rows,
      members: membersRes.rows,
      vouchers: vouchersRes.rows,
      suppliers: suppliersRes.rows,
      recent_transactions: transactionsRes.rows
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="stokkita_backup_${Date.now()}.json"`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err: any) {
    console.error("GET /api/settings/backup error:", err);
    res.status(500).json({ message: "Gagal membuat cadangan database: " + err.message });
  }
});

// POST /api/settings/restore - Restore Data from JSON Backup
router.post("/restore", requireRole("Admin"), async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id } = req.user as any;
    const { backup } = req.body;

    if (!backup || !backup.system || !backup.products) {
      return res.status(400).json({ message: "File cadangan JSON tidak valid atau rusak!" });
    }

    await client.query("BEGIN");

    // Restore Settings if provided
    if (backup.settings) {
      await client.query(`
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
      `, [
        tenant_id,
        backup.settings.store_name,
        backup.settings.slogan,
        backup.settings.phone,
        backup.settings.address,
        backup.settings.receipt_header,
        backup.settings.receipt_footer,
        backup.settings.instagram
      ]);
    }

    // Restore Members
    if (Array.isArray(backup.members)) {
      for (const m of backup.members) {
        await client.query(`
          INSERT INTO members (tenant_id, name, phone, email, tier, points, total_spent)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (tenant_id, phone) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            tier = EXCLUDED.tier,
            points = EXCLUDED.points,
            total_spent = EXCLUDED.total_spent
        `, [tenant_id, m.name, m.phone, m.email, m.tier || 'Silver', Number(m.points) || 0, Number(m.total_spent) || 0]);
      }
    }

    // Restore Vouchers
    if (Array.isArray(backup.vouchers)) {
      for (const v of backup.vouchers) {
        await client.query(`
          INSERT INTO vouchers (tenant_id, code, type, discount_value, min_spend, max_discount, quota, used_count)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (tenant_id, code) DO NOTHING
        `, [tenant_id, v.code, v.type, v.discount_value, v.min_spend, v.max_discount, v.quota, v.used_count || 0]);
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Pemulihan data cadangan berhasil dilakukan!" });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("POST /api/settings/restore error:", err);
    res.status(500).json({ message: "Gagal memulihkan cadangan data: " + err.message });
  } finally {
    client.release();
  }
});

export default router;
