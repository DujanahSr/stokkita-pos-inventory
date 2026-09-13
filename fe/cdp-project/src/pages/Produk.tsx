import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Modal from "../components/ui/Modal";
import BarcodeSVG from "../components/ui/BarcodeSVG";
import api from "../api/axios";
import supabase from "../lib/supabaseClient";
import shoeLuxuryEmblem from "../assets/shoe_luxury_emblem.jpg";
import footwearLuxuryBg from "../assets/footwear_luxury_bg.jpg";
import { 
  Package, Plus, Trash2, Edit3, Barcode, 
  Search, Filter, Printer, Layers, Tag, 
  TrendingUp, ChevronDown, ChevronRight,
  Download, Upload, FileSpreadsheet, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";

const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

const INPUT_CLS = "w-full px-3 py-2 bg-[#060a14] border border-[#c5a059]/30 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-[#c5a059] outline-none transition";
const LABEL_CLS = "block text-[10px] font-mono text-[#e5c483] uppercase tracking-wider mb-1";
const BTN_GOLD = "px-3.5 py-2 bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] text-[#070b14] font-serif-luxury font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-1.5";
const BTN_DARK = "px-3.5 py-2 bg-[#090e1c]/70 hover:bg-[#141d33] border border-[#c5a059]/30 text-slate-200 hover:text-[#e5c483] rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5";

export default function Produk() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Excel states
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [uploadingImport, setUploadingImport] = useState(false);

  // Modals
  const [isAddProductModal, setIsAddProductModal] = useState(false);
  const [isEditProductModal, setIsEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [isAddVariantModal, setIsAddVariantModal] = useState(false);
  const [isEditVariantModal, setIsEditVariantModal] = useState(false);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<any>(null);

  const [barcodeLabelData, setBarcodeLabelData] = useState<any>(null);
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  const [newProductForm, setNewProductForm] = useState({
    name: "",
    category: "Sepatu",
    image_url: "",
    variants: [
      { sku: "", size: "40", color: "Hitam", price_buy: 100000, price_sell: 150000, rop: 10, eoq: 30, initial_stock: 0 }
    ]
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Ukuran file gambar maksimal 5MB");

    setUploadingImage(true);
    try {
      if (!supabase) throw new Error("Koneksi Supabase belum aktif");
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('produk-images').upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('produk-images').getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      if (target === 'new') setNewProductForm(prev => ({ ...prev, image_url: publicUrl }));
      else setEditingProduct((prev: any) => ({ ...prev, image_url: publicUrl }));
      toast.success("Foto produk berhasil diunggah!");
    } catch (err: any) {
      toast.error("Gagal mengunggah foto: " + (err.message || "Unknown error"));
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const [variantForm, setVariantForm] = useState({
    sku: "",
    size: "40",
    color: "Hitam",
    price_buy: 100000,
    price_sell: 150000,
    rop: 10,
    eoq: 30,
    initial_stock: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      let url = "/produk";
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      if (params.toString()) url += `?${params.toString()}`;

      const [pRes, cRes] = await Promise.all([api.get(url), api.get("/produk/categories")]);
      setProducts(pRes.data);
      setCategories(cRes.data);

      const exp: Record<string, boolean> = {};
      pRes.data.forEach((p: any) => { exp[p.id] = true; });
      setExpandedProductIds(exp);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedProductIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddVariantRow = () => {
    setNewProductForm({
      ...newProductForm,
      variants: [
        ...newProductForm.variants,
        { sku: "", size: "41", color: "Hitam", price_buy: 100000, price_sell: 150000, rop: 10, eoq: 30, initial_stock: 0 }
      ]
    });
  };

  const handleRemoveVariantRow = (index: number) => {
    if (newProductForm.variants.length === 1) return toast.warning("Produk harus memiliki minimal 1 varian");
    setNewProductForm({ ...newProductForm, variants: newProductForm.variants.filter((_, i) => i !== index) });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) return toast.warning("Nama produk wajib diisi");
    setSaving(true);
    try {
      await api.post("/produk", newProductForm);
      setIsAddProductModal(false);
      setNewProductForm({
        name: "",
        category: "Sepatu",
        image_url: "",
        variants: [{ sku: "", size: "40", color: "Hitam", price_buy: 100000, price_sell: 150000, rop: 10, eoq: 30, initial_stock: 0 }]
      });
      loadData();
      toast.success(`Produk "${newProductForm.name}" berhasil didaftarkan!`);
    } catch (err: any) {
      toast.error("Gagal menambahkan produk: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      await api.put(`/produk/${editingProduct.id}`, {
        name: editingProduct.name,
        category: editingProduct.category,
        image_url: editingProduct.image_url
      });
      setIsEditProductModal(false);
      toast.success(`Produk "${editingProduct.name}" berhasil diperbarui!`);
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      toast.error("Gagal memperbarui produk: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = (id: string, name: string) => {
    toast.error(`Hapus produk "${name}"?`, {
      description: "Seluruh varian SKU dan data stok terkait akan ikut terhapus.",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await api.delete(`/produk/${id}`);
            loadData();
            toast.success(`Produk "${name}" berhasil dihapus`);
          } catch (err: any) {
            toast.error("Gagal menghapus produk: " + (err.response?.data?.message || err.message));
          }
        }
      },
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProductId) return;
    setSaving(true);
    try {
      await api.post(`/produk/${targetProductId}/variants`, variantForm);
      setIsAddVariantModal(false);
      setVariantForm({ sku: "", size: "40", color: "Hitam", price_buy: 100000, price_sell: 150000, rop: 10, eoq: 30, initial_stock: 0 });
      loadData();
      toast.success(`Varian baru "${variantForm.sku}" berhasil ditambahkan!`);
    } catch (err: any) {
      toast.error("Gagal menambahkan varian: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;
    setSaving(true);
    try {
      await api.put(`/produk/variants/${editingVariant.id}`, editingVariant);
      setIsEditVariantModal(false);
      setEditingVariant(null);
      loadData();
      toast.success("Varian berhasil diperbarui!");
    } catch (err: any) {
      toast.error("Gagal memperbarui varian: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = (variantId: string, sku: string) => {
    toast.error(`Hapus varian "${sku}"?`, {
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await api.delete(`/produk/variants/${variantId}`);
            loadData();
            toast.success(`Varian "${sku}" berhasil dihapus`);
          } catch (err: any) {
            toast.error("Gagal menghapus varian: " + (err.response?.data?.message || err.message));
          }
        }
      },
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

  const handleExportExcel = async () => {
    setDownloadingExcel(true);
    try {
      const res = await api.get("/produk/export/excel", { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Master_Produk_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("File Excel Master Produk berhasil diunduh!");
    } catch {
      toast.error("Gagal mengunduh file Excel");
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleImportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return toast.warning("Pilih file Excel (.xlsx) terlebih dahulu!");
    setUploadingImport(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await api.post("/produk/import/excel", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(res.data.message || "Impor produk berhasil!");
      setIsImportModalOpen(false);
      setImportFile(null);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengimpor file Excel");
    } finally {
      setUploadingImport(false);
    }
  };

  const totalProducts = products.length;
  const totalVariants = products.reduce((sum, p) => sum + (p.variants?.length || 0), 0);

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
        <Navbar title="Katalog Produk & Master Data" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#e5c483] text-xs font-serif-luxury tracking-widest uppercase">
                <Tag size={16} /> Haute Footwear Catalog
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-slate-100 mt-1">
                Katalog Produk & Varian SKU
              </h1>
              <p className="text-slate-400 text-xs font-mono mt-1">
                Master data inventaris barang, kontrol margin HPP, buffer EOQ/ROP, dan cetak label thermal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={downloadingExcel}
                className={BTN_DARK}
                title="Download file Excel"
              >
                <Download size={14} className="text-[#e5c483]" />
                <span>{downloadingExcel ? "Mengunduh..." : "Ekspor Excel"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className={BTN_DARK}
                title="Upload file Excel"
              >
                <Upload size={14} className="text-[#38bdf8]" />
                <span>Impor Excel</span>
              </button>

              <button
                onClick={() => setIsAddProductModal(true)}
                className={BTN_GOLD}
              >
                <Plus size={15} /> Tambah Produk
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3.5 transition">
              <div className="w-11 h-11 rounded-2xl bg-[#c5a059]/15 border border-[#c5a059]/40 flex items-center justify-center text-[#e5c483]">
                <Package size={20} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Koleksi</div>
                <div className="text-xl font-serif-luxury font-bold text-slate-100 mt-0.5">{totalProducts} Item</div>
              </div>
            </div>

            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3.5 transition">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-300">
                <Layers size={20} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Varian SKU</div>
                <div className="text-xl font-serif-luxury font-bold text-sky-200 mt-0.5">{totalVariants} SKU</div>
              </div>
            </div>

            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3.5 transition">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <Tag size={20} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Kategori Aktif</div>
                <div className="text-xl font-serif-luxury font-bold text-purple-200 mt-0.5">{categories.length || 1} Kategori</div>
              </div>
            </div>

            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3.5 transition">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <TrendingUp size={20} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Status Buffer</div>
                <div className="text-xl font-serif-luxury font-bold text-emerald-300 mt-0.5">EOQ / ROP Live</div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-2xl p-3 sm:p-4 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-[#060a14] border border-[#c5a059]/30 px-3 py-2 rounded-xl focus-within:border-[#c5a059] transition">
              <Search size={16} className="text-[#c5a059]" />
              <input
                type="text"
                placeholder="Cari produk atau SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent w-full text-xs font-mono outline-none text-slate-100 placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={15} className="text-[#c5a059]" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-[#060a14] border border-[#c5a059]/30 rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-[#c5a059]"
              >
                <option value="">Semua Kategori</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Products Accordion List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-12 text-center text-slate-400 text-xs font-mono">
                Memuat katalog produk...
              </div>
            ) : products.length === 0 ? (
              <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-12 text-center text-slate-400 text-xs font-mono">
                Belum ada produk yang terdaftar. Klik "+ Tambah Produk" untuk memulai.
              </div>
            ) : (
              products.map((p) => {
                const isExpanded = expandedProductIds[p.id];
                return (
                  <div key={p.id} className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/50 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition">
                    
                    {/* Header Item */}
                    <div className="p-4 bg-[#03060e]/50 border-b border-[#c5a059]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggleExpand(p.id)}>
                        <button type="button" className="text-[#c5a059] hover:text-[#e5c483] transition">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>

                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#0a0f1d] border border-[#c5a059]/40 flex-shrink-0 flex items-center justify-center">
                          <img 
                            src={p.image_url || shoeLuxuryEmblem} 
                            alt={p.name}
                            onError={(e) => { (e.target as HTMLImageElement).src = shoeLuxuryEmblem; }}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif-luxury font-bold text-slate-100 text-base">{p.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#c5a059]/20 text-[#e5c483] border border-[#c5a059]/30">
                              {p.category || "Umum"}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {p.variants?.length || 0} SKU Varian • Terdaftar {new Date(p.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => { setTargetProductId(p.id); setIsAddVariantModal(true); }}
                          className="px-2.5 py-1.5 bg-[#0a0f1d] border border-[#c5a059]/40 hover:border-[#c5a059] text-[#e5c483] rounded-xl text-xs font-mono flex items-center gap-1 transition"
                        >
                          <Plus size={13} /> Varian
                        </button>

                        <button
                          onClick={() => { setEditingProduct(p); setIsEditProductModal(true); }}
                          className="p-1.5 bg-[#0a0f1d] border border-[#c5a059]/30 hover:border-[#c5a059] text-slate-300 hover:text-[#e5c483] rounded-xl transition"
                          title="Edit Produk"
                        >
                          <Edit3 size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 bg-[#0a0f1d] border border-rose-500/30 hover:border-rose-500 text-rose-400 rounded-xl transition"
                          title="Hapus Produk"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Variants Table */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-xs font-mono">
                          <thead>
                            <tr className="bg-[#03060e]/60 text-[#e5c483] border-b border-[#c5a059]/30 font-serif-luxury uppercase tracking-wider text-[10px]">
                              <th className="p-3 pl-6">Barcode / SKU</th>
                              <th className="p-3">Ukuran / Warna</th>
                              <th className="p-3 text-right">HPP Modal</th>
                              <th className="p-3 text-right">Harga Jual</th>
                              <th className="p-3 text-right">Margin Laba</th>
                              <th className="p-3 text-center">Buffer (ROP/EOQ)</th>
                              <th className="p-3 text-center pr-6">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#c5a059]/10">
                            {p.variants?.map((v: any) => {
                              const profit = v.price_sell - v.price_buy;
                              const marginPercent = v.price_buy > 0 ? Math.round((profit / v.price_buy) * 100) : 0;
                              return (
                                <tr key={v.id} className="hover:bg-[#14203d]/40 transition text-slate-200">
                                  <td className="p-3 pl-6 font-bold text-[#e5c483]">
                                    <div className="flex items-center gap-1.5">
                                      <Barcode size={15} className="text-[#c5a059]" />
                                      <span>{v.sku}</span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 bg-[#0d1424] border border-[#c5a059]/30 rounded text-slate-100 font-bold mr-1.5">{v.size || "-"}</span>
                                    <span className="text-slate-400">{v.color || "-"}</span>
                                  </td>
                                  <td className="p-3 text-right text-slate-400">{fmt(v.price_buy)}</td>
                                  <td className="p-3 text-right font-bold text-emerald-400">{fmt(v.price_sell)}</td>
                                  <td className="p-3 text-right">
                                    <span className="font-bold text-slate-100">+{fmt(profit)}</span>
                                    <span className="text-[10px] text-emerald-400 ml-1">({marginPercent}%)</span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="px-2 py-0.5 bg-[#090e1c] border border-[#c5a059]/30 rounded text-[#e5c483] text-[11px]">
                                      ROP: {v.rop} | EOQ: {v.eoq}
                                    </span>
                                  </td>
                                  <td className="p-3 pr-6 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => setBarcodeLabelData({
                                          productName: p.name,
                                          sku: v.sku,
                                          size: v.size,
                                          color: v.color,
                                          price: v.price_sell,
                                          category: p.category
                                        })}
                                        className="px-2.5 py-1 bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-serif-luxury font-bold rounded-lg text-[10px] uppercase flex items-center gap-1 shadow-sm"
                                        title="Cetak Stiker Barcode"
                                      >
                                        <Printer size={12} /> Label
                                      </button>
                                      <button
                                        onClick={() => { setEditingVariant(v); setIsEditVariantModal(true); }}
                                        className="p-1 text-slate-400 hover:text-[#e5c483] rounded hover:bg-[#141d33]"
                                        title="Edit Varian"
                                      >
                                        <Edit3 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteVariant(v.id, v.sku)}
                                        className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40"
                                        title="Hapus Varian"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* MODAL 1: TAMBAH PRODUK BARU */}
      {isAddProductModal && (
        <Modal open={isAddProductModal} onClose={() => setIsAddProductModal(false)} title="Pendaftaran Koleksi Baru">
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="p-3 bg-[#060a14] border border-[#c5a059]/30 rounded-xl space-y-2">
              <label className={LABEL_CLS}>Foto Produk (Opsional)</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-[#c5a059]/30 bg-[#0a0f1d] flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {newProductForm.image_url ? (
                    <img src={newProductForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} className="text-slate-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-[#0d1424] hover:bg-[#14203d] border border-[#c5a059]/40 rounded-lg text-xs font-mono text-[#e5c483] flex items-center gap-1.5 transition">
                      <Upload size={12} />
                      <span>{uploadingImage ? "Mengunggah..." : "Pilih File"}</span>
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e) => handleUploadImage(e, "new")} />
                    </label>
                    {newProductForm.image_url && (
                      <button type="button" onClick={() => setNewProductForm({ ...newProductForm, image_url: "" })} className="text-xs text-rose-400 font-mono">
                        Hapus
                      </button>
                    )}
                  </div>
                  <input 
                    type="url" 
                    placeholder="Atau tautan URL foto..." 
                    value={newProductForm.image_url || ""} 
                    onChange={e => setNewProductForm({ ...newProductForm, image_url: e.target.value })} 
                    className={INPUT_CLS} 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Nama Produk</label>
                <input type="text" required placeholder="Misal: Derby Oxford Black" value={newProductForm.name} onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Kategori</label>
                <input type="text" required placeholder="Misal: Formal Shoes" value={newProductForm.category} onChange={e => setNewProductForm({ ...newProductForm, category: e.target.value })} className={INPUT_CLS} />
              </div>
            </div>

            {/* Varian Rows */}
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-serif-luxury font-bold text-[#e5c483] uppercase tracking-wider">Varian SKU</label>
                <button type="button" onClick={handleAddVariantRow} className="text-xs text-[#e5c483] hover:text-[#dfba73] font-mono font-bold flex items-center gap-1">
                  <Plus size={13} /> Tambah Varian
                </button>
              </div>

              {newProductForm.variants.map((v, idx) => (
                <div key={idx} className="p-3 bg-[#060a14] border border-[#c5a059]/20 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-[#e5c483]">
                    <span>Varian #{idx + 1}</span>
                    {newProductForm.variants.length > 1 && (
                      <button type="button" onClick={() => handleRemoveVariantRow(idx)} className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1">
                        <Trash2 size={12} /> Hapus
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className={LABEL_CLS}>SKU / Barcode *</label>
                      <input type="text" required placeholder="SKU-01" value={v.sku} onChange={e => {
                        const upd = [...newProductForm.variants]; upd[idx].sku = e.target.value; setNewProductForm({ ...newProductForm, variants: upd });
                      }} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Ukuran</label>
                      <input type="text" placeholder="42" value={v.size} onChange={e => {
                        const upd = [...newProductForm.variants]; upd[idx].size = e.target.value; setNewProductForm({ ...newProductForm, variants: upd });
                      }} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Warna</label>
                      <input type="text" placeholder="Black" value={v.color} onChange={e => {
                        const upd = [...newProductForm.variants]; upd[idx].color = e.target.value; setNewProductForm({ ...newProductForm, variants: upd });
                      }} className={INPUT_CLS} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className={LABEL_CLS}>HPP Modal (Rp)</label>
                      <input type="number" min="0" required value={v.price_buy} onChange={e => {
                        const upd = [...newProductForm.variants]; upd[idx].price_buy = Number(e.target.value); setNewProductForm({ ...newProductForm, variants: upd });
                      }} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Harga Jual (Rp)</label>
                      <input type="number" min="0" required value={v.price_sell} onChange={e => {
                        const upd = [...newProductForm.variants]; upd[idx].price_sell = Number(e.target.value); setNewProductForm({ ...newProductForm, variants: upd });
                      }} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Stok Awal</label>
                      <input type="number" min="0" value={v.initial_stock} onChange={e => {
                        const upd = [...newProductForm.variants]; upd[idx].initial_stock = Number(e.target.value); setNewProductForm({ ...newProductForm, variants: upd });
                      }} className={INPUT_CLS} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setIsAddProductModal(false)} className={`flex-1 ${BTN_DARK}`}>
                Batal
              </button>
              <button type="submit" disabled={saving} className={`flex-1 ${BTN_GOLD}`}>
                {saving ? "Menyimpan..." : "Simpan Koleksi"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: EDIT PRODUK */}
      {isEditProductModal && editingProduct && (
        <Modal open={isEditProductModal} onClose={() => setIsEditProductModal(false)} title="Edit Koleksi Produk">
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="p-3 bg-[#060a14] border border-[#c5a059]/30 rounded-xl space-y-2">
              <label className={LABEL_CLS}>Foto Produk</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-[#c5a059]/30 bg-[#0a0f1d] flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {editingProduct.image_url ? (
                    <img src={editingProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} className="text-slate-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-[#0d1424] hover:bg-[#14203d] border border-[#c5a059]/40 rounded-lg text-xs font-mono text-[#e5c483] flex items-center gap-1.5 transition">
                      <Upload size={12} />
                      <span>{uploadingImage ? "Mengunggah..." : "Ganti Foto"}</span>
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e) => handleUploadImage(e, "edit")} />
                    </label>
                    {editingProduct.image_url && (
                      <button type="button" onClick={() => setEditingProduct({ ...editingProduct, image_url: null })} className="text-xs text-rose-400 font-mono">
                        Hapus
                      </button>
                    )}
                  </div>
                  <input type="url" placeholder="URL Foto..." value={editingProduct.image_url || ""} onChange={e => setEditingProduct({ ...editingProduct, image_url: e.target.value })} className={INPUT_CLS} />
                </div>
              </div>
            </div>

            <div>
              <label className={LABEL_CLS}>Nama Produk</label>
              <input type="text" required value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className={INPUT_CLS} />
            </div>

            <div>
              <label className={LABEL_CLS}>Kategori</label>
              <input type="text" required value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} className={INPUT_CLS} />
            </div>

            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setIsEditProductModal(false)} className={`flex-1 ${BTN_DARK}`}>
                Batal
              </button>
              <button type="submit" disabled={saving} className={`flex-1 ${BTN_GOLD}`}>
                {saving ? "Menyimpan..." : "Perbarui"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: TAMBAH VARIAN */}
      {isAddVariantModal && (
        <Modal open={isAddVariantModal} onClose={() => setIsAddVariantModal(false)} title="Tambah Varian Baru">
          <form onSubmit={handleCreateVariant} className="space-y-3">
            <div>
              <label className={LABEL_CLS}>SKU / Barcode *</label>
              <input type="text" required placeholder="Contoh: DERBY-BLK-42" value={variantForm.sku} onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })} className={INPUT_CLS} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Ukuran</label>
                <input type="text" placeholder="42" value={variantForm.size} onChange={e => setVariantForm({ ...variantForm, size: e.target.value })} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Warna</label>
                <input type="text" placeholder="Black" value={variantForm.color} onChange={e => setVariantForm({ ...variantForm, color: e.target.value })} className={INPUT_CLS} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>HPP Modal (Rp)</label>
                <input type="number" min="0" required value={variantForm.price_buy} onChange={e => setVariantForm({ ...variantForm, price_buy: Number(e.target.value) })} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Harga Jual Kasir (Rp)</label>
                <input type="number" min="0" required value={variantForm.price_sell} onChange={e => setVariantForm({ ...variantForm, price_sell: Number(e.target.value) })} className={INPUT_CLS} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={LABEL_CLS}>ROP</label>
                <input type="number" min="1" value={variantForm.rop} onChange={e => setVariantForm({ ...variantForm, rop: Number(e.target.value) })} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>EOQ</label>
                <input type="number" min="1" value={variantForm.eoq} onChange={e => setVariantForm({ ...variantForm, eoq: Number(e.target.value) })} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Stok Awal</label>
                <input type="number" min="0" value={variantForm.initial_stock} onChange={e => setVariantForm({ ...variantForm, initial_stock: Number(e.target.value) })} className={INPUT_CLS} />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setIsAddVariantModal(false)} className={`flex-1 ${BTN_DARK}`}>
                Batal
              </button>
              <button type="submit" disabled={saving} className={`flex-1 ${BTN_GOLD}`}>
                {saving ? "Menyimpan..." : "Tambah Varian"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: EDIT VARIAN */}
      {isEditVariantModal && editingVariant && (
        <Modal open={isEditVariantModal} onClose={() => setIsEditVariantModal(false)} title="Edit Varian Produk">
          <form onSubmit={handleUpdateVariant} className="space-y-3">
            <div>
              <label className={LABEL_CLS}>SKU / Barcode *</label>
              <input type="text" required value={editingVariant.sku} onChange={e => setEditingVariant({ ...editingVariant, sku: e.target.value })} className={INPUT_CLS} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Ukuran</label>
                <input type="text" value={editingVariant.size} onChange={e => setEditingVariant({ ...editingVariant, size: e.target.value })} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Warna</label>
                <input type="text" value={editingVariant.color} onChange={e => setEditingVariant({ ...editingVariant, color: e.target.value })} className={INPUT_CLS} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>HPP Modal (Rp)</label>
                <input type="number" min="0" required value={editingVariant.price_buy} onChange={e => setEditingVariant({ ...editingVariant, price_buy: Number(e.target.value) })} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>Harga Jual (Rp)</label>
                <input type="number" min="0" required value={editingVariant.price_sell} onChange={e => setEditingVariant({ ...editingVariant, price_sell: Number(e.target.value) })} className={INPUT_CLS} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>ROP</label>
                <input type="number" min="1" value={editingVariant.rop} onChange={e => setEditingVariant({ ...editingVariant, rop: Number(e.target.value) })} className={INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>EOQ</label>
                <input type="number" min="1" value={editingVariant.eoq} onChange={e => setEditingVariant({ ...editingVariant, eoq: Number(e.target.value) })} className={INPUT_CLS} />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setIsEditVariantModal(false)} className={`flex-1 ${BTN_DARK}`}>
                Batal
              </button>
              <button type="submit" disabled={saving} className={`flex-1 ${BTN_GOLD}`}>
                {saving ? "Menyimpan..." : "Perbarui Varian"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 5: CETAK LABEL BARCODE */}
      {barcodeLabelData && (
        <Modal open={!!barcodeLabelData} onClose={() => setBarcodeLabelData(null)} title="Cetak Label Barcode Produk">
          <div className="flex flex-col items-center space-y-4">
            <div id="print-label" className="w-72 bg-white text-slate-900 p-4 rounded-xl border-2 border-dashed border-[#c5a059] flex flex-col items-center text-center shadow-inner">
              <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">StokKita Atelier</div>
              <div className="text-sm font-serif-luxury font-bold text-slate-900 mt-0.5 leading-tight">{barcodeLabelData.productName}</div>
              <div className="text-xs text-slate-600 mt-0.5 font-medium">
                Varian: <span className="font-bold text-slate-900">{barcodeLabelData.size} / {barcodeLabelData.color}</span>
              </div>
              <div className="my-2.5">
                <BarcodeSVG value={barcodeLabelData.sku} width={220} height={45} />
              </div>
              <div className="border-t border-slate-200 w-full pt-1.5 flex justify-between items-center px-1 font-mono">
                <span className="text-[10px] text-slate-500 font-semibold">{barcodeLabelData.category}</span>
                <span className="text-sm font-bold text-emerald-700">{fmt(barcodeLabelData.price)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 w-full pt-2">
              <button type="button" onClick={() => setBarcodeLabelData(null)} className={BTN_DARK}>
                Tutup
              </button>
              <button type="button" onClick={() => window.print()} className={BTN_GOLD}>
                <Printer size={14} /> Cetak Stiker
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 6: IMPOR EXCEL */}
      {isImportModalOpen && (
        <Modal open={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Impor Data Master (.xlsx)">
          <form onSubmit={handleImportExcel} className="space-y-4">
            <div className="p-3 bg-[#0d1424] border border-[#38bdf8]/30 rounded-xl text-xs font-mono text-sky-200 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-sky-300">
                <FileSpreadsheet size={15} /> Format Kolom Template Excel:
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                No | Nama Produk | Kategori | Barcode SKU | Ukuran | Warna | Harga Beli | Harga Jual | ROP | Stok Awal
              </p>
            </div>

            <div>
              <label className={LABEL_CLS}>Pilih File Excel (.xlsx)</label>
              <input
                type="file"
                required
                accept=".xlsx, .xls"
                onChange={e => setImportFile(e.target.files?.[0] || null)}
                className="w-full text-xs font-mono text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#c5a059] file:text-[#070b14] border border-[#c5a059]/30 rounded-xl p-2 cursor-pointer bg-[#060a14]"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => { setIsImportModalOpen(false); setImportFile(null); }} className={`flex-1 ${BTN_DARK}`}>
                Batal
              </button>
              <button type="submit" disabled={uploadingImport || !importFile} className={`flex-1 ${BTN_GOLD}`}>
                <Upload size={14} />
                {uploadingImport ? "Memproses..." : "Mulai Impor"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
