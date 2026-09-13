require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  console.log("=== MIGRASI TABEL CASH_MOVEMENTS (PETTY CASH KASIR) ===");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cash_movements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
      shift_id UUID REFERENCES cashier_shifts(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      type VARCHAR(20) NOT NULL, -- 'CASH_IN' or 'CASH_OUT'
      amount NUMERIC NOT NULL,
      reason VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_cash_movements_shift ON cash_movements(shift_id);
    CREATE INDEX IF NOT EXISTS idx_cash_movements_warehouse ON cash_movements(warehouse_id);
  `);

  console.log("✓ Tabel cash_movements berhasil dibuat!");
  await pool.end();
}

migrate().catch(err => {
  console.error("Gagal migrasi cash_movements:", err);
  pool.end();
});
