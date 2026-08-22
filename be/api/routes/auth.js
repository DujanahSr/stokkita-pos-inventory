import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { authenticateJWT, requireRole } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || "admin@umkm.local";
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";

function sanitizeUser(user) {
  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
  };
}

export async function ensureDefaultAdmin() {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [DEFAULT_ADMIN_EMAIL]);

  if (existing.rows.length > 0) {
    return;
  }

  const hashed = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  await pool.query(
    `INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, $4)`,
    ["Admin UMKM", DEFAULT_ADMIN_EMAIL, hashed, "admin"]
  );

  console.log(`Akun admin default dibuat: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`);
}

// Register (sekali pakai untuk admin pertama)
router.post("/register", authenticateJWT, requireRole("admin"), async (req, res) => {
  try {
    const { nama, email, password, role = "kasir" } = req.body;
    if (!nama || !email || !password)
      return res.status(400).json({ message: "Semua field wajib diisi" });

    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: "Email sudah terdaftar" });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (nama, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id, nama, email, role`,
      [nama, email, hashed, role]
    );

    res.status(201).json({ message: "Akun berhasil dibuat", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email dan password wajib diisi" });

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ message: "Email atau password salah" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: "Email atau password salah" });

    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Me
router.get("/me", authenticateJWT, async (req, res) => {
  res.json({ user: req.user });
});

export default router;