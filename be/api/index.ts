import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import inventoriRoutes from "./routes/inventori.js";
import transaksiRoutes from "./routes/transaksi.js";
import reorderRoutes from "./routes/reorder.js";
import laporanRoutes from "./routes/laporan.js";
import { ensureDefaultAdmin } from "./routes/auth.js";
import { authenticateJWT } from "./middleware/auth.js";
import pool from "./db.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// Public routes
app.use("/api/auth", authRoutes);

// Proteksi semua route data dengan JWT
app.use("/api/produk", authenticateJWT, inventoriRoutes);
app.use("/api/transaksi", authenticateJWT, transaksiRoutes);
app.use("/api/reorder", authenticateJWT, reorderRoutes);
app.use("/api/laporan", authenticateJWT, laporanRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await pool.query("ALTER TABLE produk ADD COLUMN IF NOT EXISTS image_url TEXT");
    await ensureDefaultAdmin();
  } catch (error: any) {
    console.error("Gagal menyiapkan admin default atau kolom gambar:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server jalan di port ${PORT}`);
  });
}

startServer();