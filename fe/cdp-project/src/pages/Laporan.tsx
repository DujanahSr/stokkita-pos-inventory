/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import SalesChart from "../components/charts/SalesChart";
import Modal from "../components/ui/Modal";
import api from "../api/axios";
import footwearLuxuryBg from "../assets/footwear_luxury_bg.jpg";
import { 
  TrendingUp, Package, ShoppingBag, Layers, 
  ShieldCheck, Printer, Store, DollarSign, 
  FileSpreadsheet, FileText, CheckCircle2, AlertTriangle
} from "lucide-react";

const fmt = (v: any) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

const BTN_GOLD = "px-3.5 py-2 bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] text-[#070b14] font-serif-luxury font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-1.5";
const BTN_DARK = "px-3.5 py-2 bg-[#090e1c]/70 hover:bg-[#141d33] border border-[#c5a059]/30 text-slate-200 hover:text-[#e5c483] rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5";

export default function Laporan() {
  const [activeTab, setActiveTab] = useState<"finansial" | "shift">("finansial");

  // Tab 1: Finansial
  const [data, setData] = useState<any>(null);
  const [periode, setPeriode] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Tab 2: Shift History
  const [shifts, setShifts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedW, setSelectedW] = useState<string>("");
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [selectedZReport, setSelectedZReport] = useState<any>(null);

  const handleExport = async (type: "excel" | "pdf") => {
    setIsExporting(true);
    try {
      const response = await api.get(`/laporan/export/${type}?periode=${periode}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_${periode}_hari.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError(`Gagal mengunduh laporan ${type.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

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

  useEffect(() => {
    api.get("/master/warehouses").then(res => setWarehouses(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === "shift") fetchShifts(selectedW);
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

  const totalShiftSales = shifts.reduce((sum, s) => sum + Number(s.total_sales || 0), 0);
  const totalShiftCash = shifts.reduce((sum, s) => sum + Number(s.total_cash_sales || 0), 0);
  const totalShiftNonCash = shifts.reduce((sum, s) => sum + Number(s.total_non_cash_sales || 0), 0);
  const closedShifts = shifts.filter(s => s.status === 'CLOSED');
  const balancedShiftsCount = closedShifts.filter(s => Number(s.difference) === 0).length;
  const varianceShiftsCount = closedShifts.filter(s => Number(s.difference) !== 0).length;

  return (
    <div className="flex min-h-screen bg-[#070b14] text-slate-100 font-sans-pos relative selection:bg-[#c5a059]/30 selection:text-[#f8fafc]">
      {/* Atelier Background & Vignette */}
      <div 
        className="fixed inset-0 bg-cover bg-center pointer-events-none opacity-100 z-0"
        style={{
          backgroundImage: `url(${footwearLuxuryBg})`,
          backgroundPosition: "center 20%",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat"
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: "radial-gradient(ellipse at 50% 35%, rgba(7, 11, 20, 0.12) 0%, rgba(7, 11, 20, 0.40) 65%, rgba(7, 11, 20, 0.72) 100%)"
        }}
      />

      <Sidebar />

      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col h-screen overflow-hidden relative z-10 border-l border-r border-[#1e2538]/70">
        <Navbar title="Laporan & Audit Eksekutif" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#e5c483] text-xs font-serif-luxury tracking-widest uppercase">
                <ShieldCheck size={16} /> Executive Financial Intelligence
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-slate-100 mt-1">
                Laporan Omset, Laba & Audit Shift
              </h1>
              <p className="text-slate-400 text-xs font-mono mt-1">
                Konsolidasi margin kotor COGS, performa penjualan produk, dan rekonsiliasi kas kasir (Z-Report).
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#060a14] p-1 rounded-2xl border border-[#c5a059]/30">
              <button
                onClick={() => setActiveTab("finansial")}
                className={`px-4 py-2 text-xs font-serif-luxury tracking-wider uppercase rounded-xl transition ${
                  activeTab === "finansial"
                    ? "bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Finansial & HPP
              </button>
              <button
                onClick={() => setActiveTab("shift")}
                className={`px-4 py-2 text-xs font-serif-luxury tracking-wider uppercase rounded-xl transition ${
                  activeTab === "shift"
                    ? "bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Audit Kasir (Z-Report)
              </button>
            </div>
          </div>

          {/* TAB 1: FINANSIAL */}
          {activeTab === "finansial" && (
            <div className="space-y-6">
              {/* Periode filter & Export */}
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#e5c483] mr-1">Rentang Waktu:</span>
                  {[7, 14, 30, 90].map((p) => (
                    <button 
                      key={p} 
                      onClick={() => setPeriode(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                        periode === p 
                          ? "bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold shadow-md" 
                          : "bg-[#060a14] border border-[#c5a059]/30 text-slate-300 hover:text-[#e5c483]"
                      }`}
                    >
                      {p} Hari
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport('excel')}
                    disabled={isExporting}
                    className={BTN_DARK}
                  >
                    <FileSpreadsheet size={14} className="text-emerald-400" />
                    <span>Ekspor Excel</span>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    className={BTN_GOLD}
                  >
                    <FileText size={14} />
                    <span>Ekspor PDF</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/40 text-rose-300 rounded-2xl text-xs font-mono">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-16 text-center text-slate-400 text-xs font-mono">
                  Memuat data finansial & analitik penjualan...
                </div>
              ) : data ? (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                    {[
                      { label: "Omzet Penjualan", val: fmt(data.summary.totalPenjualan), icon: TrendingUp, color: "text-[#e5c483]", sub: "Pendapatan kotor" },
                      { label: "Laba Kotor (COGS)", val: fmt(data.summary.totalLabaKotor), icon: TrendingUp, color: "text-emerald-400", sub: "Omzet - HPP Modal" },
                      { label: "Total Transaksi", val: `${data.summary.totalTransaksi} TRX`, icon: ShoppingBag, color: "text-sky-300", sub: "Struk terbit" },
                      { label: "Unit Terjual", val: `${data.summary.totalUnit} Pasang`, icon: Package, color: "text-purple-300", sub: "Volume fisik sepatu" },
                      { label: "Nilai Aset Stok", val: fmt(data.summary.totalNilaiStok), icon: Layers, color: "text-amber-300", sub: "Modal di rak gudang" },
                    ].map(({ label, val, icon: Icon, color, sub }) => (
                      <div key={label} className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{label}</span>
                          <Icon size={16} className={color} />
                        </div>
                        <div className={`text-xl font-serif-luxury font-bold mt-2 ${color}`}>{val}</div>
                        <div className="text-[10px] font-mono text-slate-500 mt-1">{sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart Container */}
                  <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <h3 className="text-sm font-serif-luxury font-bold text-[#e5c483] uppercase tracking-wider mb-4">
                      Tren Omset & Laba Bersih ({periode} Hari Terakhir)
                    </h3>
                    <SalesChart data={data.penjualanPerHari} />
                  </div>

                  {/* Top 10 Products Table */}
                  <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="p-5 border-b border-[#c5a059]/20">
                      <h3 className="text-sm font-serif-luxury font-bold text-[#e5c483] uppercase tracking-wider">
                        Top 10 Koleksi Terlaris
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[550px] text-left text-xs font-mono">
                        <thead>
                          <tr className="bg-[#03060e]/60 text-[#e5c483] border-b border-[#c5a059]/30 font-serif-luxury uppercase tracking-wider text-[10px]">
                            <th className="p-3.5 pl-6"># Peringkat</th>
                            <th className="p-3.5">Nama Koleksi</th>
                            <th className="p-3.5 text-right">Volume Terjual</th>
                            <th className="p-3.5 text-right pr-6">Akumulasi Omzet</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#c5a059]/10">
                          {data.topProduk.map((p: any, i: number) => (
                            <tr key={i} className="hover:bg-[#14203d]/40 transition text-slate-200">
                              <td className="p-3.5 pl-6 font-bold text-[#e5c483]">#{i + 1}</td>
                              <td className="p-3.5 font-bold text-slate-100">{p.produk_nama}</td>
                              <td className="p-3.5 text-right font-bold text-[#e5c483]">{p.qty} pasang</td>
                              <td className="p-3.5 text-right pr-6 font-bold text-emerald-400">{fmt(p.total)}</td>
                            </tr>
                          ))}
                          {data.topProduk.length === 0 && (
                            <tr><td colSpan={4} className="py-10 text-center text-slate-400 font-mono text-xs">Belum ada transaksi tercatat pada rentang waktu ini.</td></tr>
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
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <Store size={16} className="text-[#e5c483]" />
                  <span className="text-[#e5c483] uppercase tracking-wider">Cabang Toko:</span>
                  <select 
                    className="bg-[#060a14] border border-[#c5a059]/30 px-3 py-1.5 rounded-xl text-slate-100 outline-none focus:border-[#c5a059] ml-1"
                    value={selectedW}
                    onChange={e => setSelectedW(e.target.value)}
                  >
                    <option value="">Semua Cabang Toko</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                <button 
                  onClick={() => fetchShifts(selectedW)}
                  className={BTN_DARK}
                >
                  Refresh Data
                </button>
              </div>

              {/* Summary Cards Shift */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Omset Kasir</div>
                  <div className="text-xl font-serif-luxury font-bold text-[#e5c483] mt-1">{fmt(totalShiftSales)}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">Akumulasi shift tercatat</div>
                </div>

                <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Penjualan Kas Tunai</div>
                  <div className="text-xl font-serif-luxury font-bold text-emerald-400 mt-1">{fmt(totalShiftCash)}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">Uang fisik laci kasir</div>
                </div>

                <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Penjualan Non-Tunai</div>
                  <div className="text-xl font-serif-luxury font-bold text-sky-300 mt-1">{fmt(totalShiftNonCash)}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">QRIS / Debit / Transfer</div>
                </div>

                <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Audit Rekonsiliasi Laci</div>
                  <div className="text-xl font-serif-luxury font-bold text-slate-100 mt-1">
                    <span className="text-emerald-400">{balancedShiftsCount} Pas</span> / <span className="text-rose-400">{varianceShiftsCount} Selisih</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">{closedShifts.length} shift selesai</div>
                </div>
              </div>

              {/* Table Audit Shift */}
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="p-5 border-b border-[#c5a059]/20">
                  <h3 className="text-sm font-serif-luxury font-bold text-[#e5c483] uppercase tracking-wider">
                    Log Rekonsiliasi Kas Kasir (Z-Report)
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-[#03060e]/60 text-[#e5c483] border-b border-[#c5a059]/30 font-serif-luxury uppercase tracking-wider text-[10px]">
                        <th className="p-3.5 pl-6">Waktu Buka / Tutup</th>
                        <th className="p-3.5">Cabang</th>
                        <th className="p-3.5">Kasir</th>
                        <th className="p-3.5 text-right">Modal Awal</th>
                        <th className="p-3.5 text-right">Tunai</th>
                        <th className="p-3.5 text-right">Non-Tunai</th>
                        <th className="p-3.5 text-right">Kas Seharusnya</th>
                        <th className="p-3.5 text-right">Kas Fisik Riil</th>
                        <th className="p-3.5 text-center">Selisih Laci</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-center pr-6">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c5a059]/10">
                      {loadingShifts ? (
                        <tr><td colSpan={11} className="py-10 text-center text-slate-400 font-mono text-xs">Memuat riwayat shift...</td></tr>
                      ) : shifts.length === 0 ? (
                        <tr><td colSpan={11} className="py-10 text-center text-slate-400 font-mono text-xs">Belum ada riwayat shift tercatat.</td></tr>
                      ) : shifts.map((s) => (
                        <tr key={s.id} className="hover:bg-[#14203d]/40 transition text-slate-200">
                          <td className="p-3.5 pl-6 whitespace-nowrap">
                            <div className="font-bold text-slate-100">{new Date(s.opened_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(s.opened_at).toLocaleTimeString('id-ID', { timeStyle: 'short' })} - {s.closed_at ? new Date(s.closed_at).toLocaleTimeString('id-ID', { timeStyle: 'short' }) : 'Aktif'}
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-300">{s.warehouse_name}</td>
                          <td className="p-3.5 font-bold text-[#e5c483]">{s.cashier_name || "Kasir"}</td>
                          <td className="p-3.5 text-right text-slate-400">{fmt(Number(s.start_cash))}</td>
                          <td className="p-3.5 text-right text-emerald-400">+{fmt(Number(s.total_cash_sales))}</td>
                          <td className="p-3.5 text-right text-sky-300">+{fmt(Number(s.total_non_cash_sales))}</td>
                          <td className="p-3.5 text-right font-bold text-slate-200">
                            {s.expected_cash ? fmt(Number(s.expected_cash)) : fmt(Number(s.start_cash) + Number(s.total_cash_sales))}
                          </td>
                          <td className="p-3.5 text-right font-bold text-[#e5c483]">
                            {s.end_cash_actual !== null ? fmt(Number(s.end_cash_actual)) : "-"}
                          </td>
                          <td className="p-3.5 text-center">
                            {s.status === 'OPEN' ? (
                              <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded">Berjalan</span>
                            ) : (
                              <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-full ${
                                Number(s.difference) === 0 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' :
                                Number(s.difference) > 0 ? 'bg-sky-950/60 text-sky-300 border border-sky-500/40' : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                              }`}>
                                {Number(s.difference) > 0 ? '+' : ''}{fmt(Number(s.difference))}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'OPEN' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center pr-6">
                            {s.status === 'CLOSED' && (
                              <button
                                onClick={() => setSelectedZReport(s)}
                                className={BTN_GOLD}
                              >
                                <FileText size={11} /> Z-Report
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

      {/* POPUP PREVIEW Z-REPORT MODAL */}
      {selectedZReport && (
        <Modal open={!!selectedZReport} onClose={() => setSelectedZReport(null)} title="Salinan Laporan Z-Report Kasir">
          <div className="flex flex-col items-center">
            <div id="admin-print-zreport" className="bg-white text-slate-900 p-5 w-full max-w-sm text-xs border border-[#c5a059]/40 rounded-2xl space-y-3 font-mono shadow-xl">
              <div className="text-center font-serif-luxury font-bold text-sm border-b border-slate-200 pb-2">
                <div>AUDIT Z-REPORT KASIR RESMI</div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">{selectedZReport.warehouse_name?.toUpperCase()}</div>
              </div>

              <div className="space-y-1 text-slate-700 text-[11px]">
                <div className="flex justify-between"><span>Shift ID:</span><span>{selectedZReport.id.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span>Kasir Bertugas:</span><span>{selectedZReport.cashier_name}</span></div>
                <div className="flex justify-between"><span>Waktu Buka:</span><span>{new Date(selectedZReport.opened_at).toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Waktu Tutup:</span><span>{selectedZReport.closed_at ? new Date(selectedZReport.closed_at).toLocaleString('id-ID') : '-'}</span></div>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2"></div>

              <div className="space-y-1 text-slate-800">
                <div className="flex justify-between"><span>Modal Kas Awal:</span><span>{fmt(Number(selectedZReport.start_cash))}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Penjualan Tunai:</span><span>+{fmt(Number(selectedZReport.total_cash_sales))}</span></div>
                <div className="flex justify-between text-sky-700"><span>Penjualan Non-Tunai:</span><span>+{fmt(Number(selectedZReport.total_non_cash_sales))}</span></div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>TOTAL OMSET SHIFT:</span><span>{fmt(Number(selectedZReport.total_sales))}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2"></div>

              <div className="space-y-1">
                <div className="flex justify-between"><span>Kas Seharusnya di Laci:</span><span>{fmt(Number(selectedZReport.expected_cash))}</span></div>
                <div className="flex justify-between font-bold"><span>Kas Fisik Riil:</span><span>{fmt(Number(selectedZReport.end_cash_actual))}</span></div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
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
                <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                  Catatan: "{selectedZReport.notes}"
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4 w-full max-w-sm">
              <button type="button" onClick={() => setSelectedZReport(null)} className={BTN_DARK}>
                Tutup
              </button>
              <button type="button" onClick={() => window.print()} className={BTN_GOLD}>
                <Printer size={14} /> Cetak Salinan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}