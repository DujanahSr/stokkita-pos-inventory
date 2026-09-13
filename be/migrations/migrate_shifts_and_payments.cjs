require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  try {
    console.log('Running database migrations...');
    
    // 1. Update transactions table
    await pool.query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'Tunai',
      ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('Updated transactions table with payment_method & payment_details.');

    // 2. Create cashier_shifts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cashier_shifts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        start_cash NUMERIC NOT NULL DEFAULT 0,
        end_cash_actual NUMERIC,
        expected_cash NUMERIC,
        difference NUMERIC,
        total_sales NUMERIC DEFAULT 0,
        total_cash_sales NUMERIC DEFAULT 0,
        total_non_cash_sales NUMERIC DEFAULT 0,
        status VARCHAR(20) DEFAULT 'OPEN',
        notes TEXT,
        opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        closed_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('Created table cashier_shifts successfully.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
