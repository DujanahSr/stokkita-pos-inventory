require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  try {
    console.log('--- Migrasi Skema Tabel Tenants untuk Langganan SaaS ---');

    await pool.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(30) DEFAULT 'Starter',
      ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
      ADD COLUMN IF NOT EXISTS max_branches INTEGER DEFAULT 2,
      ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    console.log('Kolom langganan SaaS berhasil ditambahkan ke tabel tenants.');

    // Pastikan tenant yang sudah ada memiliki status 'active' dan paket
    await pool.query(`
      UPDATE tenants 
      SET 
        subscription_status = COALESCE(subscription_status, 'active'),
        subscription_plan = COALESCE(subscription_plan, 'Pro'),
        subscription_expires_at = COALESCE(subscription_expires_at, NOW() + INTERVAL '60 days'),
        max_branches = COALESCE(max_branches, 5)
      WHERE subscription_status IS NULL OR subscription_plan IS NULL;
    `);

    console.log('Existing tenants di-update menjadi paket Pro aktif.');

    // Cek atau buat user Superadmin
    const superadminEmail = 'owner@stokkita.id';
    const checkUser = await pool.query('SELECT id, role FROM users WHERE email = $1', [superadminEmail]);

    // Ambil 1 tenant ID utama untuk foreign key jika dibutuhkan
    const primaryTenantRes = await pool.query('SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1');
    const primaryTenantId = primaryTenantRes.rows[0]?.id;

    const hashedPassword = await bcrypt.hash('OwnerStokKita2026!', 10);

    if (checkUser.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (tenant_id, name, email, password, role)
        VALUES ($1, 'Platform Owner', $2, $3, 'Superadmin');
      `, [primaryTenantId, superadminEmail, hashedPassword]);
      console.log('Akun Superadmin berhasil dibuat: owner@stokkita.id / OwnerStokKita2026!');
    } else {
      await pool.query(`
        UPDATE users 
        SET role = 'Superadmin', password = $1, name = 'Platform Owner'
        WHERE email = $2;
      `, [hashedPassword, superadminEmail]);
      console.log('Akun Superadmin yang sudah ada di-update perannya menjadi Superadmin.');
    }

    console.log('Migrasi SaaS Subscription Selesai Sukses!');
  } catch (err) {
    console.error('Error saat migrasi:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
