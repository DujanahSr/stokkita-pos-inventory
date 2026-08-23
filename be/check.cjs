require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const queries = [
  "ALTER TABLE transaksi DISABLE ROW LEVEL SECURITY;",
  "ALTER TABLE produk DISABLE ROW LEVEL SECURITY;"
];

Promise.all(queries.map(q => pool.query(q)))
  .then(() => { console.log("RLS Disabled on transaksi and produk"); pool.end(); })
  .catch(console.error);
