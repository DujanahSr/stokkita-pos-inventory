import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../api/axios";
import footwearLuxuryBg from "../assets/footwear_luxury_bg.jpg";
import { toast } from "sonner";
import { 
  Store, Save, Printer, Percent, Download, Upload, 
  Database, Cloud, Server, Radio, ShieldCheck 
} from "lucide-react";

const INPUT_CLS = "w-full px-3 py-2 bg-[#060a14] border border-[#c5a059]/30 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-[#c5a059] outline-none transition";
const LABEL_CLS = "block text-[10px] font-mono text-[#e5c483] uppercase tracking-wider mb-1";
const BTN_GOLD = "px-3.5 py-2.5 bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] text-[#070b14] font-serif-luxury font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-1.5";
const BTN_DARK = "px-3.5 py-2.5 bg-[#090e1c]/70 hover:bg-[#141d33] border border-[#c5a059]/30 text-slate-200 hover:text-[#e5c483] rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [uploadingS3, setUploadingS3] = useState(false);
  const [testingS3, setTestingS3] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    store_name: "StokKita Atelier",
    slogan: "Haute Footwear & Luxury Sneaker Consignment",
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
          store_name: res.data.store_name || "StokKita Atelier",
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

  const fetchCloudStatus = async () => {
    try {
      const res = await api.get("/settings/cloud-status");
      if (res.data) setCloudStatus(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSettings();
    fetchCloudStatus();
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

  const handleUploadBackupToS3 = async () => {
    setUploadingS3(true);
    try {
      const res = await api.post("/settings/backup/s3");
      toast.success(res.data.message || "Cadangan berhasil diunggah ke AWS S3!");
    } catch (err: any) {
      toast.error("Gagal mengunggah ke AWS S3: " + (err.response?.data?.message || err.message));
    } finally {
      setUploadingS3(false);
    }
  };

  const handleTestS3 = async () => {
    setTestingS3(true);
    try {
      const res = await api.post("/upload/test-s3");
      toast.success(res.data.message || "Koneksi AWS S3 Berhasil!");
      fetchCloudStatus();
    } catch (err: any) {
      toast.error("Koneksi AWS S3 Gagal: " + (err.response?.data?.message || err.message));
    } finally {
      setTestingS3(false);
    }
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        toast.warning("Pulihkan database dari file cadangan?", {
          description: `File: ${file.name}.`,
          action: {
            label: "Pulihkan",
            onClick: async () => {
              setRestoring(true);
              try {
                const res = await api.post("/settings/restore", { backup: json });
                toast.success(res.data.message || "Pemulihan database sukses!");
                loadSettings();
              } catch (err: any) {
                toast.error("Gagal memulihkan: " + (err.response?.data?.message || err.message));
              } finally {
                setRestoring(false);
              }
            }
          },
          cancel: { label: "Batal", onClick: () => {} }
        });
      } catch {
        toast.error("Format file JSON tidak valid!");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        <Navbar title="Pengaturan Toko & Keamanan" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 text-[#e5c483] text-xs font-serif-luxury tracking-widest uppercase">
              <Store size={16} /> Store Policy & Cloud Configuration
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-slate-100 mt-1">
              Pengaturan Toko & Cadangan Sistem
            </h1>
            <p className="text-slate-400 text-xs font-mono mt-1">
              Kustomisasi profil usaha, tarif pajak PPN kasir, pembulatan tunai, integrasi S3 cloud, dan backup database.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form Input (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 1. Profil Toko & Struk */}
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <form onSubmit={handleSave} className="space-y-4">
                  <h2 className="text-sm font-serif-luxury font-bold text-[#e5c483] uppercase tracking-wider border-b border-[#c5a059]/20 pb-2.5 flex items-center gap-2">
                    <Store size={16} />
                    Identitas Usaha & Format Struk Kasir
                  </h2>

                  <div>
                    <label className={LABEL_CLS}>Nama Brand / Toko</label>
                    <input
                      type="text"
                      required
                      value={form.store_name}
                      onChange={e => setForm({ ...form, store_name: e.target.value })}
                      placeholder="Misal: StokKita Atelier"
                      className={INPUT_CLS}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLS}>Slogan / Tagline</label>
                      <input
                        type="text"
                        value={form.slogan}
                        onChange={e => setForm({ ...form, slogan: e.target.value })}
                        placeholder="Misal: Haute Footwear Atelier"
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>WhatsApp Toko / CS</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="081234567890"
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLS}>Alamat Butik / Store</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        placeholder="Mall Grand Indonesia..."
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Akun Instagram Resmi</label>
                      <input
                        type="text"
                        value={form.instagram}
                        onChange={e => setForm({ ...form, instagram: e.target.value })}
                        placeholder="@stokkita_atelier"
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL_CLS}>Pesan Header Struk (Opsional)</label>
                    <input
                      type="text"
                      value={form.receipt_header}
                      onChange={e => setForm({ ...form, receipt_header: e.target.value })}
                      placeholder="Misal: Selamat Datang di StokKita Atelier"
                      className={INPUT_CLS}
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLS}>Kebijakan Retur / Pesan Footer Struk</label>
                    <textarea
                      rows={2}
                      value={form.receipt_footer}
                      onChange={e => setForm({ ...form, receipt_footer: e.target.value })}
                      placeholder="Ketentuan tukar barang..."
                      className={INPUT_CLS}
                    />
                  </div>

                  {/* 2. Kebijakan Pajak & Pembulatan */}
                  <div className="pt-2 border-t border-[#c5a059]/20 space-y-3">
                    <h2 className="text-sm font-serif-luxury font-bold text-[#e5c483] uppercase tracking-wider flex items-center gap-2">
                      <Percent size={15} />
                      Kebijakan Fiskal & Pembulatan Kasir
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#060a14] p-3.5 rounded-2xl border border-[#c5a059]/20">
                      <div>
                        <label className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.enable_tax}
                            onChange={e => setForm({ ...form, enable_tax: e.target.checked })}
                            className="rounded accent-[#c5a059] w-4 h-4"
                          />
                          <span>Aktifkan Pajak (PPN)</span>
                        </label>
                        {form.enable_tax && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-slate-400">Tarif (%):</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                value={form.tax_rate}
                                onChange={e => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
                                className="w-20 px-2 py-1 bg-[#090e1c] border border-[#c5a059]/30 rounded-lg text-xs font-mono font-bold text-[#e5c483]"
                              />
                            </div>
                            <select
                              value={form.tax_type}
                              onChange={e => setForm({ ...form, tax_type: e.target.value })}
                              className="w-full text-xs font-mono bg-[#090e1c] border border-[#c5a059]/30 rounded-lg p-1.5 text-slate-200"
                            >
                              <option value="EXCLUSIVE">Exclusive (Tambahkan PPN ke Total)</option>
                              <option value="INCLUSIVE">Inclusive (Harga Termasuk PPN)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.enable_cash_rounding}
                            onChange={e => setForm({ ...form, enable_cash_rounding: e.target.checked })}
                            className="rounded accent-[#c5a059] w-4 h-4"
                          />
                          <span>Pembulatan Tunai Kasir</span>
                        </label>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">
                          Membulatkan kembalian tunai ke ratusan terdekat untuk transaksi fisik di kasir.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className={BTN_GOLD}
                    >
                      <Save size={15} />
                      <span>{saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. Cadangan & Pemulihan Database */}
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <h2 className="text-sm font-serif-luxury font-bold text-[#e5c483] uppercase tracking-wider border-b border-[#c5a059]/20 pb-2.5 flex items-center gap-2">
                  <Database size={16} />
                  Cadangan & Pemulihan Basis Data (Backup JSON)
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-1.5">
                  Unduh salinan JSON lengkap seluruh produk, SKU, pelanggan, dan voucher toko.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    disabled={backingUp}
                    className="p-4 rounded-2xl border border-[#c5a059]/30 bg-[#060a14] hover:bg-[#0d1424] text-slate-200 flex items-center gap-3 transition text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#c5a059]/20 border border-[#c5a059]/40 text-[#e5c483] flex items-center justify-center flex-shrink-0">
                      <Download size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-[#e5c483]">{backingUp ? "Membuat..." : "Unduh Cadangan JSON"}</div>
                      <div className="text-[10px] font-mono text-slate-400">Simpan salinan database lokal</div>
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
                      className="w-full p-4 rounded-2xl border border-[#c5a059]/30 bg-[#060a14] hover:bg-[#0d1424] text-slate-200 flex items-center gap-3 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center flex-shrink-0">
                        <Upload size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-sky-200">{restoring ? "Memulihkan..." : "Pulihkan dari JSON"}</div>
                        <div className="text-[10px] font-mono text-slate-400">Impor cadangan data sebelumnya</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Integrasi AWS Cloud S3 */}
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c5a059]/20 pb-3">
                  <div>
                    <h2 className="text-sm font-serif-luxury font-bold text-[#e5c483] uppercase tracking-wider flex items-center gap-2">
                      <Cloud size={16} className="text-[#38bdf8]" />
                      Integrasi Cloud Storage & Auto-Backup
                    </h2>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      Penyimpanan S3 untuk backup database dan aset produk.
                    </p>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
                    cloudStatus?.configured
                      ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${cloudStatus?.configured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
                    {cloudStatus?.configured ? "AWS S3 Connected" : "Local Storage (Fallback)"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#060a14] p-3.5 rounded-2xl border border-[#c5a059]/20 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Provider</span>
                    <span className="font-bold text-slate-100 flex items-center gap-1 mt-0.5">
                      <Server size={12} className="text-[#38bdf8]" /> {cloudStatus?.provider || "Amazon AWS S3"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">S3 Bucket</span>
                    <span className="font-bold text-[#e5c483] text-[11px] truncate block mt-0.5">
                      {cloudStatus?.bucket || "stokkita-vault"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AWS Region</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Radio size={12} /> {cloudStatus?.region || "ap-southeast-1"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleUploadBackupToS3}
                    disabled={uploadingS3}
                    className={BTN_GOLD}
                  >
                    <Cloud size={14} />
                    <span>{uploadingS3 ? "Mengunggah..." : "Upload Backup ke S3"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestS3}
                    disabled={testingS3}
                    className={BTN_DARK}
                  >
                    <ShieldCheck size={14} />
                    <span>{testingS3 ? "Menguji..." : "Uji Koneksi S3"}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Preview Struk Thermal (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center sticky top-24">
                <span className="text-xs font-serif-luxury uppercase tracking-wider text-[#e5c483] font-bold mb-3 flex items-center gap-1.5">
                  <Printer size={15} /> Live Preview Struk Kasir
                </span>

                <div className="w-full max-w-xs bg-white text-slate-900 p-5 rounded-2xl shadow-2xl border-2 border-dashed border-[#c5a059] font-mono text-xs space-y-2.5">
                  {/* Header */}
                  <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                    <div className="font-serif-luxury font-bold text-sm uppercase tracking-wide">{form.store_name || "STOKKITA ATELIER"}</div>
                    {form.slogan && <div className="text-[10px] text-slate-500">{form.slogan}</div>}
                    {form.address && <div className="text-[10px] text-slate-600 mt-1">{form.address}</div>}
                    {form.phone && <div className="text-[10px] text-slate-600">Telp: {form.phone}</div>}
                    {form.receipt_header && (
                      <div className="text-[10px] font-bold text-[#c5a059] mt-1 pt-1 border-t border-slate-100">
                        {form.receipt_header}
                      </div>
                    )}
                  </div>

                  {/* Dummy Info */}
                  <div className="space-y-0.5 text-[10px] text-slate-600">
                    <div className="flex justify-between"><span>No. Struk:</span><span>#TRX-982144</span></div>
                    <div className="flex justify-between"><span>Kasir:</span><span>Dujanah</span></div>
                    <div className="flex justify-between"><span>Waktu:</span><span>{new Date().toLocaleTimeString('id-ID')}</span></div>
                  </div>

                  {/* Dummy Items */}
                  <div className="border-t border-dashed border-slate-300 pt-2 space-y-1.5 text-[11px]">
                    <div>
                      <div className="flex justify-between font-bold">
                        <span>Oxford Loafer Brown (42) x1</span>
                        <span>Rp 1.850.000</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-bold">
                        <span>Shoe Care Kit Luxury x1</span>
                        <span>Rp 250.000</span>
                      </div>
                    </div>
                  </div>

                  {/* Dummy Total */}
                  <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 font-bold">
                    <div className="flex justify-between text-[11px] font-normal">
                      <span>Subtotal:</span>
                      <span>Rp 2.100.000</span>
                    </div>
                    {form.enable_tax && (
                      <div className="flex justify-between text-[11px] font-normal text-slate-600">
                        <span>PPN {form.tax_rate}%:</span>
                        <span>Rp 231.000</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-1 border-t border-slate-200 text-slate-900">
                      <span>TOTAL BAYAR:</span>
                      <span className="text-emerald-700">
                        {form.enable_tax && form.tax_type === "EXCLUSIVE" ? "Rp 2.331.000" : "Rp 2.100.000"}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-dashed border-slate-300 pt-3 text-center space-y-1">
                    <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line">
                      {form.receipt_footer || "Terima kasih atas kunjungan Anda!"}
                    </p>
                    {form.instagram && (
                      <p className="text-[10px] font-bold text-slate-800">
                        IG: {form.instagram}
                      </p>
                    )}
                    <div className="text-[9px] text-slate-400 pt-1">
                      Powered by StokKita Haute Footwear POS
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
