/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import SalesChart from "../components/charts/SalesChart";
import api from "../api/axios";
import supabase from "../lib/supabaseClient";
import { 
  TrendingUp, Package, ShoppingBag, AlertTriangle, 
  Zap, Server, Layers, Clock, ArrowRight, Play, CheckCircle2,
  DollarSign, Percent, Archive, Sparkles, Flame, ShieldCheck,
  RefreshCw, Store, Crown, ArrowUpRight, Activity, Boxes, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import footwearLuxuryBg from "../assets/footwear_luxury_bg.jpg";

const fmt = (v: any) => "Rp " + new Intl.NumberFormat("id-ID").format(Number(v) || 0);

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

      toast.success(res.data.message || "Simulasi pesanan berhasil dijalankan!");
      
      // Refresh events & dashboard
      setTimeout(() => {
        loadRecentOmnichannelEvents();
        loadDashboard(false);
      }, 1200);

    } catch (err: any) {
      toast.error("Gagal menjalankan simulasi: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSimulating(false);
    }
  };

  // Calculated Metrics
  const totalOmzet = Number(data?.summary?.totalPenjualan || 0);
  const totalProfit = Number(data?.summary?.totalLabaKotor || 0);
  const totalTrx = Number(data?.summary?.totalTransaksi || 0);
  const totalUnit = Number(data?.summary?.totalUnit || 0);
  const totalStockAsset = Number(data?.summary?.totalNilaiStok || 0);
  const aov = totalTrx > 0 ? Math.round(totalOmzet / totalTrx) : 0;
  const velocityPerDay = totalUnit > 0 ? (totalUnit / (periode || 1)).toFixed(1) : "0.0";
  const profitMargin = analytics?.financial?.profit_margin_pct !== undefined 
    ? Number(analytics.financial.profit_margin_pct) 
    : (totalOmzet > 0 ? Math.round((totalProfit / totalOmzet) * 100) : 0);
  const cogsTotal = analytics?.financial?.total_cogs !== undefined
    ? Number(analytics.financial.total_cogs)
    : Math.max(0, totalOmzet - totalProfit);

  return (
    <div className="flex min-h-screen bg-[#070b14] text-slate-100 font-sans-pos relative selection:bg-[#c5a059]/30 selection:text-[#f8fafc]">
      
      {/* Master Footwear Luxury Background Layer - Harmonized with Transaksi.tsx */}
      <div 
        className="fixed inset-0 bg-cover bg-center pointer-events-none opacity-100 z-0"
        style={{ 
          backgroundImage: `url(${footwearLuxuryBg})`,
          backgroundPosition: "center 20%",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat"
        }}
      />
      
      {/* Subtle Ambient Vignette - Crystal-clear artwork visibility with high contrast */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: "radial-gradient(ellipse at 50% 35%, rgba(7, 11, 20, 0.12) 0%, rgba(7, 11, 20, 0.40) 65%, rgba(7, 11, 20, 0.72) 100%)"
        }}
      />

      {/* Sidebar Component */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col h-screen overflow-hidden relative z-10 border-l border-r border-[#1e2538]/70">
        
        {/* Navbar Component */}
        <Navbar 
          title="Dashboard Eksekutif" 
          actions={
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#181206]/80 border border-[#c5a059]/40 text-[#f3d99d] text-[10px] font-mono tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span>Sistem Kasir & Gudang Aktif</span>
            </div>
          }
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          
          {/* EDITORIAL ATELIER MASTER BANNER & CONTROLS */}
          <div className="p-5 sm:p-6 rounded-3xl border border-[#c5a059]/35 bg-[#070c17]/30 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181308]/80 border border-[#c5a059]/50 text-[#e5c483] text-[10px] font-mono tracking-widest uppercase mb-2 backdrop-blur-xs">
                <Sparkles size={11} className="text-[#c5a059]" />
                <span>Haute Footwear Atelier • Central Command</span>
              </div>
              <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                Konsol Kendali <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5c483] via-[#f3d99d] to-[#c5a059]">Kinerja Toko & Inventori</span>
              </h1>
              <p className="text-xs font-mono text-slate-300 mt-1 max-w-2xl drop-shadow-xs">
                Pengawasan real-time arus kas kasir, margin laba bersih HPP modal, perputaran stok sepatu, dan antrean pesanan omnichannel.
              </p>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Sync Button */}
              <button
                type="button"
                onClick={() => {
                  loadDashboard(true);
                  loadRecentOmnichannelEvents();
                  toast.success("Data dashboard disinkronkan ulang!");
                }}
                disabled={loading}
                className="p-2.5 rounded-xl bg-[#090e1c]/60 hover:bg-[#141d33]/90 text-slate-200 hover:text-[#e5c483] border border-[#c5a059]/35 hover:border-[#c5a059]/70 transition shadow-sm cursor-pointer backdrop-blur-md"
                title="Sinkronisasi Data Real-Time"
              >
                <RefreshCw size={15} className={loading ? "animate-spin text-[#c5a059]" : ""} />
              </button>

              {/* Period Selector Pills */}
              <div className="flex items-center p-1 rounded-2xl bg-[#090e1c]/60 border border-[#c5a059]/35 backdrop-blur-md">
                {[7, 30, 90].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriode(p)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                      periode === p
                        ? "bg-[#161f36]/90 text-[#e5c483] font-bold border border-[#c5a059]/60 shadow-[0_0_12px_rgba(197,160,89,0.2)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {p} Hari
                  </button>
                ))}
              </div>

              {/* Realtime Supabase Heartbeat Pill */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#090e1c]/40 border border-[#c5a059]/25 text-[11px] font-mono text-slate-300 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>Supabase Realtime Sync</span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 backdrop-blur-md px-5 py-3.5 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && !data ? (
            <div className="flex flex-col items-center justify-center h-80 rounded-3xl border border-[#c5a059]/20 bg-[#070c17]/25 backdrop-blur-md">
              <RefreshCw size={28} className="animate-spin text-[#c5a059] mb-3" />
              <p className="font-serif-luxury text-sm tracking-wider text-[#e5c483] uppercase">
                Menyinkronkan Kinerja Atelier...
              </p>
              <p className="text-xs font-mono text-slate-400 mt-1">Mengagregasi omzet, perputaran stok & antrean omnichannel</p>
            </div>
          ) : data ? (
            <>
              {/* ASYMMETRICAL EXECUTIVE PERFORMANCE DECK (7 : 5 GRID) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* DECK KIRI (7 KOLOM): MASTER FINANCIAL & PROFIT ENGINE */}
                <div className="lg:col-span-7 rounded-3xl border border-[#c5a059]/35 hover:border-[#c5a059]/70 bg-[#070c17]/30 backdrop-blur-xl p-6 sm:p-7 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between transition-all duration-300">
                  {/* Subtle Ambient Radial Gold Glow */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#c5a059]/20 via-transparent to-transparent pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181308]/80 border border-[#c5a059]/40 text-[#e5c483] text-[10px] font-mono tracking-widest uppercase backdrop-blur-xs">
                        <TrendingUp size={12} className="text-[#c5a059]" />
                        <span>Kinerja Finansial & Profitabilitas</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 drop-shadow-xs">
                        {periode} Hari Terakhir
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-serif-luxury uppercase tracking-widest text-slate-300 font-semibold drop-shadow-xs">
                        Total Omzet Penjualan (Gross GMV)
                      </p>
                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif-luxury font-bold text-[#f3d99d] tracking-tight mt-1.5 drop-shadow-[0_2px_12px_rgba(197,160,89,0.35)]">
                        {fmt(totalOmzet)}
                      </h2>
                      <p className="text-xs font-mono text-slate-300 mt-2 flex items-center gap-2 drop-shadow-xs">
                        <Activity size={13} className="text-emerald-400" />
                        <span>Dihasilkan dari <strong className="text-slate-100">{totalTrx}</strong> transaksi penjualan kasir & marketplace</span>
                      </p>
                    </div>
                  </div>

                  {/* Split Financial Sub-Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 pt-6 border-t border-[#c5a059]/25">
                    
                    {/* Card 1: Laba Bersih Kotor */}
                    <div className="p-4 rounded-2xl bg-[#060a14]/35 border border-[#c5a059]/30 backdrop-blur-sm flex items-center justify-between hover:border-[#c5a059]/60 hover:bg-[#060a14]/50 transition group">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-serif-luxury uppercase tracking-wider text-slate-300 font-semibold">
                            Laba Bersih Kotor
                          </p>
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                            {profitMargin}% Margin
                          </span>
                        </div>
                        <p className="text-xl sm:text-2xl font-serif-luxury font-bold text-emerald-400 mt-1 drop-shadow-xs">
                          {fmt(totalProfit)}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">Omzet dikurangi HPP Modal Produk</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
                        <DollarSign size={20} />
                      </div>
                    </div>

                    {/* Card 2: Rata-rata Nilai Keranjang (AOV) */}
                    <div className="p-4 rounded-2xl bg-[#060a14]/35 border border-[#c5a059]/30 backdrop-blur-sm flex items-center justify-between hover:border-[#c5a059]/60 hover:bg-[#060a14]/50 transition group">
                      <div>
                        <p className="text-[11px] font-serif-luxury uppercase tracking-wider text-slate-300 font-semibold">
                          Rata-Rata Keranjang (AOV)
                        </p>
                        <p className="text-xl sm:text-2xl font-serif-luxury font-bold text-[#e5c483] mt-1 drop-shadow-xs">
                          {fmt(aov)}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">Rata-rata belanja pembeli per transaksi</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#e5c483] group-hover:scale-105 transition">
                        <Sparkles size={18} />
                      </div>
                    </div>

                  </div>

                  {/* Financial Visual Ratio Bar (COGS vs Net Profit) */}
                  <div className="mt-4 pt-4 border-t border-[#c5a059]/15">
                    <div className="flex justify-between text-[11px] font-mono text-slate-300 mb-1.5">
                      <span>Rasio Modal HPP vs Margin Laba:</span>
                      <span className="text-[#f3d99d]">
                        HPP: {fmt(cogsTotal)} • Laba: {fmt(totalProfit)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#04060d]/80 rounded-full overflow-hidden flex border border-[#c5a059]/20">
                      <div 
                        className="h-full bg-slate-500/60 transition-all duration-700" 
                        style={{ width: `${Math.max(5, Math.min(95, totalOmzet > 0 ? (cogsTotal / totalOmzet) * 100 : 50))}%` }} 
                        title="HPP Modal Pokok"
                      />
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700" 
                        style={{ width: `${Math.max(5, Math.min(95, totalOmzet > 0 ? (totalProfit / totalOmzet) * 100 : 50))}%` }} 
                        title="Laba Bersih Kotor"
                      />
                    </div>
                  </div>

                </div>

                {/* DECK KANAN (5 KOLOM): ASSET VALUATION & VELOCITY MATRIX */}
                <div className="lg:col-span-5 rounded-3xl border border-[#c5a059]/35 hover:border-[#c5a059]/70 bg-[#070c17]/30 backdrop-blur-xl p-6 sm:p-7 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10192e]/80 border border-blue-500/40 text-blue-400 text-[10px] font-mono tracking-widest uppercase backdrop-blur-xs">
                        <Boxes size={12} />
                        <span>Valuasi Aset & Perputaran Stok</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-300 drop-shadow-xs">Multi-Gudang</span>
                    </div>

                    {/* Total Stock Asset Valuation */}
                    <div className="mt-5">
                      <p className="text-xs font-serif-luxury uppercase tracking-widest text-slate-300 font-semibold drop-shadow-xs">
                        Total Nilai Aset Stok Sepatu
                      </p>
                      <div className="flex items-baseline gap-3 mt-1">
                        <h2 className="text-3xl sm:text-4xl font-serif-luxury font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                          {fmt(totalStockAsset)}
                        </h2>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-1">
                        Nilai modal inventori alas kaki di seluruh cabang & gudang penyimpanan
                      </p>
                    </div>

                    {/* Velocity & Output Counters */}
                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <div className="p-3.5 rounded-2xl bg-[#060a14]/35 border border-[#c5a059]/25 backdrop-blur-sm">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Unit Terjual</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-serif-luxury font-bold text-white">{totalUnit}</span>
                          <span className="text-[10px] font-mono text-[#e5c483]">pasang</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">Total volume fisik alas kaki</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#060a14]/35 border border-[#c5a059]/25 backdrop-blur-sm">
                        <span className="text-[10px] font-mono uppercase text-slate-400 block">Kecepatan Jual</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-serif-luxury font-bold text-emerald-400">{velocityPerDay}</span>
                          <span className="text-[10px] font-mono text-emerald-300">pasang/hari</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">Rata-rata sales velocity</p>
                      </div>
                    </div>
                  </div>

                  {/* Stock Health Diagnostic Chips */}
                  <div className="mt-5 pt-5 border-t border-[#c5a059]/25">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-300">Status Kesehatan Inventori:</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          (data?.stokKritis?.length || 0) > 0 
                            ? "bg-rose-950/60 border border-rose-500/40 text-rose-300"
                            : "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                        }`}>
                          {data?.stokKritis?.length || 0} Stok Kritis
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-300">
                          {analytics?.slow_moving?.length || 0} Dead Stock
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* OMNICHANNEL INTERACTIVE SIMULATOR & RABBITMQ SHOWCASE PANEL */}
              <div className="rounded-3xl border border-[#c5a059]/35 bg-[#070c17]/30 backdrop-blur-xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.5)] space-y-5 transition-all">
                
                {/* Header & Flow Ribbon */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#c5a059]/20 pb-5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1a1408] to-[#0d1527] border border-[#c5a059]/50 flex items-center justify-center text-[#e5c483] shadow-md">
                        <Zap size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-serif-luxury font-bold text-white tracking-wide">
                            Simulasi Omnichannel & Antrean Pesanan RabbitMQ
                          </h3>
                          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-500/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            AMQP Engine Aktif
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-300 mt-0.5">
                          Simulasikan pesanan masuk serentak dari marketplace (Shopee, Tokopedia, TikTok Shop, Lazada) yang diproses asinkron oleh background worker.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Architecture Diagram Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-2.5 py-1 bg-[#090e1c]/60 border border-[#c5a059]/30 text-slate-300 rounded-lg">Webhook Ingest</span>
                    <span className="text-[#c5a059]">→</span>
                    <span className="px-2.5 py-1 bg-amber-950/50 border border-amber-500/40 text-amber-300 font-bold rounded-lg">RabbitMQ Queue</span>
                    <span className="text-[#c5a059]">→</span>
                    <span className="px-2.5 py-1 bg-blue-950/50 border border-blue-500/40 text-blue-300 font-bold rounded-lg">Worker (FOR UPDATE)</span>
                    <span className="text-[#c5a059]">→</span>
                    <span className="px-2.5 py-1 bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-bold rounded-lg">Redis Invalidate</span>
                  </div>
                </div>

                {/* Interactive Controls Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 items-center bg-[#060a14]/40 p-4 rounded-2xl border border-[#c5a059]/25 backdrop-blur-sm">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-bold">
                      Marketplace Channel
                    </label>
                    <select
                      value={simChannel}
                      onChange={e => setSimChannel(e.target.value)}
                      className="w-full bg-[#090e1c]/80 border border-[#c5a059]/30 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 cursor-pointer"
                    >
                      <option value="ALL">Semua Channel (Acak)</option>
                      <option value="Shopee">Shopee</option>
                      <option value="Tokopedia">Tokopedia</option>
                      <option value="TikTok Shop">TikTok Shop</option>
                      <option value="Lazada">Lazada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-bold">
                      Beban Pesanan Serentak
                    </label>
                    <select
                      value={simBatchSize}
                      onChange={e => setSimBatchSize(Number(e.target.value))}
                      className="w-full bg-[#090e1c]/80 border border-[#c5a059]/30 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 cursor-pointer"
                    >
                      <option value={5}>5 Pesanan Serentak</option>
                      <option value={10}>10 Pesanan Serentak</option>
                      <option value={20}>20 Pesanan Serentak (Stress Test)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 pt-2 sm:pt-4">
                    <button
                      type="button"
                      onClick={handleTriggerSimulation}
                      disabled={isSimulating}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] hover:brightness-110 active:scale-[0.99] text-[#070b14] rounded-xl text-xs font-serif-luxury font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-[#c5a059]/20 cursor-pointer disabled:opacity-50"
                    >
                      {isSimulating ? (
                        <>
                          <Server size={15} className="animate-spin" />
                          <span>Memproses Antrean RabbitMQ ({simBatchSize} Trx)...</span>
                        </>
                      ) : (
                        <>
                          <Play size={15} />
                          <span>Jalankan Simulasi Lonjakan Pesanan ({simBatchSize} Trx)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {simSuccessMsg && (
                  <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 font-mono backdrop-blur-sm">
                    <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                    <span>{simSuccessMsg}</span>
                  </div>
                )}

                {/* Event Logs Terminal Stream Viewer */}
                <div>
                  <div className="flex justify-between items-center text-xs font-mono text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-[#c5a059]" />
                      <span>Log Aliran Pemrosesan Event (RabbitMQ Consumer Stream)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">20 Event Pesanan Terakhir</span>
                  </div>

                  <div className="bg-[#04060d]/80 p-4 rounded-2xl border border-[#c5a059]/20 font-mono text-xs max-h-52 overflow-y-auto space-y-2 text-slate-200 shadow-inner backdrop-blur-md">
                    {simLogs.length === 0 ? (
                      <div className="text-slate-500 text-center py-5">
                        Belum ada antrean pesanan online yang tercatat. Klik tombol di atas untuk menjalankan simulasi.
                      </div>
                    ) : (
                      simLogs.map((log: any) => {
                        const channelName = log.payment_method || "Marketplace";
                        return (
                          <div 
                            key={log.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-200 border-b border-[#1e2538]/60 pb-2 gap-1.5 hover:bg-[#090e1c]/40 px-1 rounded transition"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                channelName === 'Shopee' ? 'bg-orange-950/60 text-orange-400 border border-orange-500/40' :
                                channelName === 'Tokopedia' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' :
                                channelName === 'TikTok Shop' ? 'bg-purple-950/60 text-purple-400 border border-purple-500/40' :
                                'bg-blue-950/60 text-blue-400 border border-blue-500/40'
                              }`}>
                                {channelName}
                              </span>
                              <span className="text-slate-400 font-mono text-[11px]">#{log.id.slice(0, 8)}...</span>
                              <span className="text-slate-300 font-semibold">{log.warehouse_name}</span>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto font-mono">
                              <span className="font-bold text-[#f3d99d]">{fmt(log.total_amount)}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(log.created_at).toLocaleTimeString('id-ID')}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 size={11} /> ACK
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* TRAJECTORY & HAUTE LEADERBOARD GRID (8 : 4 GRID) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                
                {/* SISI KIRI (8 KOLOM): TREN PENJUALAN & MARGIN HARIAN */}
                <div className="xl:col-span-8 rounded-3xl border border-[#c5a059]/35 bg-[#070c17]/30 backdrop-blur-xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#c5a059]/20">
                    <div>
                      <h3 className="text-base sm:text-lg font-serif-luxury font-bold text-white">
                        Tren Penjualan & Margin Laba Harian
                      </h3>
                      <p className="text-xs font-mono text-slate-400">
                        Agregasi omzet harian dan perolehan laba kotor selama {periode} hari terakhir
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#e5c483]" />
                        <span className="text-slate-300">Omzet</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#34d399]" />
                        <span className="text-slate-300">Laba Kotor</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart Container */}
                  <div className="pt-2">
                    <SalesChart data={data.penjualanPerHari} theme="dark" />
                  </div>
                </div>
                
                {/* SISI KANAN (4 KOLOM): TOP 10 KOLEKSI SEPATU TERLARIS */}
                <div className="xl:col-span-4 rounded-3xl border border-[#c5a059]/35 bg-[#070c17]/30 backdrop-blur-xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#c5a059]/20">
                      <div className="flex items-center gap-2">
                        <Crown size={18} className="text-[#e5c483]" />
                        <h3 className="text-base font-serif-luxury font-bold text-white">
                          Koleksi Terlaris
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">Top 10 Model</span>
                    </div>

                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                      {(!data.topProduk || data.topProduk.length === 0) ? (
                        <p className="text-xs font-mono text-slate-500 text-center py-10">
                          Belum ada transaksi penjualan pada periode ini.
                        </p>
                      ) : (
                        data.topProduk.map((p: any, i: number) => {
                          const isGold = i === 0;
                          const isSilver = i === 1;
                          const isBronze = i === 2;

                          return (
                            <div 
                              key={i} 
                              className={`p-3 rounded-2xl border transition flex items-center gap-3 ${
                                isGold 
                                  ? "bg-[#181308]/60 border-[#c5a059]/40 shadow-sm" 
                                  : isSilver
                                  ? "bg-[#141b2b]/40 border-slate-500/30"
                                  : isBronze
                                  ? "bg-[#1a1411]/40 border-amber-700/30"
                                  : "bg-[#060a14]/30 border-[#1e2538]/50 hover:border-[#c5a059]/30"
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-serif-luxury font-bold text-xs ${
                                isGold 
                                  ? "bg-gradient-to-tr from-[#c5a059] to-[#dfba73] text-[#070b14] shadow-sm" 
                                  : isSilver
                                  ? "bg-slate-300 text-slate-900"
                                  : isBronze
                                  ? "bg-amber-700 text-amber-100"
                                  : "bg-[#090e1c] text-slate-400 border border-[#1e2538]"
                              }`}>
                                {i + 1}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-serif-luxury font-semibold text-slate-100 truncate group-hover:text-[#f3d99d]">
                                  {p.produk_nama}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400">
                                  {p.qty} pasang terjual
                                </p>
                              </div>

                              <div className="text-right font-mono">
                                <span className="text-xs font-bold text-[#f3d99d] block">
                                  {fmt(p.total)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#c5a059]/15 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Lihat katalog lengkap</span>
                    <Link to="/produk" className="text-[#e5c483] hover:underline flex items-center gap-1">
                      Katalog Produk <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>

              </div>

              {/* OPERATIONAL RISK & INVENTORY DIAGNOSTIC MATRIX (2 COLUMNS) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* DECK KIRI: DEAD STOCK / SLOW-MOVING CAPITAL WARNING */}
                <div className="rounded-3xl border border-amber-500/35 bg-[#070c17]/30 backdrop-blur-xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-4 pb-3 border-b border-amber-500/25">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 text-[10px] font-mono uppercase tracking-wider mb-1">
                          <Archive size={11} />
                          <span>Peringatan Dead Stock</span>
                        </div>
                        <h4 className="text-base font-serif-luxury font-bold text-white flex items-center gap-1.5">
                          Produk Lambat Laku (Slow-Moving)
                        </h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          Stok mengendap lebih dari 30 hari tanpa transaksi penjualan (Saran: Diskon Promo / Obral Cuci Gudang).
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-950/60 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono font-bold flex-shrink-0">
                        {analytics?.slow_moving?.length || 0} Varian
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full min-w-[550px] text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-slate-400 bg-[#03060e]/50 border-b border-[#c5a059]/20 font-serif-luxury uppercase tracking-wider text-[10px]">
                            <th className="p-3 pl-4">Produk & Ukuran</th>
                            <th className="p-3 text-center">Stok</th>
                            <th className="p-3 text-right">Modal Mengendap</th>
                            <th className="p-3 text-center">Gudang</th>
                            <th className="p-3 text-center pr-4">Saran Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e2538]/50 font-mono text-slate-200">
                          {(!analytics?.slow_moving || analytics.slow_moving.length === 0) ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                                Tidak ada dead stock, perputaran inventori toko berjalan sehat!
                              </td>
                            </tr>
                          ) : (
                            analytics.slow_moving.map((s: any, idx: number) => (
                              <tr key={idx} className="hover:bg-[#090e1c]/40 transition">
                                <td className="p-3 pl-4">
                                  <div className="font-serif-luxury font-bold text-slate-100">{s.product_name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {s.sku} {s.size ? `• Size ${s.size}` : ''} {s.color ? `• ${s.color}` : ''}
                                  </div>
                                </td>
                                <td className="p-3 text-center font-bold text-slate-200">
                                  {s.current_stock} pcs
                                </td>
                                <td className="p-3 text-right font-bold text-amber-400">
                                  {fmt(Number(s.idle_capital))}
                                </td>
                                <td className="p-3 text-center text-slate-400 text-[11px]">
                                  {s.warehouse_name}
                                </td>
                                <td className="p-3 text-center pr-4">
                                  <span className="px-2 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold">
                                    🔥 Cuci Gudang
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#c5a059]/15 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Mutasi stok antar cabang?</span>
                    <Link to="/inventori" className="text-[#e5c483] hover:underline flex items-center gap-1">
                      Buka Mutasi Inventori <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>

                {/* DECK KANAN: CRITICAL BUFFER STOCK & DEFICIT REORDER ALERT */}
                <div className="rounded-3xl border border-rose-500/35 bg-[#070c17]/30 backdrop-blur-xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-4 pb-3 border-b border-rose-500/25">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 text-[10px] font-mono uppercase tracking-wider mb-1">
                          <AlertTriangle size={11} />
                          <span>Peringatan Buffer Kritis</span>
                        </div>
                        <h4 className="text-base font-serif-luxury font-bold text-white flex items-center gap-1.5">
                          Defisit Safety Stock (Perlu Restock)
                        </h4>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          Stok aktual berada di bawah batas aman EOQ/ROP, berisiko kehilangan potensi penjualan.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-950/60 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-mono font-bold flex-shrink-0">
                        {data.stokKritis?.length || 0} Model Defisit
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full min-w-[500px] text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-slate-400 bg-[#03060e]/50 border-b border-[#c5a059]/20 font-serif-luxury uppercase tracking-wider text-[10px]">
                            <th className="p-3 pl-4">Model Sepatu</th>
                            <th className="p-3">Kategori</th>
                            <th className="p-3 text-center">Stok Fisik</th>
                            <th className="p-3 text-center">Safety Buffer</th>
                            <th className="p-3 text-right pr-4">Defisit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e2538]/50 font-mono text-slate-200">
                          {(!data.stokKritis || data.stokKritis.length === 0) ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                                Semua stok produk berada di atas ambang batas aman safety stock.
                              </td>
                            </tr>
                          ) : (
                            data.stokKritis.map((p: any) => (
                              <tr key={p.id} className="hover:bg-[#090e1c]/40 transition">
                                <td className="p-3 pl-4">
                                  <div className="font-serif-luxury font-bold text-slate-100">{p.nama}</div>
                                </td>
                                <td className="p-3 text-slate-400 text-[11px]">{p.kategori || "Sepatu"}</td>
                                <td className="p-3 text-center text-rose-400 font-bold">{p.stok} pcs</td>
                                <td className="p-3 text-center text-slate-400">{p.safety_stock} pcs</td>
                                <td className="p-3 text-right pr-4 text-rose-400 font-bold">-{p.kekurangan} pcs</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#c5a059]/15 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Ajukan pengadaan produk?</span>
                    <Link 
                      to="/reorder" 
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-serif-luxury font-bold text-[10px] uppercase tracking-wider hover:brightness-110 transition flex items-center gap-1"
                    >
                      + Buat Purchase Order (PO)
                    </Link>
                  </div>
                </div>

              </div>
            </>
          ) : !error ? (
            <div className="rounded-3xl border border-[#c5a059]/30 bg-[#070c17]/30 backdrop-blur-xl px-6 py-16 text-center text-sm font-mono text-slate-400">
              Tidak ada data dashboard yang tersedia untuk periode ini.
            </div>
          ) : null}

        </main>
      </div>
    </div>
  );
}