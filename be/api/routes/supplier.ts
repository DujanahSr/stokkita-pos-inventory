import express, { Request, Response } from "express";
import pool from "../db.js";

const router = express.Router();

// GET /api/supplier - List suppliers
router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { search } = req.query;

    let query = `
      SELECT 
        s.*,
        COUNT(po.id) as total_po_count
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.name ILIKE po.supplier AND s.tenant_id = po.tenant_id
      WHERE s.tenant_id = $1
    `;
    const params: any[] = [tenant_id];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (s.name ILIKE $${params.length} OR s.pic_name ILIKE $${params.length} OR s.phone ILIKE $${params.length})`;
    }

    query += ` GROUP BY s.id ORDER BY s.name ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error("GET /api/supplier error:", err);
    res.status(500).json({ message: "Gagal mengambil data supplier" });
  }
});

// POST /api/supplier - Create supplier
router.post("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { name, pic_name, phone, email, address, payment_terms } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Nama vendor/supplier wajib diisi" });
    }

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";

    const result = await pool.query(`
      INSERT INTO suppliers (tenant_id, name, pic_name, phone, email, address, payment_terms)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      tenant_id,
      name.trim(),
      pic_name ? pic_name.trim() : "-",
      cleanPhone || "-",
      email ? email.trim() : "-",
      address ? address.trim() : "-",
      payment_terms || "NET 30"
    ]);

    res.status(201).json({ message: "Supplier berhasil didaftarkan", supplier: result.rows[0] });
  } catch (err: any) {
    console.error("POST /api/supplier error:", err);
    res.status(500).json({ message: "Gagal menambahkan supplier" });
  }
});

// PUT /api/supplier/:id - Update supplier
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { id } = req.params;
    const { name, pic_name, phone, email, address, payment_terms } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Nama vendor/supplier tidak boleh kosong" });
    }

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";

    const result = await pool.query(`
      UPDATE suppliers
      SET 
        name = $1,
        pic_name = $2,
        phone = $3,
        email = $4,
        address = $5,
        payment_terms = $6
      WHERE id = $7 AND tenant_id = $8
      RETURNING *
    `, [
      name.trim(),
      pic_name ? pic_name.trim() : "-",
      cleanPhone || "-",
      email ? email.trim() : "-",
      address ? address.trim() : "-",
      payment_terms || "NET 30",
      id,
      tenant_id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Supplier tidak ditemukan" });
    }

    res.json({ message: "Data supplier berhasil diperbarui", supplier: result.rows[0] });
  } catch (err: any) {
    console.error("PUT /api/supplier error:", err);
    res.status(500).json({ message: "Gagal memperbarui supplier" });
  }
});

// DELETE /api/supplier/:id - Delete supplier
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM suppliers WHERE id = $1 AND tenant_id = $2 RETURNING *
    `, [id, tenant_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Supplier tidak ditemukan" });
    }

    res.json({ message: "Supplier berhasil dihapus" });
  } catch (err: any) {
    console.error("DELETE /api/supplier error:", err);
    res.status(500).json({ message: "Gagal menghapus supplier" });
  }
});

export default router;
