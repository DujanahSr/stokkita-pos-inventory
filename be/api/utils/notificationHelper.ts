import pool from "../db.js";

export interface CreateNotificationOptions {
  tenantId: string;
  type: "STOCK_LOW_ROP" | "SHIFT_VARIANCE" | "OMNICHANNEL_SURGE" | "PO_STATUS" | "SYSTEM";
  title: string;
  message: string;
  link?: string;
}

/**
 * Asynchronous, non-blocking notification dispatcher
 * Fires without delaying the calling request thread
 */
export function createNotification({
  tenantId,
  type,
  title,
  message,
  link = "/reorder"
}: CreateNotificationOptions): void {
  setImmediate(async () => {
    try {
      await pool.query(`
        INSERT INTO notifications (tenant_id, type, title, message, is_read, link, created_at)
        VALUES ($1, $2, $3, $4, false, $5, NOW())
      `, [tenantId, type, title, message, link]);
    } catch (err) {
      console.error("[NOTIFICATION ERROR]:", err);
    }
  });
}
