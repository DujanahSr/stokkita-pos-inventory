import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { authenticateJWT, requireRole } from "../middleware/auth.js";
import { logAudit } from "../utils/auditLogger.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

// All superadmin routes require valid JWT and Superadmin role
router.use(authenticateJWT);
router.use(requireRole("Superadmin"));

// Pricing plan reference for MRR estimation (in IDR)
const PLAN_PRICES: Record<string, number> = {
  Starter: 150000,
  Pro: 350000,
  Enterprise: 750000,
};

/**
 * GET /api/superadmin/metrics
 * Global SaaS platform KPIs and metrics
 */
router.get("/metrics", async (_req: Request, res: Response) => {
  try {
    // 1. Tenants count and breakdown by status
    const tenantStatsRes = await pool.query(`
      SELECT 
        COUNT(*)::int as total_tenants,
        COUNT(*) FILTER (WHERE subscription_status = 'active')::int as active_tenants,
        COUNT(*) FILTER (WHERE subscription_status = 'trial')::int as trial_tenants,
        COUNT(*) FILTER (WHERE subscription_status = 'suspended')::int as suspended_tenants,
        COUNT(*) FILTER (WHERE subscription_expires_at < NOW())::int as expired_tenants,
        COUNT(*) FILTER (WHERE subscription_plan = 'Starter')::int as starter_count,
        COUNT(*) FILTER (WHERE subscription_plan = 'Pro')::int as pro_count,
        COUNT(*) FILTER (WHERE subscription_plan = 'Enterprise')::int as enterprise_count
      FROM tenants;
    `);
    const tenantStats = tenantStatsRes.rows[0];

    // 2. Total GMV (Gross Merchandise Value) and transactions across platform
    const gmvRes = await pool.query(`
      SELECT 
        COUNT(*)::int as total_transactions,
        COALESCE(SUM(total_amount), 0)::numeric as total_gmv
      FROM transactions;
    `);
    const gmvStats = gmvRes.rows[0];

    // 3. Total Users (Admins & Cashiers)
    const userStatsRes = await pool.query(`
      SELECT 
        COUNT(*)::int as total_users,
        COUNT(*) FILTER (WHERE role = 'Admin')::int as admin_users,
        COUNT(*) FILTER (WHERE role = 'Kasir')::int as cashier_users
      FROM users
      WHERE role != 'Superadmin';
    `);
    const userStats = userStatsRes.rows[0];

    // 4. Total Warehouses / Branches and Total Products
    const entityStatsRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*)::int FROM warehouses) as total_branches,
        (SELECT COUNT(*)::int FROM products) as total_products,
        (SELECT COUNT(*)::int FROM variants) as total_variants;
    `);
    const entityStats = entityStatsRes.rows[0];

    // 5. Estimated MRR (Monthly Recurring Revenue)
    const activeStarter = tenantStats.starter_count || 0;
    const activePro = tenantStats.pro_count || 0;
    const activeEnterprise = tenantStats.enterprise_count || 0;
    const estimatedMrr = 
      (activeStarter * PLAN_PRICES.Starter) +
      (activePro * PLAN_PRICES.Pro) +
      (activeEnterprise * PLAN_PRICES.Enterprise);

    res.json({
      tenants: {
        total: tenantStats.total_tenants,
        active: tenantStats.active_tenants,
        trial: tenantStats.trial_tenants,
        suspended: tenantStats.suspended_tenants,
        expired: tenantStats.expired_tenants,
        plans: {
          Starter: activeStarter,
          Pro: activePro,
          Enterprise: activeEnterprise,
        },
      },
      financial: {
        total_gmv: Number(gmvStats.total_gmv),
        total_transactions: gmvStats.total_transactions,
        estimated_mrr: estimatedMrr,
      },
      ecosystem: {
        total_users: userStats.total_users,
        admin_users: userStats.admin_users,
        cashier_users: userStats.cashier_users,
        total_branches: entityStats.total_branches,
        total_products: entityStats.total_products,
        total_variants: entityStats.total_variants,
      },
    });
  } catch (err) {
    console.error("Superadmin metrics error:", err);
    res.status(500).json({ message: "Gagal mengambil data metrik platform" });
  }
});

/**
 * GET /api/superadmin/tenants
 * List all tenants with subscription details and store metrics
 */
router.get("/tenants", async (req: Request, res: Response) => {
  try {
    const { search, status, plan } = req.query;

    let query = `
      SELECT 
        t.id,
        t.name,
        t.domain,
        t.created_at,
        t.subscription_status,
        t.subscription_plan,
        t.subscription_expires_at,
        t.max_branches,
        t.contact_phone,
        t.notes,
        -- Primary Admin info
        (
          SELECT json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email
          )
          FROM users u 
          WHERE u.tenant_id = t.id AND u.role = 'Admin' 
          ORDER BY u.created_at ASC 
          LIMIT 1
        ) as owner_info,
        -- Aggregate statistics
        (SELECT COUNT(*)::int FROM warehouses w WHERE w.tenant_id = t.id) as branch_count,
        (SELECT COUNT(*)::int FROM products p WHERE p.tenant_id = t.id) as product_count,
        (SELECT COUNT(*)::int FROM users u WHERE u.tenant_id = t.id AND u.role != 'Superadmin') as user_count,
        (SELECT COUNT(*)::int FROM transactions tr WHERE tr.tenant_id = t.id) as transaction_count,
        (SELECT COALESCE(SUM(tr.total_amount), 0)::numeric FROM transactions tr WHERE tr.tenant_id = t.id) as gmv
      FROM tenants t
      WHERE 1=1
    `;

    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (t.name ILIKE $${params.length} OR t.domain ILIKE $${params.length})`;
    }

    if (status && status !== "ALL") {
      params.push(status);
      query += ` AND t.subscription_status = $${params.length}`;
    }

    if (plan && plan !== "ALL") {
      params.push(plan);
      query += ` AND t.subscription_plan = $${params.length}`;
    }

    query += ` ORDER BY t.created_at DESC;`;

    const result = await pool.query(query, params);

    res.json({
      tenants: result.rows.map(row => ({
        ...row,
        gmv: Number(row.gmv),
        is_expired: row.subscription_expires_at ? new Date(row.subscription_expires_at) < new Date() : false,
      })),
    });
  } catch (err) {
    console.error("Superadmin get tenants error:", err);
    res.status(500).json({ message: "Gagal mengambil daftar penyewa UMKM" });
  }
});

