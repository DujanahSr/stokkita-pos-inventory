/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import StatCard from "../components/ui/StatCard";
import SalesChart from "../components/charts/SalesChart";
import Badge from "../components/ui/Badge";
import api from "../api/axios";
import supabase from "../lib/supabaseClient";
import { 
  TrendingUp, Package, ShoppingBag, AlertTriangle, 
  Zap, Server, Layers, Clock, ArrowRight, Play, CheckCircle2,
  DollarSign, Percent, Archive, Sparkles, Flame
} from "lucide-react";

const fmt = (v: any) => "Rp " + new Intl.NumberFormat("id-ID").format(v);

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [periode, setPeriode] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Omnichannel Simulator State
  const [simChannel, setSimChannel] = useState("ALL");
  const [simBatchSize, setSimBatchSize] = useState(5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simLogs, setSimLogs] = useState<any[]>([]);
  const [simSuccessMsg, setSimSuccessMsg] = useState("");

  const loadDashboard = (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");

    Promise.all([
      api.get(`/laporan?periode=${periode}`),
      api.get(`/laporan/analytics`)
    ])
      .then(([resDashboard, resAnalytics]) => {
        setData(resDashboard.data);
        setAnalytics(resAnalytics.data);
      })
      .catch((err) => setError(err.response?.data?.message || "Gagal memuat dashboard"))
      .finally(() => setLoading(false));
  };

  const loadRecentOmnichannelEvents = async () => {
    try {
      const res = await api.get("/omnichannel/recent-events");
      setSimLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboard(true);
    loadRecentOmnichannelEvents();

    // Setup Supabase Realtime
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaksi' }, (payload) => {
        console.log("Realtime: Transaksi berubah!", payload);
        loadDashboard(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produk' }, (payload) => {
        console.log("Realtime: Produk berubah!", payload);
        loadDashboard(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [periode]);

  // Trigger Omnichannel Batch Simulation
  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    setSimSuccessMsg("");
    try {
      const res = await api.post("/omnichannel/simulate", {
        batch_size: simBatchSize,
        channel_filter: simChannel
      });

      setSimSuccessMsg(res.data.message);
      
      // Refresh events & dashboard
      setTimeout(() => {
        loadRecentOmnichannelEvents();
        loadDashboard(false);
      }, 1200);

    } catch (err: any) {
      alert("Gagal menjalankan simulasi: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Dashboard" />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* Top Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Executive Performance Dashboard</h1>
              <p className="text-xs text-slate-500 mt-0.5">Pemantauan real-time finansial, omnichannel e-commerce, dan perputaran inventori</p>
            </div>

            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              {[7, 30, 90].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriode(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    periode === p
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p} Hari
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          ) : data ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard label="Omzet Penjualan" value={fmt(data.summary.totalPenjualan)} icon={TrendingUp} color="green" sub={`${periode} hari terakhir`} />
                <StatCard label="Laba Kotor" value={fmt(data.summary.totalLabaKotor)} icon={TrendingUp} color="emerald" sub="Omzet - HPP Modal" />
                <StatCard label="Total Transaksi" value={data.summary.totalTransaksi} icon={ShoppingBag} color="green" sub={`${periode} hari terakhir`} />
                <StatCard label="Unit Terjual" value={data.summary.totalUnit} icon={Package} color="amber" sub={`${periode} hari terakhir`} />
                <StatCard label="Nilai Aset Stok" value={fmt(data.summary.totalNilaiStok)} icon={Package} color="red" sub="Di semua cabang" />
              </div>

              {/* OMNICHANNEL INTERACTIVE SIMULATOR & RABBITMQ SHOWCASE PANEL (LIGHT THEME) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                        <Zap size={20} />
                      </span>
                      <h3 className="text-base font-bold text-slate-800">Simulasi Omnichannel & Antrean Pesanan RabbitMQ</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        RabbitMQ Aktif
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Simulasikan pesanan masuk serentak dari Marketplace (Shopee, Tokopedia, TikTok Shop) yang diproses asinkron oleh Background Worker.
                    </p>
                  </div>

                  {/* Architecture Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg">Webhook Ingest</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 font-bold rounded-lg">RabbitMQ Queue</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 font-bold rounded-lg">Worker (FOR UPDATE)</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-lg">Redis Invalidate</span>
                  </div>
                </div>

                {/* Controls Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Marketplace Channel</label>
                    <select
                      value={simChannel}
                      onChange={e => setSimChannel(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="ALL">Semua Channel (Acak)</option>
                      <option value="Shopee">Shopee</option>
                      <option value="Tokopedia">Tokopedia</option>
                      <option value="TikTok Shop">TikTok Shop</option>
                      <option value="Lazada">Lazada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Jumlah Pesanan Serentak</label>
                    <select
                      value={simBatchSize}
                      onChange={e => setSimBatchSize(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none font-semibold focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={5}>5 Pesanan Serentak</option>
                      <option value={10}>10 Pesanan Serentak</option>
                      <option value={20}>20 Pesanan Serentak (Stress Test)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 pt-2 sm:pt-0">
                    <button
                      onClick={handleTriggerSimulation}
                      disabled={isSimulating}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <><Server size={16} className="animate-spin" /> Memproses Antrean RabbitMQ...</>
                      ) : (
                        <><Play size={16} /> Jalankan Simulasi Lonjakan Pesanan ({simBatchSize} Trx)</>
                      )}
                    </button>
                  </div>
                </div>

                {simSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>{simSuccessMsg}</span>
                  </div>
                )}

                {/* Event Logs Terminal Viewer */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-500" /> Log Aliran Pemrosesan Event (RabbitMQ Consumer Stream)
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">20 Event Terakhir</span>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs max-h-48 overflow-y-auto space-y-2 text-white shadow-inner">
                    {simLogs.length === 0 ? (
                      <div className="text-slate-400 text-center py-4">Belum ada pesanan online. Klik tombol simulasi di atas untuk menguji.</div>
                    ) : (
                      simLogs.map((log: any) => {
                        const channelName = log.payment_method || "Marketplace";
                        return (
                          <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-200 border-b border-slate-800 pb-1.5 gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                channelName === 'Shopee' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                channelName === 'Tokopedia' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                channelName === 'TikTok Shop' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {channelName}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">{log.id.slice(0, 8)}...</span>
                              <span className="text-slate-300">{log.warehouse_name}</span>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              <span className="font-bold text-emerald-400">{fmt(log.total_amount)}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(log.created_at).toLocaleTimeString('id-ID')}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-bold">✓ ACK</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Chart + Top Produk */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Tren Penjualan & Omset Harian ({periode} Hari)</h3>
                  <SalesChart data={data.penjualanPerHari} />
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4">Top 10 Produk Terlaris</h3>
                  <div className="space-y-3">
                    {data.topProduk.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">Belum ada data penjualan</p>
                    )}
                    {data.topProduk.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{p.produk_nama}</p>
                          <p className="text-[10px] text-slate-400">{p.qty} unit terjual</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-700">{fmt(p.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* EXECUTIVE FINANCIAL & INVENTORY ANALYTICS */}
              {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Financial Gross Profit Margin */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Analitik Finansial 30 Hari</span>
                        <h4 className="text-base font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <DollarSign size={18} className="text-emerald-600" /> Margin Laba Kotor
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-extrabold">
                        {analytics.financial.profit_margin_pct}% Margin
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span className="text-slate-500">Omset Penjualan:</span>
                        <span className="font-bold text-slate-800">{fmt(analytics.financial.total_revenue)}</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span className="text-slate-500">Total HPP Modal (COGS):</span>
                        <span className="font-bold text-red-600">-{fmt(analytics.financial.total_cogs)}</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-emerald-50 text-emerald-900 rounded-xl font-bold border border-emerald-200">
                        <span>Laba Bersih Kotor:</span>
                        <span className="text-emerald-700 font-extrabold">{fmt(analytics.financial.gross_profit)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Slow-Moving / Dead Stock Actionable Clearances */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-600">Peringatan Dead Stock</span>
                        <h4 className="text-base font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <Archive size={18} className="text-amber-500" /> Produk Lambat Laku (Slow-Moving)
                        </h4>
                        <p className="text-xs text-slate-500">Stok mengendap lebih dari 30 hari tanpa transaksi penjualan (Saran: Diskon Promo / Obral Cuci Gudang)</p>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
                        {analytics.slow_moving?.length || 0} Varian Mengendap
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 bg-slate-50 border-b border-slate-100 uppercase font-semibold">
                            <th className="p-2.5 pl-3">Produk & Varian</th>
                            <th className="p-2.5 text-center">Stok Fisik</th>
                            <th className="p-2.5 text-right">Modal Mengendap</th>
                            <th className="p-2.5 text-center">Gudang</th>
                            <th className="p-2.5 text-center pr-3">Saran Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-medium">
                          {(!analytics.slow_moving || analytics.slow_moving.length === 0) ? (
                            <tr><td colSpan={5} className="py-6 text-center text-slate-400">Tidak ada dead stock, perputaran inventori sehat!</td></tr>
                          ) : (
                            analytics.slow_moving.map((s: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5 pl-3">
                                  <div className="font-bold text-slate-800">{s.product_name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{s.sku} • {s.size}/{s.color}</div>
                                </td>
                                <td className="p-2.5 text-center font-bold text-slate-800">{s.current_stock} pcs</td>
                                <td className="p-2.5 text-right font-bold text-amber-700">{fmt(Number(s.idle_capital))}</td>
                                <td className="p-2.5 text-center text-slate-600">{s.warehouse_name}</td>
                                <td className="p-2.5 text-center pr-3">
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-lg text-[10px]">
                                    🔥 Diskon Obral
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Stok Kritis Buffer */}
              {data.stokKritis.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-bold text-slate-800">Peringatan Buffer Stok Kritis</h3>
                    <span className="ml-auto bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                      {data.stokKritis.length} Produk Perlu Restock
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 uppercase pb-2 font-semibold">
                          <th className="pb-3">Produk</th>
                          <th className="pb-3">Kategori</th>
                          <th className="pb-3 text-right">Stok Fisik Saat Ini</th>
                          <th className="pb-3 text-right">Safety Stock Buffer</th>
                          <th className="pb-3 text-right">Defisit Stok</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium">
                        {data.stokKritis.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-3 font-semibold text-slate-800">{p.nama}</td>
                            <td className="py-3 text-slate-500">{p.kategori}</td>
                            <td className="py-3 text-right text-red-600 font-bold">{p.stok} pcs</td>
                            <td className="py-3 text-right text-slate-600">{p.safety_stock} pcs</td>
                            <td className="py-3 text-right text-amber-700 font-bold">-{p.kekurangan} pcs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : !error ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
              Tidak ada data dashboard.
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}