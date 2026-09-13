import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { 
  Package, RefreshCcw, Plus, Building2, 
  FileText, BrainCircuit, CheckCircle2, Truck,
  Phone, MessageSquare, Edit3, Trash2, Users, MapPin, Mail
} from "lucide-react";
import api from "../api/axios";
import footwearLuxuryBg from "../assets/footwear_luxury_bg.jpg";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

const INPUT_CLS = "w-full px-3 py-2 bg-[#060a14] border border-[#c5a059]/30 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-[#c5a059] outline-none transition";
const LABEL_CLS = "block text-[10px] font-mono text-[#e5c483] uppercase tracking-wider mb-1";
const BTN_GOLD = "px-3.5 py-2 bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] text-[#070b14] font-serif-luxury font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-1.5";
const BTN_DARK = "px-3.5 py-2 bg-[#090e1c]/70 hover:bg-[#141d33] border border-[#c5a059]/30 text-slate-200 hover:text-[#e5c483] rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5";

function LuxuryModal({ open, onClose, title, children }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#090e1c] border border-[#c5a059]/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#c5a059]/20 flex items-center justify-between">
          <h3 className="font-serif-luxury font-bold text-sm text-[#e5c483] uppercase tracking-wider">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">&times;</button>
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
      setError(err.response?.data?.message || "Gagal memuat data pengadaan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRecalculateEOQ = async () => {
    setRecalculating(true);
    try {
      const res = await api.post("/reorder/recalculate");
      setRecalcResult(res.data);
      load();
      toast.success("Parameter pengadaan (EOQ/ROP) berhasil dihitung ulang!");
    } catch (err: any) {
      toast.error("Gagal menghitung ulang: " + (err.response?.data?.message || err.message));
    } finally {
      setRecalculating(false);
    }
  };

  const handleDownloadPdf = async (poId: string, kodePo: string) => {
    setDownloadingPdfId(poId);
    try {
      const res = await api.get(`/reorder/export/pdf/${poId}`, { responseType: "blob" });
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
    } catch {
      toast.error("Gagal mengunduh PDF Purchase Order");
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleSendWhatsApp = (po: any) => {
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
Berdasarkan sistem perkiraan restock otomatis kami, kami bermaksud menerbitkan Surat Pesanan Pembelian (*Purchase Order*):

📦 *Detail Barang:*
- Nama Item: ${itemName}
- Barcode SKU: ${po.sku}
- Jumlah Pesanan: *${po.qty} pcs*
- Estimasi Biaya: *${fmt(po.total)}*
- Lokasi Pengiriman: *${po.warehouse_name}*

Mohon konfirmasi ketersediaan barang dan jadwal pengiriman. Terima kasih.
_StokKita Supply Chain Management_`;

    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(waText)}`;
    window.open(waUrl, "_blank");
  };

  const handleCreate = async () => {
    if (!form.variant_id || !form.warehouse_id || !form.qty) {
      return toast.warning("Produk, gudang, dan qty wajib diisi");
    }
    setSaving(true);
    setError("");
    try {
      await api.post("/reorder", form);
      setOpen(false);
      setForm(emptyForm);
      load();
      toast.success("Draft Purchase Order berhasil diterbitkan!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal membuat PO");
    } finally {
      setSaving(false);
    }
  };

  const handleReceivePO = (po: any) => {
    toast.warning(`Konfirmasi penerimaan barang untuk ${po.kode_po || 'PO'}?`, {
      description: `Barang "${po.product_name || po.produk}" sebanyak ${po.qty} pcs akan otomatis ditambahkan ke stok ${po.warehouse_name || po.warehouse}.`,
      action: {
        label: "Terima",
        onClick: async () => {
          try {
            await api.put(`/reorder/${po.id}/terima`);
            load();
            toast.success("Barang diterima! Stok fisik otomatis bertambah.");
          } catch (err: any) {
            toast.error("Gagal menerima barang: " + (err.response?.data?.message || err.message));
          }
        }
      },
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSupplier) {
        await api.put(`/supplier/${editingSupplier.id}`, supplierForm);
        toast.success(`Data supplier "${supplierForm.name}" diperbarui!`);
      } else {
        await api.post("/supplier", supplierForm);
        toast.success(`Supplier "${supplierForm.name}" ditambahkan!`);
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
      action: {
        label: "Hapus",
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
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

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
        <Navbar title="Pengadaan & Supplier Management" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#e5c483] text-xs font-serif-luxury tracking-widest uppercase">
                <Truck size={16} /> Supply Chain Operations
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-slate-100 mt-1">
                Pengadaan EOQ & Vendor Relations
              </h1>
              <p className="text-slate-400 text-xs font-mono mt-1">
                Peramalan batch restock EOQ, monitoring ROP, penerbitan PO resmi, dan integrasi WhatsApp vendor.
              </p>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-[#060a14] p-1 rounded-2xl border border-[#c5a059]/30">
              <button
                onClick={() => setActiveTab("po")}
                className={`px-4 py-2 text-xs font-serif-luxury tracking-wider uppercase rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === "po"
                    ? "bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Package size={14} /> PO & Analisis EOQ
              </button>

              <button
                onClick={() => setActiveTab("supplier")}
                className={`px-4 py-2 text-xs font-serif-luxury tracking-wider uppercase rounded-xl transition flex items-center gap-1.5 ${
                  activeTab === "supplier"
                    ? "bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users size={14} /> Mitra Vendor ({suppliers.length})
              </button>
            </div>
          </div>

          {/* TAB 1: PURCHASE ORDERS */}
          {activeTab === "po" && (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row justify-between items-center gap-3">
                <button
                  onClick={handleRecalculateEOQ}
                  disabled={recalculating}
                  className="px-4 py-2 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-mono flex items-center gap-2 transition disabled:opacity-50"
                >
                  <BrainCircuit size={15} />
                  <span>{recalculating ? "Menganalisis Tren Transaksi..." : "Hitung Ulang EOQ & ROP Dinamis"}</span>
                </button>

                <button
                  onClick={() => setOpen(true)}
                  className={BTN_GOLD}
                >
                  <Plus size={15} /> Terbitkan PO Manual
                </button>
              </div>

              {/* Purchase Orders Table */}
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="px-5 py-2.5 bg-[#040812]/50 border-b border-[#c5a059]/20 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Daftar Pesanan Restock Supplier ({purchaseOrders.length})</span>
                  <span className="text-[10px] text-slate-500 xl:hidden flex items-center gap-1">
                    ↔ Geser horizontal untuk aksi lengkap
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-[#03060e]/60 text-[#e5c483] border-b border-[#c5a059]/30 font-serif-luxury uppercase tracking-wider text-[10px]">
                        <th className="p-3.5 pl-6">No. PO & Status</th>
                        <th className="p-3.5">Produk & Varian SKU</th>
                        <th className="p-3.5">Gudang Tujuan</th>
                        <th className="p-3.5 text-center">Jumlah Restock</th>
                        <th className="p-3.5 text-right">Total HPP Modal</th>
                        <th className="p-3.5">Vendor / Supplier</th>
                        <th className="p-3.5 text-center pr-6">Aksi Dispatch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c5a059]/10">
                      {loading ? (
                        <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">Memuat data pengadaan...</td></tr>
                      ) : purchaseOrders.length === 0 ? (
                        <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">Belum ada pesanan PO diterbitkan.</td></tr>
                      ) : (
                        purchaseOrders.map(po => {
                          const isSuggestion = (po.status === "Disarankan" || po.status === "SUGGESTION");
                          const isDone = po.status === "Selesai";

                          return (
                            <tr key={po.id} className={`hover:bg-[#14203d]/40 transition text-slate-200 ${isSuggestion ? 'bg-amber-950/10' : ''}`}>
                              <td className="p-3.5 pl-6">
                                <div className="font-bold text-[#e5c483]">{po.kode_po || `PO-${po.id.slice(0, 8)}`}</div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 ${
                                  isDone ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' :
                                  isSuggestion ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {po.status}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <div className="font-bold text-slate-100">{po.product_name}</div>
                                <div className="text-[10px] text-slate-400">{po.sku} • Sz {po.size} / {po.color}</div>
                              </td>
                              <td className="p-3.5 text-slate-300">{po.warehouse_name}</td>
                              <td className="p-3.5 text-center font-bold text-[#e5c483]">
                                <span className="px-2 py-0.5 bg-[#060a14] border border-[#c5a059]/20 rounded-lg">{po.qty} pcs</span>
                              </td>
                              <td className="p-3.5 text-right font-bold text-emerald-400">{fmt(po.total)}</td>
                              <td className="p-3.5 text-slate-300">{po.supplier || "Supplier Pusat"}</td>
                              <td className="p-3.5 pr-6 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleSendWhatsApp(po)}
                                    className="px-2.5 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                                    title="Kirim ke WhatsApp Vendor"
                                  >
                                    <MessageSquare size={12} /> WA PO
                                  </button>

                                  <button
                                    onClick={() => handleDownloadPdf(po.id, po.kode_po)}
                                    disabled={downloadingPdfId === po.id}
                                    className="px-2.5 py-1 bg-[#090e1c] hover:bg-[#141d33] border border-[#c5a059]/30 text-[#e5c483] rounded-lg text-[10px] flex items-center gap-1 transition disabled:opacity-50"
                                    title="Download PDF Resmi"
                                  >
                                    <FileText size={12} /> {downloadingPdfId === po.id ? "..." : "PDF"}
                                  </button>

                                  {(po.status === "Menunggu" || isSuggestion) && (
                                    <button
                                      onClick={() => handleReceivePO(po)}
                                      className="px-2.5 py-1 bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-serif-luxury font-bold rounded-lg text-[10px] flex items-center gap-1 transition"
                                      title="Konfirmasi Fisik Barang Tiba (Good Receipt)"
                                    >
                                      <CheckCircle2 size={12} /> Terima
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

          {/* TAB 2: MASTER DATA SUPPLIER */}
          {activeTab === "supplier" && (
            <div className="space-y-4">
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-serif-luxury font-bold text-[#e5c483] uppercase tracking-wider">Mitra Vendor & Manufaktur</h3>
                  <p className="text-xs text-slate-400 font-mono">Daftar kontak PIC, nomor WhatsApp, termin pembayaran, dan riwayat PO.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingSupplier(null);
                    setSupplierForm({ name: "", pic_name: "", phone: "", email: "", address: "", payment_terms: "NET 30" });
                    setIsSupplierModalOpen(true);
                  }}
                  className={BTN_GOLD}
                >
                  <Plus size={15} /> Tambah Vendor
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((s) => (
                  <div key={s.id} className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-3.5 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#c5a059]/20 text-[#e5c483] border border-[#c5a059]/30">
                          {s.payment_terms || "NET 30"}
                        </span>
                        <h4 className="text-base font-serif-luxury font-bold text-slate-100 mt-2">{s.name}</h4>
                        <div className="text-xs text-slate-400 font-mono">PIC: {s.pic_name || "-"}</div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingSupplier(s);
                            setSupplierForm({ name: s.name, pic_name: s.pic_name, phone: s.phone, email: s.email, address: s.address, payment_terms: s.payment_terms });
                            setIsSupplierModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#e5c483] rounded-lg hover:bg-[#141d33] transition"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s.id, s.name)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono text-slate-300 bg-[#060a14] p-3 rounded-2xl border border-[#c5a059]/20">
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-[#c5a059]" />
                        <span>{s.phone || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-[#38bdf8]" />
                        <span className="truncate">{s.email || "-"}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-rose-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-[11px] text-slate-400">{s.address || "-"}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#c5a059]/15 flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-400">Total Pengadaan:</span>
                      <span className="font-bold text-[#e5c483]">{s.total_po_count || 0} PO</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: TAMBAH/EDIT SUPPLIER */}
      {isSupplierModalOpen && (
        <LuxuryModal open={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title={editingSupplier ? "Edit Data Vendor" : "Pendaftaran Vendor Baru"}>
          <form onSubmit={handleSaveSupplier} className="space-y-3">
            <div>
              <label className={LABEL_CLS}>Nama Vendor / Pabrik *</label>
              <input type="text" required placeholder="PT. Mitra Manufaktur" value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} className={INPUT_CLS} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Nama PIC</label>
                <input type="text" placeholder="Bpk. Agus" value={supplierForm.pic_name} onChange={e => setSupplierForm({ ...supplierForm, pic_name: e.target.value })} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>WhatsApp *</label>
                <input type="text" required placeholder="628123456789" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} className={INPUT_CLS} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Email</label>
                <input type="email" placeholder="sales@vendor.com" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Termin Pembayaran</label>
                <select value={supplierForm.payment_terms} onChange={e => setSupplierForm({ ...supplierForm, payment_terms: e.target.value })} className={INPUT_CLS}>
                  <option value="NET 30">NET 30 Hari</option>
                  <option value="NET 60">NET 60 Hari</option>
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                  <option value="Tunai Dimuka">Tunai Dimuka (Prepaid)</option>
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL_CLS}>Alamat Lengkap</label>
              <textarea rows={2} placeholder="Alamat pabrik / workshop..." value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} className={INPUT_CLS} />
            </div>

            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setIsSupplierModalOpen(false)} className={`flex-1 ${BTN_DARK}`}>
                Batal
              </button>
              <button type="submit" disabled={saving} className={`flex-1 ${BTN_GOLD}`}>
                {saving ? "Menyimpan..." : "Simpan Vendor"}
              </button>
            </div>
          </form>
        </LuxuryModal>
      )}

      {/* MODAL 2: MANUAL PO */}
      {open && (
        <LuxuryModal open={open} onClose={() => setOpen(false)} title="Penerbitan Dokumen PO Manual">
          <div className="space-y-3">
            <div>
              <label className={LABEL_CLS}>Pilih Produk (Varian SKU) *</label>
              <select value={form.variant_id} onChange={e => setForm({ ...form, variant_id: e.target.value })} className={INPUT_CLS}>
                <option value="" disabled>-- Pilih Produk --</option>
                {variants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.product_name} - {v.sku} ({v.size}/{v.color}) - HPP: {fmt(v.price_buy)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Gudang Penerima *</label>
                <select value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value })} className={INPUT_CLS}>
                  <option value="" disabled>-- Pilih Gudang --</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Jumlah Pesanan (Qty) *</label>
                <input type="number" min="1" placeholder="50" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} className={INPUT_CLS} />
              </div>
            </div>

            <div>
              <label className={LABEL_CLS}>Pilih Mitra Supplier</label>
              <select value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className={INPUT_CLS}>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name} ({s.pic_name})</option>)}
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className={`flex-1 ${BTN_DARK}`}>
                Batal
              </button>
              <button type="button" onClick={handleCreate} disabled={saving} className={`flex-1 ${BTN_GOLD}`}>
                {saving ? "Menerbitkan..." : "Terbitkan PO"}
              </button>
            </div>
          </div>
        </LuxuryModal>
      )}

      {/* MODAL 3: HASIL REKALKULASI EOQ */}
      {recalcResult && (
        <LuxuryModal open={!!recalcResult} onClose={() => setRecalcResult(null)} title="Hasil Rekalkulasi EOQ & ROP Dinamis">
          <div className="space-y-4">
            <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl text-purple-200 text-xs font-mono space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-purple-300">
                <BrainCircuit size={15} /> Analisis Tren 30 Hari Selesai
              </div>
              <p className="text-[11px] text-slate-300">{recalcResult.message}</p>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-[#c5a059]/10 border border-[#c5a059]/20 rounded-xl">
              {recalcResult.details?.map((d: any, idx: number) => (
                <div key={idx} className="p-3 flex justify-between items-center hover:bg-[#14203d]/30 text-xs font-mono">
                  <div>
                    <div className="font-bold text-slate-100">{d.product_name}</div>
                    <div className="text-[10px] text-slate-400">{d.sku} • Demand: {d.avg_daily_demand} pcs/hari</div>
                  </div>
                  <span className="px-2 py-0.5 bg-[#060a14] text-[#e5c483] border border-[#c5a059]/30 rounded text-[11px] font-bold">
                    ROP: {d.new_rop} | EOQ: {d.new_eoq}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setRecalcResult(null)} className={BTN_GOLD}>
                Selesai
              </button>
            </div>
          </div>
        </LuxuryModal>
      )}
    </div>
  );
}
