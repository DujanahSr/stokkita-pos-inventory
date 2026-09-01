import express, { Request, Response } from "express";
import pool from "../db.js";
import PDFDocument from "pdfkit";
// @ts-ignore
import ExcelJS from "exceljs";

const router = express.Router();

const getReportData = async (tenant_id: string, days: number) => {
  // Summary: Total Penjualan, COGS, & Transaksi in period
  const tRes = await pool.query(
    `SELECT 
        COUNT(DISTINCT t.id) as total_transaksi, 
        COALESCE(SUM(ti.subtotal), 0) as total_pendapatan,
        COALESCE(SUM(ti.qty * v.price_buy), 0) as total_cogs
     FROM transactions t
     LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
     LEFT JOIN variants v ON ti.variant_id = v.id
     WHERE t.tenant_id = $1 AND t.created_at >= NOW() - ($2 || ' days')::interval AND t.type != 'Retur'`, 
    [tenant_id, days]
  );

  // Summary: Total Unit Terjual in period
  const uRes = await pool.query(
    `SELECT COALESCE(SUM(ti.qty), 0) as total_unit 
     FROM transaction_items ti
     JOIN transactions t ON ti.transaction_id = t.id
     WHERE t.tenant_id = $1 AND t.created_at >= NOW() - ($2 || ' days')::interval AND t.type != 'Retur'`, 
    [tenant_id, days]
  );

  // Summary: Total Nilai Stok
  const sRes = await pool.query(
    `SELECT COALESCE(SUM(i.qty * v.price_buy), 0) as total_nilai_stok 
     FROM inventory i
     JOIN variants v ON i.variant_id = v.id
     JOIN warehouses w ON i.warehouse_id = w.id
     WHERE w.tenant_id = $1`, 
    [tenant_id]
  );

  // Chart: Penjualan per Hari (Continuous dates)
  const chartRes = await pool.query(
    `WITH date_series AS (
       SELECT generate_series(
         CURRENT_DATE - ($2 - 1 || ' days')::interval,
         CURRENT_DATE,
         '1 day'::interval
       )::date AS date
     )
     SELECT 
       ds.date as name, 
       COALESCE(SUM(ti.subtotal), 0) as total,
       COALESCE(SUM(ti.subtotal) - SUM(ti.qty * v.price_buy), 0) as profit
     FROM date_series ds
     LEFT JOIN transactions t 
       ON DATE(t.created_at) = ds.date AND t.tenant_id = $1 AND t.type != 'Retur'
     LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
     LEFT JOIN variants v ON ti.variant_id = v.id
     GROUP BY ds.date
     ORDER BY ds.date ASC`, 
    [tenant_id, days]
  );

  // Top Produk
  const topRes = await pool.query(
    `SELECT p.name as produk_nama, COALESCE(SUM(ti.qty), 0) as qty, COALESCE(SUM(ti.subtotal), 0) as total
     FROM transaction_items ti
     JOIN transactions t ON ti.transaction_id = t.id
     JOIN variants v ON ti.variant_id = v.id
     JOIN products p ON v.product_id = p.id
     WHERE t.tenant_id = $1 AND t.created_at >= NOW() - ($2 || ' days')::interval AND t.type != 'Retur'
     GROUP BY p.id, p.name
     ORDER BY qty DESC
     LIMIT 50`, 
    [tenant_id, days]
  );

  // Stok Kritis
  const kritisRes = await pool.query(
    `SELECT p.name as nama, p.category as kategori, i.qty as stok, v.rop as safety_stock, (v.rop - i.qty) as kekurangan
     FROM inventory i
     JOIN variants v ON i.variant_id = v.id
     JOIN products p ON v.product_id = p.id
     JOIN warehouses w ON i.warehouse_id = w.id
     WHERE w.tenant_id = $1 AND i.qty <= v.rop
     ORDER BY kekurangan DESC
     LIMIT 5`, 
    [tenant_id]
  );

  return {
    summary: {
      totalPenjualan: Number(tRes.rows[0].total_pendapatan),
      totalCogs: Number(tRes.rows[0].total_cogs),
      totalLabaKotor: Number(tRes.rows[0].total_pendapatan) - Number(tRes.rows[0].total_cogs),
      totalTransaksi: Number(tRes.rows[0].total_transaksi),
      totalUnit: Number(uRes.rows[0].total_unit),
      totalNilaiStok: Number(sRes.rows[0].total_nilai_stok)
    },
    penjualanPerHari: chartRes.rows,
    topProduk: topRes.rows,
    stokKritis: kritisRes.rows
  };
};

