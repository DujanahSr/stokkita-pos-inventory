/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import SalesChart from "../components/charts/SalesChart";
import Badge from "../components/ui/Badge";
import StatCard from "../components/ui/StatCard";
import Modal from "../components/ui/Modal";
import api from "../api/axios";
import { 
  TrendingUp, Package, ShoppingBag, Layers, 
  Clock, ShieldCheck, Printer, Store, DollarSign, 
  FileSpreadsheet, FileText, CheckCircle2, AlertTriangle
} from "lucide-react";

const fmt = (v: any) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

export default function Laporan() {
  const [activeTab, setActiveTab] = useState<"finansial" | "shift">("finansial");

  // Tab 1: Finansial State
  const [data, setData] = useState<any>(null);
  const [periode, setPeriode] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Tab 2: Shift History State
  const [shifts, setShifts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedW, setSelectedW] = useState<string>("");
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [selectedZReport, setSelectedZReport] = useState<any>(null);

  const handleExport = async (type: "excel" | "pdf") => {
    setIsExporting(true);
    try {
      const response = await api.get(`/laporan/export/${type}?periode=${periode}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_${periode}_hari.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(`Gagal mengunduh laporan ${type.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Load Financial Data
  useEffect(() => {
    if (activeTab === "finansial") {
      setLoading(true);
      setError("");

      api.get(`/laporan?periode=${periode}`)
        .then((r) => setData(r.data))
        .catch((err) => setError(err.response?.data?.message || "Gagal memuat laporan"))
        .finally(() => setLoading(false));
    }
  }, [periode, activeTab]);

  // Load Warehouses & Shift History
  useEffect(() => {
    api.get("/master/warehouses").then(res => setWarehouses(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === "shift") {
      fetchShifts(selectedW);
    }
  }, [activeTab, selectedW]);

  const fetchShifts = async (wid?: string) => {
    setLoadingShifts(true);
    try {
      const url = wid ? `/shift/history?warehouse_id=${wid}` : "/shift/history";
      const res = await api.get(url);
      setShifts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingShifts(false);
    }
  };

  // Stats for Shifts
  const totalShiftSales = shifts.reduce((sum, s) => sum + Number(s.total_sales || 0), 0);
  const totalShiftCash = shifts.reduce((sum, s) => sum + Number(s.total_cash_sales || 0), 0);
  const totalShiftNonCash = shifts.reduce((sum, s) => sum + Number(s.total_non_cash_sales || 0), 0);
  const closedShifts = shifts.filter(s => s.status === 'CLOSED');
  const balancedShiftsCount = closedShifts.filter(s => Number(s.difference) === 0).length;
  const varianceShiftsCount = closedShifts.filter(s => Number(s.difference) !== 0).length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Laporan & Audit" />
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* Header & Tab Navigation */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={32} />
                Laporan & Audit Eksekutif
              </h1>
              <p className="text-slate-500 mt-1">Analitik Laba Bersih, Omset, dan Rekonsiliasi Kas Kasir (Z-Report)</p>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner">
              <button
                onClick={() => setActiveTab("finansial")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "finansial" 
                    ? "bg-white text-emerald-700 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Laporan Finansial & HPP
              </button>
              <button
                onClick={() => setActiveTab("shift")}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === "shift" 
                    ? "bg-white text-emerald-700 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Audit Shift Kasir (Z-Report)
              </button>
            </div>
          </div>

          {/* TAB 1: FINANSIAL & PENJUALAN */}
          {activeTab === "finansial" && (
            <div className="space-y-6">
              {/* Filter & Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase mr-1">Periode:</span>
                  {[7, 14, 30, 90].map((p) => (
                    <button 
                      key={p} 
                      onClick={() => setPeriode(p)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                        periode === p ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p} Hari
                    </button>
                  ))}
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport('excel')}
                    disabled={isExporting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 disabled:opacity-50 transition shadow-sm"
                  >
                    <FileSpreadsheet size={16} /> Export Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 disabled:opacity-50 transition shadow-sm"
                  >
                    <FileText size={16} /> Export PDF
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex h-56 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400">
                  Memuat data laporan finansial...
                </div>
              ) : data ? (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                    {[
                      { label: "Omzet Penjualan", val: fmt(data.summary.totalPenjualan), icon: TrendingUp, color: "green", sub: "Total pendapatan kotor" },
                      { label: "Laba Kotor (COGS)", val: fmt(data.summary.totalLabaKotor), icon: TrendingUp, color: "emerald", sub: "Omzet - HPP Modal" },
                      { label: "Total Transaksi", val: data.summary.totalTransaksi, icon: ShoppingBag, color: "green", sub: "Transaksi selesai" },
                      { label: "Unit Terjual", val: data.summary.totalUnit, icon: Package, color: "amber", sub: "Total kuantitas barang" },
                      { label: "Nilai Aset Stok", val: fmt(data.summary.totalNilaiStok), icon: Layers, color: "red", sub: "Modal tersimpan di gudang" },
                    ].map(({ label, val, icon: Icon, color, sub }) => (
                      <StatCard key={label} label={label} value={val} icon={Icon} color={color} sub={sub} />
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Tren Penjualan & Laba Harian ({periode} Hari Terakhir)</h3>
                    <SalesChart data={data.penjualanPerHari} />
                  </div>

                  {/* Top produk */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-800 mb-4">Top 10 Produk Terlaris</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 border-b border-slate-100">
                          <tr>
                            <th className="pb-3">#</th>
                            <th className="pb-3 font-semibold">Produk</th>
                            <th className="pb-3 font-semibold text-right">Qty Terjual</th>
                            <th className="pb-3 font-semibold text-right">Total Omzet</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {data.topProduk.map((p: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 text-slate-400 font-bold text-xs">{i + 1}</td>
                              <td className="py-3 font-semibold text-slate-800">{p.produk_nama}</td>
                              <td className="py-3 text-right font-medium text-slate-600">{p.qty} pcs</td>
                              <td className="py-3 text-right font-bold text-emerald-700">{fmt(p.total)}</td>
                            </tr>
                          ))}
                          {data.topProduk.length === 0 && (
                            <tr><td colSpan={4} className="py-8 text-center text-slate-400">Belum ada data penjualan pada periode ini</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* TAB 2: AUDIT SHIFT KASIR (Z-REPORT) */}
          {activeTab === "shift" && (
            <div className="space-y-6">
              
              {/* Filter Gudang */}
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-slate-700 text-sm font-medium">
                  <Store size={18} className="text-emerald-600" />
                  <span>Filter Cabang / Toko:</span>
                  <select 
                    className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold text-slate-800 outline-none text-sm ml-1"
                    value={selectedW}
                    onChange={e => setSelectedW(e.target.value)}
                  >
                    <option value="">Semua Cabang Toko</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => fetchShifts(selectedW)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition"
                >
                  Refresh Data
                </button>
              </div>

              {/* Summary Cards Shift */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Total Omset Kasir</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">{fmt(totalShiftSales)}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Akumulasi shift tercatat</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Penjualan Tunai Kas</div>
                  <div className="text-xl font-bold text-emerald-700 mt-1">{fmt(totalShiftCash)}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Uang fisik masuk ke laci</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Penjualan Non-Tunai</div>
                  <div className="text-xl font-bold text-blue-700 mt-1">{fmt(totalShiftNonCash)}</div>
                  <div className="text-[11px] text-slate-400 mt-1">QRIS / Debit / Transfer</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-xs text-slate-500 font-medium">Audit Rekonsiliasi Kas</div>
                  <div className="text-xl font-bold text-slate-800 mt-1">
                    <span className="text-emerald-600">{balancedShiftsCount} Pas</span> / <span className="text-red-500">{varianceShiftsCount} Selisih</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Total {closedShifts.length} shift selesai</div>
                </div>
              </div>

              {/* Table Audit Shift */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4">Riwayat Rekonsiliasi & Audit Shift Kasir (Z-Report)</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-100 font-semibold uppercase">
                        <th className="pb-3">Waktu Buka / Tutup</th>
                        <th className="pb-3">Cabang Toko</th>
                        <th className="pb-3">Kasir</th>
                        <th className="pb-3 text-right">Modal Awal</th>
                        <th className="pb-3 text-right">Omset Tunai</th>
                        <th className="pb-3 text-right">Omset Non-Tunai</th>
                        <th className="pb-3 text-right">Kas Seharusnya</th>
                        <th className="pb-3 text-right">Kas Riil</th>
                        <th className="pb-3 text-center">Selisih Laci</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {loadingShifts ? (
                        <tr><td colSpan={11} className="py-8 text-center text-slate-400">Memuat riwayat shift...</td></tr>
                      ) : shifts.length === 0 ? (
                        <tr><td colSpan={11} className="py-8 text-center text-slate-400">Belum ada riwayat shift tercatat.</td></tr>
                      ) : shifts.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 text-slate-600 whitespace-nowrap">
                            <div>{new Date(s.opened_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(s.opened_at).toLocaleTimeString('id-ID', { timeStyle: 'short' })} - {s.closed_at ? new Date(s.closed_at).toLocaleTimeString('id-ID', { timeStyle: 'short' }) : 'Aktif'}
                            </div>
                          </td>
                          <td className="py-3.5 font-semibold text-slate-700">{s.warehouse_name}</td>
                          <td className="py-3.5 font-medium text-slate-600">{s.cashier_name || "Kasir"}</td>
                          <td className="py-3.5 text-right text-slate-700">{fmt(Number(s.start_cash))}</td>
                          <td className="py-3.5 text-right font-semibold text-emerald-700">+{fmt(Number(s.total_cash_sales))}</td>
                          <td className="py-3.5 text-right font-semibold text-blue-700">+{fmt(Number(s.total_non_cash_sales))}</td>
                          <td className="py-3.5 text-right font-bold text-slate-800">
                            {s.expected_cash ? fmt(Number(s.expected_cash)) : fmt(Number(s.start_cash) + Number(s.total_cash_sales))}
                          </td>
                          <td className="py-3.5 text-right font-bold text-slate-900">
                            {s.end_cash_actual !== null ? fmt(Number(s.end_cash_actual)) : "-"}
                          </td>
                          <td className="py-3.5 text-center">
                            {s.status === 'OPEN' ? (
                              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded">Sedang Berjalan</span>
                            ) : (
                              <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded-full ${
                                Number(s.difference) === 0 ? 'bg-emerald-100 text-emerald-800' :
                                Number(s.difference) > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {Number(s.difference) > 0 ? '+' : ''}{fmt(Number(s.difference))}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            {s.status === 'CLOSED' && (
                              <button
                                onClick={() => setSelectedZReport(s)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-semibold transition flex items-center gap-1 mx-auto"
                              >
                                <FileText size={12} /> Z-Report
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* POPUP PREVIEW Z-REPORT MODAL UNTUK ADMIN */}
      {selectedZReport && (
        <Modal open={!!selectedZReport} onClose={() => setSelectedZReport(null)} title="Salinan Laporan Z-Report Kasir">
          <div className="flex flex-col items-center">
            <div id="admin-print-zreport" className="bg-white p-5 w-full max-w-sm text-xs border border-slate-300 rounded-lg space-y-3 font-mono">
              <div className="text-center font-bold text-sm border-b pb-2">
                <div>AUDIT Z-REPORT KASIR RESMI</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">{selectedZReport.warehouse_name?.toUpperCase()}</div>
              </div>

              <div className="space-y-1 text-slate-700 text-[11px]">
                <div className="flex justify-between"><span>Shift ID:</span><span>{selectedZReport.id.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span>Kasir Bertugas:</span><span>{selectedZReport.cashier_name}</span></div>
                <div className="flex justify-between"><span>Waktu Buka:</span><span>{new Date(selectedZReport.opened_at).toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Waktu Tutup:</span><span>{selectedZReport.closed_at ? new Date(selectedZReport.closed_at).toLocaleString('id-ID') : '-'}</span></div>
              </div>

              <div className="border-t border-dashed my-2"></div>

              <div className="space-y-1 text-slate-800">
                <div className="flex justify-between"><span>Modal Kas Awal:</span><span>{fmt(Number(selectedZReport.start_cash))}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Penjualan Tunai:</span><span>+{fmt(Number(selectedZReport.total_cash_sales))}</span></div>
                <div className="flex justify-between text-blue-700"><span>Penjualan Non-Tunai:</span><span>+{fmt(Number(selectedZReport.total_non_cash_sales))}</span></div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t">
                  <span>TOTAL OMSET SHIFT:</span><span>{fmt(Number(selectedZReport.total_sales))}</span>
                </div>
              </div>

              <div className="border-t border-dashed my-2"></div>

              <div className="space-y-1">
                <div className="flex justify-between"><span>Kas Seharusnya di Laci:</span><span>{fmt(Number(selectedZReport.expected_cash))}</span></div>
                <div className="flex justify-between font-bold"><span>Kas Fisik Riil:</span><span>{fmt(Number(selectedZReport.end_cash_actual))}</span></div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t">
                  <span>SELISIH REKONSILIASI:</span>
                  <span className={Number(selectedZReport.difference) === 0 ? 'text-emerald-700' : Number(selectedZReport.difference) > 0 ? 'text-blue-700' : 'text-red-700'}>
                    {Number(selectedZReport.difference) > 0 ? '+' : ''}{fmt(Number(selectedZReport.difference))}
                  </span>
                </div>
                <div className="text-center font-bold text-[10px] mt-2 py-1 bg-slate-100 rounded">
                  STATUS AUDIT: {Number(selectedZReport.difference) === 0 ? 'SEIMBANG / PAS (OK)' : Number(selectedZReport.difference) > 0 ? 'LEBIH / SURPLUS' : 'DEFISIT / SELISIH KURANG'}
                </div>
              </div>

              {selectedZReport.notes && (
                <div className="text-[11px] text-slate-500 italic pt-1 border-t">
                  Catatan: "{selectedZReport.notes}"
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-5 w-full max-w-sm">
              <button type="button" onClick={() => setSelectedZReport(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">Tutup</button>
              <button type="button" onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Printer size={16} /> Cetak Salinan
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}