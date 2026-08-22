import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token otorisasi tidak ditemukan" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Token otorisasi tidak ditemukan" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Akses ditolak" });
    }
    next();
  };
}