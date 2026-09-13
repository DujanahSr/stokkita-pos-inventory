import pool from "../db.js";

export interface AuditLogOptions {
  tenantId: string;
  userId?: string | null;
  action: string;
  module: "POS" | "SHIFT" | "INVENTORI" | "PRODUK" | "PO" | "OMNICHANNEL" | "AUTH" | "SYSTEM";
  details?: Record<string, any>;
  ipAddress?: string;
}

/**
 * Non-blocking, asynchronous audit logger
 * Fire-and-forget query that will never slow down API response latency
 */
export function logAudit({
  tenantId,
  userId = null,
  action,
  module,
  details = {},
  ipAddress = "127.0.0.1"
}: AuditLogOptions): void {
  // Asynchronous execution without blocking the main event loop
  setImmediate(async () => {
    try {
      await pool.query(`
        INSERT INTO audit_logs (tenant_id, user_id, action, module, details, ip_address, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        tenantId,
        userId,
        action,
        module,
        JSON.stringify(details),
        ipAddress
      ]);
    } catch (err) {
      console.error("[AUDIT LOG ERROR]:", err);
    }
  });
}
