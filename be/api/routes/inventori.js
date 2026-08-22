import express from "express";
import pool from "../db.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router(); // koneksi PostgreSQL kamu

// =========================
// GET ALL PRODUK
// =========================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM produk ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// GET PRODUK BY ID
// =========================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM produk WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// TAMBAH PRODUK
// =========================
router.post("/", requireRole("admin"), async (req, res) => {
  try {
    const {
      id,
      nama,
      kategori,
      stok,
      safety_stock,
      harga_beli,
      harga_jual,
      supplier,
      image_url,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO produk 
      (id, nama, kategori, stok, safety_stock, harga_beli, harga_jual, supplier, image_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        id,
        nama,
        kategori,
        stok,
        safety_stock,
        harga_beli,
        harga_jual,
        supplier,
        image_url,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambah produk", error: err.message });
  }
});

// =========================
// UPDATE PRODUK
// =========================
router.put("/:id", requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nama,
      kategori,
      stok,
      safety_stock,
      harga_beli,
      harga_jual,
      supplier,
      image_url,
    } = req.body;

    const result = await pool.query(
      `UPDATE produk SET
        nama = $1,
        kategori = $2,
        stok = $3,
        safety_stock = $4,
        harga_beli = $5,
        harga_jual = $6,
        supplier = $7,
        image_url = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [
        nama,
        kategori,
        stok,
        safety_stock,
        harga_beli,
        harga_jual,
        supplier,
        image_url,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal update produk" });
  }
});

// =========================
// DELETE PRODUK
// =========================
router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM produk WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }

    res.json({ message: "Produk berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal hapus produk" });
  }
});

export default router;