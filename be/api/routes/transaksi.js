import express from "express";
import pool from "../db.js";
import { requireRole } from "../middleware/auth.js";
import PDFDocument from "pdfkit";

const router = express.Router();

// =========================
// GET ALL TRANSAKSI
// =========================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM transaksi ORDER BY tanggal DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// GET TRANSAKSI HARI INI (KPI DASHBOARD)
// =========================
router.get("/today", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_transaksi,
        COALESCE(SUM(CASE WHEN tipe = 'Penjualan' THEN total END),0) AS penjualan_hari_ini,
        COALESCE(SUM(CASE WHEN tipe = 'PO Diterima' THEN total END),0) AS po_diterima_hari_ini
      FROM transaksi
      WHERE DATE(tanggal) = CURRENT_DATE;
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// =========================
// TAMBAH TRANSAKSI
// =========================
router.post("/", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      tanggal,
      tipe,
      produk_id,
      produk_nama,
      qty,
      harga_satuan,
    } = req.body;

    const total = qty * harga_satuan;

    // insert transaksi
    const result = await client.query(
      `INSERT INTO transaksi
      (tanggal, tipe, produk_id, produk_nama, qty, harga_satuan, total)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        tanggal,
        tipe,
        produk_id,
        produk_nama,
        qty,
        harga_satuan,
        total,
      ]
    );

    // =========================
    // UPDATE STOK PRODUK
    // =========================
    if (tipe === "Penjualan") {
      await client.query(
        `UPDATE produk SET stok = stok - $1 WHERE id = $2`,
        [qty, produk_id]
      );
    }

    if (tipe === "PO Diterima") {
      await client.query(
        `UPDATE produk SET stok = stok + $1 WHERE id = $2`,
        [qty, produk_id]
      );
    }

    await client.query("COMMIT");

    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Gagal menambah transaksi" });
  } finally {
    client.release();
  }
});

// =========================
// DELETE TRANSAKSI (opsional)
// =========================
router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM transaksi WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    res.json({ message: "Transaksi berhasil dihapus" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal hapus transaksi" });
  }
});

// =========================
// GET RECEIPT PDF
// =========================
router.get("/:id/receipt", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM transaksi WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Transaksi tidak ditemukan" });
    }

    const t = result.rows[0];

    const doc = new PDFDocument({ size: 'A6', margin: 20 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=receipt-${t.id}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(12).text('StokKita', { align: 'center' });
    doc.fontSize(9).text('Manajemen UMKM', { align: 'center' });
    doc.moveDown(0.5);

    // Transaction meta
    doc.fontSize(8).text(`No: ${t.id}`);
    doc.text(`Tanggal: ${new Date(t.tanggal).toLocaleString('id-ID')}`);
    doc.text(`Tipe: ${t.tipe}`);
    doc.moveDown(0.5);

    // Item
    doc.fontSize(9).text(`${t.produk_nama}`);
    doc.fontSize(8).text(`Qty: ${t.qty}  x  ${Number(t.harga_satuan).toLocaleString('id-ID')}`);
    doc.moveDown(0.5);

    // Totals
    doc.fontSize(10).text(`TOTAL: Rp ${Number(t.total).toLocaleString('id-ID')}`, { align: 'right' });
    doc.moveDown(1);

    doc.fontSize(8).text('Terima kasih atas pembelian Anda!', { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal membuat receipt', error: err.message });
  }
});

export default router;