/**
 * POST /api/superadmin/tenants
 * Manually register a new tenant and owner from the Superadmin dashboard
 */
router.post("/tenants", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const {
      name,
      domain,
      plan = "Starter",
      duration_months = 1,
      admin_name,
      admin_email,
      admin_password,
      contact_phone,
      notes,
    } = req.body;

    // Validasi input
    const cleanName = (name || "").trim();
    const cleanAdminName = (admin_name || "").trim();
    const cleanEmail = (admin_email || "").trim().toLowerCase();
    const cleanPassword = (admin_password || "").trim();

    if (!cleanName || cleanName.length < 3) {
      res.status(400).json({ message: "Nama toko UMKM minimal harus 3 karakter" });
      return;
    }

    if (!cleanAdminName || cleanAdminName.length < 2) {
      res.status(400).json({ message: "Nama pemilik toko minimal harus 2 karakter" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ message: "Format email pemilik tidak valid" });
      return;
    }

    if (cleanPassword.length < 6) {
      res.status(400).json({ message: "Password pemilik minimal harus 6 karakter" });
      return;
    }

    const validPlans = ["Starter", "Pro", "Enterprise"];
    if (!validPlans.includes(plan)) {
      res.status(400).json({ message: "Paket langganan harus Starter, Pro, atau Enterprise" });
      return;
    }

    const tenantDomain = (domain ? domain.trim() : cleanName)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "");

    if (!tenantDomain || tenantDomain.length < 2) {
      res.status(400).json({ message: "Domain / slug toko tidak valid (minimal 2 karakter alfanumerik)" });
      return;
    }

    // Check if domain already exists
    const domainCheck = await client.query("SELECT id FROM tenants WHERE domain = $1", [tenantDomain]);
    if (domainCheck.rows.length > 0) {
      res.status(400).json({ message: `Domain "${tenantDomain}" sudah digunakan oleh toko lain. Silakan ubah domain.` });
      return;
    }

    // Check if email already exists
    const emailCheck = await client.query("SELECT id FROM users WHERE email = $1", [cleanEmail]);
    if (emailCheck.rows.length > 0) {
      res.status(400).json({ message: `Email "${cleanEmail}" sudah terdaftar di sistem. Gunakan email lain.` });
      return;
    }

    const maxBranches = plan === "Enterprise" ? 999 : plan === "Pro" ? 5 : 2;
    const months = Math.max(1, Math.min(60, Number(duration_months || 1)));
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    await client.query("BEGIN");

    // 1. Create Tenant
    const tenantRes = await client.query(
      `INSERT INTO tenants (
        name, domain, subscription_status, subscription_plan, 
        subscription_expires_at, max_branches, contact_phone, notes
      ) VALUES ($1, $2, 'active', $3, $4, $5, $6, $7) RETURNING id`,
      [cleanName, tenantDomain, plan, expiresAt, maxBranches, contact_phone ? contact_phone.trim() : null, notes ? notes.trim() : null]
    );
    const tenantId = tenantRes.rows[0].id;

    // 2. Create Admin User
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    await client.query(
      `INSERT INTO users (tenant_id, name, email, password, role) 
       VALUES ($1, $2, $3, $4, 'Admin')`,
      [tenantId, cleanAdminName, cleanEmail, hashedPassword]
    );

    // 3. Create Default Central Warehouse
    await client.query(
      `INSERT INTO warehouses (tenant_id, name, address, type) 
       VALUES ($1, 'Gudang Pusat', 'Pusat Operasional', 'Main')`,
      [tenantId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: `Tenant "${cleanName}" berhasil didaftarkan dengan paket ${plan}`,
      tenant_id: tenantId,
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Create tenant error:", err);
    res.status(500).json({ message: err.message || "Gagal membuat tenant baru" });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/superadmin/tenants/:id/subscription
 * Update subscription tier, status, validity, or branch limits
 */
router.put("/tenants/:id/subscription", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      subscription_status,
      subscription_plan,
      subscription_expires_at,
      extend_months,
      max_branches,
      contact_phone,
      notes,
    } = req.body;

    // Check tenant existence
    const check = await pool.query("SELECT * FROM tenants WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ message: "Tenant tidak ditemukan" });
      return;
    }

    const currentTenant = check.rows[0];

    // Validations
    if (subscription_status && !["active", "trial", "suspended", "expired"].includes(subscription_status)) {
      res.status(400).json({ message: "Status langganan harus active, trial, suspended, atau expired" });
      return;
    }

    if (subscription_plan && !["Starter", "Pro", "Enterprise"].includes(subscription_plan)) {
      res.status(400).json({ message: "Paket langganan harus Starter, Pro, atau Enterprise" });
      return;
    }

    if (max_branches !== undefined && (Number(max_branches) < 1 || isNaN(Number(max_branches)))) {
      res.status(400).json({ message: "Batas maksimal cabang minimal harus 1" });
      return;
    }

    // Compute new expiration if extend_months provided
    let newExpiresAt = subscription_expires_at || currentTenant.subscription_expires_at;
    if (extend_months && Number(extend_months) > 0) {
      const baseDate = currentTenant.subscription_expires_at && new Date(currentTenant.subscription_expires_at) > new Date()
        ? new Date(currentTenant.subscription_expires_at)
        : new Date();
      baseDate.setMonth(baseDate.getMonth() + Number(extend_months));
      newExpiresAt = baseDate;
    }

    const newPlan = subscription_plan || currentTenant.subscription_plan;
    let newMaxBranches = max_branches !== undefined ? Number(max_branches) : currentTenant.max_branches;
    if (!newMaxBranches) {
      newMaxBranches = newPlan === "Enterprise" ? 999 : newPlan === "Pro" ? 5 : 2;
    }

    const updated = await pool.query(
      `UPDATE tenants 
       SET 
         subscription_status = COALESCE($1, subscription_status),
         subscription_plan = COALESCE($2, subscription_plan),
         subscription_expires_at = COALESCE($3, subscription_expires_at),
         max_branches = COALESCE($4, max_branches),
         contact_phone = COALESCE($5, contact_phone),
         notes = COALESCE($6, notes)
       WHERE id = $7
       RETURNING *;`,
      [
        subscription_status,
        newPlan,
        newExpiresAt,
        newMaxBranches,
        contact_phone !== undefined ? (contact_phone ? contact_phone.trim() : null) : currentTenant.contact_phone,
        notes !== undefined ? (notes ? notes.trim() : null) : currentTenant.notes,
        id,
      ]
    );

    res.json({
      message: `Status langganan tenant "${updated.rows[0].name}" berhasil diperbarui`,
      tenant: updated.rows[0],
    });
  } catch (err: any) {
    console.error("Update subscription error:", err);
    res.status(500).json({ message: "Gagal memperbarui langganan tenant" });
  }
});

