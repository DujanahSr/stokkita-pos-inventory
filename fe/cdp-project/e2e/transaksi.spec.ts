import { test, expect } from '@playwright/test';

test.describe('Skenario Transaksi', () => {
  // Sebelum setiap test, login dulu sebagai kasir
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Login
    await page.getByPlaceholder(/email/i).fill('abu@gmail.com');
    await page.locator('input[type="password"]').fill('abu123');
    await page.getByRole('button', { name: /masuk/i }).click();

    // Tunggu sampai masuk ke Dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test('kasir dapat membuat transaksi penjualan baru', async ({ page }) => {
    // 1. Pindah ke halaman transaksi menggunakan navigasi
    await page.getByRole('link', { name: /transaksi/i }).click();

    // Pastikan berada di halaman Transaksi
    await expect(page.getByRole('heading', { name: 'Transaksi', exact: true })).toBeVisible();

    // 2. Klik tombol "Tambah Transaksi"
    await page.getByRole('button', { name: /tambah transaksi/i }).click();

    // 3. Pastikan modal tambah transaksi muncul
    await expect(page.getByRole('heading', { name: /tambah transaksi/i })).toBeVisible();

    // 4. Isi form transaksi
    // Pilih produk pertama dari dropdown (index 1 karena index 0 adalah "Pilih produk")
    await page.locator('select').nth(1).selectOption({ index: 1 });
    
    // Isi Qty
    // Menggunakan getByLabel mungkin gagal jika struktur DOM tidak terkait langsung
    // Alternatif menggunakan locator tipe number
    const inputs = page.locator('input[type="number"]');
    await inputs.nth(0).fill('2'); // Qty

    // 5. Klik "Simpan"
    await page.getByRole('button', { name: 'Simpan', exact: true }).click();

    // 6. Pastikan modal "Transaksi Berhasil" muncul
    await expect(page.getByText('Transaksi berhasil disimpan')).toBeVisible();
  });
});
