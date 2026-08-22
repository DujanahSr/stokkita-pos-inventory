import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Modal from "../components/ui/Modal";
import api from "../api/axios";
import { Plus, Pencil, Trash2, Search, Hash, Tag, Layers, Truck, Database, ShieldAlert, ArrowDownLeft, ArrowUpRight, Image as ImageIcon } from "lucide-react";
import supabase, { supabaseConfigured } from "../lib/supabaseClient";

const fmt = (v) => "Rp " + new Intl.NumberFormat("id-ID").format(v);
const empty = { id: "", nama: "", kategori: "", stok: "", safety_stock: "", harga_beli: "", harga_jual: "", supplier: "", image_url: "" };

const compressImage = async (file) => {
  if (!file || !file.type.startsWith("image/")) return file;

  const imageUrl = URL.createObjectURL(file);
  const img = new Image();
  img.src = imageUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const maxWidth = 1200;
  const maxHeight = 1200;
  let { width, height } = img;

  if (width > height) {
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
  } else if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);

  const quality = file.type === "image/png" ? 0.9 : 0.8;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, file.type || "image/jpeg", quality));
  URL.revokeObjectURL(imageUrl);

  if (!blob) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: blob.type || "image/jpeg" });
};

export default function Inventori() {
  const [produk, setProduk] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(empty);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const res = await api.get("/produk");
      setProduk(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat inventori");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = produk.filter(
    (p) => p.nama.toLowerCase().includes(search.toLowerCase()) ||
           p.kategori.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(empty); setEditMode(false); setImageFile(null); setPreviewImage(""); setModal(true); };
  const openEdit = (p) => {
    setForm({ ...p, harga_beli: p.harga_beli, harga_jual: p.harga_jual });
    setEditMode(true);
    setImageFile(null);
    setPreviewImage(p.image_url || "");
    setModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let image_url = form.image_url;
      if (imageFile) {
        if (!supabaseConfigured || !supabase) {
          throw new Error("Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.");
        }

        const uploadFile = imageFile.size > 1024 * 1024 ? await compressImage(imageFile) : imageFile;
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${form.id || Date.now()}-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('produk-images').upload(fileName, uploadFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: uploadFile.type || 'image/jpeg',
        });
        if (error) throw error;
        const { data: publicData } = supabase.storage.from('produk-images').getPublicUrl(data.path);
        image_url = publicData.publicUrl;
      }

      const payload = { ...form, image_url };
      if (editMode) {
        await api.put(`/produk/${form.id}`, payload);
      } else {
        await api.post("/produk", payload);
      }
      setModal(false);
      load();
    } catch (err) {
      alert(err.message || err.response?.data?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus produk ini?")) return;
    await api.delete(`/produk/${id}`);
    load();
  };

  const handleImageChange = (file) => {
    setImageFile(file);
    setPreviewImage(file ? URL.createObjectURL(file) : "");
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0">
        <Navbar title="Inventori Produk" />
        <main className="p-6 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {initialLoading ? (
              <div className="flex h-56 items-center justify-center text-slate-400">Memuat inventori...</div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">ID</th>
                    <th className="text-left px-4 py-3">Gambar</th>
                    <th className="text-left px-4 py-3">Nama Produk</th>
                    <th className="text-left px-4 py-3">Kategori</th>
                    <th className="text-right px-4 py-3">Stok</th>
                    <th className="text-right px-4 py-3">Safety</th>
                    <th className="text-right px-4 py-3">Harga Beli</th>
                    <th className="text-right px-4 py-3">Harga Jual</th>
                    <th className="text-left px-4 py-3">Supplier</th>
                    <th className="text-center px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-10 text-slate-400">Tidak ada data</td></tr>
                  )}
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.id}</td>
                      <td className="px-4 py-3">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.nama} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">No</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{p.nama}</td>
                      <td className="px-4 py-3 text-slate-500">{p.kategori}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${p.stok < p.safety_stock ? "text-red-600" : "text-slate-700"}`}>{p.stok}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{p.safety_stock}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(p.harga_beli)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(p.harga_jual)}</td>
                      <td className="px-4 py-3 text-slate-500">{p.supplier}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 transition">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editMode ? "Edit Produk" : "Tambah Produk"}>
        <div className="space-y-3">
          {[
            { key: "id", label: "ID Produk", disabled: editMode, icon: Hash },
            { key: "nama", label: "Nama", icon: Tag },
            { key: "kategori", label: "Kategori", icon: Layers },
            { key: "supplier", label: "Supplier", icon: Truck },
          ].map(({ key, label, disabled, icon: Icon }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form[key]}
                  disabled={disabled}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "stok", label: "Stok", icon: Database },
              { key: "safety_stock", label: "Safety Stock", icon: ShieldAlert },
              { key: "harga_beli", label: "Harga Beli", icon: ArrowDownLeft },
              { key: "harga_jual", label: "Harga Jual", icon: ArrowUpRight },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Gambar Produk</label>
              <div className="relative flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-slate-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-700"
                />
              </div>
            </div>
            {(previewImage || form.image_url) && (
              <div className="rounded-xl border border-slate-200 overflow-hidden w-32 h-32">
                <img src={previewImage || form.image_url} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setModal(false)}
              className="flex-1 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition"
            >
              {loading ? (imageFile ? "Mengupload gambar..." : "Menyimpan...") : "Simpan"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}