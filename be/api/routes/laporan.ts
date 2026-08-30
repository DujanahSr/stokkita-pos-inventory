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

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StokKita System';
    workbook.created = new Date();

    const ws = workbook.addWorksheet(`Laporan ${days} Hari`);

    // Title
    ws.mergeCells('A1', 'D1');
    ws.getCell('A1').value = `LAPORAN PENJUALAN - ${tenant_name || 'Toko UMKM'}`;
    ws.getCell('A1').font = { size: 16, bold: true };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.mergeCells('A2', 'D2');
    ws.getCell('A2').value = `Periode: ${days} Hari Terakhir`;
    ws.getCell('A2').alignment = { horizontal: 'center' };

    // Summary
    ws.getCell('A4').value = 'Omzet Penjualan:';
    ws.getCell('B4').value = data.summary.totalPenjualan;
    ws.getCell('B4').numFmt = '"Rp "#,##0';

    ws.getCell('A5').value = 'Laba Kotor:';
    ws.getCell('B5').value = data.summary.totalLabaKotor;
    ws.getCell('B5').numFmt = '"Rp "#,##0';
    
    ws.getCell('A6').value = 'Total Transaksi:';
    ws.getCell('B6').value = data.summary.totalTransaksi;

    ws.getCell('A7').value = 'Unit Terjual:';
    ws.getCell('B7').value = data.summary.totalUnit;

    ws.getCell('A8').value = 'Nilai Stok Saat Ini:';
    ws.getCell('B8').value = data.summary.totalNilaiStok;
    ws.getCell('B8').numFmt = '"Rp "#,##0';

    // Header Tabel
    ws.getRow(10).values = ['No', 'Nama Produk', 'Qty Terjual', 'Total Pendapatan'];
    ws.getRow(10).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(10).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    
    ws.columns = [
      { key: 'no', width: 5 },
      { key: 'produk', width: 40 },
      { key: 'qty', width: 15 },
      { key: 'total', width: 25 }
    ];

    // Data Tabel
    data.topProduk.forEach((p: any, idx: number) => {
      const row = ws.addRow({
        no: idx + 1,
        produk: p.produk_nama,
        qty: Number(p.qty),
        total: Number(p.total)
      });
      row.getCell('total').numFmt = '"Rp "#,##0';
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

export default router;
