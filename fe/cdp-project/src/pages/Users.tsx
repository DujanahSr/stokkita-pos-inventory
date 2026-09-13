import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import footwearLuxuryBg from "../assets/footwear_luxury_bg.jpg";
import { User, Mail, Lock, Shield, UserPlus } from "lucide-react";

export default function Users() {
  const { user } = useAuth();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("kasir");
  const [status, setStatus] = useState({ message: "", variant: "", loading: false });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus({ message: "", variant: "", loading: true });

    try {
      const res = await api.post("/auth/create-user", { nama, email, password, role });
      setStatus({ message: res.data.message || "User baru berhasil didaftarkan.", variant: "success", loading: false });
      setNama("");
      setEmail("");
      setPassword("");
      setRole("kasir");
    } catch (err: any) {
      setStatus({
        message: err.response?.data?.message || "Gagal membuat user.",
        variant: "error",
        loading: false,
      });
    }
  };

  const isRoleAdmin = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "superadmin";

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
        <Navbar title="Manajemen Pengguna & Staf" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Header Card */}
            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-2 text-[#e5c483] text-xs font-serif-luxury tracking-widest uppercase">
                <Shield size={16} /> Staff & Access Governance
              </div>
              <h1 className="text-2xl font-serif-luxury font-bold text-slate-100 mt-1">
                Registrasi Staf & Kasir Baru
              </h1>
              <p className="text-slate-400 text-xs font-mono mt-1">
                Buat akun operasional untuk kasir kasir POS atau administrator toko.
              </p>
            </div>

            {!isRoleAdmin ? (
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-rose-500/40 rounded-3xl p-6 text-rose-300 font-mono text-xs shadow-xl">
                <p className="font-bold text-sm text-rose-200">Akses Ditolak.</p>
                <p className="mt-1 text-slate-400">Hanya akun level Administrator yang memiliki wewenang membuat akun kasir/staf baru.</p>
              </div>
            ) : (
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-[#e5c483] uppercase tracking-wider mb-1.5">
                      Nama Lengkap Staf *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5a059]" />
                      <input
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-[#060a14] border border-[#c5a059]/30 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-[#c5a059] outline-none transition"
                        placeholder="Contoh: Rahmat Kasir"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#e5c483] uppercase tracking-wider mb-1.5">
                      Email Login *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5a059]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-[#060a14] border border-[#c5a059]/30 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-[#c5a059] outline-none transition"
                        placeholder="kasir@stokkita.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#e5c483] uppercase tracking-wider mb-1.5">
                      Password Login *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5a059]" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-[#060a14] border border-[#c5a059]/30 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-[#c5a059] outline-none transition"
                        placeholder="Minimal 6 karakter"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#e5c483] uppercase tracking-wider mb-1.5">
                      Peran Otoritas (Role) *
                    </label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c5a059]" />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-[#060a14] border border-[#c5a059]/30 rounded-xl text-xs font-mono text-slate-100 focus:border-[#c5a059] outline-none transition"
                      >
                        <option value="kasir">Kasir POS (Front-of-House)</option>
                        <option value="admin">Administrator Toko (Full Access)</option>
                      </select>
                    </div>
                  </div>

                  {status.message && (
                    <div className={`p-3 rounded-xl text-xs font-mono border ${
                      status.variant === "success" 
                        ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40" 
                        : "bg-rose-950/60 text-rose-300 border-rose-500/40"
                    }`}>
                      {status.message}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={status.loading}
                      className="w-full py-3 bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] text-[#070b14] font-serif-luxury font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <UserPlus size={15} />
                      <span>{status.loading ? "Mendaftarkan Staf..." : "Terbitkan Akun Staf"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
