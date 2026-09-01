import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { authenticateJWT, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../schemas/index.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Join with tenants to get domain/name if needed
    const result = await pool.query(
      "SELECT u.*, t.name as tenant_name FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = $1", 
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ message: "Email atau password salah" });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ message: "Email atau password salah" });
      return;
    }

    const payload = {
      id: user.id,
      tenant_id: user.tenant_id,
      tenant_name: user.tenant_name,
      nama: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

    res.json({
      token,
      user: payload,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { perusahaan, nama, email, password } = req.body;
    
    // Validasi basic
    if (!perusahaan || !nama || !email || !password) {
      return res.status(400).json({ message: "Semua field harus diisi" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password minimal harus 6 karakter" });
    }

    // Cek email
    const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query('BEGIN');
    
    // 1. Create Tenant
    const tenantDomain = perusahaan.toLowerCase().replace(/[^a-z0-9]/g, '');
    const tenantRes = await pool.query(
      "INSERT INTO tenants (name, domain) VALUES ($1, $2) RETURNING id",
      [perusahaan, tenantDomain]
    );
    const tenant_id = tenantRes.rows[0].id;
    
    // 2. Create User (Admin)
    await pool.query(
      "INSERT INTO users (tenant_id, name, email, password, role) VALUES ($1, $2, $3, $4, 'Admin')",
      [tenant_id, nama, email, hashedPassword]
    );
    
    // 3. Create Default Warehouse
    await pool.query(
      "INSERT INTO warehouses (tenant_id, name, address, type) VALUES ($1, 'Gudang Pusat', 'Pusat', 'Main')",
      [tenant_id]
    );
    
    await pool.query('COMMIT');
    
    res.status(201).json({ message: "Registrasi berhasil, silakan login" });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/create-user", authenticateJWT, requireRole("Admin"), async (req: Request, res: Response) => {
  try {
    const { nama, email, password, role } = req.body;
    const { tenant_id } = req.user as any;

    if (!nama || !email || !password || !role) {
      return res.status(400).json({ message: "Semua field harus diisi" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password minimal harus 6 karakter" });
    }

    const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      "INSERT INTO users (tenant_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)",
      [tenant_id, nama, email, hashedPassword, role === 'admin' ? 'Admin' : 'Kasir']
    );

    res.status(201).json({ message: "User/Kasir berhasil dibuat" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", authenticateJWT, async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;
