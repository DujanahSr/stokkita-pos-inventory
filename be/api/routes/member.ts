import express, { Request, Response } from "express";
import pool from "../db.js";

const router = express.Router();

// GET /api/members - List members
router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { search } = req.query;

    let query = `
      SELECT * FROM members
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenant_id];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    query += ` ORDER BY total_spent DESC, created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error("GET /api/members error:", err);
    res.status(500).json({ message: "Gagal mengambil data member" });
  }
});

// GET /api/members/lookup?phone=... - Quick lookup for POS cashier
router.get("/lookup", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: "Nomor telepon member wajib diisi" });
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, "");

    const result = await pool.query(`
      SELECT id, name, phone, email, tier, points, total_spent
      FROM members
      WHERE tenant_id = $1 AND (phone = $2 OR phone ILIKE $3)
      LIMIT 1
    `, [tenant_id, cleanPhone, `%${cleanPhone}%`]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Member tidak ditemukan" });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("GET /api/members/lookup error:", err);
    res.status(500).json({ message: "Gagal mencari data member" });
  }
});

// POST /api/members - Create new member
router.post("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { name, phone, email, tier } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Nama dan nomor WhatsApp member wajib diisi" });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");

    // Check duplicate phone for tenant
    const dupCheck = await pool.query(`
      SELECT id FROM members WHERE tenant_id = $1 AND phone = $2
    `, [tenant_id, cleanPhone]);

    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ message: "Nomor telepon member sudah terdaftar" });
    }

    const result = await pool.query(`
      INSERT INTO members (tenant_id, name, phone, email, tier, points, total_spent)
      VALUES ($1, $2, $3, $4, $5, 0, 0)
      RETURNING *
    `, [
      tenant_id,
      name.trim(),
      cleanPhone,
      email ? email.trim() : null,
      tier || "Silver"
    ]);

    res.status(201).json({ message: "Member berhasil didaftarkan", member: result.rows[0] });
  } catch (err: any) {
    console.error("POST /api/members error:", err);
    res.status(500).json({ message: "Gagal mendaftarkan member" });
  }
});

// PUT /api/members/:id - Update member
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { id } = req.params;
    const { name, phone, email, tier, points } = req.body;

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";

    const result = await pool.query(`
      UPDATE members
      SET 
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = $3,
        tier = COALESCE($4, tier),
        points = COALESCE($5, points)
      WHERE id = $6 AND tenant_id = $7
      RETURNING *
    `, [
      name ? name.trim() : null,
      cleanPhone || null,
      email ? email.trim() : null,
      tier || null,
      points !== undefined ? Number(points) : null,
      id,
      tenant_id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Member tidak ditemukan" });
    }

    res.json({ message: "Data member berhasil diperbarui", member: result.rows[0] });
  } catch (err: any) {
    console.error("PUT /api/members/:id error:", err);
    res.status(500).json({ message: "Gagal memperbarui data member" });
  }
});

// DELETE /api/members/:id - Delete member
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM members WHERE id = $1 AND tenant_id = $2 RETURNING id
    `, [id, tenant_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Member tidak ditemukan" });
    }

    res.json({ message: "Member berhasil dihapus" });
  } catch (err: any) {
    console.error("DELETE /api/members/:id error:", err);
    res.status(500).json({ message: "Gagal menghapus member" });
  }
});

export default router;
