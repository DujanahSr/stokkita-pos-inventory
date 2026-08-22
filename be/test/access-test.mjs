import process from 'node:process';

const BASE = process.env.BASE_URL || 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@umkm.local';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';
const KASIR_EMAIL = process.env.KASIR_EMAIL || 'kasir.auto@test.local';
const KASIR_PASS = process.env.KASIR_PASSWORD || 'test123';

async function req(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, opts);
  let body;
  try { body = await res.json(); } catch { body = await res.text(); }
  return { status: res.status, body };
}

async function main() {
  console.log('Base API:', BASE);

  // 1) Login admin
  console.log('- Login admin...');
  const loginAdmin = await req('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }) });
  if (loginAdmin.status !== 200) {
    console.error('Gagal login admin:', loginAdmin.status, loginAdmin.body);
    process.exit(2);
  }
  const adminToken = loginAdmin.body.token;
  console.log('  ok, got admin token');

  // 2) Ensure kasir exists (create via admin)
  console.log('- Pastikan kasir ada (membuat jika belum)...');
  const createKasir = await req('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify({ nama: 'Kasir Auto', email: KASIR_EMAIL, password: KASIR_PASS, role: 'kasir' }) });
  if (createKasir.status === 201) {
    console.log('  kasir dibuat');
  } else if (createKasir.status === 400 && typeof createKasir.body === 'object' && createKasir.body.message && createKasir.body.message.toLowerCase().includes('sudah')) {
    console.log('  kasir sudah ada');
  } else if (createKasir.status === 403 || createKasir.status === 401) {
    console.warn('  register membutuhkan admin token; request dikembalikan:', createKasir.status);
  } else {
    console.log('  register response:', createKasir.status, createKasir.body);
  }

  // 3) Login kasir
  console.log('- Login kasir...');
  const loginKasir = await req('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: KASIR_EMAIL, password: KASIR_PASS }) });
  if (loginKasir.status !== 200) {
    console.error('Gagal login kasir:', loginKasir.status, loginKasir.body);
    process.exit(3);
  }
  const kasirToken = loginKasir.body.token;
  console.log('  ok, got kasir token');

  // 4) Kasir coba tambah produk (harus 403)
  console.log('- Kasir mencoba menambah produk (mengharapkan 403)...');
  const shortId = 'p' + (Date.now() % 100000000).toString();
  const produkPayload = { id: shortId, nama: 'Produk Test ' + Date.now(), kategori: 'Test', stok: 10, safety_stock: 2, harga_beli: 1000, harga_jual: 1500, supplier: 'Auto' };
  const kasirCreate = await req('/produk', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${kasirToken}` }, body: JSON.stringify(produkPayload) });
  console.log('  response:', kasirCreate.status, kasirCreate.body && kasirCreate.body.message ? kasirCreate.body.message : kasirCreate.body);

  // 5) Admin coba tambah produk (harus 201)
  console.log('- Admin mencoba menambah produk (mengharapkan 201)...');
  const adminCreate = await req('/produk', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(produkPayload) });
  console.log('  response:', adminCreate.status, adminCreate.body && adminCreate.body.id ? `created id=${adminCreate.body.id}` : adminCreate.body);

  // Evaluate expectations
  const kasirOk = kasirCreate.status === 403 || kasirCreate.status === 401;
  const adminOk = adminCreate.status === 201 || adminCreate.status === 200;

  if (kasirOk && adminOk) {
    console.log('\nRESULT: ✅ Role-based access checks passed (kasir denied, admin allowed)');
    process.exit(0);
  } else {
    console.error('\nRESULT: ❌ Role-based access checks FAILED');
    if (!kasirOk) console.error('  - Kasir expected 403 but got', kasirCreate.status);
    if (!adminOk) console.error('  - Admin expected 201 but got', adminCreate.status);
    process.exit(4);
  }
}

main().catch((err) => {
  console.error('Error running tests:', err);
  process.exit(1);
});
