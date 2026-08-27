import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Terhubung ke Redis");
  }
}

export async function clearCache(key: string) {
    if (redisClient.isOpen) {
        await redisClient.del(key);
        console.log(`Cache cleared for key: ${key}`);
    }
}

export default redisClient;
