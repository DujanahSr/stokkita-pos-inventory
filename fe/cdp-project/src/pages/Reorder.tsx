import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { 
  Package, RefreshCcw, Plus, Hash, Building2, 
  FileText, BrainCircuit, CheckCircle2, ArrowRight, Truck 
} from "lucide-react";
import api from "../api/axios";

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function fmtDate(d: any) {
  if (!d) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));
}

function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Menunggu: "bg-amber-100 text-amber-700 border-amber-200",
    Selesai: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Batal: "bg-red-100 text-red-700 border-red-200",
    Disarankan: "bg-blue-100 text-blue-700 border-blue-200",
  };
  const c = colors[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${c}`}>
      {status}
    </span>
  );
}

function Modal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Reorder() {
  const emptyForm = { variant_id: "", warehouse_id: "", qty: "", supplier: "Supplier Pusat" };
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Dynamic Calculation State
  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState<any>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

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
    } catch (err: any) {
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
        supplier: form.supplier || "Supplier Pusat"
      });

      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal membuat PO");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    setSaving(true);
    setError("");

    try {
      await api.put(`/reorder/${id}/${action}`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memproses PO");
    } finally {
      setSaving(false);
    }
  };

  // Recalculate Dynamic EOQ & ROP
  const handleRecalculate = async () => {
    setRecalculating(true);
    setError("");
    try {
      const res = await api.post("/reorder/recalculate");
      setRecalcResult(res.data);
      await load();
    } catch (err: any) {
      alert("Gagal menghitung ulang parameter: " + (err.response?.data?.message || err.message));
    } finally {
      setRecalculating(false);
    }
  };

  // Download PDF Purchase Order
  const handleDownloadPdf = async (id: string, kodePo: string) => {
    setDownloadingPdfId(id);
    try {
      const res = await api.get(`/reorder/export/pdf/${id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${kodePo || 'Purchase_Order'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert("Gagal mengunduh PDF Purchase Order");
    } finally {
      setDownloadingPdfId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Purchase Order & Procurement" />
        <main className="flex-1 p-6 space-y-5 overflow-y-auto">
          
          {/* Header & Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Manajemen Purchase Order & Pengadaan</h2>
              <p className="text-sm text-slate-500 mt-0.5">Optimasi stok otomatis berbasis Algoritma Dynamic EOQ & ROP</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60 transition shadow-sm"
              >
                <BrainCircuit className={`h-4 w-4 text-indigo-600 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? "Menghitung Algoritma..." : "Hitung Ulang EOQ & ROP"}
              </button>

              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                <RefreshCcw className="h-4 w-4" />
                Muat Ulang
              </button>

              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Buat PO Manual
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* PO Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex h-56 items-center justify-center text-slate-400">
                Memuat data purchase order...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 uppercase tracking-wider text-slate-400 font-semibold">
                    <tr>
                      <th className="px-4 py-3.5">Kode PO</th>
                      <th className="px-4 py-3.5">Produk & Varian</th>
                      <th className="px-4 py-3.5">Gudang / Cabang</th>
                      <th className="px-4 py-3.5">Supplier</th>
                      <th className="px-4 py-3.5 text-right">Qty</th>
                      <th className="px-4 py-3.5 text-right">Total Biaya</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5">Tanggal</th>
                      <th className="px-4 py-3.5 text-center">Aksi & Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {purchaseOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                          Belum ada purchase order atau saran restock.
                        </td>
                      </tr>
                    ) : (
                      purchaseOrders.map((po) => (
                        <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-700">{po.kode_po}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-slate-800">{po.produk}</div>
                                <div className="text-[10px] text-slate-400">{po.variant}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{po.warehouse}</td>
                          <td className="px-4 py-3 text-slate-600">{po.supplier || 'Supplier Pusat'}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">{po.qty} pcs</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700">{fmt(po.total)}</td>
                          <td className="px-4 py-3 text-center"><Badge status={po.status} /></td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(po.tanggal || po.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* DOWNLOAD PDF BUTTON */}
                              <button
                                onClick={() => handleDownloadPdf(po.id, po.kode_po)}
                                disabled={downloadingPdfId === po.id}
                                title="Download Dokumen Resmi PO (PDF)"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[11px] font-semibold transition"
                              >
                                <FileText size={13} className="text-red-500" />
                                {downloadingPdfId === po.id ? "..." : "PDF"}
                              </button>

                              {/* STATUS ACTION BUTTONS */}
                              {po.status === "Menunggu" && (
                                <>
                                  <button
                                    onClick={() => handleAction(po.id, "terima")}
                                    disabled={saving}
                                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                                  >
                                    Terima
                                  </button>
                                  <button
                                    onClick={() => handleAction(po.id, "batal")}
                                    disabled={saving}
                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60 transition"
                                  >
                                    Batal
                                  </button>
                                </>
                              )}
                              {po.status === "Disarankan" && (
                                <button
                                  onClick={() => handleAction(po.id, "terima")}
                                  disabled={saving}
                                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                                >
                                  Terima Saran
                                </button>
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

      {/* MODAL 1: BUAT PO MANUAL */}
      <Modal open={open} onClose={() => setOpen(false)} title="Buat Purchase Order Manual">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Gudang Penerima</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={form.warehouse_id}
                onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              >
                <option value="">-- Pilih Gudang Tujuan --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Produk & Varian</label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={form.variant_id}
                onChange={(e) => setForm({ ...form, variant_id: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
              >
                <option value="">-- Pilih Produk --</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.produk} ({v.variant}) - ROP: {v.rop} | EOQ: {v.eoq}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Nama Supplier / Vendor</label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="Misal: PT Sumber Busana Abadi"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Jumlah Pesanan (Qty)</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="1"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
                placeholder="Contoh: 50"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition shadow-sm"
            >
              {saving ? "Menyimpan..." : "Kirim Purchase Order"}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: ANALITIK KALKULASI DINAMIS EOQ & ROP */}
      {recalcResult && (
        <Modal open={!!recalcResult} onClose={() => setRecalcResult(null)} title="Hasil Kalkulasi Dynamic EOQ & ROP (30 Hari)">
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-indigo-600 flex-shrink-0" />
              <span>{recalcResult.message}. Parameter inventori seluruh varian telah diperbarui.</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Produk / SKU</th>
                    <th className="p-2.5 text-right">Daily Velocity</th>
                    <th className="p-2.5 text-right">Safety Stock</th>
                    <th className="p-2.5 text-center">ROP (Min Stok)</th>
                    <th className="p-2.5 text-center">EOQ (Batch Order)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recalcResult.updated_variants?.map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-800">{v.product_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{v.sku} ({v.size} {v.color})</div>
                      </td>
                      <td className="p-2.5 text-right text-slate-700">{v.daily_velocity} /hari</td>
                      <td className="p-2.5 text-right text-slate-700">{v.safety_stock} pcs</td>
                      <td className="p-2.5 text-center">
                        <span className="text-slate-400 line-through mr-1">{v.old_rop}</span>
                        <ArrowRight size={10} className="inline text-slate-400 mr-1" />
                        <span className="font-bold text-emerald-700">{v.new_rop}</span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="text-slate-400 line-through mr-1">{v.old_eoq}</span>
                        <ArrowRight size={10} className="inline text-slate-400 mr-1" />
                        <span className="font-bold text-indigo-700">{v.new_eoq}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setRecalcResult(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
