import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, Shield, UserPlus } from "lucide-react";

export default function Users() {
  const { user } = useAuth();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("kasir");
  const [status, setStatus] = useState({ message: "", variant: "", loading: false });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ message: "", variant: "", loading: true });

    try {
      const res = await api.post("/auth/register", { nama, email, password, role });
      setStatus({ message: res.data.message || "User berhasil dibuat.", variant: "success", loading: false });
      setNama("");
      setEmail("");
      setPassword("");
      setRole("kasir");
    } catch (err) {
      setStatus({
        message: err.response?.data?.message || "Gagal membuat user.",
        variant: "error",
        loading: false,
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0">
        <Navbar title="Kelola User" />
        <main className="p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h1 className="text-xl font-semibold text-slate-900">Halaman Admin: Buat User/Kasir</h1>
              <p className="mt-2 text-sm text-slate-500">
                Gunakan halaman ini untuk menambahkan akun baru. Hanya admin yang dapat mengakses halaman ini.
              </p>
            </div>

            {user?.role !== "admin" ? (
              <div className="bg-white rounded-xl border border-red-200 p-6 text-red-700">
                <p className="font-semibold">Akses ditolak.</p>
                <p className="mt-2 text-sm text-slate-500">Hanya admin yang dapat membuat user baru.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Nama</label>
                    <div className="relative mt-2">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                        placeholder="Nama pengguna"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                        placeholder="email@domain.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative mt-2">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                        placeholder="Minimal 6 karakter"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Role</label>
                    <div className="relative mt-2">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none appearance-none"
                      >
                        <option value="kasir">Kasir</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  {status.message && (
                    <div className={`rounded-xl px-4 py-3 text-sm ${status.variant === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                      {status.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status.loading}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {status.loading ? "Menyimpan..." : "Buat User Baru"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