/**
 * POST /api/superadmin/tenants/:id/impersonate
 * Impersonate tenant admin to investigate or assist customer
 */
router.post("/tenants/:id/impersonate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find tenant
    const tenantRes = await pool.query("SELECT * FROM tenants WHERE id = $1", [id]);
    if (tenantRes.rows.length === 0) {
      res.status(404).json({ message: "Tenant tidak ditemukan" });
      return;
    }
    const tenant = tenantRes.rows[0];

    // Find primary admin of tenant
    const adminRes = await pool.query(
      "SELECT * FROM users WHERE tenant_id = $1 AND role = 'Admin' ORDER BY created_at ASC LIMIT 1",
      [id]
    );

    if (adminRes.rows.length === 0) {
      res.status(404).json({ message: "Tidak ada akun Admin pada tenant ini" });
      return;
    }

    const adminUser = adminRes.rows[0];

    const payload = {
      id: adminUser.id,
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      nama: `${adminUser.name} (Support Mode)`,
      email: adminUser.email,
      role: "Admin",
      impersonated_by: req.user?.email || "Superadmin",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

    // Rekam jejak audit digital yang tidak bisa dimanipulasi
    logAudit({
      tenantId: tenant.id,
      userId: adminUser.id,
      action: "SUPERADMIN_SUPPORT_IMPERSONATION",
      module: "SYSTEM",
      details: {
        superadmin_email: req.user?.email || "Superadmin",
        target_store: tenant.name,
        target_admin_email: adminUser.email,
        reason: "Customer Support Technical Investigation",
        timestamp: new Date().toISOString(),
      },
      ipAddress: req.ip || "127.0.0.1",
    });

    res.json({
      message: `Berhasil masuk ke toko "${tenant.name}" sebagai Admin`,
      token,
      user: payload,
    });
  } catch (err) {
    console.error("Impersonate error:", err);
    res.status(500).json({ message: "Gagal melakukan impersonasi toko" });
  }
});

export default router;
