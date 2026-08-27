import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Mail, Lock, User, Store } from "lucide-react";
import api from "../api/axios";

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			await api.post("/auth/register", form);
			navigate("/login", { state: { message: "Registrasi berhasil! Silakan login." } });
		} catch (err: any) {
			setError(err.response?.data?.message || "Terjadi kesalahan saat registrasi");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="flex justify-center items-center gap-2 text-emerald-600">
					<Store className="w-10 h-10" />
					<span className="text-3xl font-bold tracking-tight text-slate-900">StokKita</span>
				</div>
				<h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
					Daftarkan Bisnis Anda
				</h2>
				<p className="mt-2 text-center text-sm text-slate-600">
					Sistem manajemen gudang terpusat untuk UMKM
				</p>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
					<form className="space-y-5" onSubmit={handleSubmit}>
						{error && (
							<div className="rounded-lg bg-red-50 p-4 border border-red-200">
								<p className="text-sm text-red-700">{error}</p>
							</div>
						)}

						<div>
							<label className="block text-sm font-medium text-slate-700">Nama Perusahaan / Toko</label>
							<div className="mt-1 relative rounded-md shadow-sm">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Building2 className="h-5 w-5 text-slate-400" />
								</div>
								<input
									type="text"
									required
									value={form.perusahaan}
									onChange={(e) => setForm({ ...form, perusahaan: e.target.value })}
									className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
									placeholder="PT Sepatu Maju Jaya"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700">Nama Lengkap Admin</label>
							<div className="mt-1 relative rounded-md shadow-sm">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<User className="h-5 w-5 text-slate-400" />
								</div>
								<input
									type="text"
									required
									value={form.nama}
									onChange={(e) => setForm({ ...form, nama: e.target.value })}
									className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
									placeholder="Budi Santoso"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700">Email Address</label>
							<div className="mt-1 relative rounded-md shadow-sm">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Mail className="h-5 w-5 text-slate-400" />
								</div>
								<input
									type="email"
									required
									value={form.email}
									onChange={(e) => setForm({ ...form, email: e.target.value })}
									className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
									placeholder="budi@example.com"
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-slate-700">Password</label>
							<div className="mt-1 relative rounded-md shadow-sm">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Lock className="h-5 w-5 text-slate-400" />
								</div>
								<input
									type="password"
									required
									value={form.password}
									onChange={(e) => setForm({ ...form, password: e.target.value })}
									className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
									placeholder="••••••••"
								/>
							</div>
						</div>

						<div>
							<button
								type="submit"
								disabled={loading}
								className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 transition-colors"
							>
								{loading ? "Memproses..." : "Daftar Sekarang"}
							</button>
						</div>
					</form>

					<div className="mt-6">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-slate-200" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-white text-slate-500">Sudah punya akun?</span>
							</div>
						</div>

						<div className="mt-6">
							<Link
								to="/login"
								className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
							>
								Masuk ke Dashboard
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
