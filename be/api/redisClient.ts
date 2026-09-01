import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 2) {
        return false; // Stop retrying if Redis is not running locally
      }
      return 1000;
    }
  }
});

let isRedisConnected = false;

redisClient.on("error", (_err) => {
  // Silent fallback when running locally without standalone Redis service
  isRedisConnected = false;
});

export async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      isRedisConnected = true;
      console.log("✓ Terhubung ke Redis Cache Engine");
    }
  } catch (_err) {
    isRedisConnected = false;
    console.log("ℹ️ Redis offline (Backend berjalan normal langsung membaca database Supabase)");
  }
}

export async function clearCache(key: string) {
  if (redisClient.isOpen && isRedisConnected) {
    try {
      await redisClient.del(key);
      console.log(`Cache cleared for key: ${key}`);
    } catch (_e) {}
  }
}

export default redisClient;
