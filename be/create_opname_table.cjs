require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
        variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
        expected_qty INTEGER NOT NULL,
        actual_qty INTEGER NOT NULL,
        difference INTEGER NOT NULL,
        reason TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Table stock_adjustments created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await pool.end();
  }
}

main();
