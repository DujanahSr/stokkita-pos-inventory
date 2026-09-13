import amqp from "amqplib";
import { processOrder } from "./worker.js";

let channel: amqp.Channel;

export async function connectRabbitMQ() {
    try {
        const url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
        const connection = await amqp.connect(url);
        channel = await connection.createChannel();
        await channel.assertQueue("online_orders_queue", { durable: true });
        console.log("✓ Terhubung ke RabbitMQ Message Broker (AMQP)");
    } catch (error) {
        console.warn("⚠️ RabbitMQ broker tidak terhubung, sistem menggunakan Mode Worker Internal Asinkron.");
    }
}

export function publishOrder(orderData: any) {
    if (channel) {
        channel.sendToQueue("online_orders_queue", Buffer.from(JSON.stringify(orderData)), { persistent: true });
        console.log("Pesanan online dikirim ke antrean RabbitMQ:", orderData.order_id);
    } else {
        // Fallback: proses pesanan secara asinkron langsung bila RabbitMQ broker belum aktif
        console.log("[RABBITMQ INTERNAL FALLBACK] Memproses pesanan secara asinkron:", orderData.order_id);
        setImmediate(() => {
            processOrder(orderData).catch(err => {
                console.error("[RABBITMQ FALLBACK ERROR] Gagal memproses pesanan:", err);
            });
        });
    }
}
