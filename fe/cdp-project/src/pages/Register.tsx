import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Building2, Mail, Lock, User, Store, ShieldCheck, 
  Sparkles, ArrowRight, Eye, EyeOff, Info, CheckCircle2 
} from "lucide-react";
import api from "../api/axios";
import footwearAtelierLogin from "../assets/footwear_atelier_login.jpg";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    perusahaan: "",
    nama: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", form);
      navigate("/login", { 
        state: { 
          message: `Registrasi brand "${form.perusahaan}" berhasil! Silakan masuk sebagai Pemilik Toko.` 
        } 
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kendala saat mendaftarkan brand. Pastikan email belum terdaftar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-10 relative overflow-hidden font-sans select-none">
      {/* Background Architectural Ambience */}
      <div 
        className="fixed inset-0 bg-cover bg-center pointer-events-none opacity-35 blur-2xl scale-110"
        style={{ backgroundImage: `url(${footwearAtelierLogin})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/90 to-[#050811]/70 pointer-events-none" />

      {/* Main Registration Container */}
      <div className="w-full max-w-2xl rounded-3xl border border-[#1e2538] bg-[#070c17]/95 backdrop-blur-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-6 sm:p-10 relative z-10">
        
        {/* Top Header & Emblem */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1e2538]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl border border-[#c5a059]/50 bg-[#070c17]/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_18px_rgba(197,160,89,0.25)] ring-1 ring-[#c5a059]/20">
              <Store className="w-5 h-5 text-[#e5c483]" />
            </div>
            <div>
              <h1 className="font-serif-luxury text-lg font-bold tracking-[0.16em] text-[#e5c483] leading-none uppercase">
                StokKita
              </h1>
              <p className="text-[10px] font-mono tracking-[0.24em] uppercase text-slate-400 mt-1">
                Merchant Onboarding Portal
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181308]/90 border border-[#c5a059]/40 text-[#e5c483] text-[10px] font-mono tracking-widest uppercase self-start sm:self-auto">
            <Sparkles size={11} className="text-[#c5a059]" />
            <span>Khusus Pemilik Brand / Owner</span>
          </div>
        </div>

        {/* Informational Guidance for SaaS Multi-Tenant */}
        <div className="mt-6 p-3.5 rounded-2xl bg-[#0c1424]/80 border border-[#1e2538] flex items-start gap-3 text-xs leading-relaxed">
          <Info size={18} className="text-[#c5a059] flex-shrink-0 mt-0.5" />
          <div className="text-slate-300">
            <span className="font-semibold text-[#f3d99d] block mb-0.5">Ketentuan Akun Pemilik Usaha:</span>
            Pendaftaran ini otomatis mendirikan tenant brand baru dan memberikan Anda hak akses penuh (Owner/Admin). 
            <span className="text-slate-400 block mt-1">
              *Akun Kasir dan Staf tidak didaftarkan di sini, melainkan dibuat oleh Anda dari dalam dashboard toko.
            </span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#250d12] border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
            <span className="font-mono">{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                Nama Brand / Toko Sepatu
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: Atelier Footwear"
                  value={form.perusahaan}
                  onChange={(e) => setForm({ ...form, perusahaan: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 pl-9 bg-[#090e1c] border border-[#1e2538] rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none transition"
                />
                <Building2 size={14} className="absolute left-3 top-3 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                Nama Lengkap Pemilik (Owner)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Contoh: Muhammad Dujanah"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 pl-9 bg-[#090e1c] border border-[#1e2538] rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none transition"
                />
                <User size={14} className="absolute left-3 top-3 text-slate-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
              Email Bisnis Resmi
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="owner@atelier.id"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 pl-9 bg-[#090e1c] border border-[#1e2538] rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none transition"
              />
              <Mail size={14} className="absolute left-3 top-3 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
              Kata Sandi Akun
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Minimal 8 karakter terenkripsi"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 pl-9 pr-10 bg-[#090e1c] border border-[#1e2538] rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none transition"
              />
              <Lock size={14} className="absolute left-3 top-3 text-slate-500" />
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

          {/* Value Propositions */}
          <div className="py-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#c5a059]" />
              <span>Gudang Utama Otomatis</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#c5a059]" />
              <span>Katalog Sepatu Siap Pakai</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#c5a059]" />
              <span>Multi-Kasir Terisolasi</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 rounded-xl bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] hover:brightness-110 active:scale-[0.99] text-[#070b14] font-serif-luxury text-xs sm:text-sm font-bold tracking-[0.14em] uppercase transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2 font-mono">
                <span className="w-4 h-4 border-2 border-[#070b14] border-t-transparent rounded-full animate-spin" />
                Mempersiapkan Atelier Toko Anda...
              </span>
            ) : (
              <>
                <span>Daftarkan Brand Sepatu & Buka Toko</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Sudah memiliki akun toko atau akun kasir?{" "}
          <Link to="/login" className="text-[#e5c483] hover:text-[#f3d99d] font-semibold underline underline-offset-4 transition">
            Buka Sesi Masuk →
          </Link>
        </div>

        {/* Security Guarantee Footer */}
        <div className="pt-6 mt-6 border-t border-[#1e2538]/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-[#c5a059]" />
            <span>256-Bit SSL • Isolasi Multi-Tenant Enkripsi Penuh</span>
          </div>
          <span>© {new Date().getFullYear()} StokKita Footwear Atelier</span>
        </div>

      </div>
    </div>
  );
}
