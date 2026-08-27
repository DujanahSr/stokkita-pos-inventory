import { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { Package, RefreshCcw, Plus, Hash, Building2 } from "lucide-react";
import api from "../api/axios";

function fmt(n) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(n || 0);
}

function fmtDate(d) {
	if (!d) return "-";
	return new Intl.DateTimeFormat("id-ID", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(d));
}

function Badge({ status }) {
	const colors = {
		Menunggu: "bg-amber-100 text-amber-700 border-amber-200",
		Selesai: "bg-emerald-100 text-emerald-700 border-emerald-200",
		Batal: "bg-red-100 text-red-700 border-red-200",
		Disarankan: "bg-blue-100 text-blue-700 border-blue-200",
	};
	const c = colors[status] || "bg-slate-100 text-slate-700 border-slate-200";
	return (
		<span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${c}`}>
			{status}
		</span>
	);
}

function Modal({ open, onClose, title, children }) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
				<div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
					<h3 className="font-semibold text-slate-800">{title}</h3>
					<button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
				</div>
				<div className="p-6 overflow-y-auto max-h-[80vh]">
					{children}
				</div>
			</div>
		</div>
	);
}

export default function Reorder() {
	const emptyForm = { variant_id: "", warehouse_id: "", qty: "" };
	const [purchaseOrders, setPurchaseOrders] = useState([]);
	const [variants, setVariants] = useState([]);
	const [warehouses, setWarehouses] = useState([]);
	const [open, setOpen] = useState(false);
	const [form, setForm] = useState(emptyForm);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const load = async () => {
		setLoading(true);
		setError("");

		try {
			const [poRes, varRes, whRes] = await Promise.all([
				api.get("/reorder"),
				api.get("/master/variants"),
				api.get("/master/warehouses")
			]);
			setPurchaseOrders(poRes.data);
			setVariants(varRes.data);
			setWarehouses(whRes.data);
		} catch (err) {
			setError(err.response?.data?.message || "Gagal memuat data purchase order");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const handleCreate = async () => {
		if (!form.variant_id || !form.warehouse_id || !form.qty) {
			setError("Produk, gudang, dan qty wajib diisi");
			return;
		}

		setSaving(true);
		setError("");

		try {
			await api.post("/reorder", {
				variant_id: form.variant_id,
				warehouse_id: form.warehouse_id,
				qty: Number(form.qty),
			});

			setOpen(false);
			setForm(emptyForm);
			await load();
		} catch (err) {
			setError(err.response?.data?.message || "Gagal membuat PO");
		} finally {
			setSaving(false);
		}
	};

	const handleAction = async (id, action) => {
		setSaving(true);
		setError("");

		try {
			await api.put(`/reorder/${id}/${action}`);
			await load();
		} catch (err) {
			setError(err.response?.data?.message || "Gagal memproses PO");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="flex min-h-screen bg-slate-50">
			<Sidebar />
			<div className="flex-1 lg:ml-60 ml-0 min-w-0">
				<Navbar title="Purchase Order" />
				<main className="p-6 space-y-4">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
						<div>
							<h2 className="text-lg font-semibold text-slate-800">Manajemen Purchase Order</h2>
							<p className="text-sm text-slate-500">Buat PO dari stok produk yang sudah ada di inventori.</p>
						</div>
						<div className="flex items-center gap-2 w-full sm:w-auto">
							<button
								onClick={load}
								className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
							>
								<RefreshCcw className="h-4 w-4" />
								Muat Ulang
							</button>
							<button
								onClick={() => setOpen(true)}
								className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
							>
								<Plus className="h-4 w-4" />
								Buat PO
							</button>
						</div>
					</div>

					{error && (
						<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{error}
						</div>
					)}

					<div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
						{loading ? (
							<div className="flex h-56 items-center justify-center text-slate-400">
								Memuat data purchase order...
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
										<tr>
											<th className="px-4 py-3 text-left">Kode PO</th>
											<th className="px-4 py-3 text-left">Produk</th>
											<th className="px-4 py-3 text-left">Supplier</th>
											<th className="px-4 py-3 text-right">Qty</th>
											<th className="px-4 py-3 text-right">Total</th>
											<th className="px-4 py-3 text-left">Status</th>
											<th className="px-4 py-3 text-left">Tanggal</th>
											<th className="px-4 py-3 text-center">Aksi</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{purchaseOrders.length === 0 ? (
											<tr>
												<td colSpan={8} className="px-4 py-10 text-center text-slate-400">
													Belum ada purchase order.
												</td>
											</tr>
										) : (
											purchaseOrders.map((po) => (
												<tr key={po.id} className="hover:bg-slate-50">
													<td className="px-4 py-3 font-mono text-xs text-slate-500">{po.kode_po}</td>
													<td className="px-4 py-3 font-medium text-slate-800">
														<div className="flex items-center gap-2">
															<Package className="h-4 w-4 text-slate-400" />
															<span>{po.produk} ({po.variant})</span>
														</div>
													</td>
													<td className="px-4 py-3 text-slate-500">{po.supplier}</td>
													<td className="px-4 py-3 text-right text-slate-700">{po.qty}</td>
													<td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(po.total)}</td>
													<td className="px-4 py-3"><Badge status={po.status} /></td>
													<td className="px-4 py-3 text-slate-500">{fmtDate(po.tanggal || po.created_at)}</td>
													<td className="px-4 py-3">
														<div className="flex items-center justify-center gap-2">
															{po.status === "Menunggu" && (
																<>
																	<button
																		onClick={() => handleAction(po.id, "terima")}
																		disabled={saving}
																		className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
																	>
																		Terima
																	</button>
																	<button
																		onClick={() => handleAction(po.id, "batal")}
																		disabled={saving}
																		className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
																	>
																		Batal
																	</button>
																</>
															)}
															{po.status === "Disarankan" && (
																<button
																	onClick={() => handleAction(po.id, "terima")}
																	disabled={saving}
																	className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
																>
																	Terima Saran
																</button>
															)}
															{(po.status === "Selesai" || po.status === "Batal") && (
																<span className="text-xs text-slate-400">{po.status}</span>
															)}
														</div>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</main>
			</div>

			<Modal open={open} onClose={() => setOpen(false)} title="Buat Purchase Order">
				<div className="space-y-4">
					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">Gudang Penerima</label>
						<div className="relative">
							<Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<select
								value={form.warehouse_id}
								onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
								className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
							>
								<option value="">Pilih gudang</option>
								{warehouses.map((w) => (
									<option key={w.id} value={w.id}>
										{w.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">Produk</label>
						<div className="relative">
							<Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<select
								value={form.variant_id}
								onChange={(e) => setForm({ ...form, variant_id: e.target.value })}
								className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
							>
								<option value="">Pilih produk</option>
								{variants.map((v) => (
									<option key={v.id} value={v.id}>
										{v.produk} ({v.variant})
									</option>
								))}
							</select>
						</div>
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-slate-600">Qty</label>
						<div className="relative">
							<Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
							<input
								type="number"
								min="1"
								value={form.qty}
								onChange={(e) => setForm({ ...form, qty: e.target.value })}
								className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
							/>
						</div>
					</div>

					<div className="flex gap-2 pt-2">
						<button
							onClick={() => setOpen(false)}
							className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
						>
							Batal
						</button>
						<button
							onClick={handleCreate}
							disabled={saving}
							className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
						>
							{saving ? "Menyimpan..." : "Simpan"}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
