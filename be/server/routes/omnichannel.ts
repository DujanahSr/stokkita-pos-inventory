import express, { Request, Response } from "express";
import pool from "../db.js";
import { publishOrder } from "../rabbitmqClient.js";
import { logAudit } from "../utils/auditLogger.js";

const router = express.Router();

// POST /api/omnichannel/simulate - Simulate batch marketplace orders
router.post("/simulate", async (req: Request, res: Response) => {
  try {
    const { tenant_id, id: user_id } = req.user as any;
    const { batch_size = 5, channel_filter = "ALL" } = req.body;

    const count = Math.min(50, Math.max(1, Number(batch_size) || 5));

    // Fetch available warehouses and variants for this tenant
    const [wRes, vRes] = await Promise.all([
      pool.query(`SELECT id, name FROM warehouses WHERE tenant_id = $1 LIMIT 5`, [tenant_id]),
      pool.query(`
        SELECT v.id, v.sku, v.price_sell, p.name as product_name 
        FROM variants v
        JOIN products p ON v.product_id = p.id
        WHERE p.tenant_id = $1 
        LIMIT 20
      `, [tenant_id])
    ]);

    if (wRes.rows.length === 0 || vRes.rows.length === 0) {
      return res.status(400).json({ message: "Daftarkan minimal 1 gudang dan 1 produk untuk menjalankan simulasi" });
    }

    const warehouses = wRes.rows;
    const variants = vRes.rows;
    const channels = ["Shopee", "Tokopedia", "TikTok Shop", "Lazada"];

    const generatedOrders = [];

    for (let i = 0; i < count; i++) {
      const selectedChannel = channel_filter !== "ALL" && channels.includes(channel_filter)
        ? channel_filter
        : channels[Math.floor(Math.random() * channels.length)];

      const randomWarehouse = warehouses[Math.floor(Math.random() * warehouses.length)];
      const randomVariant = variants[Math.floor(Math.random() * variants.length)];
      const orderQty = Math.floor(Math.random() * 3) + 1; // 1 to 3 pcs
      const itemPrice = Number(randomVariant.price_sell) || 100000;
      const totalAmount = itemPrice * orderQty;

      const orderPayload = {
        order_id: `OMNI-${selectedChannel.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
        channel: selectedChannel,
        tenant_id,
        warehouse_id: randomWarehouse.id,
        warehouse_name: randomWarehouse.name,
        user_id: user_id || null,
        total_amount: totalAmount,
        customer_name: `Customer ${selectedChannel} #${Math.floor(1000 + Math.random() * 9000)}`,
        items: [
          {
            variant_id: randomVariant.id,
            sku: randomVariant.sku,
            product_name: randomVariant.product_name,
            qty: orderQty,
            price: itemPrice
          }
        ],
        timestamp: new Date().toISOString()
      };

      // Publish to RabbitMQ Message Queue
      publishOrder(orderPayload);
      generatedOrders.push(orderPayload);
    }

    // Log to Audit Trail
    logAudit({
      tenantId: tenant_id,
      userId: user_id,
      action: "OMNICHANNEL_BATCH_SIMULATED",
      module: "OMNICHANNEL",
      details: {
        total_orders_published: count,
        channel_filter,
        queue: "online_orders_queue"
      },
      ipAddress: req.ip || "127.0.0.1"
    });

    res.json({
      message: `Berhasil mengirim ${count} pesanan e-commerce ke antrean RabbitMQ (online_orders_queue)`,
      total_published: count,
      orders: generatedOrders
    });
  } catch (err: any) {
    console.error("POST /api/omnichannel/simulate error:", err);
    res.status(500).json({ message: err.message || "Gagal menjalankan simulasi omnichannel" });
  }
});

// GET /api/omnichannel/recent-events - Fetch recent online orders from DB
router.get("/recent-events", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;

    const result = await pool.query(`
      SELECT 
        t.id,
        t.type,
        t.total_amount,
        t.payment_method,
        t.payment_details,
        t.created_at,
        w.name as warehouse_name
      FROM transactions t
      JOIN warehouses w ON t.warehouse_id = w.id
      WHERE t.tenant_id = $1 AND (t.type = 'Pesanan Online' OR t.payment_method ILIKE '%Online%')
      ORDER BY t.created_at DESC
      LIMIT 20
    `, [tenant_id]);

    res.json(result.rows);
  } catch (err: any) {
    console.error("GET /api/omnichannel/recent-events error:", err);
    res.status(500).json({ message: "Gagal mengambil log event omnichannel" });
  }
});

export default router;
