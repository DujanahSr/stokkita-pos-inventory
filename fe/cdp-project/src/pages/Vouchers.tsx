import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Modal from "../components/ui/Modal";
import api from "../api/axios";
import footwearLuxuryBg from "../assets/footwear_luxury_bg.jpg";
import { toast } from "sonner";
import { Ticket, Plus, Trash2, Search } from "lucide-react";

const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

const INPUT_CLS = "w-full px-3 py-2 bg-[#060a14] border border-[#c5a059]/30 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-[#c5a059] outline-none transition";
const LABEL_CLS = "block text-[10px] font-mono text-[#e5c483] uppercase tracking-wider mb-1";
const BTN_GOLD = "px-3.5 py-2 bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] text-[#070b14] font-serif-luxury font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-1.5";
const BTN_DARK = "px-3.5 py-2 bg-[#090e1c]/70 hover:bg-[#141d33] border border-[#c5a059]/30 text-slate-200 hover:text-[#e5c483] rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5";

export default function Vouchers() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    code: "",
    type: "PERCENT",
    discount_value: 10,
    min_spend: 100000,
    max_discount: 50000,
    quota: 100,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/vouchers");
      setVouchers(res.data);
    } catch (err: any) {
      toast.error("Gagal memuat voucher: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.warning("Kode voucher wajib diisi!");
    setSaving(true);
    try {
      const res = await api.post("/vouchers", form);
      toast.success(res.data.message || "Voucher berhasil diterbitkan!");
      setIsModalOpen(false);
      setForm({
        code: "",
        type: "PERCENT",
        discount_value: 10,
        min_spend: 100000,
        max_discount: 50000,
        quota: 100,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      });
      loadVouchers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal membuat voucher");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVoucher = (id: string, code: string) => {
    toast.error(`Hapus voucher promo "${code}"?`, {
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await api.delete(`/vouchers/${id}`);
            toast.success(`Voucher "${code}" berhasil dihapus`);
            loadVouchers();
          } catch (err: any) {
            toast.error("Gagal menghapus voucher: " + (err.response?.data?.message || err.message));
          }
        }
      },
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(search.toLowerCase())
  );

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
        <Navbar title="Manajemen Kupon & Promo" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#e5c483] text-xs font-serif-luxury tracking-widest uppercase">
                <Ticket size={16} /> Exclusive Privileges & Promos
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-slate-100 mt-1">
                Kupon Diskon & Voucher Promo
              </h1>
              <p className="text-slate-400 text-xs font-mono mt-1">
                Penerbitan kode promo eksklusif untuk promosi toko dan kasir POS.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={BTN_GOLD}
            >
              <Plus size={15} /> Buat Kupon Baru
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex items-center gap-3">
            <Search className="text-[#c5a059]" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari kode kupon..."
              className="bg-transparent w-full text-xs font-mono text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          {/* Voucher Cards Grid */}
          {loading ? (
            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-16 text-center text-slate-400 font-mono text-xs">
              Memuat katalog voucher...
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-16 text-center text-slate-400 font-mono text-xs space-y-2">
              <Ticket className="mx-auto text-[#c5a059]/50 mb-2" size={40} />
              <p className="font-bold text-slate-200">Belum ada voucher diskon</p>
              <p className="text-[11px] text-slate-500">Klik tombol "+ Buat Kupon Baru" untuk menambah promo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVouchers.map(v => {
                const isExpired = v.valid_until && new Date(v.valid_until) < new Date();
                const isQuotaExceeded = v.quota > 0 && v.used_count >= v.quota;

                return (
                  <div 
                    key={v.id}
                    className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between transition"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-base text-[#e5c483] bg-[#060a14] px-3 py-1 rounded-xl border border-[#c5a059]/40 tracking-wider">
                              {v.code}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isExpired 
                                ? "bg-rose-950/60 text-rose-300 border border-rose-500/40"
                                : isQuotaExceeded
                                ? "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                                : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                            }`}>
                              {isExpired ? "Kedaluwarsa" : isQuotaExceeded ? "Kuota Habis" : "Aktif"}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-300 mt-2">
                            Diskon: <strong className="text-[#e5c483]">{v.type === 'PERCENT' ? `${v.discount_value}%` : fmt(v.discount_value)}</strong>
                            {v.type === 'PERCENT' && v.max_discount > 0 && ` (Maks. ${fmt(v.max_discount)})`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteVoucher(v.id, v.code)}
                          className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/40 transition"
                          title="Hapus voucher"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="space-y-1.5 py-3 border-t border-[#c5a059]/15 text-xs font-mono text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Min. Belanja:</span>
                          <strong className="text-slate-100">{v.min_spend > 0 ? fmt(v.min_spend) : 'Tanpa Syarat'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Terpakai:</span>
                          <span className="font-bold text-[#e5c483]">{v.used_count} / {v.quota > 0 ? `${v.quota} kali` : 'Unlimited'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Masa Berlaku:</span>
                          <span className="text-slate-300">
                            {v.valid_until ? new Date(v.valid_until).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : 'Selamanya'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal Buat Voucher */}
      {isModalOpen && (
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Penerbitan Kupon Promo Baru">
          <form onSubmit={handleCreateVoucher} className="space-y-3">
            <div>
              <label className={LABEL_CLS}>Kode Kupon (Huruf Besar & Angka)</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Misal: ATELIER10"
                className={`${INPUT_CLS} uppercase font-bold tracking-widest`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Tipe Diskon</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className={INPUT_CLS}
                >
                  <option value="PERCENT">Persentase (%)</option>
                  <option value="FIXED">Nominal Tetap (Rp)</option>
                </select>
              </div>

              <div>
                <label className={LABEL_CLS}>
                  {form.type === "PERCENT" ? "Nilai Diskon (%)" : "Nominal Diskon (Rp)"}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.discount_value}
                  onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Minimal Belanja (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={form.min_spend}
                  onChange={e => setForm({ ...form, min_spend: Number(e.target.value) })}
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Maksimal Diskon (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={form.max_discount}
                  onChange={e => setForm({ ...form, max_discount: Number(e.target.value) })}
                  placeholder="0 jika tanpa batas"
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Kuota Penggunaan</label>
                <input
                  type="number"
                  min="1"
                  value={form.quota}
                  onChange={e => setForm({ ...form, quota: Number(e.target.value) })}
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Berlaku Sampai Tanggal</label>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={e => setForm({ ...form, valid_until: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 ${BTN_DARK}`}>
                Batal
              </button>
              <button type="submit" disabled={saving} className={`flex-1 ${BTN_GOLD}`}>
                {saving ? "Menyimpan..." : "Terbitkan Kupon"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