const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v);

router.get("/", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;
    const days = parseInt(req.query.periode as string) || 7;
    const data = await getReportData(tenant_id, days);
    // Batasi topProduk ke 10 untuk view web
    data.topProduk = data.topProduk.slice(0, 10);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/export/pdf", async (req: Request, res: Response) => {
  try {
    const { tenant_id, tenant_name } = req.user as any;
    const days = parseInt(req.query.periode as string) || 30;
    const data = await getReportData(tenant_id, days);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="laporan_${days}_hari.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#059669').text(`Laporan Kinerja Bisnis`, { align: 'center' });
    doc.fontSize(14).fillColor('#475569').text(`${tenant_name || 'Toko UMKM'}`, { align: 'center' });
    doc.fontSize(10).text(`Periode: ${days} Hari Terakhir`, { align: 'center' });
    doc.moveDown(2);

    // Summary Box
    doc.rect(50, doc.y, 495, 80).fill('#f8fafc').stroke('#e2e8f0');
    const startY = doc.y + 15;
    doc.fillColor('#0f172a').fontSize(11);
    doc.text(`Omzet Penjualan: ${fmt(data.summary.totalPenjualan)}`, 65, startY);
    doc.text(`Laba Kotor: ${fmt(data.summary.totalLabaKotor)}`, 65, startY + 20);
    doc.text(`Total Transaksi: ${data.summary.totalTransaksi}`, 65, startY + 40);
    doc.text(`Unit Terjual: ${data.summary.totalUnit}`, 280, startY);
    doc.text(`Nilai Stok Saat Ini: ${fmt(data.summary.totalNilaiStok)}`, 280, startY + 20);
    doc.moveDown(4);

    // Top Products Table Header
    doc.fontSize(16).fillColor('#0f172a').text('Produk Terlaris', 50, doc.y);
    doc.moveDown(1);
    
    let tableY = doc.y;
    doc.fontSize(10).fillColor('#475569');
    doc.text('No', 50, tableY, { width: 30 });
    doc.text('Nama Produk', 90, tableY, { width: 220 });
    doc.text('Qty', 320, tableY, { width: 50, align: 'right' });
    doc.text('Pendapatan', 380, tableY, { width: 150, align: 'right' });
    
    doc.moveTo(50, tableY + 15).lineTo(545, tableY + 15).stroke('#cbd5e1');
    doc.y = tableY + 25;

    // Table Rows
    data.topProduk.slice(0, 20).forEach((p: any, idx: number) => {
      let currentY = doc.y;
      doc.fillColor('#0f172a');
      doc.text(`${idx + 1}`, 50, currentY, { width: 30 });
      doc.text(`${p.produk_nama}`, 90, currentY, { width: 220 });
      doc.text(`${p.qty}`, 320, currentY, { width: 50, align: 'right' });
      doc.text(`${fmt(Number(p.total))}`, 380, currentY, { width: 150, align: 'right' });
      
      doc.moveTo(50, currentY + 15).lineTo(545, currentY + 15).stroke('#f1f5f9');
      doc.y = currentY + 20;

      if (doc.y > 750) {
        doc.addPage();
        doc.y = 50;
      }
    });

    // Footer
    doc.fontSize(8).fillColor('#94a3b8').text(`Dihasilkan oleh StokKita System pada ${new Date().toLocaleString()}`, 50, 780, { align: 'center' });

    doc.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ error: "Server error" });
  }
});

