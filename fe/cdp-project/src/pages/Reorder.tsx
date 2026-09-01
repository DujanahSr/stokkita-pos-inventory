import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { 
  Package, RefreshCcw, Plus, Hash, Building2, 
  FileText, BrainCircuit, CheckCircle2, ArrowRight, Truck,
  Phone, MessageSquare, Edit3, Trash2, Users, MapPin, Mail, CreditCard
} from "lucide-react";
import api from "../api/axios";
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState<"po" | "supplier">("po");

  // Tab 1: PO State
  const emptyForm = { variant_id: "", warehouse_id: "", qty: "", supplier: "PT. Mitra Manufaktur Bandung" };
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

  // Tab 2: Supplier State
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    pic_name: "",
    phone: "",
    email: "",
    address: "",
    payment_terms: "NET 30"
  });

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [poRes, varRes, whRes, supRes] = await Promise.all([
        api.get("/reorder"),
        api.get("/master/variants"),
        api.get("/master/warehouses"),
        api.get("/supplier")
      ]);
      setPurchaseOrders(poRes.data);
      setVariants(varRes.data);
      setWarehouses(whRes.data);
      setSuppliers(supRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Recalculate EOQ & ROP
  const handleRecalculateEOQ = async () => {
    setRecalculating(true);
    try {
      const res = await api.post("/reorder/recalculate");
      setRecalcResult(res.data);
      load();
      toast.success("Parameter pengadaan (EOQ/ROP) berhasil dihitung ulang!");
    } catch (err: any) {
      toast.error("Gagal menghitung ulang parameter pengadaan: " + (err.response?.data?.message || err.message));
    } finally {
      setRecalculating(false);
    }
  };

  // Download Official PDF
  const handleDownloadPdf = async (poId: string, kodePo: string) => {
    setDownloadingPdfId(poId);
    try {
      const res = await api.get(`/reorder/export/pdf/${poId}`, {
        responseType: "blob"
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Purchase_Order_${kodePo || poId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF Purchase Order berhasil diunduh!");
    } catch (err: any) {
      toast.error("Gagal mengunduh PDF Purchase Order");
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // Dispatch WhatsApp PO
  const handleSendWhatsApp = (po: any) => {
    // Find matching supplier by name or fallback
    const matchedSupplier = suppliers.find(s => s.name.toLowerCase() === (po.supplier || "").toLowerCase()) || suppliers[0];
    const phone = matchedSupplier?.phone ? matchedSupplier.phone.replace(/[^0-9]/g, "") : "6281234567890";
    const picName = matchedSupplier?.pic_name || "Bapak/Ibu Bagian Sales";
    const supplierName = matchedSupplier?.name || po.supplier || "Supplier Mitra";

    const itemName = po.product_name ? `${po.product_name} (${po.size} / ${po.color})` : `Varian SKU: ${po.sku}`;
    const cleanKode = (po.kode_po || `PO-${po.id.slice(0, 8)}`).toUpperCase();

    const waText = 
`*PURCHASE ORDER RESMI - STOKKITA PLATFORM*
No. Dokumen: *${cleanKode}*
Tanggal Order: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}

Kepada Yth.
*${supplierName}*
Attn: *${picName}*

Dengan hormat,
Berdasarkan sistem perkiraan restock otomatis kami, kami bermaksud menerbitkan Surat Pesanan Pembelian (*Purchase Order*) untuk kebutuhan stok berikut:

📦 *Detail Barang:*
- Nama Item: ${itemName}
- Barcode SKU: ${po.sku}
- Jumlah Pesanan: *${po.qty} pcs*
- Estimasi Biaya: *${fmt(po.total)}*
- Lokasi Pengiriman: *${po.warehouse_name}*

Mohon konfirmasi ketersediaan barang, jadwal pengiriman, dan faktur tagihan (*Invoice*).

Atas kerjasamanya kami ucapkan terima kasih.

_StokKita Supply Chain & Inventory Operations_`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(waText)}`;
    window.open(waUrl, "_blank");
  };

  // Create PO
  const handleCreate = async () => {
    if (!form.variant_id || !form.warehouse_id || !form.qty) {
      setError("Produk, gudang, dan qty wajib diisi");
      toast.warning("Produk, gudang, dan qty wajib diisi");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/reorder", form);
      setOpen(false);
      setForm(emptyForm);
      load();
      toast.success("Draft Purchase Order berhasil dibuat!");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal membuat PO";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Update PO Status
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/reorder/${id}/status`, { status });
      load();
      toast.success(`Status Purchase Order diperbarui menjadi "${status}"`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengupdate status");
    }
  };

  // Supplier CRUD Handlers
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSupplier) {
        await api.put(`/supplier/${editingSupplier.id}`, supplierForm);
        toast.success(`Data supplier "${supplierForm.name}" berhasil diperbarui!`);
      } else {
        await api.post("/supplier", supplierForm);
        toast.success(`Supplier "${supplierForm.name}" berhasil ditambahkan!`);
      }
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      setSupplierForm({ name: "", pic_name: "", phone: "", email: "", address: "", payment_terms: "NET 30" });
      load();
    } catch (err: any) {
      toast.error("Gagal menyimpan supplier: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    toast.error(`Hapus supplier "${name}"?`, {
      description: "Data kontak dan riwayat supplier ini akan dihapus dari sistem.",
      action: {
        label: "Hapus Supplier",
        onClick: async () => {
          try {
            await api.delete(`/supplier/${id}`);
            load();
            toast.success(`Supplier "${name}" berhasil dihapus`);
          } catch (err: any) {
            toast.error("Gagal menghapus supplier: " + (err.response?.data?.message || err.message));
          }
        }
      },
      cancel: {
        label: "Batal",
        onClick: () => {}
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Pengadaan & Supplier Management" />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <Truck className="text-emerald-600" size={32} />
                Pengadaan & Vendor Management
              </h1>
              <p className="text-slate-500 mt-1">Peramalan EOQ, rekomendasi ROP, penerbitan PO resmi, dan pengiriman otomatis via WhatsApp</p>
            </div>

            {/* Tab Buttons */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setActiveTab("po")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === "po"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Package size={15} /> Purchase Order & EOQ
              </button>

              <button
                onClick={() => setActiveTab("supplier")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === "supplier"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Users size={15} /> Master Data Supplier ({suppliers.length})
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* TAB 1: PURCHASE ORDER & DYNAMIC FORECASTING */}
          {activeTab === "po" && (
            <div className="space-y-6">
              
              {/* Top Action Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRecalculateEOQ}
                    disabled={recalculating}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <BrainCircuit size={16} />
                    <span>{recalculating ? "Menganalisis 30 Hari Transaksi..." : "Hitung Ulang EOQ & ROP Dinamis"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Plus size={16} /> Buat PO Manual
                  </button>
                </div>
              </div>

              {/* Purchase Orders Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="p-3.5 pl-6">Kode PO</th>
                        <th className="p-3.5">Produk & Varian</th>
                        <th className="p-3.5">Gudang Tujuan</th>
                        <th className="p-3.5 text-center">Jumlah Restock</th>
                        <th className="p-3.5 text-right">Total Biaya HPP</th>
                        <th className="p-3.5">Vendor / Supplier</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-center pr-6">Aksi Dispatch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {loading ? (
                        <tr><td colSpan={8} className="py-10 text-center text-slate-400">Memuat data pengadaan...</td></tr>
                      ) : purchaseOrders.length === 0 ? (
                        <tr><td colSpan={8} className="py-10 text-center text-slate-400">Belum ada pesanan pengadaan.</td></tr>
                      ) : (
                        purchaseOrders.map(po => {
                          const isSuggestion = (po.status === "Disarankan" || po.status === "SUGGESTION");
                          return (
                            <tr key={po.id} className={`hover:bg-slate-50 transition-colors ${isSuggestion ? 'bg-amber-50/20' : ''}`}>
                              <td className="p-3.5 pl-6 font-mono font-bold text-slate-800">
                                {po.kode_po || `PO-${po.id.slice(0, 8)}`}
                              </td>
                              <td className="p-3.5 text-slate-800">
                                <div className="font-semibold">{po.product_name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{po.sku} • {po.size} / {po.color}</div>
                              </td>
                              <td className="p-3.5 text-slate-700">{po.warehouse_name}</td>
                              <td className="p-3.5 text-center font-bold text-slate-800">
                                <span className="px-2 py-0.5 bg-slate-100 rounded-lg">{po.qty} pcs</span>
                              </td>
                              <td className="p-3.5 text-right font-bold text-emerald-700">{fmt(po.total)}</td>
                              <td className="p-3.5 text-slate-600 font-semibold">{po.supplier || "Supplier Pusat"}</td>
                              <td className="p-3.5 text-center">
                                <Badge status={po.status} />
                              </td>
                              <td className="p-3.5 pr-6 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  
                                  {/* WHATSAPP DISPATCH BUTTON */}
                                  <button
                                    onClick={() => handleSendWhatsApp(po)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition"
                                    title="Kirim PO resmi ke WhatsApp Vendor"
                                  >
                                    <MessageSquare size={13} /> WA PO
                                  </button>

                                  {/* PDF DOWNLOAD BUTTON */}
                                  <button
                                    onClick={() => handleDownloadPdf(po.id, po.kode_po)}
                                    disabled={downloadingPdfId === po.id}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition disabled:opacity-50"
                                    title="Download Dokumen PO PDF Resmi"
                                  >
                                    <FileText size={13} /> {downloadingPdfId === po.id ? "..." : "PDF"}
                                  </button>

                                  {/* Terima Barang Button */}
                                  {po.status === "Menunggu" && (
                                    <button
                                      onClick={() => handleUpdateStatus(po.id, "Selesai")}
                                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                      title="Barang Telah Tiba di Gudang (Selesai)"
                                    >
                                      <CheckCircle2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER DATA SUPPLIER & VENDOR */}
          {activeTab === "supplier" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Daftar Mitra Vendor & Supplier</h3>
                  <p className="text-xs text-slate-500">Kelola kontak PIC, nomor WhatsApp, dan termin pembayaran pengadaan</p>
                </div>
                <button
                  onClick={() => {
                    setEditingSupplier(null);
                    setSupplierForm({ name: "", pic_name: "", phone: "", email: "", address: "", payment_terms: "NET 30" });
                    setIsSupplierModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <Plus size={16} /> Tambah Supplier Baru
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((s) => (
                  <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-emerald-300 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {s.payment_terms || "NET 30"}
                        </span>
                        <h4 className="text-base font-bold text-slate-800 mt-2">{s.name}</h4>
                        <div className="text-xs text-slate-500 font-medium">PIC: {s.pic_name || "-"}</div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSupplier(s);
                            setSupplierForm({
                              name: s.name,
                              pic_name: s.pic_name,
                              phone: s.phone,
                              email: s.email,
                              address: s.address,
                              payment_terms: s.payment_terms
                            });
                            setIsSupplierModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s.id, s.name)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-emerald-600" />
                        <span className="font-mono">{s.phone || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-blue-600" />
                        <span>{s.email || "-"}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{s.address || "-"}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Riwayat Pengadaan:</span>
                      <span className="font-bold text-slate-800">{s.total_po_count || 0} PO</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL 1: FORM TAMBAH/EDIT SUPPLIER */}
      {isSupplierModalOpen && (
        <Modal open={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title={editingSupplier ? "Edit Data Supplier" : "Pendaftaran Supplier Baru"}>
          <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Vendor *</label>
              <input
                type="text"
                required
                placeholder="Misal: PT. Mitra Manufaktur Bandung"
                value={supplierForm.name}
                onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama PIC (Kontak)</label>
                <input
                  type="text"
                  placeholder="Misal: Bpk. Agus"
                  value={supplierForm.pic_name}
                  onChange={e => setSupplierForm({ ...supplierForm, pic_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="6281234567890"
                  value={supplierForm.phone}
                  onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Sales</label>
                <input
                  type="email"
                  placeholder="sales@vendor.com"
                  value={supplierForm.email}
                  onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Termin Pembayaran</label>
                <select
                  value={supplierForm.payment_terms}
                  onChange={e => setSupplierForm({ ...supplierForm, payment_terms: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none font-medium"
                >
                  <option value="NET 30">NET 30 Hari</option>
                  <option value="NET 60">NET 60 Hari</option>
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                  <option value="Tunai Dimuka">Tunai Dimuka (Prepaid)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Gudang / Pabrik</label>
              <textarea
                rows={2}
                placeholder="Alamat lengkap supplier..."
                value={supplierForm.address}
                onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
              >
                {saving ? "Menyimpan..." : "Simpan Supplier"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: FORM BUAT PO MANUAL */}
      {open && (
        <Modal open={open} onClose={() => setOpen(false)} title="Penerbitan Purchase Order Baru">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pilih Produk & Varian *</label>
              <select
                value={form.variant_id}
                onChange={e => setForm({ ...form, variant_id: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white outline-none font-medium"
              >
                <option value="" disabled>Pilih produk...</option>
                {variants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.product_name} - {v.sku} ({v.size}/{v.color}) - HPP: {fmt(v.price_buy)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gudang Penerima *</label>
                <select
                  value={form.warehouse_id}
                  onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white outline-none font-medium"
                >
                  <option value="" disabled>Pilih gudang...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah Pesanan (Qty) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Misal: 50"
                  value={form.qty}
                  onChange={e => setForm({ ...form, qty: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pilih Supplier Mitra</label>
              <select
                value={form.supplier}
                onChange={e => setForm({ ...form, supplier: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white outline-none font-medium"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.pic_name})</option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
              >
                {saving ? "Menerbitkan..." : "Terbitkan Dokumen PO"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: RECALCULATE EOQ RESULT ANALYTICS */}
      {recalcResult && (
        <Modal open={!!recalcResult} onClose={() => setRecalcResult(null)} title="Hasil Rekalkulasi EOQ & ROP Dinamis">
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1 text-purple-900">
              <div className="font-bold flex items-center gap-1.5">
                <BrainCircuit size={16} /> Analisis 30 Hari Velocity Berhasil!
              </div>
              <p className="text-[11px] text-purple-800">
                {recalcResult.message}. Parameter ROP & EOQ telah diperbarui di database.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {recalcResult.details?.map((d: any, idx: number) => (
                <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <div className="font-semibold text-slate-800">{d.product_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{d.sku} • Rata-rata: {d.avg_daily_demand} pcs/hari</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
                      ROP: {d.new_rop} | EOQ: {d.new_eoq}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setRecalcResult(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Selesai
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
