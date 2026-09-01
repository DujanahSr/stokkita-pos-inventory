require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  console.log("=== MIGRASI TABEL MEMBERS & CUSTOMER LOYALTY ===");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(100),
      tier VARCHAR(20) DEFAULT 'Silver',
      points INT DEFAULT 0,
      total_spent NUMERIC DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_members_tenant ON members(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
    CREATE INDEX IF NOT EXISTS idx_members_tier ON members(tier);
  `);

  // Insert sample members if empty
  const mCheck = await pool.query("SELECT id FROM members LIMIT 1");
  if (mCheck.rows.length === 0) {
    const tRes = await pool.query("SELECT id FROM tenants LIMIT 1");
    if (tRes.rows.length > 0) {
      const tenantId = tRes.rows[0].id;
      await pool.query(`
        INSERT INTO members (tenant_id, name, phone, email, tier, points, total_spent)
        VALUES 
        ($1, 'Budi Santoso', '081298765432', 'budi.santoso@gmail.com', 'Gold', 150, 4500000),
        ($1, 'Siti Nurhaliza', '085712345678', 'siti.nur@gmail.com', 'Platinum', 320, 8900000),
        ($1, 'Ahmad Fauzi', '087811223344', 'ahmad.fauzi@yahoo.com', 'Silver', 45, 1250000)
      `, [tenantId]);
      console.log("✓ Berhasil memasukkan contoh data member loyalitas");
    }
  }

  console.log("✓ Tabel members berhasil dibuat & dikonfigurasi!");
  await pool.end();
}

migrate().catch(err => {
  console.error("Gagal migrasi:", err);
  pool.end();
});
