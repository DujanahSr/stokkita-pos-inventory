require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateAuditLogs() {
  console.log("=== MIGRASI TABEL AUDIT_LOGS ===");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      module VARCHAR(50) NOT NULL,
      details JSONB DEFAULT '{}'::jsonb,
      ip_address VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
  `);

  console.log("✓ Tabel audit_logs dan indexes berhasil dibuat!");
  await pool.end();
}

migrateAuditLogs().catch(err => {
  console.error("Gagal migrasi:", err);
  pool.end();
});
