import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Eye, EyeOff, Lock, Store, ShieldCheck, 
  ArrowRight, Sparkles, Layers, CheckCircle2
} from "lucide-react";
import footwearAtelierLogin from "../assets/footwear_atelier_login.jpg";
import shoeLuxuryEmblem from "../assets/shoe_luxury_emblem.jpg";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      const role = res?.user?.role?.toLowerCase();
      if (role === "superadmin") {
        navigate("/superadmin");
      } else if (role === "kasir") {
        navigate("/transaksi");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Email atau password yang Anda masukkan tidak sesuai");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden font-sans select-none">
      {/* Background Architectural Ambience */}
      <div 
        className="fixed inset-0 bg-cover bg-center pointer-events-none opacity-40 blur-2xl scale-110"
        style={{ backgroundImage: `url(${footwearAtelierLogin})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/90 to-[#050811]/70 pointer-events-none" />

      {/* Main Master Console Frame */}
      <div className="w-full max-w-[1360px] min-h-[680px] rounded-3xl border border-[#1e2538] bg-[#070c17]/90 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative z-10">
        
        {/* SISI KIRI: HERO ATELIER & EDITORIAL SHOWCASE (7 COLS) */}
        <div className="lg:col-span-7 xl:col-span-7 relative p-8 sm:p-10 lg:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-[#1e2538]/80">
          
          {/* Master Footwear Photograph Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
            style={{ 
              backgroundImage: `url(${footwearAtelierLogin})`,
              backgroundPosition: "center 40%" 
            }}
          />
          {/* Dark Glass Scrim to Guarantee Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070c17] via-[#070c17]/75 to-[#070c17]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#c5a059]/15 via-transparent to-transparent pointer-events-none" />

          {/* Top Atelier Brand Crest */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl border border-[#c5a059]/50 bg-[#070c17]/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_18px_rgba(197,160,89,0.25)] ring-1 ring-[#c5a059]/20">
                <Store className="w-5 h-5 text-[#e5c483]" />
              </div>
              <div>
                <h1 className="font-serif-luxury text-lg font-bold tracking-[0.16em] text-[#e5c483] leading-none uppercase">
                  StokKita
                </h1>
                <p className="text-[10px] font-mono tracking-[0.24em] uppercase text-slate-400 mt-1">
                  Haute Footwear Atelier & POS
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#070c17]/80 border border-[#c5a059]/30 backdrop-blur-md text-[11px] font-mono text-[#e5c483]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>Sistem Aktif & Terenkripsi</span>
            </div>
          </div>

          {/* Center Editorial Headlines */}
          <div className="relative z-10 my-10 lg:my-14 max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181308]/90 border border-[#c5a059]/40 text-[#e5c483] text-[10px] font-mono tracking-widest uppercase">
              <Sparkles size={11} className="text-[#c5a059]" />
              <span>Platform Manajemen Sepatu Presisi B2B</span>
            </div>

            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-serif-luxury font-bold text-slate-100 leading-tight tracking-tight">
              Seni Kerajinan & Presisi Manajemen{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5c483] via-[#c5a059] to-[#dfba73]">
                Alas Kaki Modern
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
              Arsitektur terpadu untuk pengawasan stok multi-cabang, formulasi teknik industri EOQ & ROP otomatis, serta terminal kasir berkecepatan tinggi.
            </p>
          </div>

          {/* Bottom Features Ribbon - 3 Architectural Columns */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#1e2538]/80 bg-[#070c17]/60 backdrop-blur-md -mx-8 -mb-8 p-6 sm:-mx-10 sm:-mb-10 sm:p-8 lg:-mx-12 lg:-mb-12 lg:p-8">
            <div className="p-3 rounded-xl border border-[#1e2538] bg-[#0a101f]/60 space-y-1">
              <span className="font-mono text-[11px] text-[#c5a059] font-bold">01 / MULTI-CABANG</span>
              <p className="text-xs text-slate-200 font-medium">Sinkronisasi Stok Instan</p>
              <p className="text-[10px] text-slate-400">Mutasi & ketersediaan real-time antar gudang</p>
            </div>

            <div className="p-3 rounded-xl border border-[#1e2538] bg-[#0a101f]/60 space-y-1">
              <span className="font-mono text-[11px] text-[#c5a059] font-bold">02 / POS ATELIER</span>
              <p className="text-xs text-slate-200 font-medium">Kasir Kilat & Barcode</p>
              <p className="text-[10px] text-slate-400">Shift laci, retur struk & parkir antrean</p>
            </div>

            <div className="p-3 rounded-xl border border-[#1e2538] bg-[#0a101f]/60 space-y-1">
              <span className="font-mono text-[11px] text-[#c5a059] font-bold">03 / BUFFER CERDAS</span>
              <p className="text-xs text-slate-200 font-medium">EOQ & ROP Otomatis</p>
              <p className="text-[10px] text-slate-400">Pencegahan kehabisan stok & margin laba</p>
            </div>
          </div>
        </div>

        {/* SISI KANAN: TERMINAL ACCESS CONSOLE (5 COLS) */}
        <div className="lg:col-span-5 xl:col-span-5 p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#070b14]/95 backdrop-blur-3xl relative">
          
          {/* Top Console Heading */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141d33] border border-[#c5a059]/40 text-[#e5c483] text-[10px] font-mono tracking-widest uppercase">
                <Lock size={11} className="text-[#c5a059]" />
                <span>Autentikasi Aman</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">v2.4 Enterprise</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-slate-100 tracking-tight">
              Akses Terminal
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
              Masukkan identitas akun resmi untuk membuka konsol kerja atelier toko Anda.
            </p>

            {/* Error Banner */}
            {error && (
              <div className="mt-5 p-3 rounded-xl bg-[#250d12] border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                <span className="font-mono">{error}</span>
              </div>
            )}

            {/* Credentials Form (Secure & Empty by Default) */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-300 mb-2 font-semibold">
                  Alamat Email Terdaftar
                </label>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-[#090e1c] border border-[#1e2538] rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none transition shadow-inner"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-serif-luxury uppercase tracking-wider text-slate-300 font-semibold">
                    Kata Sandi (Password)
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-10 bg-[#090e1c] border border-[#1e2538] rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none transition shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-[#e5c483] transition"
                    aria-label="Toggle password"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Sovereign Gold Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] hover:brightness-110 active:scale-[0.99] text-[#070b14] font-serif-luxury text-xs sm:text-sm font-bold tracking-[0.14em] uppercase transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2 font-mono">
                    <span className="w-4 h-4 border-2 border-[#070b14] border-t-transparent rounded-full animate-spin" />
                    Memverifikasi Sesi...
                  </span>
                ) : (
                  <>
                    <span>Buka Sesi Masuk</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-400">
              Ingin membuka toko sepatu baru?{" "}
              <Link to="/register" className="text-[#e5c483] hover:text-[#f3d99d] font-semibold underline underline-offset-4 transition">
                Daftar Merchant (Khusus Owner) →
              </Link>
            </div>
          </div>

          {/* Security Guarantee Footer */}
          <div className="pt-6 mt-6 border-t border-[#1e2538]/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#c5a059]" />
              <span>256-Bit SSL • Isolasi Multi-Tenant</span>
            </div>
            <span>© {new Date().getFullYear()} StokKita Atelier</span>
          </div>

        </div>
      </div>
    </div>
  );
}