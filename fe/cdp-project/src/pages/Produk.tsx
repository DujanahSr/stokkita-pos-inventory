import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Modal from "../components/ui/Modal";
import BarcodeSVG from "../components/ui/BarcodeSVG";
import QRCodeSVG from "../components/ui/QRCodeSVG";
import api from "../api/axios";
import { 
  Package, Plus, Trash2, Edit3, Barcode, QrCode, 
  Search, Filter, Printer, Layers, Tag, DollarSign, 
  TrendingUp, CheckCircle2, ChevronDown, ChevronRight 
} from "lucide-react";

const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

export default function Produk() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal States
  const [isAddProductModal, setIsAddProductModal] = useState(false);
  const [isEditProductModal, setIsEditProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [isAddVariantModal, setIsAddVariantModal] = useState(false);
  const [isEditVariantModal, setIsEditVariantModal] = useState(false);
  const [targetProductId, setTargetProductId] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<any>(null);

  const [barcodeLabelData, setBarcodeLabelData] = useState<any>(null);
  const [expandedProductIds, setExpandedProductIds] = useState<Record<string, boolean>>({});

  // Form State for New Product
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    category: "Sepatu",
    variants: [
      { sku: "", size: "40", color: "Hitam", price_buy: 100000, price_sell: 150000, rop: 10, eoq: 30, initial_stock: 0 }
    ]
  });

  // Form State for Single Variant
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

      const [pRes, cRes] = await Promise.all([
        api.get(url),
        api.get("/produk/categories")
      ]);

      setProducts(pRes.data);
      setCategories(cRes.data);

      // Auto expand all products by default
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

  // Add Product & Multiple Variants
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
    if (newProductForm.variants.length === 1) {
      return alert("Produk harus memiliki minimal 1 varian");
    }
    const updated = newProductForm.variants.filter((_, i) => i !== index);
    setNewProductForm({ ...newProductForm, variants: updated });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) return alert("Nama produk wajib diisi");

    setSaving(true);
    try {
      await api.post("/produk", newProductForm);
      setIsAddProductModal(false);
      setNewProductForm({
        name: "",
        category: "Sepatu",
        variants: [
          { sku: "", size: "40", color: "Hitam", price_buy: 100000, price_sell: 150000, rop: 10, eoq: 30, initial_stock: 0 }
        ]
      });
      loadData();
      alert("Produk dan varian berhasil ditambahkan!");
    } catch (err: any) {
      alert("Gagal menambahkan produk: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Edit Product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    try {
      await api.put(`/produk/${editingProduct.id}`, {
        name: editingProduct.name,
        category: editingProduct.category
      });
      setIsEditProductModal(false);
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      alert("Gagal memperbarui produk: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}" dan seluruh variannya?`)) return;
    try {
      await api.delete(`/produk/${id}`);
      loadData();
      alert("Produk berhasil dihapus");
    } catch (err: any) {
      alert("Gagal menghapus produk: " + (err.response?.data?.message || err.message));
    }
  };

  // Add Single Variant
  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProductId) return;
    setSaving(true);
    try {
      await api.post(`/produk/${targetProductId}/variants`, variantForm);
      setIsAddVariantModal(false);
      setVariantForm({ sku: "", size: "40", color: "Hitam", price_buy: 100000, price_sell: 150000, rop: 10, eoq: 30, initial_stock: 0 });
      loadData();
      alert("Varian baru berhasil ditambahkan!");
    } catch (err: any) {
      alert("Gagal menambahkan varian: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Update Single Variant
  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;
    setSaving(true);
    try {
      await api.put(`/produk/variants/${editingVariant.id}`, editingVariant);
      setIsEditVariantModal(false);
      setEditingVariant(null);
      loadData();
      alert("Varian berhasil diperbarui!");
    } catch (err: any) {
      alert("Gagal memperbarui varian: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Delete Single Variant
  const handleDeleteVariant = async (variantId: string, sku: string) => {
    if (!confirm(`Hapus varian dengan SKU "${sku}"?`)) return;
    try {
      await api.delete(`/produk/variants/${variantId}`);
      loadData();
      alert("Varian berhasil dihapus");
    } catch (err: any) {
      alert("Gagal menghapus varian: " + (err.response?.data?.message || err.message));
    }
  };

  // Metrics
  const totalProducts = products.length;
  const totalVariants = products.reduce((sum, p) => sum + (p.variants?.length || 0), 0);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Katalog Produk & Master Data" />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <Tag className="text-emerald-600" size={30} />
                Katalog Produk & Varian
              </h1>
              <p className="text-slate-500 mt-1">Kelola data master barang, varian dinamis, HPP modal, dan cetak label barcode</p>
            </div>

            <button
              onClick={() => setIsAddProductModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={18} /> Tambah Produk Baru
            </button>
          </div>

          {/* Metrics Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Package size={22} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Total Produk</div>
                <div className="text-xl font-bold text-slate-800 mt-0.5">{totalProducts} Item</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Layers size={22} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Total Varian SKU</div>
                <div className="text-xl font-bold text-blue-700 mt-0.5">{totalVariants} SKU</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Tag size={22} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Kategori Produk</div>
                <div className="text-xl font-bold text-purple-700 mt-0.5">{categories.length || 1} Kategori</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <TrendingUp size={22} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Status Pengadaan</div>
                <div className="text-xl font-bold text-amber-700 mt-0.5">EOQ & ROP Ready</div>
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama produk atau SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent w-full text-xs font-medium outline-none text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-slate-500" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products & Variants List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                Memuat data katalog produk...
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
                Belum ada produk yang terdaftar. Klik "+ Tambah Produk Baru" untuk memulai.
              </div>
            ) : (
              products.map((p) => {
                const isExpanded = expandedProductIds[p.id];
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                    
                    {/* Product Header */}
                    <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleExpand(p.id)}>
                        <button type="button" className="text-slate-400 hover:text-slate-600">
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-base">{p.name}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {p.category || "Umum"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {p.variants?.length || 0} Varian Terdaftar • Terdaftar sejak {new Date(p.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                          </p>
                        </div>
                      </div>

                      {/* Product Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => {
                            setTargetProductId(p.id);
                            setIsAddVariantModal(true);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                        >
                          <Plus size={14} className="text-emerald-600" /> Varian
                        </button>

                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsEditProductModal(true);
                          }}
                          className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
                          title="Edit Produk"
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 bg-white border border-slate-200 hover:bg-red-50 text-red-500 rounded-lg transition"
                          title="Hapus Produk"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Variants Table */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-100 font-semibold bg-white uppercase tracking-wider">
                              <th className="p-3 pl-6">Barcode / SKU</th>
                              <th className="p-3">Ukuran & Warna</th>
                              <th className="p-3 text-right">Harga Modal (HPP)</th>
                              <th className="p-3 text-right">Harga Jual Kasir</th>
                              <th className="p-3 text-right">Margin Laba</th>
                              <th className="p-3 text-center">Buffer (ROP / EOQ)</th>
                              <th className="p-3 text-center pr-6">Aksi Label & Data</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-medium">
                            {p.variants?.map((v: any) => {
                              const profit = v.price_sell - v.price_buy;
                              const marginPercent = v.price_buy > 0 ? Math.round((profit / v.price_buy) * 100) : 0;
                              return (
                                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 pl-6 font-mono font-bold text-slate-800">
                                    <div className="flex items-center gap-1.5">
                                      <Barcode size={16} className="text-slate-400" />
                                      <span>{v.sku}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-slate-700">
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-semibold mr-1.5">{v.size || '-'}</span>
                                    <span>{v.color || '-'}</span>
                                  </td>
                                  <td className="p-3 text-right text-slate-600">{fmt(v.price_buy)}</td>
                                  <td className="p-3 text-right font-bold text-emerald-700">{fmt(v.price_sell)}</td>
                                  <td className="p-3 text-right">
                                    <span className="font-semibold text-slate-800">+{fmt(profit)}</span>
                                    <span className="text-[10px] text-emerald-600 ml-1">({marginPercent}%)</span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded font-semibold text-[11px]">
                                      ROP: {v.rop} | EOQ: {v.eoq}
                                    </span>
                                  </td>
                                  <td className="p-3 pr-6 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {/* CETAK LABEL STIKER BARCODE */}
                                      <button
                                        onClick={() => setBarcodeLabelData({
                                          productName: p.name,
                                          sku: v.sku,
                                          size: v.size,
                                          color: v.color,
                                          price: v.price_sell,
                                          category: p.category
                                        })}
                                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition shadow-sm"
                                        title="Cetak Label Stiker Barcode"
                                      >
                                        <Printer size={13} /> Label
                                      </button>

                                      <button
                                        onClick={() => {
                                          setEditingVariant(v);
                                          setIsEditVariantModal(true);
                                        }}
                                        className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
                                        title="Edit Varian"
                                      >
                                        <Edit3 size={14} />
                                      </button>

                                      <button
                                        onClick={() => handleDeleteVariant(v.id, v.sku)}
                                        className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                                        title="Hapus Varian"
                                      >
                                        <Trash2 size={14} />
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

      {/* MODAL 1: TAMBAH PRODUK BARU & MULTI-VARIAN */}
      {isAddProductModal && (
        <Modal open={isAddProductModal} onClose={() => setIsAddProductModal(false)} title="Pendaftaran Produk Baru">
          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Sepatu Ventela Public Low"
                  value={newProductForm.name}
                  onChange={e => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Sepatu / Pakaian"
                  value={newProductForm.category}
                  onChange={e => setNewProductForm({ ...newProductForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Varian Rows */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Varian Produk (Ukuran, Warna & Harga)</label>
                <button
                  type="button"
                  onClick={handleAddVariantRow}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Varian Lain
                </button>
              </div>

              {newProductForm.variants.map((v, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Varian #{idx + 1}</span>
                    {newProductForm.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantRow(idx)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-semibold"
                      >
                        <Trash2 size={13} /> Hapus
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">SKU / Barcode *</label>
                      <input
                        type="text"
                        required
                        placeholder="VNT-BLK-40"
                        value={v.sku}
                        onChange={e => {
                          const updated = [...newProductForm.variants];
                          updated[idx].sku = e.target.value;
                          setNewProductForm({ ...newProductForm, variants: updated });
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Ukuran</label>
                      <input
                        type="text"
                        placeholder="40"
                        value={v.size}
                        onChange={e => {
                          const updated = [...newProductForm.variants];
                          updated[idx].size = e.target.value;
                          setNewProductForm({ ...newProductForm, variants: updated });
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Warna</label>
                      <input
                        type="text"
                        placeholder="Hitam"
                        value={v.color}
                        onChange={e => {
                          const updated = [...newProductForm.variants];
                          updated[idx].color = e.target.value;
                          setNewProductForm({ ...newProductForm, variants: updated });
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Harga Beli HPP (Rp)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={v.price_buy}
                        onChange={e => {
                          const updated = [...newProductForm.variants];
                          updated[idx].price_buy = Number(e.target.value);
                          setNewProductForm({ ...newProductForm, variants: updated });
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Harga Jual Kasir (Rp)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={v.price_sell}
                        onChange={e => {
                          const updated = [...newProductForm.variants];
                          updated[idx].price_sell = Number(e.target.value);
                          setNewProductForm({ ...newProductForm, variants: updated });
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Stok Awal di Cabang</label>
                      <input
                        type="number"
                        min="0"
                        value={v.initial_stock}
                        onChange={e => {
                          const updated = [...newProductForm.variants];
                          updated[idx].initial_stock = Number(e.target.value);
                          setNewProductForm({ ...newProductForm, variants: updated });
                        }}
                        className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddProductModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm disabled:opacity-60"
              >
                {saving ? "Mendaftarkan..." : "Simpan Produk & Varian"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: EDIT PRODUK */}
      {isEditProductModal && editingProduct && (
        <Modal open={isEditProductModal} onClose={() => setIsEditProductModal(false)} title="Edit Data Produk">
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk</label>
              <input
                type="text"
                required
                value={editingProduct.name}
                onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
              <input
                type="text"
                required
                value={editingProduct.category}
                onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditProductModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                {saving ? "Menyimpan..." : "Perbarui Produk"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: TAMBAH VARIAN TUNGGAL */}
      {isAddVariantModal && (
        <Modal open={isAddVariantModal} onClose={() => setIsAddVariantModal(false)} title="Tambah Varian Baru">
          <form onSubmit={handleCreateVariant} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Barcode *</label>
              <input
                type="text"
                required
                placeholder="Contoh: AJ1-WHT-43"
                value={variantForm.sku}
                onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ukuran</label>
                <input
                  type="text"
                  placeholder="43"
                  value={variantForm.size}
                  onChange={e => setVariantForm({ ...variantForm, size: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warna</label>
                <input
                  type="text"
                  placeholder="Putih"
                  value={variantForm.color}
                  onChange={e => setVariantForm({ ...variantForm, color: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Beli HPP (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={variantForm.price_buy}
                  onChange={e => setVariantForm({ ...variantForm, price_buy: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Jual Kasir (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={variantForm.price_sell}
                  onChange={e => setVariantForm({ ...variantForm, price_sell: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Stok Awal</label>
                <input
                  type="number"
                  min="0"
                  value={variantForm.initial_stock}
                  onChange={e => setVariantForm({ ...variantForm, initial_stock: Number(e.target.value) })}
                  className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-0.5">ROP (Min)</label>
                <input
                  type="number"
                  min="1"
                  value={variantForm.rop}
                  onChange={e => setVariantForm({ ...variantForm, rop: Number(e.target.value) })}
                  className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-0.5">EOQ (Batch)</label>
                <input
                  type="number"
                  min="1"
                  value={variantForm.eoq}
                  onChange={e => setVariantForm({ ...variantForm, eoq: Number(e.target.value) })}
                  className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddVariantModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                {saving ? "Menyimpan..." : "Tambah Varian"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 4: EDIT VARIAN TUNGGAL */}
      {isEditVariantModal && editingVariant && (
        <Modal open={isEditVariantModal} onClose={() => setIsEditVariantModal(false)} title="Edit Detail Varian">
          <form onSubmit={handleUpdateVariant} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Barcode *</label>
              <input
                type="text"
                required
                value={editingVariant.sku}
                onChange={e => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ukuran</label>
                <input
                  type="text"
                  value={editingVariant.size}
                  onChange={e => setEditingVariant({ ...editingVariant, size: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warna</label>
                <input
                  type="text"
                  value={editingVariant.color}
                  onChange={e => setEditingVariant({ ...editingVariant, color: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Beli HPP (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingVariant.price_buy}
                  onChange={e => setEditingVariant({ ...editingVariant, price_buy: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Jual Kasir (Rp)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editingVariant.price_sell}
                  onChange={e => setEditingVariant({ ...editingVariant, price_sell: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-0.5">ROP (Batas Aman)</label>
                <input
                  type="number"
                  min="1"
                  value={editingVariant.rop}
                  onChange={e => setEditingVariant({ ...editingVariant, rop: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-medium mb-0.5">EOQ (Batch Order)</label>
                <input
                  type="number"
                  min="1"
                  value={editingVariant.eoq}
                  onChange={e => setEditingVariant({ ...editingVariant, eoq: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditVariantModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                {saving ? "Menyimpan..." : "Perbarui Varian"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 5: CETAK LABEL BARCODE STIKER RETAIL */}
      {barcodeLabelData && (
        <Modal open={!!barcodeLabelData} onClose={() => setBarcodeLabelData(null)} title="Cetak Label Barcode Produk">
          <div className="flex flex-col items-center space-y-4">
            
            {/* RETAIL LABEL STICKER (40x30mm Standard) */}
            <div id="print-label" className="w-72 bg-white p-4 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center text-center shadow-inner">
              <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">StokKita Retail Store</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 leading-tight">{barcodeLabelData.productName}</div>
              
              <div className="text-xs text-slate-600 mt-0.5 font-medium">
                Varian: <span className="font-bold text-slate-800">{barcodeLabelData.size} / {barcodeLabelData.color}</span>
              </div>

              {/* 1D Barcode Pattern */}
              <div className="my-2.5">
                <BarcodeSVG value={barcodeLabelData.sku} width={220} height={45} />
              </div>

              <div className="border-t border-slate-200 w-full pt-1.5 flex justify-between items-center px-1">
                <span className="text-[10px] text-slate-400 font-semibold">{barcodeLabelData.category}</span>
                <span className="text-base font-bold text-emerald-700">{fmt(barcodeLabelData.price)}</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 text-center">
              Format stiker label standar siap dicetak ke printer barcode thermal (Xprinter/Zebra).
            </div>

            <div className="flex justify-end gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => setBarcodeLabelData(null)}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Printer size={15} /> Cetak Label Stiker
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
