import amqp from "amqplib";

let channel: amqp.Channel;

export async function connectRabbitMQ() {
    try {
        const url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
        const connection = await amqp.connect(url);
        channel = await connection.createChannel();
        await channel.assertQueue("online_orders_queue", { durable: true });
        console.log("Terhubung ke RabbitMQ");
    } catch (error) {
        console.error("Gagal menyambung RabbitMQ:", error);
    }
}

export function publishOrder(orderData: any) {
    if (channel) {
        channel.sendToQueue("online_orders_queue", Buffer.from(JSON.stringify(orderData)), { persistent: true });
        console.log("Pesanan online dikirim ke antrean:", orderData.order_id);
    }
}
