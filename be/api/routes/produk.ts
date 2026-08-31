import express, { Request, Response } from "express";
import pool from "../db.js";
import { clearCache } from "../redisClient.js";

const router = express.Router();

// GET /api/produk - List all products with their variants
router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { category, search } = req.query;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.category,
        p.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', v.id,
              'sku', v.sku,
              'size', v.size,
              'color', v.color,
              'price_buy', v.price_buy,
              'price_sell', v.price_sell,
              'rop', v.rop,
              'eoq', v.eoq,
              'created_at', v.created_at
            ) ORDER BY v.sku ASC
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'
        ) as variants,
        COUNT(v.id) as variant_count
      FROM products p
      LEFT JOIN variants v ON p.id = v.product_id
      WHERE p.tenant_id = $1
    `;

    const params: any[] = [tenant_id];

    if (category) {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR v.sku ILIKE $${params.length})`;
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error("GET /api/produk error:", err);
    res.status(500).json({ message: "Gagal mengambil daftar produk" });
  }
});

// GET /api/produk/categories - List distinct categories
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const result = await pool.query(`
      SELECT DISTINCT category 
      FROM products 
      WHERE tenant_id = $1 AND category IS NOT NULL AND category != ''
      ORDER BY category ASC
    `, [tenant_id]);

    res.json(result.rows.map(r => r.category));
  } catch (err) {
    console.error("GET /api/produk/categories error:", err);
    res.status(500).json({ message: "Gagal mengambil kategori" });
  }
});

// POST /api/produk - Create new product with variants and initialize warehouse stock
router.post("/", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id } = req.user as any;
    const { name, category, variants } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Nama produk wajib diisi" });
    }

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ message: "Minimal daftarkan 1 varian produk" });
    }

    await client.query("BEGIN");

    // 1. Insert Product
    const pRes = await client.query(`
      INSERT INTO products (tenant_id, name, category)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [tenant_id, name.trim(), category ? category.trim() : "Umum"]);

    const product = pRes.rows[0];

    // 2. Fetch tenant warehouses to initialize inventory
    const wRes = await client.query(`
      SELECT id FROM warehouses WHERE tenant_id = $1
    `, [tenant_id]);
    const warehouses = wRes.rows;

    // 3. Insert Variants and Inventory rows
    const insertedVariants = [];
    for (const v of variants) {
      if (!v.sku || !v.sku.trim()) {
        throw new Error("SKU/Barcode varian wajib diisi");
      }

      // Check unique SKU
      const skuCheck = await client.query(`
        SELECT v.id FROM variants v
        JOIN products p ON v.product_id = p.id
        WHERE p.tenant_id = $1 AND LOWER(v.sku) = LOWER($2)
      `, [tenant_id, v.sku.trim()]);

      if (skuCheck.rows.length > 0) {
        throw new Error(`SKU "${v.sku}" sudah digunakan oleh produk lain`);
      }

      const priceBuy = Number(v.price_buy) || 0;
      const priceSell = Number(v.price_sell) || 0;
      const rop = Number(v.rop) || 10;
      const eoq = Number(v.eoq) || 50;

      const vRes = await client.query(`
        INSERT INTO variants (product_id, sku, size, color, price_buy, price_sell, rop, eoq)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        product.id,
        v.sku.trim(),
        v.size ? v.size.trim() : "-",
        v.color ? v.color.trim() : "-",
        priceBuy,
        priceSell,
        rop,
        eoq
      ]);

      const newVariant = vRes.rows[0];
      insertedVariants.push(newVariant);

      // Initialize inventory row for every warehouse
      for (const w of warehouses) {
        const initialQty = Number(v.initial_stock) || 0;
        await client.query(`
          INSERT INTO inventory (warehouse_id, variant_id, qty)
          VALUES ($1, $2, $3)
          ON CONFLICT (warehouse_id, variant_id) DO NOTHING
        `, [w.id, newVariant.id, initialQty]);

        await clearCache(`inventory:${w.id}`);
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Produk dan varian berhasil didaftarkan",
      product: {
        ...product,
        variants: insertedVariants
      }
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("POST /api/produk error:", err);
    res.status(400).json({ message: err.message || "Gagal mendaftarkan produk baru" });
  } finally {
    client.release();
  }
});

