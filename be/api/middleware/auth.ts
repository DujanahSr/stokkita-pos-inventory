import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import pool from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token otorisasi tidak ditemukan" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Token otorisasi tidak ditemukan" });
      return;
    }
    const userRole = (req.user.role || "").toLowerCase();
    const allowed = roles.map(r => r.toLowerCase());
    if (!allowed.includes(userRole)) {
      res.status(403).json({ message: "Akses ditolak" });
      return;
    }
    next();
  };
}

export async function checkTenantSubscription(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return next();
  // Superadmin bypasses subscription checks
  if (req.user.role?.toLowerCase() === "superadmin") return next();

  try {
    const { tenant_id } = req.user;
    if (!tenant_id) return next();

    const result = await pool.query(
      "SELECT subscription_status, subscription_expires_at FROM tenants WHERE id = $1",
      [tenant_id]
    );

    if (result.rows.length > 0) {
      const tenant = result.rows[0];
      if (tenant.subscription_status === "suspended") {
        res.status(403).json({
          message: "Akses ditangguhkan: Masa sewa toko Anda sedang disuspend oleh penyedia layanan StokKita."
        });
        return;
      }
      if (tenant.subscription_expires_at && new Date(tenant.subscription_expires_at) < new Date()) {
        res.status(403).json({
          message: "Akses berakhir: Masa sewa toko Anda telah habis. Silakan hubungi penyedia layanan StokKita untuk perpanjangan."
        });
        return;
      }
    }
    next();
  } catch (err) {
    console.error("Subscription check error:", err);
    next();
  }
}