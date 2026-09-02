import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../api/axios";
import { toast } from "sonner";
import { 
  Store, Save, Printer, Phone, MapPin, 
  Globe, MessageSquare, ShieldCheck, Sparkles,
  Percent, Coins, Download, Upload, Database, CheckCircle2
} from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    store_name: "StokKita Shoes Store",
    slogan: "Platform Manajemen Inventory & Kasir Sepatu",
    phone: "081234567890",
    address: "Mall Grand Indonesia Lt. 3 Unit 45, Jakarta Pusat",
    receipt_header: "Terima Kasih Atas Kunjungan Anda!",
    receipt_footer: "Barang yang sudah dibeli dapat ditukar maksimal 3 hari dengan menyertakan struk ini. Follow IG @stokkita_official",
    instagram: "@stokkita_official",
    enable_tax: false,
    tax_rate: 11.0,
    tax_type: "EXCLUSIVE",
    enable_service_charge: false,
    service_charge_rate: 0.0,
    enable_cash_rounding: true
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
          instagram: res.data.instagram || "",
          enable_tax: Boolean(res.data.enable_tax),
          tax_rate: Number(res.data.tax_rate) || 11.0,
          tax_type: res.data.tax_type || "EXCLUSIVE",
          enable_service_charge: Boolean(res.data.enable_service_charge),
          service_charge_rate: Number(res.data.service_charge_rate) || 0.0,
          enable_cash_rounding: res.data.enable_cash_rounding !== undefined ? Boolean(res.data.enable_cash_rounding) : true
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

  // One-Click Backup
  const handleDownloadBackup = async () => {
    setBackingUp(true);
    try {
      const res = await api.get("/settings/backup", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stokkita_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Cadangan database JSON berhasil diunduh!");
    } catch (err: any) {
      toast.error("Gagal mengunduh cadangan database: " + (err.response?.data?.message || err.message));
    } finally {
      setBackingUp(false);
    }
  };

  // Restore JSON File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        toast.warning("Pulihkan database dari file cadangan?", {
          description: `File: ${file.name}. Tindakan ini akan menyinkronkan data toko, member, dan voucher.`,
          action: {
            label: "Ya, Pulihkan Data",
            onClick: async () => {
              setRestoring(true);
              try {
                const res = await api.post("/settings/restore", { backup: json });
                toast.success(res.data.message || "Pemulihan database sukses!");
                loadSettings();
              } catch (err: any) {
                toast.error("Gagal memulihkan data: " + (err.response?.data?.message || err.message));
              } finally {
                setRestoring(false);
              }
            }
          },
          cancel: {
            label: "Batal",
            onClick: () => {}
          }
        });
      } catch (err) {
        toast.error("Format file JSON tidak valid atau rusak!");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Pengaturan Toko, Pajak & Keamanan" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                <Store className="text-emerald-600" size={28} />
                Pengaturan Toko, Kebijakan Finansial & Backup
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">Kustomisasi profil usaha, tarif pajak PPN, pembulatan tunai kasir, dan backup mandiri</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Input (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Profil Toko & Struk */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <form onSubmit={handleSave} className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                      <Store size={16} className="text-emerald-600" />
                      Profil Identitas Toko & Struk Kasir
                    </h2>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Brand / Toko</label>
                      <input
                        type="text"
                        required
                        value={form.store_name}
                        onChange={e => setForm({ ...form, store_name: e.target.value })}
                        placeholder="Misal: StokKita Footwear"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Slogan / Tagline</label>
                        <input
                          type="text"
                          value={form.slogan}
                          onChange={e => setForm({ ...form, slogan: e.target.value })}
                          placeholder="Misal: Pusat Sepatu Original"
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp Toko / CS</label>
                        <input
                          type="text"
                          value={form.phone}
                          onChange={e => setForm({ ...form, phone: e.target.value })}
                          placeholder="081234567890"
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Toko</label>
                        <input
                          type="text"
                          value={form.address}
                          onChange={e => setForm({ ...form, address: e.target.value })}
                          placeholder="Jl. Sudirman No. 123"
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Akun Instagram</label>
                        <input
                          type="text"
                          value={form.instagram}
                          onChange={e => setForm({ ...form, instagram: e.target.value })}
                          placeholder="@stokkita_official"
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Header Struk (Opsional)</label>
                      <input
                        type="text"
                        value={form.receipt_header}
                        onChange={e => setForm({ ...form, receipt_header: e.target.value })}
                        placeholder="Misal: Selamat Datang di Toko Kami!"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Footer / Kebijakan Retur Struk</label>
                      <textarea
                        rows={2}
                        value={form.receipt_footer}
                        onChange={e => setForm({ ...form, receipt_footer: e.target.value })}
                        placeholder="Ketentuan tukar barang atau link sosial media..."
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* 2. Kebijakan Finansial Pajak & Pembulatan */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Percent size={16} className="text-emerald-600" />
                        Kebijakan Pajak PPN & Kasir
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.enable_tax}
                              onChange={e => setForm({ ...form, enable_tax: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            />
                            <span>Aktifkan Pajak (PPN)</span>
                          </label>
                          {form.enable_tax && (
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-600">Tarif (%):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={form.tax_rate}
                                  onChange={e => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-xs font-bold"
                                />
                              </div>
                              <select
                                value={form.tax_type}
                                onChange={e => setForm({ ...form, tax_type: e.target.value })}
                                className="w-full text-xs border border-slate-300 rounded p-1"
                              >
                                <option value="EXCLUSIVE">Exclusive (Tambahkan PPN ke Total)</option>
                                <option value="INCLUSIVE">Inclusive (Harga Sudah Termasuk PPN)</option>
                              </select>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.enable_cash_rounding}
                              onChange={e => setForm({ ...form, enable_cash_rounding: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                            />
                            <span>Pembulatan Tunai Kasir</span>
                          </label>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Membulatkan nominal desimal ke ratusan terdekat untuk mempermudah uang kembalian fisik.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Save size={16} />
                        {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* 3. Cadangan & Pemulihan Database JSON */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <Database size={16} className="text-emerald-600" />
                    Cadangan & Pemulihan Mandiri (Backup & Restore)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Amankan seluruh basis data produk, varian SKU, member, dan kupon voucher toko ke file cadangan JSON.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      disabled={backingUp}
                      className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-800 flex items-center gap-3 transition text-left"
                    >
                      <div className="p-2.5 bg-emerald-600 text-white rounded-lg">
                        <Download size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{backingUp ? "Membuat File..." : "Unduh Cadangan JSON"}</div>
                        <div className="text-[10px] text-emerald-600">Simpan salinan database ke laptop</div>
                      </div>
                    </button>

                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={restoring}
                        className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center gap-3 transition text-left"
                      >
                        <div className="p-2.5 bg-slate-700 text-white rounded-lg">
                          <Upload size={20} />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{restoring ? "Memulihkan..." : "Pulihkan dari JSON"}</div>
                          <div className="text-[10px] text-slate-500">Impor file cadangan sebelumnya</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Preview Struk Thermal (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full bg-slate-200/70 p-4 rounded-2xl border border-slate-300 flex flex-col items-center sticky top-20">
                  <span className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
                    <Printer size={14} /> Live Preview Struk Thermal Kasir
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

                    {/* Dummy Items with Notes */}
                    <div className="border-t border-dashed pt-2 space-y-1.5 text-[11px]">
                      <div>
                        <div className="flex justify-between">
                          <span>Air Jordan 1 Retro (Sz 42) x1</span>
                          <span>Rp 2.100.000</span>
                        </div>
                        <div className="text-[9px] text-slate-500 italic pl-2">Note: Bungkus Kado Pita Emas</div>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span>Ventela Basic Low (Sz 40) x1</span>
                          <span>Rp 150.000</span>
                        </div>
                      </div>
                    </div>

                    {/* Dummy Total with Tax & Rounding */}
                    <div className="border-t border-dashed pt-2 space-y-1 font-bold">
                      <div className="flex justify-between text-[11px] font-normal">
                        <span>Subtotal:</span>
                        <span>Rp 2.250.000</span>
                      </div>
                      {form.enable_tax && (
                        <div className="flex justify-between text-[11px] font-normal text-slate-600">
                          <span>PPN {form.tax_rate}%:</span>
                          <span>Rp 247.500</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm pt-1 border-t">
                        <span>TOTAL BAYAR:</span>
                        <span className="text-emerald-700">
                          {form.enable_tax && form.tax_type === "EXCLUSIVE" ? "Rp 2.497.500" : "Rp 2.250.000"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] font-normal">
                        <span>BAYAR (TUNAI):</span>
                        <span>Rp 2.500.000</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-normal">
                        <span>KEMBALIAN:</span>
                        <span>{form.enable_tax && form.tax_type === "EXCLUSIVE" ? "Rp 2.500" : "Rp 250.000"}</span>
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
