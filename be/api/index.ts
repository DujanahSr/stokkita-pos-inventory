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
import { authenticateJWT } from "./middleware/auth.js";
import { connectRedis } from "./redisClient.js";
import { connectRabbitMQ, publishOrder } from "./rabbitmqClient.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/master", authenticateJWT, inventoriRoutes);
app.use("/api/transaksi", authenticateJWT, transaksiRoutes);
app.use("/api/laporan", authenticateJWT, laporanRoutes);
app.use("/api/reorder", authenticateJWT, reorderRoutes);
app.use("/api/opname", authenticateJWT, opnameRoutes);
app.use("/api/shift", authenticateJWT, shiftRoutes);
app.use("/api/produk", authenticateJWT, produkRoutes);
app.use("/api/audit", authenticateJWT, auditRoutes);
app.use("/api/omnichannel", authenticateJWT, omnichannelRoutes);
app.use("/api/supplier", authenticateJWT, supplierRoutes);
app.use("/api/notifications", authenticateJWT, notificationRoutes);
app.use("/api/members", authenticateJWT, memberRoutes);
app.use("/api/settings", authenticateJWT, settingsRoutes);
app.use("/api/vouchers", authenticateJWT, vouchersRoutes);

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
