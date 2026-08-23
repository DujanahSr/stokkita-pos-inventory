import { z } from "zod";

// ========================
// AUTH SCHEMAS
// ========================
export const registerSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["admin", "kasir"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

// ========================
// PRODUK SCHEMAS
// ========================
export const produkSchema = z.object({
  id: z.string().optional(),
  nama: z.string().min(1, "Nama produk wajib diisi"),
  kategori: z.string().min(1, "Kategori wajib diisi"),
  stok: z.coerce.number().int().nonnegative("Stok tidak boleh negatif"),
  safety_stock: z.coerce.number().int().nonnegative("Safety stock tidak boleh negatif"),
  harga_beli: z.coerce.number().nonnegative("Harga beli tidak boleh negatif"),
  harga_jual: z.coerce.number().nonnegative("Harga jual tidak boleh negatif"),
  supplier: z.string().optional().nullable(),
  image_url: z.string().url().optional().nullable().or(z.literal("")),
});

// ========================
// TRANSAKSI SCHEMAS
// ========================
export const transaksiSchema = z.object({
  tanggal: z.string().datetime({ message: "Format tanggal tidak valid (harus ISO-8601)" }).or(z.string().min(1)),
  tipe: z.enum(["Penjualan", "PO Diterima"], { message: "Tipe harus 'Penjualan' atau 'PO Diterima'" }),
  produk_id: z.string().min(1, "ID Produk wajib diisi"),
  produk_nama: z.string().min(1, "Nama produk wajib diisi"),
  qty: z.coerce.number().int().positive("Qty harus lebih dari 0"),
  harga_satuan: z.coerce.number().nonnegative("Harga satuan tidak boleh negatif"),
});
