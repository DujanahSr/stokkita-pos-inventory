import express, { Request, Response } from "express";
import pool from "../db.js";
import redisClient from "../redisClient.js";
import PDFDocument from "pdfkit";
import { calculateDynamicInventoryMetrics } from "../utils/stockUtils.js";

const router = express.Router();

// GET all POs and Suggestions
router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    
    const result = await pool.query(`
      SELECT 
        po.id::text,
        po.kode_po,
        p.name as produk,
        v.sku as variant,
        w.name as warehouse,
        po.supplier,
        po.qty,
        po.total,
        po.status,
        po.created_at as tanggal
      FROM purchase_orders po
      JOIN variants v ON po.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN warehouses w ON po.warehouse_id = w.id
      WHERE po.tenant_id = $1
      
      UNION ALL
      
      SELECT 
        'SUG-' || i.id::text as id,
        'SUGGESTION' as kode_po,
        p.name as produk, 
        v.sku as variant,
        w.name as warehouse,
        'Supplier Pusat' as supplier,
        v.eoq as qty,
        (v.eoq * v.price_buy) as total,
        'Disarankan' as status,
        NOW() as tanggal
      FROM inventory i
      JOIN variants v ON i.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN warehouses w ON i.warehouse_id = w.id
      WHERE w.tenant_id = $1 
        AND i.qty <= v.rop
        AND NOT EXISTS (
            SELECT 1 FROM purchase_orders po2 
            WHERE po2.variant_id = i.variant_id 
              AND po2.warehouse_id = i.warehouse_id 
              AND po2.status = 'Menunggu'
        )
      ORDER BY tanggal DESC
    `, [tenant_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST Create Manual PO
router.post("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const { variant_id, warehouse_id, qty, supplier } = req.body;
    
    const vRes = await pool.query('SELECT price_buy FROM variants WHERE id = $1', [variant_id]);
    if (vRes.rows.length === 0) return res.status(404).json({ message: "Varian tidak ditemukan" });
    const price = vRes.rows[0].price_buy;
    const total = price * qty;
    
    const kode_po = `PO-${Date.now()}`;
    
    await pool.query(`
      INSERT INTO purchase_orders (tenant_id, warehouse_id, variant_id, qty, total, kode_po, supplier, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Menunggu')
    `, [tenant_id, warehouse_id, variant_id, qty, total, kode_po, supplier || 'Supplier Pusat']);
    
    res.json({ message: "PO berhasil dibuat" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST Recalculate Dynamic EOQ & ROP for all variants of tenant
router.post("/recalculate", async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { tenant_id } = req.user as any;
    
    // Get all variants belonging to tenant
    const varRes = await client.query(`
      SELECT v.id, v.sku, v.size, v.color, v.price_buy, v.rop as old_rop, v.eoq as old_eoq, p.name as product_name
      FROM variants v
      JOIN products p ON v.product_id = p.id
      WHERE p.tenant_id = $1
    `, [tenant_id]);

    if (varRes.rows.length === 0) {
      return res.json({ message: "Tidak ada varian produk yang ditemukan", updated_variants: [] });
    }

    await client.query("BEGIN");
    const updatedVariants = [];

    for (const v of varRes.rows) {
      // Get daily sales in the last 30 days
      const salesRes = await client.query(`
        SELECT DATE(t.created_at) as sale_date, COALESCE(SUM(ti.qty), 0) as qty
        FROM transactions t
        JOIN transaction_items ti ON t.id = ti.transaction_id
        WHERE t.tenant_id = $1 
          AND ti.variant_id = $2 
          AND t.created_at >= NOW() - INTERVAL '30 days'
          AND t.type != 'Retur'
        GROUP BY DATE(t.created_at)
      `, [tenant_id, v.id]);

      // Build 30-day continuous sales array
      const salesMap = new Map<string, number>();
      salesRes.rows.forEach(r => {
        salesMap.set(new Date(r.sale_date).toISOString().slice(0, 10), Number(r.qty));
      });

      const dailySalesArray: number[] = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        dailySalesArray.push(salesMap.get(dateStr) || 0);
      }

      const metrics = calculateDynamicInventoryMetrics(dailySalesArray, Number(v.price_buy));

      // Update variants table with new ROP and EOQ
      await client.query(`
        UPDATE variants
        SET rop = $1, eoq = $2
        WHERE id = $3
      `, [metrics.rop, metrics.eoq, v.id]);

      updatedVariants.push({
        id: v.id,
        sku: v.sku,
        product_name: v.product_name,
        size: v.size,
        color: v.color,
        price_buy: Number(v.price_buy),
        daily_velocity: metrics.avgDailySales,
        max_daily_sales: metrics.maxDailySales,
        safety_stock: metrics.safetyStock,
        old_rop: v.old_rop,
        new_rop: metrics.rop,
        old_eoq: v.old_eoq,
        new_eoq: metrics.eoq
      });
    }

    await client.query("COMMIT");

    res.json({
      message: "Kalkulasi dinamis EOQ & ROP 30 hari berhasil diperbarui",
      total_variants: updatedVariants.length,
      updated_variants: updatedVariants
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Recalculate error:", err);
    res.status(500).json({ message: err.message || "Gagal menghitung ulang parameter inventori" });
  } finally {
    client.release();
  }
});

// GET Export Purchase Order PDF
router.get("/export/pdf/:id", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const id = req.params.id as string;

    let poData: any = null;

    if (id.startsWith('SUG-')) {
      // Suggestion PO
      const inv_id = id.replace('SUG-', '');
      const sRes = await pool.query(`
        SELECT 
          'SUG-' || UPPER(SUBSTRING(i.id::text, 1, 8)) as kode_po,
          'Supplier Pusat' as supplier,
          v.eoq as qty,
          (v.eoq * v.price_buy) as total,
          'Disarankan' as status,
          NOW() as created_at,
          p.name as product_name,
          v.sku,
          v.size,
          v.color,
          v.price_buy,
          w.name as warehouse_name,
          w.address as warehouse_address,
          t.name as tenant_name,
          t.domain as tenant_domain
        FROM inventory i
        JOIN variants v ON i.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        JOIN warehouses w ON i.warehouse_id = w.id
        JOIN tenants t ON w.tenant_id = t.id
        WHERE i.id = $1 AND w.tenant_id = $2
      `, [inv_id, tenant_id]);

      if (sRes.rows.length === 0) return res.status(404).json({ message: "PO tidak ditemukan" });
      poData = sRes.rows[0];
    } else {
      // Real PO
      const pRes = await pool.query(`
        SELECT 
          po.kode_po,
          po.supplier,
          po.qty,
          po.total,
          po.status,
          po.created_at,
          p.name as product_name,
          v.sku,
          v.size,
          v.color,
          v.price_buy,
          w.name as warehouse_name,
          w.address as warehouse_address,
          t.name as tenant_name,
          t.domain as tenant_domain
        FROM purchase_orders po
        JOIN variants v ON po.variant_id = v.id
        JOIN products p ON v.product_id = p.id
        JOIN warehouses w ON po.warehouse_id = w.id
        JOIN tenants t ON po.tenant_id = t.id
        WHERE po.id = $1 AND po.tenant_id = $2
      `, [id, tenant_id]);

      if (pRes.rows.length === 0) return res.status(404).json({ message: "PO tidak ditemukan" });
      poData = pRes.rows[0];
    }

    const fmt = (n: number) => "Rp " + new Intl.NumberFormat("id-ID").format(n || 0);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${poData.kode_po}.pdf"`);
    doc.pipe(res);

    // Header Kop Dokumen
    doc.rect(40, 40, 515, 60).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text("SURAT PESANAN PEMBELIAN (PURCHASE ORDER)", 55, 52);
    doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text(`${poData.tenant_name.toUpperCase()} • B2B Procurement & Supply Chain System`, 55, 74);

    // Meta Box
    doc.rect(40, 115, 515, 80).strokeColor('#cbd5e1').stroke();

    // Left Meta Column
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    doc.text("INFORMASI PEMESANAN", 55, 125);
    doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
    doc.text("Nomor PO", 55, 142);
    doc.font('Helvetica-Bold').text(`: ${poData.kode_po}`, 125, 142, { width: 165 });
    doc.font('Helvetica').text("Tanggal Terbit", 55, 157);
    doc.text(`: ${new Date(poData.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}`, 125, 157, { width: 165 });
    doc.font('Helvetica').text("Status PO", 55, 172);
    doc.font('Helvetica-Bold').fillColor('#0369a1').text(`: ${poData.status.toUpperCase()}`, 125, 172, { width: 165 });

    // Right Meta Column
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
    doc.text("TUJUAN PENGIRIMAN & VENDOR", 305, 125);
    doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
    doc.text("Supplier / Vendor", 305, 142);
    doc.font('Helvetica-Bold').text(`: ${poData.supplier || 'Supplier Pusat'}`, 390, 142, { width: 155 });
    doc.font('Helvetica').text("Gudang Tujuan", 305, 157);
    doc.text(`: ${poData.warehouse_name}`, 390, 157, { width: 155 });
    doc.font('Helvetica').text("Alamat Pengiriman", 305, 172);
    doc.text(`: ${poData.warehouse_address || 'Pusat Distribusi'}`, 390, 172, { width: 155, ellipsis: true });

    // Table Items Header
    const tableTop = 215;
    doc.rect(40, tableTop, 515, 25).fill('#f1f5f9');
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
    doc.text("NO", 50, tableTop + 8);
    doc.text("DESKRIPSI PRODUK & SKU", 85, tableTop + 8);
    doc.text("VARIAN", 260, tableTop + 8);
    doc.text("QTY", 345, tableTop + 8, { width: 40, align: 'center' });
    doc.text("HARGA SATUAN", 395, tableTop + 8, { width: 75, align: 'right' });
    doc.text("SUBTOTAL", 475, tableTop + 8, { width: 70, align: 'right' });

    // Table Row
    const rowTop = tableTop + 25;
    doc.rect(40, rowTop, 515, 30).strokeColor('#e2e8f0').stroke();
    doc.fillColor('#0f172a').font('Helvetica').fontSize(9);
    doc.text("1", 50, rowTop + 10);
    doc.font('Helvetica-Bold').text(poData.product_name, 85, rowTop + 5);
    doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(`SKU: ${poData.sku}`, 85, rowTop + 17);
    doc.fontSize(9).fillColor('#0f172a').text(`${poData.size || '-'} / ${poData.color || '-'}`, 260, rowTop + 10);
    doc.font('Helvetica-Bold').text(`${poData.qty} pcs`, 345, rowTop + 10, { width: 40, align: 'center' });
    doc.font('Helvetica').text(fmt(Number(poData.price_buy)), 395, rowTop + 10, { width: 75, align: 'right' });
    doc.font('Helvetica-Bold').text(fmt(Number(poData.total)), 475, rowTop + 10, { width: 70, align: 'right' });

    // Summary Box
    const sumTop = rowTop + 40;
    doc.rect(330, sumTop, 225, 45).fill('#f8fafc');
    doc.rect(330, sumTop, 225, 45).strokeColor('#cbd5e1').stroke();
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11);
    doc.text("GRAND TOTAL:", 345, sumTop + 16);
    doc.fillColor('#059669').fontSize(13).text(fmt(Number(poData.total)), 430, sumTop + 15, { width: 115, align: 'right' });

    // Syarat & Ketentuan
    const termsTop = sumTop + 60;
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text("SYARAT & KETENTUAN PENGIRIMAN:", 40, termsTop);
    doc.font('Helvetica').fontSize(8).fillColor('#475569');
    doc.text("1. Barang harus dikirimkan dalam kondisi baru, segel utuh, dan sesuai spesifikasi SKU di atas.", 40, termsTop + 14);
    doc.text("2. Harap sertakan Surat Jalan dan salinan PO resmi ini saat pengiriman ke gudang.", 40, termsTop + 26);
    doc.text("3. Pembayaran akan diproses setelah tim gudang melakukan verifikasi Goods Receipt (Penerimaan Barang).", 40, termsTop + 38);

    // Tanda Tangan Ganda
    const signTop = termsTop + 65;
    doc.rect(40, signTop, 230, 85).strokeColor('#cbd5e1').stroke();
    doc.rect(325, signTop, 230, 85).strokeColor('#cbd5e1').stroke();

    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8);
    doc.text("DISETUJUI OLEH (PEMBELI):", 50, signTop + 8);
    doc.text("DITERIMA & DIKONFIRMASI (VENDOR):", 335, signTop + 8);

    doc.font('Helvetica').fontSize(8).fillColor('#64748b');
    doc.text(`${poData.tenant_name}`, 50, signTop + 68);
    doc.text(`${poData.supplier || 'Supplier Pusat'}`, 335, signTop + 68);

    // Footer
    doc.fontSize(7).fillColor('#94a3b8').text("Dokumen ini dicetak otomatis secara sah oleh StokKita B2B Platform pada " + new Date().toLocaleString('id-ID'), 40, 770, { align: 'center', width: 515 });

    doc.end();
  } catch (err: any) {
    console.error("PDF Export error:", err);
    res.status(500).json({ message: "Gagal membuat dokumen PDF PO" });
  }
});

