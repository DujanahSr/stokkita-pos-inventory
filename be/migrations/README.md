# Database Migrations & Table Setup Scripts

Kumpulan skrip Node.js sekali-pakai (*one-time migration scripts*) yang digunakan untuk menginisialisasi tabel-tabel pendukung sistem di PostgreSQL / Supabase.

### Daftar Skrip:
1. `create_audit_table.cjs`: Inisialisasi tabel `audit_logs` dan indeks pelacakannya.
2. `create_cash_movements_table.cjs`: Inisialisasi tabel arus kas kasir `cash_movements`.
3. `create_members_table.cjs`: Inisialisasi skema pelanggan loyalitas `members`.
4. `create_opname_table.cjs`: Inisialisasi tabel master stok opname.
5. `create_opnames.cjs`: Setup entitas stok opname item.
6. `create_supplier_and_notification_tables.cjs`: Inisialisasi tabel `suppliers` dan notifikasi inventaris.
7. `migrate_saas_subscriptions.cjs`: Penyesuaian skema multi-tenant dan paket langganan.
8. `migrate_shifts_and_payments.cjs`: Penyesuaian skema shift kasir dan rekonsiliasi pembayaran.

> **Catatan**: Skrip-skrip ini tidak dipanggil saat runtime produksi API (server berjalan via `dist/api/index.js`).