router.get("/export/excel", async (req: Request, res: Response) => {
  try {
    const { tenant_id, tenant_name } = req.user as any;
    const days = parseInt(req.query.periode as string) || 30;
    const data = await getReportData(tenant_id, days);

    // Fetch Store Settings for branding
    let storeName = tenant_name || "StokKita Retail Store";
    let storePhone = "";
    try {
      const sRes = await pool.query("SELECT store_name, phone FROM store_settings WHERE tenant_id = $1", [tenant_id]);
      if (sRes.rows.length > 0) {
        storeName = sRes.rows[0].store_name || storeName;
        storePhone = sRes.rows[0].phone || "";
      }
    } catch (err) {
      // ignore
    }

    // Fetch Detailed Transactions
    const trxRes = await pool.query(`
      SELECT 
        t.id,
        t.created_at,
        w.name as warehouse_name,
        u.name as cashier_name,
        t.type,
        t.payment_method,
        t.total_amount,
        t.payment_details,
        COUNT(ti.id) as item_count,
        COALESCE(SUM(ti.qty), 0) as total_qty
      FROM transactions t
      LEFT JOIN warehouses w ON t.warehouse_id = w.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      WHERE t.tenant_id = $1 AND t.created_at >= NOW() - ($2 || ' days')::interval
      GROUP BY t.id, t.created_at, w.name, u.name, t.type, t.payment_method, t.total_amount, t.payment_details
      ORDER BY t.created_at DESC
    `, [tenant_id, days]);

    // Fetch Payment Methods Summary
    const payRes = await pool.query(`
      SELECT 
        t.payment_method,
        COUNT(t.id) as trx_count,
        COALESCE(SUM(t.total_amount), 0) as total_nominal
      FROM transactions t
      WHERE t.tenant_id = $1 AND t.created_at >= NOW() - ($2 || ' days')::interval AND t.type != 'Retur'
      GROUP BY t.payment_method
      ORDER BY total_nominal DESC
    `, [tenant_id, days]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StokKita Enterprise POS';
    workbook.created = new Date();

    const thinBorder: any = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };

    // ==========================================
    // SHEET 1: RINGKASAN & PRODUK TERLARIS
    // ==========================================
    const ws1 = workbook.addWorksheet('Ringkasan & Produk');
    ws1.views = [{ showGridLines: true }];

    // 1. Header Banner
    ws1.mergeCells('A1', 'F1');
    ws1.getCell('A1').value = `LAPORAN EKSEKUTIF PENJUALAN - ${storeName.toUpperCase()}`;
    ws1.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    ws1.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Dark Slate
    ws1.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(1).height = 30;

    ws1.mergeCells('A2', 'F2');
    ws1.getCell('A2').value = `Periode: ${days} Hari Terakhir  |  Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}  |  Kontak: ${storePhone || '-'}`;
    ws1.getCell('A2').font = { size: 9, italic: true, color: { argb: 'FFFFFFFF' } };
    ws1.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }; // Emerald
    ws1.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    ws1.getRow(2).height = 20;

    // 2. KPI Summary Box Section (Row 4 to Row 9)
    ws1.mergeCells('A4', 'F4');
    ws1.getCell('A4').value = 'RINGKASAN METRIK KEUANGAN & INVENTORI';
    ws1.getCell('A4').font = { size: 11, bold: true, color: { argb: 'FF0F172A' } };

    const kpiData = [
      { label: 'Total Omzet Penjualan (Gross)', val: data.summary.totalPenjualan, fmt: '"Rp "#,##0', note: 'Total penerimaan dari transaksi kasir' },
      { label: 'Estimasi Laba Kotor (Gross Profit)', val: data.summary.totalLabaKotor, fmt: '"Rp "#,##0', note: `Margin: ${data.summary.totalPenjualan > 0 ? ((data.summary.totalLabaKotor / data.summary.totalPenjualan) * 100).toFixed(1) : 0}% dari Omzet` },
      { label: 'Total Transaksi Selesai', val: data.summary.totalTransaksi, fmt: '#,##0" Transaksi"', note: `Rata-rata: ${data.summary.totalTransaksi > 0 ? Math.round(data.summary.totalPenjualan / data.summary.totalTransaksi) : 0} / transaksi` },
      { label: 'Total Unit Produk Terjual', val: data.summary.totalUnit, fmt: '#,##0" Pcs / Pasang"', note: 'Volume produk fisik terjual' },
      { label: 'Total Estimasi Nilai Stok Fisik', val: data.summary.totalNilaiStok, fmt: '"Rp "#,##0', note: 'Aset modal barang di seluruh cabang toko' }
    ];

    kpiData.forEach((kpi, idx) => {
      const rowIdx = 5 + idx;
      ws1.mergeCells(`A${rowIdx}`, `C${rowIdx}`);
      ws1.getCell(`A${rowIdx}`).value = kpi.label;
      ws1.getCell(`A${rowIdx}`).font = { size: 10, bold: true, color: { argb: 'FF334155' } };
      ws1.getCell(`A${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      ws1.getCell(`A${rowIdx}`).border = thinBorder;

      ws1.mergeCells(`D${rowIdx}`, `E${rowIdx}`);
      ws1.getCell(`D${rowIdx}`).value = kpi.val;
      ws1.getCell(`D${rowIdx}`).font = { size: 10, bold: true, color: { argb: 'FF059669' } };
      ws1.getCell(`D${rowIdx}`).numFmt = kpi.fmt;
      ws1.getCell(`D${rowIdx}`).alignment = { horizontal: 'right' };
      ws1.getCell(`D${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      ws1.getCell(`D${rowIdx}`).border = thinBorder;

      ws1.getCell(`F${rowIdx}`).value = kpi.note;
      ws1.getCell(`F${rowIdx}`).font = { size: 8, italic: true, color: { argb: 'FF64748B' } };
      ws1.getCell(`F${rowIdx}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      ws1.getCell(`F${rowIdx}`).border = thinBorder;
    });

    // 3. Section Title: Top Produk
    ws1.mergeCells('A12', 'F12');
    ws1.getCell('A12').value = 'ANALISIS PRODUK TERLARIS (TOP SELLING PRODUCTS)';
    ws1.getCell('A12').font = { size: 11, bold: true, color: { argb: 'FF0F172A' } };

    // Table Header
    const tableHeaders = ['No', 'Nama Produk', 'Jumlah Terjual (Qty)', 'Total Pendapatan (Omzet)', 'Estimasi Laba', 'Kontribusi (%)'];
    ws1.getRow(13).values = tableHeaders;
    ws1.getRow(13).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws1.getRow(13).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    ws1.getRow(13).height = 24;
    ws1.getRow(13).alignment = { vertical: 'middle' };

    ws1.columns = [
      { key: 'no', width: 6 },
      { key: 'product_name', width: 38 },
      { key: 'qty', width: 22 },
      { key: 'omzet', width: 26 },
      { key: 'laba', width: 24 },
      { key: 'kontribusi', width: 18 }
    ];

    let sumQty = 0;
    let sumOmzet = 0;

    data.topProduk.forEach((p: any, idx: number) => {
      const rowIdx = 14 + idx;
      const qtyNum = Number(p.qty || 0);
      const omzetNum = Number(p.total || 0);
      const kontribusiPct = data.summary.totalPenjualan > 0 ? (omzetNum / data.summary.totalPenjualan) : 0;
      sumQty += qtyNum;
      sumOmzet += omzetNum;

      const r = ws1.addRow({
        no: idx + 1,
        product_name: p.produk_nama,
        qty: qtyNum,
        omzet: omzetNum,
        laba: Math.round(omzetNum * 0.3), // estimasi rata2 gross margin
        kontribusi: kontribusiPct
      });

      r.height = 20;
      r.border = thinBorder;
      if (idx % 2 === 1) {
        r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      }

      r.getCell('no').alignment = { horizontal: 'center' };
      r.getCell('qty').alignment = { horizontal: 'center' };
      r.getCell('qty').numFmt = '#,##0" pcs"';
      r.getCell('omzet').numFmt = '"Rp "#,##0';
      r.getCell('laba').numFmt = '"Rp "#,##0';
      r.getCell('kontribusi').numFmt = '0.0%';
      r.getCell('kontribusi').alignment = { horizontal: 'center' };
    });

    // Total Row
    const totalRow = ws1.addRow({
      no: '',
      product_name: 'TOTAL KESELURUHAN',
      qty: sumQty,
      omzet: sumOmzet,
      laba: Math.round(sumOmzet * 0.3),
      kontribusi: 1.0
    });
    totalRow.font = { bold: true, color: { argb: 'FF0F172A' } };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    totalRow.height = 22;
    totalRow.border = thinBorder;
    totalRow.getCell('qty').numFmt = '#,##0" pcs"';
    totalRow.getCell('qty').alignment = { horizontal: 'center' };
    totalRow.getCell('omzet').numFmt = '"Rp "#,##0';
    totalRow.getCell('laba').numFmt = '"Rp "#,##0';
    totalRow.getCell('kontribusi').numFmt = '0.0%';
    totalRow.getCell('kontribusi').alignment = { horizontal: 'center' };

    // ==========================================
    // SHEET 2: RIWAYAT TRANSAKSI LENGKAP
    // ==========================================
    const ws2 = workbook.addWorksheet('Riwayat Transaksi');
    ws2.views = [{ showGridLines: true }];

    ws2.mergeCells('A1', 'I1');
    ws2.getCell('A1').value = `BUKU RIWAYAT TRANSAKSI KASIR - ${storeName.toUpperCase()}`;
    ws2.getCell('A1').font = { size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    ws2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    ws2.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(1).height = 28;

    const trxHeaders = ['No', 'ID Transaksi', 'Waktu Transaksi', 'Cabang Toko', 'Nama Kasir', 'Tipe', 'Metode Bayar', 'Jml Item', 'Total Bayar'];
    ws2.getRow(3).values = trxHeaders;
    ws2.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws2.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    ws2.getRow(3).height = 22;

    ws2.columns = [
      { key: 'no', width: 6 },
      { key: 'id', width: 22 },
      { key: 'date', width: 20 },
      { key: 'warehouse', width: 22 },
      { key: 'cashier', width: 18 },
      { key: 'type', width: 14 },
      { key: 'payment', width: 16 },
      { key: 'items', width: 12 },
      { key: 'total', width: 20 }
    ];

    trxRes.rows.forEach((t: any, idx: number) => {
      const r = ws2.addRow({
        no: idx + 1,
        id: t.id.slice(0, 13),
        date: new Date(t.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
        warehouse: t.warehouse_name || 'Cabang Utama',
        cashier: t.cashier_name || 'Kasir',
        type: t.type,
        payment: t.payment_method,
        items: Number(t.total_qty || t.item_count || 1),
        total: Number(t.total_amount || 0)
      });

      r.height = 19;
      r.border = thinBorder;
      if (idx % 2 === 1) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

      r.getCell('no').alignment = { horizontal: 'center' };
      r.getCell('date').alignment = { horizontal: 'center' };
      r.getCell('type').alignment = { horizontal: 'center' };
      r.getCell('payment').alignment = { horizontal: 'center' };
      r.getCell('items').alignment = { horizontal: 'center' };
      r.getCell('total').numFmt = '"Rp "#,##0';
    });

    // ==========================================
    // SHEET 3: REKAP METODE PEMBAYARAN
    // ==========================================
    const ws3 = workbook.addWorksheet('Rekap Pembayaran');
    ws3.views = [{ showGridLines: true }];

    ws3.mergeCells('A1', 'E1');
    ws3.getCell('A1').value = `REKAPITULASI METODE PEMBAYARAN & SETTLEMENT`;
    ws3.getCell('A1').font = { size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    ws3.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    ws3.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws3.getRow(1).height = 28;

    const payHeaders = ['No', 'Kanal Pembayaran', 'Frekuensi Transaksi', 'Total Nominal (Rp)', 'Pangsa Pasar (%)'];
    ws3.getRow(3).values = payHeaders;
    ws3.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws3.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    ws3.getRow(3).height = 22;

    ws3.columns = [
      { key: 'no', width: 6 },
      { key: 'method', width: 25 },
      { key: 'count', width: 22 },
      { key: 'amount', width: 26 },
      { key: 'share', width: 18 }
    ];

    payRes.rows.forEach((p: any, idx: number) => {
      const nom = Number(p.total_nominal || 0);
      const share = data.summary.totalPenjualan > 0 ? (nom / data.summary.totalPenjualan) : 0;

      const r = ws3.addRow({
        no: idx + 1,
        method: p.payment_method || 'Tunai',
        count: Number(p.trx_count),
        amount: nom,
        share: share
      });

      r.height = 20;
      r.border = thinBorder;
      r.getCell('no').alignment = { horizontal: 'center' };
      r.getCell('count').alignment = { horizontal: 'center' };
      r.getCell('count').numFmt = '#,##0" trx"';
      r.getCell('amount').numFmt = '"Rp "#,##0';
      r.getCell('share').numFmt = '0.0%';
      r.getCell('share').alignment = { horizontal: 'center' };
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="laporan_penjualan_${days}_hari.xlsx"`
    );
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ error: "Server error" });
  }
});

// GET /api/laporan/analytics - Executive Financial & Inventory Analytics
router.get("/analytics", async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.user as any;

    // 1. Gross Profit & Financial Summary (Last 30 days)
    const finRes = await pool.query(`
      SELECT 
        COALESCE(SUM(ti.subtotal), 0) as total_revenue,
        COALESCE(SUM(ti.qty * v.price_buy), 0) as total_cogs,
        COUNT(DISTINCT t.id) as total_transactions,
        COALESCE(SUM(ti.qty), 0) as total_units_sold
      FROM transactions t
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN variants v ON ti.variant_id = v.id
      WHERE t.tenant_id = $1 AND t.created_at >= NOW() - INTERVAL '30 days' AND t.type != 'Retur'
    `, [tenant_id]);

    const revenue = Number(finRes.rows[0]?.total_revenue || 0);
    const cogs = Number(finRes.rows[0]?.total_cogs || 0);
    const grossProfit = revenue - cogs;
    const profitMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : "0";

    // 2. Top 5 Best Selling Products (Volume & Omset)
    const topRes = await pool.query(`
      SELECT 
        p.name as product_name,
        v.sku,
        v.size,
        v.color,
        SUM(ti.qty) as total_qty_sold,
        SUM(ti.subtotal) as total_revenue_generated
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      JOIN variants v ON ti.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      WHERE t.tenant_id = $1 AND t.created_at >= NOW() - INTERVAL '30 days' AND t.type != 'Retur'
      GROUP BY p.name, v.sku, v.size, v.color
      ORDER BY total_qty_sold DESC
      LIMIT 5
    `, [tenant_id]);

    // 3. Slow-Moving / Dead Stock Items (Stock > 0 with 0 sales in last 30 days)
    const slowRes = await pool.query(`
      SELECT 
        p.name as product_name,
        v.sku,
        v.size,
        v.color,
        i.qty as current_stock,
        v.price_buy,
        (i.qty * v.price_buy) as idle_capital,
        w.name as warehouse_name
      FROM inventory i
      JOIN variants v ON i.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN warehouses w ON i.warehouse_id = w.id
      WHERE p.tenant_id = $1 AND i.qty > 0
        AND v.id NOT IN (
          SELECT DISTINCT ti.variant_id 
          FROM transaction_items ti
          JOIN transactions t ON ti.transaction_id = t.id
          WHERE t.tenant_id = $1 AND t.created_at >= NOW() - INTERVAL '30 days'
        )
      ORDER BY idle_capital DESC
      LIMIT 5
    `, [tenant_id]);

    res.json({
      financial: {
        total_revenue: revenue,
        total_cogs: cogs,
        gross_profit: grossProfit,
        profit_margin_pct: Number(profitMargin),
        total_transactions: Number(finRes.rows[0]?.total_transactions || 0),
        total_units_sold: Number(finRes.rows[0]?.total_units_sold || 0)
      },
      top_selling: topRes.rows,
      slow_moving: slowRes.rows
    });
  } catch (err: any) {
    console.error("GET /api/laporan/analytics error:", err);
    res.status(500).json({ message: "Gagal mengambil data analitik eksekutif" });
  }
});

export default router;