// PUT Process PO (Terima / Batal)
router.put("/:id/:action", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const id = req.params.id as string;
    const action = req.params.action as string;
    
    if (id.startsWith('SUG-')) {
      if (action !== 'terima') return res.status(400).json({ message: "Saran hanya bisa diterima" });
      
      const inv_id = id.replace('SUG-', '');
      const iRes = await pool.query(`
        SELECT i.warehouse_id, i.variant_id, v.eoq, v.price_buy 
        FROM inventory i 
        JOIN variants v ON i.variant_id = v.id 
        WHERE i.id = $1
      `, [inv_id]);
      
      if (iRes.rows.length === 0) return res.status(404).json({ message: "Saran tidak valid" });
      
      const inv = iRes.rows[0];
      const qty = inv.eoq;
      const total = qty * inv.price_buy;
      const kode_po = `PO-${Date.now()}`;
      
      await pool.query('BEGIN');
      
      await pool.query(`
        INSERT INTO purchase_orders (tenant_id, warehouse_id, variant_id, qty, total, kode_po, supplier, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'Supplier Pusat', 'Selesai')
      `, [tenant_id, inv.warehouse_id, inv.variant_id, qty, total, kode_po]);
      
      await pool.query(`
        UPDATE inventory SET qty = qty + $1 WHERE id = $2
      `, [qty, inv_id]);
      
      await pool.query('COMMIT');
      
      if (redisClient.isOpen) {
        await redisClient.del(`inventory:${inv.warehouse_id}`);
      }
      
      return res.json({ message: "Saran PO diterima, stok gudang otomatis bertambah" });
    }
    
    const poRes = await pool.query('SELECT * FROM purchase_orders WHERE id = $1 AND tenant_id = $2', [id, tenant_id]);
    if (poRes.rows.length === 0) return res.status(404).json({ message: "PO tidak ditemukan" });
    const po = poRes.rows[0];
    
    if (po.status !== 'Menunggu') return res.status(400).json({ message: "PO sudah diproses sebelumnya" });
    
    if (action === 'terima') {
      await pool.query('BEGIN');
      await pool.query('UPDATE purchase_orders SET status = $1 WHERE id = $2', ['Selesai', id]);
      await pool.query('UPDATE inventory SET qty = qty + $1 WHERE warehouse_id = $2 AND variant_id = $3', [po.qty, po.warehouse_id, po.variant_id]);
      await pool.query('COMMIT');
      
      if (redisClient.isOpen) {
        await redisClient.del(`inventory:${po.warehouse_id}`);
      }
    } else if (action === 'batal') {
      await pool.query('UPDATE purchase_orders SET status = $1 WHERE id = $2', ['Batal', id]);
    }
    
    res.json({ message: `PO berhasil di-${action}` });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
