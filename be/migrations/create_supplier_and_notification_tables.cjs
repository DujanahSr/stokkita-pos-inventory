require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  console.log("=== MIGRASI TABEL SUPPLIERS & NOTIFICATIONS ===");

  await pool.query(`
    -- Tabel Suppliers
    CREATE TABLE IF NOT EXISTS suppliers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      pic_name VARCHAR(100),
      phone VARCHAR(50),
      email VARCHAR(100),
      address TEXT,
      payment_terms VARCHAR(50) DEFAULT 'NET 30',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);

    -- Tabel Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      link VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
  `);

  // Insert default supplier if table is empty
  const sCheck = await pool.query("SELECT id FROM suppliers LIMIT 1");
  if (sCheck.rows.length === 0) {
    const tRes = await pool.query("SELECT id FROM tenants LIMIT 1");
    if (tRes.rows.length > 0) {
      const tenantId = tRes.rows[0].id;
      await pool.query(`
        INSERT INTO suppliers (tenant_id, name, pic_name, phone, email, address, payment_terms)
        VALUES 
        ($1, 'PT. Mitra Manufaktur Bandung', 'Bpk. Agus Hermawan', '6281234567890', 'sales@mitrasepatu.com', 'Kawasan Industri Rancaekek No. 45, Bandung', 'NET 30'),
        ($1, 'CV. Sumber Logistik Nusantara', 'Ibu Rina Sutejo', '6285678901234', 'order@sumberlogistik.co.id', 'Jl. Daan Mogot KM 12, Jakarta Barat', 'Cash on Delivery')
      `, [tenantId]);
      console.log("✓ Berhasil memasukkan supplier default contoh");
    }
  }

  console.log("✓ Tabel suppliers dan notifications berhasil dibuat!");
  await pool.end();
}

migrate().catch(err => {
  console.error("Gagal migrasi:", err);
  pool.end();
});
