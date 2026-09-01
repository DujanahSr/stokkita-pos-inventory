import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Modal from "../components/ui/Modal";
import api from "../api/axios";
import { toast } from "sonner";
import { 
  Ticket, Plus, Trash2, Tag, Calendar, Percent, 
  DollarSign, CheckCircle2, AlertCircle, Sparkles, Search 
} from "lucide-react";

const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

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
      toast.error("Gagal memuat daftar voucher: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.warning("Kode voucher wajib diisi!");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/vouchers", form);
      toast.success(res.data.message || "Voucher berhasil dibuat!");
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
      description: "Voucher ini tidak akan bisa digunakan lagi oleh kasir.",
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
      cancel: {
        label: "Batal",
        onClick: () => {}
      }
    });
  };

  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Manajemen Kupon & Promo" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800">
                  <Ticket className="text-emerald-600" size={32} />
                  Kupon & Voucher Diskon
                </h1>
                <p className="text-slate-500 mt-1">Buat kode voucher promo untuk promosi toko dan kasir POS</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition shadow-sm"
                >
                  <Plus size={16} /> Buat Voucher Baru
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <Search className="text-slate-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari kode voucher..."
                className="w-full text-sm outline-none text-slate-800"
              />
            </div>

            {/* Voucher Cards Grid */}
            {loading ? (
              <div className="py-12 text-center text-slate-400">Memuat daftar voucher...</div>
            ) : filteredVouchers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                <Ticket className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="font-bold text-slate-700">Belum ada voucher diskon</p>
                <p className="text-xs text-slate-400 mt-1">Klik tombol "+ Buat Voucher Baru" di atas untuk menambah kupon promo</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVouchers.map(v => {
                  const isExpired = v.valid_until && new Date(v.valid_until) < new Date();
                  const isQuotaExceeded = v.quota > 0 && v.used_count >= v.quota;

                  return (
                    <div 
                      key={v.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* Top Banner Tag */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-lg text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 tracking-wider">
                              {v.code}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isExpired 
                                ? "bg-red-100 text-red-800"
                                : isQuotaExceeded
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}>
                              {isExpired ? "Kedaluwarsa" : isQuotaExceeded ? "Kuota Habis" : "Aktif"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1.5 font-medium">
                            Diskon: <strong className="text-slate-800">{v.type === 'PERCENT' ? `${v.discount_value}%` : fmt(v.discount_value)}</strong>
                            {v.type === 'PERCENT' && v.max_discount > 0 && ` (Maks. ${fmt(v.max_discount)})`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteVoucher(v.id, v.code)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                          title="Hapus voucher"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Terms & Usage */}
                      <div className="space-y-1.5 py-3 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Min. Belanja:</span>
                          <strong className="text-slate-800">{v.min_spend > 0 ? fmt(v.min_spend) : 'Tanpa Syarat'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Terpakai:</span>
                          <span className="font-semibold text-slate-700">{v.used_count} / {v.quota > 0 ? `${v.quota} kali` : 'Unlimited'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Masa Berlaku:</span>
                          <span className="text-slate-700">
                            {v.valid_until ? new Date(v.valid_until).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : 'Selamanya'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Modal Buat Voucher */}
      {isModalOpen && (
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Voucher Promo Baru">
          <form onSubmit={handleCreateVoucher} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode Voucher (Huruf Besar & Angka)</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Misal: PROMOSEPATU10"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold uppercase text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Diskon</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="PERCENT">Persentase (%)</option>
                  <option value="FIXED">Nominal Tetap (Rp)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {form.type === "PERCENT" ? "Nilai Diskon (%)" : "Nominal Diskon (Rp)"}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.discount_value}
                  onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Minimal Belanja (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={form.min_spend}
                  onChange={e => setForm({ ...form, min_spend: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Maksimal Diskon (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={form.max_discount}
                  onChange={e => setForm({ ...form, max_discount: Number(e.target.value) })}
                  placeholder="0 jika tanpa batas"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kuota Penggunaan</label>
                <input
                  type="number"
                  min="1"
                  value={form.quota}
                  onChange={e => setForm({ ...form, quota: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Berlaku Sampai Tanggal</label>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={e => setForm({ ...form, valid_until: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Buat Voucher"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
