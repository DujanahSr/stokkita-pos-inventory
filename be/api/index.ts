import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import inventoriRoutes from "./routes/inventori.js";
import transaksiRoutes from "./routes/transaksi.js";
import laporanRoutes from "./routes/laporan.js";
import reorderRoutes from "./routes/reorder.js";
import opnameRoutes from "./routes/opname.js";
import shiftRoutes from "./routes/shift.js";
import produkRoutes from "./routes/produk.js";
import auditRoutes from "./routes/audit.js";
import omnichannelRoutes from "./routes/omnichannel.js";
import supplierRoutes from "./routes/supplier.js";
import notificationRoutes from "./routes/notifications.js";
import memberRoutes from "./routes/member.js";
import settingsRoutes from "./routes/settings.js";
import vouchersRoutes from "./routes/vouchers.js";
import uploadRoutes from "./routes/upload.js";
import superadminRoutes from "./routes/superadmin.js";
import path from "path";
import { fileURLToPath } from "url";
import { authenticateJWT, checkTenantSubscription } from "./middleware/auth.js";
import { connectRedis } from "./redisClient.js";
import { connectRabbitMQ, publishOrder } from "./rabbitmqClient.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost",
  "http://localhost:80",
  "http://127.0.0.1:5173",
  "http://127.0.0.1",
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (mobile apps, curl, docker gateway internal, same-origin)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }
    return callback(new Error("CORS policy: Origin not allowed"));
  },
  credentials: true,
}));
app.use(express.json());

// Health check endpoint untuk Docker / Cloud Deployment
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Serve local uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/master", authenticateJWT, checkTenantSubscription, inventoriRoutes);
app.use("/api/transaksi", authenticateJWT, checkTenantSubscription, transaksiRoutes);
app.use("/api/laporan", authenticateJWT, checkTenantSubscription, laporanRoutes);
app.use("/api/reorder", authenticateJWT, checkTenantSubscription, reorderRoutes);
app.use("/api/opname", authenticateJWT, checkTenantSubscription, opnameRoutes);
app.use("/api/shift", authenticateJWT, checkTenantSubscription, shiftRoutes);
app.use("/api/produk", authenticateJWT, checkTenantSubscription, produkRoutes);
app.use("/api/audit", authenticateJWT, checkTenantSubscription, auditRoutes);
app.use("/api/omnichannel", authenticateJWT, checkTenantSubscription, omnichannelRoutes);
app.use("/api/supplier", authenticateJWT, checkTenantSubscription, supplierRoutes);
app.use("/api/notifications", authenticateJWT, checkTenantSubscription, notificationRoutes);
app.use("/api/members", authenticateJWT, checkTenantSubscription, memberRoutes);
app.use("/api/settings", authenticateJWT, checkTenantSubscription, settingsRoutes);
app.use("/api/vouchers", authenticateJWT, checkTenantSubscription, vouchersRoutes);
app.use("/api/upload", authenticateJWT, checkTenantSubscription, uploadRoutes);

// Webhook untuk simulasi E-Commerce
app.post("/api/omnichannel/webhook", authenticateJWT, (req, res) => {
    // Di dunia nyata, ini dipanggil oleh server Tokopedia/Shopee
    const orderData = req.body;
    orderData.order_id = `OMNI-${Date.now()}`;
    
    // Kirim ke RabbitMQ agar tidak membebani web server
    publishOrder(orderData);
    
    res.json({ message: "Pesanan diterima dan masuk antrean pemrosesan" });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectRedis();
    await connectRabbitMQ();
  } catch (error: any) {
    console.error("Gagal menyambung infrastruktur:", error.message);
  }
  app.listen(PORT, () => {
    console.log(`Server jalan di port ${PORT}`);
  });
}

startServer();
