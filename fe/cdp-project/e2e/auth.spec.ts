import { test, expect } from '@playwright/test';

test('kasir dapat login dan melihat dashboard', async ({ page }) => {
  await page.goto('/');

  // Pastikan form login muncul
  await expect(page.getByRole('heading', { name: /selamat datang/i })).toBeVisible();

  // Isi email dan password
  await page.getByPlaceholder(/email/i).fill('abu@gmail.com');
  await page.locator('input[type="password"]').fill('abu123');

  // Klik tombol login
  await page.getByRole('button', { name: /masuk/i }).click();

  // Pastikan berhasil masuk dan melihat Dashboard
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 10000 });
});
