import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../api/axios";
import { toast } from "sonner";
import { 
  Store, Save, Printer, Phone, MapPin, 
  Globe, MessageSquare, ShieldCheck, Sparkles 
} from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    store_name: "StokKita Shoes Store",
    slogan: "Platform Manajemen Inventory & Kasir Sepatu",
    phone: "081234567890",
    address: "Mall Grand Indonesia Lt. 3 Unit 45, Jakarta Pusat",
    receipt_header: "Terima Kasih Atas Kunjungan Anda!",
    receipt_footer: "Barang yang sudah dibeli dapat ditukar maksimal 3 hari dengan menyertakan struk ini. Follow IG @stokkita_official",
    instagram: "@stokkita_official"
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/settings");
      if (res.data) {
        setForm({
          store_name: res.data.store_name || "StokKita Store",
          slogan: res.data.slogan || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
          receipt_header: res.data.receipt_header || "",
          receipt_footer: res.data.receipt_footer || "",
          instagram: res.data.instagram || ""
        });
      }
    } catch (err: any) {
      toast.error("Gagal memuat pengaturan toko: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/settings", form);
      toast.success(res.data.message || "Pengaturan berhasil disimpan!");
    } catch (err: any) {
      toast.error("Gagal menyimpan pengaturan: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Pengaturan Toko & Struk Kasir" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800">
                <Store className="text-emerald-600" size={32} />
                Pengaturan Profil & Struk Thermal
              </h1>
              <p className="text-slate-500 mt-1">Kustomisasi identitas toko, nomor kontak, header, dan pesan footer struk kasir</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Input (7 cols) */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleSave} className="space-y-4">
                  <h2 className="text-base font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <Store size={18} className="text-emerald-600" />
                    Profil Identitas Toko
                  </h2>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Brand / Toko</label>
                    <input
                      type="text"
                      required
                      value={form.store_name}
                      onChange={e => setForm({ ...form, store_name: e.target.value })}
                      placeholder="Misal: StokKita Footwear"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Slogan Toko</label>
                    <input
                      type="text"
                      value={form.slogan}
                      onChange={e => setForm({ ...form, slogan: e.target.value })}
                      placeholder="Misal: Pusat Sepatu Original & Sneakers Terlengkap"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">No. Telepon / WhatsApp CS</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="0812-3456-7890"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Akun Instagram Toko</label>
                      <input
                        type="text"
                        value={form.instagram}
                        onChange={e => setForm({ ...form, instagram: e.target.value })}
                        placeholder="@stokkita_official"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Fisik Toko</label>
                    <textarea
                      rows={2}
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="Alamat toko yang akan tercetak di bagian atas struk kasir..."
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <h2 className="text-base font-bold text-slate-800 border-b pb-2 pt-2 flex items-center gap-2">
                    <Printer size={18} className="text-emerald-600" />
                    Kustomisasi Struk Thermal Kasir
                  </h2>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Header Struk (Opsional)</label>
                    <input
                      type="text"
                      value={form.receipt_header}
                      onChange={e => setForm({ ...form, receipt_header: e.target.value })}
                      placeholder="Misal: Selamat Datang di Toko Kami!"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Footer / Kebijakan Retur Struk</label>
                    <textarea
                      rows={3}
                      value={form.receipt_footer}
                      onChange={e => setForm({ ...form, receipt_footer: e.target.value })}
                      placeholder="Pesan terima kasih, ketentuan garansi/tukar barang, atau link media sosial..."
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save size={18} />
                      {saving ? "Menyimpan..." : "Simpan Pengaturan Toko"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Preview Struk Thermal (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full bg-slate-200/70 p-4 rounded-2xl border border-slate-300 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                    <Printer size={14} /> Live Preview Struk Thermal 58mm/80mm
                  </span>

                  <div className="w-full max-w-xs bg-white p-5 rounded-xl shadow-md border border-slate-300 font-mono text-xs text-slate-800 space-y-2.5">
                    {/* Header */}
                    <div className="text-center space-y-0.5 border-b border-dashed pb-2">
                      <div className="font-bold text-sm uppercase tracking-wide">{form.store_name || "STOKKITA STORE"}</div>
                      {form.slogan && <div className="text-[10px] text-slate-500">{form.slogan}</div>}
                      {form.address && <div className="text-[10px] text-slate-600 mt-1">{form.address}</div>}
                      {form.phone && <div className="text-[10px] text-slate-600">Telp: {form.phone}</div>}
                      {form.receipt_header && (
                        <div className="text-[11px] font-semibold text-emerald-800 mt-1 pt-1 border-t border-slate-100">
                          {form.receipt_header}
                        </div>
                      )}
                    </div>

                    {/* Dummy Info */}
                    <div className="space-y-0.5 text-[11px] text-slate-600">
                      <div className="flex justify-between"><span>No. Struk:</span><span>#TRX-982144</span></div>
                      <div className="flex justify-between"><span>Kasir:</span><span>Budi Santoso</span></div>
                      <div className="flex justify-between"><span>Waktu:</span><span>{new Date().toLocaleTimeString('id-ID')}</span></div>
                    </div>

                    {/* Dummy Items */}
                    <div className="border-t border-dashed pt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span>Air Jordan 1 Retro (Sz 42) x1</span>
                        <span>Rp 2.100.000</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ventela Basic Low (Sz 40) x1</span>
                        <span>Rp 150.000</span>
                      </div>
                    </div>

                    {/* Dummy Total */}
                    <div className="border-t border-dashed pt-2 space-y-1 font-bold">
                      <div className="flex justify-between">
                        <span>TOTAL:</span>
                        <span className="text-emerald-700">Rp 2.250.000</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-normal">
                        <span>BAYAR (TUNAI):</span>
                        <span>Rp 2.500.000</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-normal">
                        <span>KEMBALIAN:</span>
                        <span>Rp 250.000</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-dashed pt-3 text-center space-y-1">
                      <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line">
                        {form.receipt_footer || "Terima kasih atas kunjungan Anda!"}
                      </p>
                      {form.instagram && (
                        <p className="text-[10px] font-bold text-slate-800">
                          IG: {form.instagram}
                        </p>
                      )}
                      <div className="text-[9px] text-slate-400 pt-1">
                        Powered by StokKita POS
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
