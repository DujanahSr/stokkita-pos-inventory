import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi"),
  category: z.string().optional(),
});

export const variantSchema = z.object({
  product_id: z.string().uuid(),
  sku: z.string().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
  price_buy: z.coerce.number().nonnegative(),
  price_sell: z.coerce.number().nonnegative(),
  eoq: z.coerce.number().nonnegative().default(0),
  rop: z.coerce.number().nonnegative().default(0),
});

export const stockMutationSchema = z.object({
  from_warehouse_id: z.string().uuid(),
  to_warehouse_id: z.string().uuid(),
  items: z.array(z.object({
    variant_id: z.string().uuid(),
    qty: z.coerce.number().int().positive()
  })).min(1)
});

export const transactionSchema = z.object({
  warehouse_id: z.string().uuid(),
  type: z.enum(["Penjualan", "Retur"]),
  items: z.array(z.object({
    variant_id: z.string().uuid(),
    qty: z.coerce.number().int().positive(),
    price: z.coerce.number().nonnegative()
  })).min(1)
});
