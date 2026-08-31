import express, { Request, Response } from "express";
import pool from "../db.js";

const router = express.Router();

// GET /api/audit - List audit logs with filters
router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { module, action, limit = "50", offset = "0" } = req.query;

    let query = `
      SELECT 
        a.id,
        a.action,
        a.module,
        a.details,
        a.ip_address,
        a.created_at,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.tenant_id = $1
    `;

    const params: any[] = [tenant_id];

    if (module && module !== "ALL") {
      params.push(module);
      query += ` AND a.module = $${params.length}`;
    }

    if (action) {
      params.push(`%${action}%`);
      query += ` AND a.action ILIKE $${params.length}`;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit) || 50, Number(offset) || 0);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error("GET /api/audit error:", err);
    res.status(500).json({ message: "Gagal memuat log audit" });
  }
});

// GET /api/audit/stats - Summary security metrics
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;

    const totalLogsRes = await pool.query(
      `SELECT COUNT(*) as total FROM audit_logs WHERE tenant_id = $1`,
      [tenant_id]
    );

    const criticalRes = await pool.query(
      `SELECT COUNT(*) as critical_count 
       FROM audit_logs 
       WHERE tenant_id = $1 AND (
         action ILIKE '%VARIANCE%' OR 
         action ILIKE '%OPNAME%' OR 
         action ILIKE '%DELETE%'
       )`,
      [tenant_id]
    );

    const moduleDistribution = await pool.query(
      `SELECT module, COUNT(*) as count 
       FROM audit_logs 
       WHERE tenant_id = $1 
       GROUP BY module 
       ORDER BY count DESC`,
      [tenant_id]
    );

    res.json({
      total_events: Number(totalLogsRes.rows[0]?.total || 0),
      critical_events: Number(criticalRes.rows[0]?.critical_count || 0),
      module_breakdown: moduleDistribution.rows
    });
  } catch (err) {
    console.error("GET /api/audit/stats error:", err);
    res.status(500).json({ message: "Gagal memuat statistik audit" });
  }
});

export default router;
