import express from "express";
import pool from "../db.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();

//get semua po 
router.get("/", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          po.*,
          p.nama
        FROM purchase_orders po
        JOIN produk p
          ON p.id = po.produk_id
        ORDER BY po.created_at DESC
      `);
  
      res.json(result.rows);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: "Gagal mengambil PO"
      });
    }
  });

//post buat po
router.post("/", async (req, res) => {

    try {
  
      const {
        produk_id,
        qty
      } = req.body;
  
      const produk = await pool.query(
        `
        SELECT *
        FROM produk
        WHERE id=$1
        `,
        [produk_id]
      );
  
      if (produk.rows.length === 0) {
        return res.status(404).json({
          message: "Produk tidak ditemukan"
        });
      }
  
      const p = produk.rows[0];
  
      const kodePO =
        "PO" +
        Date.now();
  
      const total =
        qty * p.harga_beli;
  
      const result = await pool.query(
        `
        INSERT INTO purchase_orders
        (
          kode_po,
          produk_id,
          supplier,
          qty,
          harga_satuan,
          total
        )
        VALUES
        ($1,$2,$3,$4,$5,$6)
        RETURNING *
        `,
        [
          kodePO,
          p.id,
          p.supplier,
          qty,
          p.harga_beli,
          total
        ]
      );
  
      res.status(201).json(result.rows[0]);
  
    } catch (err) {
      console.error(err);
  
      res.status(500).json({
        message: "Gagal membuat PO"
      });
    }
  });

//put terima po
router.put("/:id/terima", requireRole("admin"), async (req, res) => {

    const client =
      await pool.connect();
  
    try {
  
      await client.query("BEGIN");
  
      const poResult =
        await client.query(
          `
          SELECT
            po.*,
            p.nama
          FROM purchase_orders po
          JOIN produk p
            ON p.id = po.produk_id
          WHERE po.id=$1
          `,
          [req.params.id]
        );
  
      if (poResult.rows.length === 0) {
        throw new Error("PO tidak ditemukan");
      }
  
      const po = poResult.rows[0];
  
      if (po.status !== "Menunggu") {
        throw new Error(
          "PO sudah diproses"
        );
      }
  
      await client.query(
        `
        UPDATE produk
        SET stok = stok + $1
        WHERE id = $2
        `,
        [
          po.qty,
          po.produk_id
        ]
      );
  
      await client.query(
        `
        UPDATE purchase_orders
        SET status='Diterima'
        WHERE id=$1
        `,
        [po.id]
      );
  
      await client.query(
        `
        INSERT INTO transaksi
        (
          tanggal,
          tipe,
          produk_id,
          produk_nama,
          qty,
          harga_satuan,
          total
        )
        VALUES
        (
          NOW(),
          'PO Diterima',
          $1,
          $2,
          $3,
          $4,
          $5
        )
        `,
        [
          po.produk_id,
          po.nama,
          po.qty,
          po.harga_satuan,
          po.total
        ]
      );
  
      await client.query("COMMIT");
  
      res.json({
        message: "PO diterima"
      });
  
    } catch (err) {
  
      await client.query("ROLLBACK");
  
      console.error(err);
  
      res.status(500).json({
        message: err.message
      });
  
    } finally {
      client.release();
    }
  });

  //put batal po
  router.put("/:id/batal", requireRole("admin"), async (req, res) => {

    try {
  
      await pool.query(
        `
        UPDATE purchase_orders
        SET status='Dibatalkan'
        WHERE id=$1
        `,
        [req.params.id]
      );
  
      res.json({
        message: "PO dibatalkan"
      });
  
    } catch (err) {
  
      console.error(err);
  
      res.status(500).json({
        message: "Gagal membatalkan PO"
      });
    }
  });

  export default router;