// PUT /api/produk/:id - Update product
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { id } = req.params;
    const { name, category } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Nama produk tidak boleh kosong" });
    }

    const result = await pool.query(`
      UPDATE products
      SET name = $1, category = $2
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
    `, [name.trim(), category ? category.trim() : "Umum", id, tenant_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    res.json({ message: "Produk berhasil diperbarui", product: result.rows[0] });
  } catch (err: any) {
    console.error("PUT /api/produk error:", err);
    res.status(500).json({ message: "Gagal memperbarui produk" });
  }
});

// DELETE /api/produk/:id - Delete product and variants
router.delete("/:id", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id } = req.user as any;
    const { id } = req.params;

    await client.query("BEGIN");

    // Check if any variant in this product is referenced in transactions
    const trxCheck = await client.query(`
      SELECT ti.id 
      FROM transaction_items ti
      JOIN variants v ON ti.variant_id = v.id
      WHERE v.product_id = $1
      LIMIT 1
    `, [id]);

    if (trxCheck.rows.length > 0) {
      throw new Error("Produk tidak dapat dihapus karena sudah memiliki riwayat transaksi penjualan/retur");
    }

    // Delete inventory records
    await client.query(`
      DELETE FROM inventory
      WHERE variant_id IN (SELECT id FROM variants WHERE product_id = $1)
    `, [id]);

    // Delete variants
    await client.query(`
      DELETE FROM variants WHERE product_id = $1
    `, [id]);

    // Delete product
    const pRes = await client.query(`
      DELETE FROM products WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, [id, tenant_id]);

    if (pRes.rows.length === 0) {
      throw new Error("Produk tidak ditemukan");
    }

    await client.query("COMMIT");

    res.json({ message: "Produk dan variannya berhasil dihapus" });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("DELETE /api/produk error:", err);
    res.status(400).json({ message: err.message || "Gagal menghapus produk" });
  } finally {
    client.release();
  }
});

// POST /api/produk/:id/variants - Add a single variant to an existing product
router.post("/:id/variants", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id } = req.user as any;
    const { id } = req.params;
    const { sku, size, color, price_buy, price_sell, rop, eoq, initial_stock } = req.body;

    if (!sku || !sku.trim()) {
      return res.status(400).json({ message: "SKU/Barcode varian wajib diisi" });
    }

    await client.query("BEGIN");

    // Verify product belongs to tenant
    const pCheck = await client.query(`
      SELECT id FROM products WHERE id = $1 AND tenant_id = $2
    `, [id, tenant_id]);

    if (pCheck.rows.length === 0) {
      throw new Error("Produk tidak ditemukan");
    }

    // Check SKU duplicate
    const skuCheck = await client.query(`
      SELECT v.id FROM variants v
      JOIN products p ON v.product_id = p.id
      WHERE p.tenant_id = $1 AND LOWER(v.sku) = LOWER($2)
    `, [tenant_id, sku.trim()]);

    if (skuCheck.rows.length > 0) {
      throw new Error(`SKU "${sku}" sudah digunakan`);
    }

    const vRes = await client.query(`
      INSERT INTO variants (product_id, sku, size, color, price_buy, price_sell, rop, eoq)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      id,
      sku.trim(),
      size ? size.trim() : "-",
      color ? color.trim() : "-",
      Number(price_buy) || 0,
      Number(price_sell) || 0,
      Number(rop) || 10,
      Number(eoq) || 50
    ]);

    const newVariant = vRes.rows[0];

    // Initialize inventory across warehouses
    const wRes = await client.query(`SELECT id FROM warehouses WHERE tenant_id = $1`, [tenant_id]);
    for (const w of wRes.rows) {
      await client.query(`
        INSERT INTO inventory (warehouse_id, variant_id, qty)
        VALUES ($1, $2, $3)
        ON CONFLICT (warehouse_id, variant_id) DO NOTHING
      `, [w.id, newVariant.id, Number(initial_stock) || 0]);

      await clearCache(`inventory:${w.id}`);
    }

    await client.query("COMMIT");

    res.status(201).json({ message: "Varian baru berhasil ditambahkan", variant: newVariant });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("POST /api/produk/:id/variants error:", err);
    res.status(400).json({ message: err.message || "Gagal menambahkan varian" });
  } finally {
    client.release();
  }
});

