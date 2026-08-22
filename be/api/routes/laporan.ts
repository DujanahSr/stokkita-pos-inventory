import express, { Request, Response } from "express";
import pool from "../db.js";
import redisClient from "../redisClient.js";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const periode = parseInt(req.query.periode as string) || 7;
    const cacheKey = `laporan:dashboard:periode:${periode}`;

    // 1. Cek apakah ada di cache Redis
    if (redisClient.isOpen) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`[Redis] Cache Hit untuk ${cacheKey}`);
        res.json(JSON.parse(cachedData));
        return;
      }
    }

    console.log(`[Redis] Cache Miss untuk ${cacheKey}, query ke DB...`);

    const dashboardQuery = `
      SELECT
        COALESCE(SUM(total),0) AS total_penjualan,
        COUNT(*) AS total_transaksi,
        COALESCE(SUM(qty),0) AS total_unit
      FROM transaksi
      WHERE tipe = 'Penjualan'
      AND tanggal >= NOW() - ($1 || ' days')::interval
    `;

    const dashboard = await pool.query(
      dashboardQuery,
      [periode]
    );

    const nilaiStok = await pool.query(`
      SELECT
      COALESCE(SUM(stok * harga_beli),0) AS total_nilai_stok
      FROM produk
    `);

    const penjualanPerHari = await pool.query(
      `
      SELECT
        DATE(tanggal) AS tanggal,
        SUM(total) AS total
      FROM transaksi
      WHERE tipe='Penjualan'
      AND tanggal >= NOW() - ($1 || ' days')::interval
      GROUP BY DATE(tanggal)
      ORDER BY tanggal
      `,
      [periode]
    );

    const topProduk = await pool.query(
      `
      SELECT
        produk_nama,
        SUM(qty) AS qty,
        SUM(total) AS total
      FROM transaksi
      WHERE tipe='Penjualan'
      AND tanggal >= NOW() - ($1 || ' days')::interval
      GROUP BY produk_nama
      ORDER BY total DESC
      LIMIT 10
      `,
      [periode]
    );

    const stokKritis = await pool.query(`
      SELECT
        id,
        nama,
        kategori,
        stok,
        safety_stock,
        (safety_stock - stok) AS kekurangan
      FROM produk
      WHERE stok < safety_stock
      ORDER BY kekurangan DESC
    `);

    const responseData = {
      summary: {
        totalPenjualan:
          Number(dashboard.rows[0].total_penjualan),
        totalTransaksi:
          Number(dashboard.rows[0].total_transaksi),
        totalUnit:
          Number(dashboard.rows[0].total_unit),
        totalNilaiStok:
          Number(nilaiStok.rows[0].total_nilai_stok),
      },

      penjualanPerHari: penjualanPerHari.rows,

      topProduk: topProduk.rows,

      stokKritis: stokKritis.rows,
    };

    // 2. Simpan hasil query ke Redis (Expire 5 menit / 300 detik)
    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
      console.log(`[Redis] Data disimpan ke cache: ${cacheKey}`);
    }

    res.json(responseData);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil laporan"
    });
  }
});

export default router;