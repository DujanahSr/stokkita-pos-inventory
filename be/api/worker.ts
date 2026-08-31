import amqp from "amqplib";
import pool from "./db.js";
import { connectRedis, clearCache } from "./redisClient.js";
import { logAudit } from "./utils/auditLogger.js";

async function processOrder(orderData: any) {
    const client = await pool.connect();
    const startTime = Date.now();
    try {
        await client.query("BEGIN"); // Pessimistic Concurrency Control

        for (const item of orderData.items) {
            const invCheck = await client.query(`
                SELECT id, qty FROM inventory 
                WHERE warehouse_id = $1 AND variant_id = $2 
                FOR UPDATE
            `, [orderData.warehouse_id, item.variant_id]);

            if (invCheck.rows.length > 0) {
                const currentQty = invCheck.rows[0].qty;
                if (currentQty >= item.qty) {
                    await client.query("UPDATE inventory SET qty = $1 WHERE id = $2", [currentQty - item.qty, invCheck.rows[0].id]);
                } else {
                    console.warn(`[WORKER] Stok menipis untuk variant ${item.variant_id} saat pesanan online diproses (Tersedia: ${currentQty}, Diminta: ${item.qty})`);
                }
            }
        }
        
        // Simpan ke transaksi dengan payment_method & details
        const channelName = orderData.channel || 'E-Commerce Marketplace';
        const tRes = await client.query(`
            INSERT INTO transactions (tenant_id, warehouse_id, user_id, type, total_amount, payment_method, payment_details)
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id
        `, [
            orderData.tenant_id, 
            orderData.warehouse_id, 
            orderData.user_id, 
            'Pesanan Online', 
            orderData.total_amount,
            channelName,
            JSON.stringify({
                marketplace: channelName,
                order_id: orderData.order_id,
                customer: orderData.customer_name,
                processing_time_ms: Date.now() - startTime
            })
        ]);
        
        for (const item of orderData.items) {
            await client.query(`
                INSERT INTO transaction_items (transaction_id, variant_id, qty, price, subtotal)
                VALUES ($1, $2, $3, $4, $5)
            `, [tRes.rows[0].id, item.variant_id, item.qty, item.price, item.qty * item.price]);
        }

        await client.query("COMMIT");
        await clearCache(`inventory:${orderData.warehouse_id}`);

        const execTime = Date.now() - startTime;
        console.log(`[WORKER] Berhasil memproses pesanan ${channelName} #${orderData.order_id} dalam ${execTime}ms`);

        // Record to Audit Logs
        logAudit({
            tenantId: orderData.tenant_id,
            userId: orderData.user_id,
            action: `OMNICHANNEL_ORDER_PROCESSED_${channelName.toUpperCase().replace(/\s+/g, '_')}`,
            module: "OMNICHANNEL",
            details: {
                order_id: orderData.order_id,
                channel: channelName,
                total_amount: orderData.total_amount,
                items_count: orderData.items.length,
                execution_time_ms: execTime
            },
            ipAddress: "127.0.0.1 (RabbitMQ Worker)"
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("[WORKER] Gagal memproses pesanan:", error);
    } finally {
        client.release();
    }
}

async function startWorker() {
    await connectRedis();
    
    try {
        const url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
        const connection = await amqp.connect(url);
        const channel = await connection.createChannel();
        const queue = "online_orders_queue";

        await channel.assertQueue(queue, { durable: true });
        console.log(`[*] Menunggu pesanan dari ${queue}. To exit press CTRL+C`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const orderData = JSON.parse(msg.content.toString());
                console.log(`[x] Menerima pesanan online #${orderData.order_id} (${orderData.channel || 'Marketplace'})`);
                
                await processOrder(orderData);
                
                channel.ack(msg); // Konfirmasi ke RabbitMQ bahwa pesan selesai diproses
            }
        });
    } catch (error) {
        console.error("Worker gagal menyambung ke RabbitMQ", error);
    }
}

startWorker();