// PUT /api/produk/variants/:variant_id - Update a variant
router.put("/variants/:variant_id", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { variant_id } = req.params;
    const { sku, size, color, price_buy, price_sell, rop, eoq } = req.body;

    if (!sku || !sku.trim()) {
      return res.status(400).json({ message: "SKU tidak boleh kosong" });
    }

    // Verify variant belongs to tenant
    const vCheck = await pool.query(`
      SELECT v.id FROM variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.id = $1 AND p.tenant_id = $2
    `, [variant_id, tenant_id]);

    if (vCheck.rows.length === 0) {
      return res.status(404).json({ message: "Varian tidak ditemukan" });
    }

    // Check SKU duplicate (excluding self)
    const skuCheck = await pool.query(`
      SELECT v.id FROM variants v
      JOIN products p ON v.product_id = p.id
      WHERE p.tenant_id = $1 AND LOWER(v.sku) = LOWER($2) AND v.id != $3
    `, [tenant_id, sku.trim(), variant_id]);

    if (skuCheck.rows.length > 0) {
      return res.status(400).json({ message: `SKU "${sku}" sudah digunakan pada varian lain` });
    }

    const result = await pool.query(`
      UPDATE variants
      SET 
        sku = $1,
        size = $2,
        color = $3,
        price_buy = $4,
        price_sell = $5,
        rop = $6,
        eoq = $7
      WHERE id = $8
      RETURNING *
    `, [
      sku.trim(),
      size ? size.trim() : "-",
      color ? color.trim() : "-",
      Number(price_buy) || 0,
      Number(price_sell) || 0,
      Number(rop) || 10,
      Number(eoq) || 50,
      variant_id
    ]);

    res.json({ message: "Varian berhasil diperbarui", variant: result.rows[0] });
  } catch (err: any) {
    console.error("PUT /api/produk/variants error:", err);
    res.status(500).json({ message: "Gagal memperbarui varian" });
  }
});

// DELETE /api/produk/variants/:variant_id - Delete a variant
router.delete("/variants/:variant_id", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id } = req.user as any;
    const { variant_id } = req.params;

    await client.query("BEGIN");

    // Verify variant belongs to tenant
    const vCheck = await client.query(`
      SELECT v.id FROM variants v
      JOIN products p ON v.product_id = p.id
      WHERE v.id = $1 AND p.tenant_id = $2
    `, [variant_id, tenant_id]);

    if (vCheck.rows.length === 0) {
      throw new Error("Varian tidak ditemukan");
    }

    // Check transaction history
    const trxCheck = await client.query(`
      SELECT id FROM transaction_items WHERE variant_id = $1 LIMIT 1
    `, [variant_id]);

    if (trxCheck.rows.length > 0) {
      throw new Error("Varian tidak dapat dihapus karena sudah tercatat dalam riwayat transaksi kasir");
    }

    await client.query(`DELETE FROM inventory WHERE variant_id = $1`, [variant_id]);
    await client.query(`DELETE FROM variants WHERE id = $1`, [variant_id]);

    await client.query("COMMIT");

    res.json({ message: "Varian berhasil dihapus" });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("DELETE /api/produk/variants error:", err);
    res.status(400).json({ message: err.message || "Gagal menghapus varian" });
  } finally {
    client.release();
  }
});

export default router;
