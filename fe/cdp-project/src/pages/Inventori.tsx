import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../api/axios";
import shoeLuxuryEmblem from "../assets/shoe_luxury_emblem.jpg";
import footwearLuxuryBg from "../assets/footwear_luxury_bg.jpg";
import { PackageSearch, MapPin, ArrowRightLeft, X, Printer, FileText, Truck, Building2, Layers } from "lucide-react";
import { toast } from "sonner";

const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

const INPUT_CLS = "w-full px-3 py-2 bg-[#060a14] border border-[#c5a059]/30 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-[#c5a059] outline-none transition";
const LABEL_CLS = "block text-[10px] font-mono text-[#e5c483] uppercase tracking-wider mb-1";
const BTN_GOLD = "px-3.5 py-2 bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] text-[#070b14] font-serif-luxury font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-1.5";
const BTN_DARK = "px-3.5 py-2 bg-[#090e1c]/70 hover:bg-[#141d33] border border-[#c5a059]/30 text-slate-200 hover:text-[#e5c483] rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5";

export default function Inventori() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedW, setSelectedW] = useState<string>("");
  const [inventory, setInventory] = useState<any[]>([]);

  // Modal Transfer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    to_warehouse_id: "",
    variant_id: "",
    qty: 0,
  });
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState<any>(null);

  // Modal Opname
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  const [opnameForm, setOpnameForm] = useState({
    variant_id: "",
    actual_qty: 0,
    reason: "",
  });
  const [loadingOpname, setLoadingOpname] = useState(false);
  const [opnameError, setOpnameError] = useState("");

  const [activeTab, setActiveTab] = useState<"stok" | "mutasi" | "opname">("stok");
  const [transfers, setTransfers] = useState<any[]>([]);
  const [opnames, setOpnames] = useState<any[]>([]);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedW) fetchInventory(selectedW);
  }, [selectedW]);

  useEffect(() => {
    if (activeTab === "mutasi") fetchTransfers();
    else if (activeTab === "opname") fetchOpnames(selectedW);
  }, [activeTab, selectedW]);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get("/master/warehouses");
      setWarehouses(res.data);
      if (res.data.length > 0) setSelectedW(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventory = async (wid: string) => {
    try {
      const res = await api.get(`/master/inventory/${wid}`);
      setInventory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransfers = async () => {
    try {
      const res = await api.get("/master/transfers");
      setTransfers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOpnames = async (wid: string) => {
    try {
      const res = await api.get(wid ? `/opname?warehouse_id=${wid}` : "/opname");
      setOpnames(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError("");
    setLoadingTransfer(true);
    try {
      const res = await api.post("/master/transfers", {
        source_warehouse_id: selectedW,
        destination_warehouse_id: transferForm.to_warehouse_id,
        variant_id: transferForm.variant_id,
        qty: Number(transferForm.qty)
      });
      toast.success(res.data.message || "Surat jalan transfer berhasil diterbitkan!");
      setIsModalOpen(false);
      fetchInventory(selectedW);
      fetchTransfers();
      setTransferForm({ to_warehouse_id: "", variant_id: "", qty: 0 });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal mutasi stok";
      setTransferError(msg);
      toast.error(msg);
    } finally {
      setLoadingTransfer(false);
    }
  };

  const handleReceiveTransfer = (trfId: string, trfNo: string) => {
    toast.warning(`Konfirmasi penerimaan barang ${trfNo}?`, {
      description: "Stok cabang penerima akan otomatis bertambah saat diterima.",
      action: {
        label: "Terima",
        onClick: async () => {
          try {
            const res = await api.put(`/master/transfers/${trfId}/receive`);
            toast.success(res.data.message || "Penerimaan barang berhasil dikonfirmasi!");
            fetchTransfers();
            if (selectedW) fetchInventory(selectedW);
          } catch (err: any) {
            toast.error("Gagal konfirmasi: " + (err.response?.data?.message || err.message));
          }
        }
      },
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

  const handleCancelTransfer = (trfId: string, trfNo: string) => {
    toast.error(`Batalkan transfer ${trfNo}?`, {
      description: "Barang akan dikembalikan ke stok gudang asal.",
      action: {
        label: "Batalkan",
        onClick: async () => {
          try {
            const res = await api.put(`/master/transfers/${trfId}/cancel`);
            toast.success(res.data.message || "Transfer berhasil dibatalkan");
            fetchTransfers();
            if (selectedW) fetchInventory(selectedW);
          } catch (err: any) {
            toast.error("Gagal membatalkan: " + (err.response?.data?.message || err.message));
          }
        }
      },
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

  const handleOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpnameError("");
    setLoadingOpname(true);
    try {
      const res = await api.post("/opname", {
        warehouse_id: selectedW,
        variant_id: opnameForm.variant_id,
        actual_qty: Number(opnameForm.actual_qty),
        reason: opnameForm.reason
      });
      toast.success(`Stock Opname tersimpan! Selisih: ${res.data.difference > 0 ? `+${res.data.difference}` : res.data.difference}`);
      setIsOpnameModalOpen(false);
      fetchInventory(selectedW);
      fetchOpnames(selectedW);
      setOpnameForm({ variant_id: "", actual_qty: 0, reason: "" });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Gagal melakukan opname";
      setOpnameError(msg);
      toast.error(msg);
    } finally {
      setLoadingOpname(false);
    }
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
        <Navbar title="Inventori & Warehouse Management" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#e5c483] text-xs font-serif-luxury tracking-widest uppercase">
                <Building2 size={16} /> Multi-Warehouse Logistics
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-slate-100 mt-1">
                Sistem Manajemen Gudang & Stok Fisik
              </h1>
              <p className="text-slate-400 text-xs font-mono mt-1">
                Kontrol stok fisik per cabang toko, surat jalan mutasi otomatis, dan rekonsiliasi stock opname.
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#060a14] p-1 rounded-2xl border border-[#c5a059]/30">
              <button
                onClick={() => setActiveTab("stok")}
                className={`px-4 py-2 text-xs font-serif-luxury tracking-wider uppercase rounded-xl transition ${
                  activeTab === 'stok' 
                    ? 'bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stok Gudang
              </button>
              <button
                onClick={() => setActiveTab("mutasi")}
                className={`px-4 py-2 text-xs font-serif-luxury tracking-wider uppercase rounded-xl transition ${
                  activeTab === 'mutasi' 
                    ? 'bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Riwayat Mutasi
              </button>
              <button
                onClick={() => setActiveTab("opname")}
                className={`px-4 py-2 text-xs font-serif-luxury tracking-wider uppercase rounded-xl transition ${
                  activeTab === 'opname' 
                    ? 'bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stock Opname
              </button>
            </div>
          </div>

          {/* TAB 1: STOK GUDANG */}
          {activeTab === "stok" && (
            <div className="space-y-4">
              {/* Warehouse Selector & Action Toolbar */}
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2.5 text-slate-200 w-full sm:w-auto">
                  <MapPin size={17} className="text-[#e5c483]" />
                  <span className="text-xs font-serif-luxury uppercase tracking-wider text-[#e5c483]">Cabang Gudang:</span>
                  <select 
                    className="bg-[#060a14] border border-[#c5a059]/30 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-100 outline-none focus:border-[#c5a059]"
                    value={selectedW}
                    onChange={e => setSelectedW(e.target.value)}
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button 
                    onClick={() => setIsOpnameModalOpen(true)}
                    className={BTN_DARK}
                  >
                    <PackageSearch size={14} className="text-[#e5c483]" />
                    <span>Lakukan Opname</span>
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className={BTN_GOLD}
                  >
                    <ArrowRightLeft size={14} />
                    <span>Mutasi Stok</span>
                  </button>
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-[#03060e]/60 text-[#e5c483] border-b border-[#c5a059]/30 font-serif-luxury uppercase tracking-wider text-[10px]">
                        <th className="p-3.5 pl-6">Varian Produk</th>
                        <th className="p-3.5">Harga Jual</th>
                        <th className="p-3.5 text-center">Stok Fisik</th>
                        <th className="p-3.5 text-center">Teknik Buffer (EOQ / ROP)</th>
                        <th className="p-3.5 text-center pr-6">Status Buffer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c5a059]/10">
                      {inventory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 font-mono text-xs">
                            Belum ada stok barang terdaftar di cabang ini.
                          </td>
                        </tr>
                      ) : inventory.map((i) => (
                        <tr key={i.id} className="hover:bg-[#14203d]/40 transition text-slate-200">
                          <td className="p-3.5 pl-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0a0f1d] border border-[#c5a059]/40 flex-shrink-0 flex items-center justify-center">
                                <img 
                                  src={i.image_url || shoeLuxuryEmblem} 
                                  alt={i.product_name}
                                  onError={(e) => { (e.target as HTMLImageElement).src = shoeLuxuryEmblem; }}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-serif-luxury font-bold text-slate-100 text-sm">{i.product_name}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{i.color} • Sz {i.size}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-emerald-400">{fmt(i.price_sell)}</td>
                          <td className="p-3.5 text-center text-lg font-bold text-[#e5c483]">
                            {i.qty}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-3 px-3 py-1 bg-[#060a14] border border-[#c5a059]/20 rounded-xl text-[11px]">
                              <span>EOQ: <strong className="text-slate-100">{i.eoq}</strong></span>
                              <span className="text-[#c5a059]">•</span>
                              <span>ROP: <strong className="text-slate-100">{i.rop}</strong></span>
                            </div>
                          </td>
                          <td className="p-3.5 text-center pr-6">
                            {i.qty <= i.rop ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40">
                                Re-Stock Diperlukan
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                                Stok Aman
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RIWAYAT MUTASI */}
          {activeTab === "mutasi" && (
            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-serif-luxury font-bold text-[#e5c483]">Riwayat Mutasi Antar Gudang</h2>
                  <p className="text-xs text-slate-400 font-mono">Log pengiriman stok antar cabang dan penerbitan Surat Jalan resmi.</p>
                </div>
                <button
                  onClick={() => {
                    if (!selectedW && warehouses.length > 0) setSelectedW(warehouses[0].id);
                    setIsModalOpen(true);
                  }}
                  className={BTN_GOLD}
                >
                  <ArrowRightLeft size={14} />
                  <span>Transfer Stok Baru</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#c5a059]/20">
                <table className="w-full min-w-[800px] text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-[#03060e]/60 text-[#e5c483] border-b border-[#c5a059]/30 font-serif-luxury uppercase tracking-wider text-[10px]">
                      <th className="p-3.5 pl-6">No. SJ & Waktu</th>
                      <th className="p-3.5">Produk & SKU</th>
                      <th className="p-3.5">Asal</th>
                      <th className="p-3.5">Tujuan</th>
                      <th className="p-3.5 text-center">Qty</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center pr-6">Aksi & Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c5a059]/10">
                    {transfers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">Belum ada riwayat mutasi stok.</td>
                      </tr>
                    ) : transfers.map((t) => {
                      const isInTransit = t.status === "IN_TRANSIT";
                      const isReceived = t.status === "RECEIVED";
                      const isCancelled = t.status === "CANCELLED";

                      return (
                        <tr key={t.id} className="hover:bg-[#14203d]/40 transition text-slate-200">
                          <td className="p-3.5 pl-6">
                            <div className="font-bold text-[#e5c483]">{t.transfer_no || `TRF-${t.id.slice(0, 6)}`}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(t.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-100">{t.product_name}</div>
                            <div className="text-[10px] text-slate-400">{t.color} • Sz {t.size} ({t.sku})</div>
                          </td>
                          <td className="p-3.5 text-slate-300">{t.source_warehouse_name || t.from_warehouse}</td>
                          <td className="p-3.5 text-slate-300">{t.destination_warehouse_name || t.to_warehouse}</td>
                          <td className="p-3.5 text-center font-bold text-[#e5c483]">
                            <span className="px-2 py-0.5 bg-[#060a14] border border-[#c5a059]/20 rounded-lg">{t.qty} pcs</span>
                          </td>
                          <td className="p-3.5 text-center">
                            {isInTransit ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 animate-pulse">
                                In-Transit
                              </span>
                            ) : isReceived ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                                Diterima
                              </span>
                            ) : isCancelled ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40">
                                Dibatalkan
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200">
                                {t.status}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center pr-6">
                            <div className="flex items-center justify-center gap-1.5">
                              {isInTransit && (
                                <>
                                  <button
                                    onClick={() => handleReceiveTransfer(t.id, t.transfer_no || t.id.slice(0, 6))}
                                    className="px-2 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition"
                                    title="Konfirmasi Barang Tiba"
                                  >
                                    Terima
                                  </button>
                                  <button
                                    onClick={() => handleCancelTransfer(t.id, t.transfer_no || t.id.slice(0, 6))}
                                    className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 rounded-lg text-[10px] transition"
                                    title="Batalkan"
                                  >
                                    Batal
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setSelectedDeliveryNote(t)}
                                className="px-2.5 py-1 bg-[#090e1c] hover:bg-[#141d33] border border-[#c5a059]/30 text-[#e5c483] rounded-lg text-[10px] flex items-center gap-1 transition"
                                title="Lihat Surat Jalan"
                              >
                                <FileText size={11} /> Surat Jalan
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: STOCK OPNAME */}
          {activeTab === "opname" && (
            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-serif-luxury font-bold text-[#e5c483]">Riwayat Stock Opname (Audit Fisik)</h2>
                  <p className="text-xs text-slate-400 font-mono">Log rekonsiliasi stok sistem dengan hasil hitung fisik di rak gudang.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    className="bg-[#060a14] border border-[#c5a059]/30 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-100 outline-none focus:border-[#c5a059]"
                    value={selectedW}
                    onChange={e => setSelectedW(e.target.value)}
                  >
                    <option value="">Semua Gudang</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <button 
                    onClick={() => setIsOpnameModalOpen(true)}
                    className={BTN_GOLD}
                  >
                    <PackageSearch size={14} />
                    <span>Lakukan Opname</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#c5a059]/20">
                <table className="w-full min-w-[850px] text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-[#03060e]/60 text-[#e5c483] border-b border-[#c5a059]/30 font-serif-luxury uppercase tracking-wider text-[10px]">
                      <th className="p-3.5 pl-6">Tanggal & Jam</th>
                      <th className="p-3.5">Gudang</th>
                      <th className="p-3.5">Produk & SKU</th>
                      <th className="p-3.5 text-center">Sistem</th>
                      <th className="p-3.5 text-center">Fisik</th>
                      <th className="p-3.5 text-center">Selisih</th>
                      <th className="p-3.5">Catatan / Alasan</th>
                      <th className="p-3.5 pr-6">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c5a059]/10">
                    {opnames.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 font-mono text-xs">Belum ada riwayat stock opname.</td>
                      </tr>
                    ) : opnames.map((o) => (
                      <tr key={o.id} className="hover:bg-[#14203d]/40 transition text-slate-200">
                        <td className="p-3.5 pl-6 text-slate-400 whitespace-nowrap">
                          {new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="p-3.5 text-[#e5c483] font-bold">
                          {o.warehouse_name || warehouses.find(w => w.id === o.warehouse_id)?.name || "-"}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-100">{o.product_name}</div>
                          <div className="text-[10px] text-slate-400">SKU: {o.sku} {o.color ? `• ${o.color}` : ''} {o.size ? `• ${o.size}` : ''}</div>
                        </td>
                        <td className="p-3.5 text-center text-slate-400 font-bold">{o.expected_qty}</td>
                        <td className="p-3.5 text-center font-bold text-slate-100 text-sm">{o.actual_qty}</td>
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            o.difference < 0 ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40' :
                            o.difference > 0 ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' :
                            'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {o.difference > 0 ? `+${o.difference}` : o.difference}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400 max-w-xs truncate">{o.reason || "-"}</td>
                        <td className="p-3.5 pr-6 text-slate-400 text-[11px]">{o.created_by_name || "Admin"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL MUTASI STOK */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#090e1c] rounded-3xl p-6 w-full max-w-md border border-[#c5a059]/40 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#c5a059]/20 pb-3">
              <h2 className="text-sm font-serif-luxury uppercase tracking-wider text-[#e5c483] font-bold">Mutasi Stok Antar Cabang</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            {transferError && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono rounded-xl">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-3">
              <div>
                <label className={LABEL_CLS}>Cabang Gudang Asal</label>
                <div className="px-3 py-2 bg-[#060a14] border border-[#c5a059]/20 rounded-xl text-xs font-mono text-[#e5c483] font-bold">
                  {warehouses.find(w => w.id === selectedW)?.name}
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>Pilih Koleksi Produk (Varian)</label>
                <select
                  required
                  value={transferForm.variant_id}
                  onChange={(e) => setTransferForm({ ...transferForm, variant_id: e.target.value })}
                  className={INPUT_CLS}
                >
                  <option value="">-- Pilih Varian Tersedia --</option>
                  {inventory.filter(i => i.qty > 0).map((i) => (
                    <option key={i.variant_id} value={i.variant_id}>
                      {i.product_name} ({i.color} - Sz {i.size}) - Stok: {i.qty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>Kuantitas Transfer (Qty)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transferForm.qty || ""}
                  onChange={(e) => setTransferForm({ ...transferForm, qty: Number(e.target.value) })}
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Cabang Gudang Tujuan</label>
                <select
                  required
                  value={transferForm.to_warehouse_id}
                  onChange={(e) => setTransferForm({ ...transferForm, to_warehouse_id: e.target.value })}
                  className={INPUT_CLS}
                >
                  <option value="">-- Pilih Cabang Tujuan --</option>
                  {warehouses.filter(w => w.id !== selectedW).map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 ${BTN_DARK}`}>
                  Batal
                </button>
                <button type="submit" disabled={loadingTransfer} className={`flex-1 ${BTN_GOLD}`}>
                  {loadingTransfer ? "Memproses..." : "Terbitkan SJ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL STOCK OPNAME */}
      {isOpnameModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#090e1c] rounded-3xl p-6 w-full max-w-md border border-[#c5a059]/40 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#c5a059]/20 pb-3">
              <h2 className="text-sm font-serif-luxury uppercase tracking-wider text-[#e5c483] font-bold">Stock Opname Fisik</h2>
              <button onClick={() => setIsOpnameModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            {opnameError && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono rounded-xl">
                {opnameError}
              </div>
            )}

            <form onSubmit={handleOpname} className="space-y-3">
              <div>
                <label className={LABEL_CLS}>Lokasi Gudang</label>
                <div className="px-3 py-2 bg-[#060a14] border border-[#c5a059]/20 rounded-xl text-xs font-mono text-[#e5c483] font-bold">
                  {warehouses.find(w => w.id === selectedW)?.name}
                </div>
              </div>

              <div>
                <label className={LABEL_CLS}>Pilih Koleksi Produk (Varian)</label>
                <select
                  required
                  value={opnameForm.variant_id}
                  onChange={(e) => setOpnameForm({ ...opnameForm, variant_id: e.target.value })}
                  className={INPUT_CLS}
                >
                  <option value="">-- Pilih Varian --</option>
                  {inventory.map((i) => (
                    <option key={i.variant_id} value={i.variant_id}>
                      {i.product_name} ({i.color} - Sz {i.size})
                    </option>
                  ))}
                </select>
              </div>

              {opnameForm.variant_id && (
                <div className="p-3 bg-[#060a14] border border-[#c5a059]/30 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-mono text-slate-400">Stok Sistem Saat Ini:</span>
                  <span className="text-lg font-mono font-bold text-[#e5c483]">
                    {inventory.find(i => i.variant_id === opnameForm.variant_id)?.qty || 0}
                  </span>
                </div>
              )}

              <div>
                <label className={LABEL_CLS}>Hasil Hitung Fisik Riil</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={opnameForm.actual_qty === 0 && opnameForm.variant_id === "" ? "" : opnameForm.actual_qty}
                  onChange={(e) => setOpnameForm({ ...opnameForm, actual_qty: Number(e.target.value) })}
                  className={`${INPUT_CLS} text-base font-bold text-center text-[#e5c483]`}
                  placeholder="0"
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Catatan / Keterangan (Opsional)</label>
                <input
                  type="text"
                  value={opnameForm.reason}
                  onChange={(e) => setOpnameForm({ ...opnameForm, reason: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Misal: Barang display cacat / selisih perhitungan"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsOpnameModalOpen(false)} className={`flex-1 ${BTN_DARK}`}>
                  Batal
                </button>
                <button type="submit" disabled={loadingOpname} className={`flex-1 ${BTN_GOLD}`}>
                  {loadingOpname ? "Menyimpan..." : "Simpan Opname"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SURAT JALAN */}
      {selectedDeliveryNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#090e1c] border border-[#c5a059]/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#c5a059]/20 flex items-center justify-between">
              <h3 className="font-serif-luxury font-bold text-sm text-[#e5c483] flex items-center gap-2 uppercase tracking-wider">
                <Truck size={16} /> Dokumen Surat Jalan Resmi
              </h3>
              <button onClick={() => setSelectedDeliveryNote(null)} className="text-slate-400 hover:text-slate-200">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div id="print-surat-jalan" className="p-5 border border-[#c5a059]/30 rounded-2xl space-y-4 bg-white text-slate-900 text-xs font-mono shadow-inner">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-base font-serif-luxury font-extrabold text-slate-900">SURAT JALAN PENGIRIMAN</h2>
                    <p className="text-[10px] text-slate-500 font-mono">No. SJ: SJ-{selectedDeliveryNote.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-600">
                    <p>Tanggal: {new Date(selectedDeliveryNote.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                    <p>Status: <strong>{selectedDeliveryNote.status}</strong></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-slate-700 text-[11px] pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Gudang Pengirim</span>
                    <p className="font-bold text-slate-900">{selectedDeliveryNote.source_warehouse_name || selectedDeliveryNote.from_warehouse}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Gudang Penerima</span>
                    <p className="font-bold text-slate-900">{selectedDeliveryNote.destination_warehouse_name || selectedDeliveryNote.to_warehouse}</p>
                  </div>
                </div>

                <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2 border-b">Produk</th>
                      <th className="p-2 border-b">SKU</th>
                      <th className="p-2 border-b text-center">Ukuran</th>
                      <th className="p-2 border-b text-center">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 font-bold">{selectedDeliveryNote.product_name}</td>
                      <td className="p-2">{selectedDeliveryNote.sku}</td>
                      <td className="p-2 text-center">{selectedDeliveryNote.size}</td>
                      <td className="p-2 text-center font-bold text-slate-900">{selectedDeliveryNote.qty} pcs</td>
                    </tr>
                  </tbody>
                </table>

                <div className="grid grid-cols-3 gap-2 pt-6 text-center text-[10px] text-slate-600">
                  <div className="border-t border-slate-300 pt-1">Pengirim (Gudang Asal)</div>
                  <div className="border-t border-slate-300 pt-1">Driver / Ekspedisi</div>
                  <div className="border-t border-slate-300 pt-1">Penerima (Cabang Tujuan)</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setSelectedDeliveryNote(null)} className={BTN_DARK}>
                  Tutup
                </button>
                <button onClick={() => window.print()} className={BTN_GOLD}>
                  <Printer size={14} /> Cetak Surat Jalan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
