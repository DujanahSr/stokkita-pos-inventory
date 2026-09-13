require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_opnames (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        warehouse_id UUID NOT NULL REFERENCES warehouses(id),
        variant_id UUID NOT NULL REFERENCES variants(id),
        expected_qty INTEGER NOT NULL,
        actual_qty INTEGER NOT NULL,
        difference INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("Table stock_opnames created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    pool.end();
  }
}

run();
