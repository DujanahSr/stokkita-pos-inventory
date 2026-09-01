import express, { Request, Response } from "express";
import pool from "../db.js";
import { logAudit } from "../utils/auditLogger.js";

const router = express.Router();

// GET active shift for current cashier
router.get("/active", async (req: Request, res: Response) => {
  try {
    const { tenant_id, id: user_id } = req.user as any;
    const { warehouse_id } = req.query;

    let query = `
      SELECT cs.*, w.name as warehouse_name, u.name as cashier_name
      FROM cashier_shifts cs
      JOIN warehouses w ON cs.warehouse_id = w.id
      JOIN users u ON cs.user_id = u.id
      WHERE cs.tenant_id = $1 AND cs.user_id = $2 AND cs.status = 'OPEN'
    `;
    const params: any[] = [tenant_id, user_id];

    if (warehouse_id) {
      query += ` AND cs.warehouse_id = $3`;
      params.push(warehouse_id);
    }

    query += ` ORDER BY cs.opened_at DESC LIMIT 1`;

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.json({ active_shift: null });
    }

    res.json({ active_shift: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil status shift kasir" });
  }
});

// POST open new shift
router.post("/open", async (req: Request, res: Response) => {
  try {
    const { tenant_id, id: user_id } = req.user as any;
    const { warehouse_id, start_cash, notes } = req.body;

    if (!warehouse_id || start_cash === undefined || Number(start_cash) < 0) {
      return res.status(400).json({ message: "Gudang dan modal kas awal (tidak boleh negatif) wajib diisi" });
    }

    // Check if shift already open
    const existing = await pool.query(
      "SELECT id FROM cashier_shifts WHERE tenant_id = $1 AND user_id = $2 AND warehouse_id = $3 AND status = 'OPEN'",
      [tenant_id, user_id, warehouse_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Anda masih memiliki shift aktif yang belum ditutup di cabang ini" });
    }

    const result = await pool.query(`
      INSERT INTO cashier_shifts (tenant_id, warehouse_id, user_id, start_cash, status, notes, opened_at)
      VALUES ($1, $2, $3, $4, 'OPEN', $5, NOW())
      RETURNING *
    `, [tenant_id, warehouse_id, user_id, Number(start_cash), notes || "Buka Kasir"]);

    const newShift = result.rows[0];

    // Non-blocking Audit Log
    logAudit({
      tenantId: tenant_id,
      userId: user_id,
      action: "SHIFT_OPEN",
      module: "SHIFT",
      details: {
        shift_id: newShift.id,
        warehouse_id,
        start_cash: Number(start_cash),
        notes: notes || "Buka Kasir"
      },
      ipAddress: req.ip || "127.0.0.1"
    });

    res.status(201).json({ message: "Shift kasir berhasil dibuka", shift: newShift });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal membuka shift kasir" });
  }
});

// POST cash movement (Petty Cash / Cash In / Cash Out)
router.post("/cash-movement", async (req: Request, res: Response) => {
  try {
    const { tenant_id, id: user_id } = req.user as any;
    const { shift_id, warehouse_id, type, amount, reason } = req.body;

    if (!shift_id || !type || !amount || Number(amount) <= 0 || !reason) {
      return res.status(400).json({ message: "Shift ID, tipe (CASH_IN/CASH_OUT), nominal valid, dan alasan wajib diisi" });
    }

    // Verify shift is OPEN
    const shiftCheck = await pool.query(
      "SELECT id, warehouse_id FROM cashier_shifts WHERE id = $1 AND tenant_id = $2 AND status = 'OPEN'",
      [shift_id, tenant_id]
    );

    if (shiftCheck.rows.length === 0) {
      return res.status(404).json({ message: "Shift aktif tidak ditemukan" });
    }

    const wId = warehouse_id || shiftCheck.rows[0].warehouse_id;

    const result = await pool.query(`
      INSERT INTO cash_movements (tenant_id, warehouse_id, shift_id, user_id, type, amount, reason, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [tenant_id, wId, shift_id, user_id, type, Number(amount), reason.trim()]);

    logAudit({
      tenantId: tenant_id,
      userId: user_id,
      action: type === 'CASH_IN' ? 'CASH_DRAWER_IN' : 'CASH_DRAWER_OUT',
      module: "SHIFT",
      details: {
        shift_id,
        amount: Number(amount),
        reason: reason.trim()
      },
      ipAddress: req.ip || "127.0.0.1"
    });

    res.status(201).json({ message: `Kas ${type === 'CASH_IN' ? 'masuk' : 'keluar'} berhasil dicatat`, movement: result.rows[0] });
  } catch (err: any) {
    console.error("POST /cash-movement error:", err);
    res.status(500).json({ message: "Gagal mencatat mutasi kas laci" });
  }
});

// GET cash movements for a shift
router.get("/cash-movements", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { shift_id } = req.query;

    if (!shift_id) {
      return res.status(400).json({ message: "Shift ID wajib disertakan" });
    }

    const result = await pool.query(`
      SELECT cm.*, u.name as cashier_name
      FROM cash_movements cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.tenant_id = $1 AND cm.shift_id = $2
      ORDER BY cm.created_at ASC
    `, [tenant_id, shift_id]);

    res.json(result.rows);
  } catch (err: any) {
    console.error("GET /cash-movements error:", err);
    res.status(500).json({ message: "Gagal memuat mutasi kas laci" });
  }
});

// POST close shift (Z-Report)
router.post("/close", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id, id: user_id } = req.user as any;
    const { shift_id, end_cash_actual, notes } = req.body;

    if (!shift_id || end_cash_actual === undefined || Number(end_cash_actual) < 0) {
      return res.status(400).json({ message: "ID Shift dan jumlah uang fisik laci kasir wajib diisi" });
    }

    await client.query("BEGIN");

    const shiftRes = await client.query(
      "SELECT * FROM cashier_shifts WHERE id = $1 AND tenant_id = $2 AND status = 'OPEN' FOR UPDATE",
      [shift_id, tenant_id]
    );

    if (shiftRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Shift aktif tidak ditemukan atau sudah ditutup" });
    }

    const shift = shiftRes.rows[0];
    const startCash = Number(shift.start_cash) || 0;
    const totalCashSales = Number(shift.total_cash_sales) || 0;
    const totalNonCashSales = Number(shift.total_non_cash_sales) || 0;
    const totalSales = Number(shift.total_sales) || 0;
    const actualCash = Number(end_cash_actual);

    // Calculate Cash Movements (Petty cash In & Out)
    const movRes = await client.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'CASH_IN' THEN amount ELSE 0 END), 0) as total_in,
        COALESCE(SUM(CASE WHEN type = 'CASH_OUT' THEN amount ELSE 0 END), 0) as total_out
      FROM cash_movements
      WHERE shift_id = $1
    `, [shift_id]);

    const totalCashIn = Number(movRes.rows[0]?.total_in || 0);
    const totalCashOut = Number(movRes.rows[0]?.total_out || 0);

    const expectedCash = startCash + totalCashSales + totalCashIn - totalCashOut;
    const difference = actualCash - expectedCash;

    const updateRes = await client.query(`
      UPDATE cashier_shifts
      SET 
        end_cash_actual = $1,
        expected_cash = $2,
        difference = $3,
        status = 'CLOSED',
        notes = COALESCE($4, notes),
        closed_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [actualCash, expectedCash, difference, notes, shift_id]);

    await client.query("COMMIT");

    const closedShift = updateRes.rows[0];

    // Non-blocking Audit Log
    logAudit({
      tenantId: tenant_id,
      userId: user_id,
      action: difference === 0 ? "SHIFT_CLOSE_BALANCED" : "SHIFT_CLOSE_VARIANCE",
      module: "SHIFT",
      details: {
        shift_id: closedShift.id,
        expected_cash: expectedCash,
        end_cash_actual: actualCash,
        difference: difference,
        total_cash_in: totalCashIn,
        total_cash_out: totalCashOut,
        status: closedShift.status
      },
      ipAddress: req.ip || "127.0.0.1"
    });

    res.json({
      message: "Shift kasir berhasil ditutup. Laporan Z-Report siap dicetak.",
      z_report: {
        shift_id: closedShift.id,
        opened_at: closedShift.opened_at,
        closed_at: closedShift.closed_at,
        start_cash: startCash,
        total_cash_sales: totalCashSales,
        total_non_cash_sales: totalNonCashSales,
        total_sales: totalSales,
        total_cash_in: totalCashIn,
        total_cash_out: totalCashOut,
        expected_cash: expectedCash,
        end_cash_actual: actualCash,
        difference: difference,
        status_reconciliation: difference === 0 ? "SEIMBANG / PAS" : difference > 0 ? "LEBIH (SURPLUS)" : "KURANG (DEFICIT)",
        notes: closedShift.notes
      }
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: err.message || "Gagal menutup shift kasir" });
  } finally {
    client.release();
  }
});

// GET shift history for auditing
router.get("/history", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { warehouse_id } = req.query;

    let query = `
      SELECT 
        cs.*,
        w.name as warehouse_name,
        u.name as cashier_name
      FROM cashier_shifts cs
      JOIN warehouses w ON cs.warehouse_id = w.id
      JOIN users u ON cs.user_id = u.id
      WHERE cs.tenant_id = $1
    `;
    const params: any[] = [tenant_id];

    if (warehouse_id) {
      query += ` AND cs.warehouse_id = $2`;
      params.push(warehouse_id);
    }

    query += ` ORDER BY cs.opened_at DESC LIMIT 50`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil riwayat shift kasir" });
  }
});

export default router;
