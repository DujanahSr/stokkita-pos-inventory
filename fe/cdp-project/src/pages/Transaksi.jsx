import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import api from "../api/axios";
import { Plus, Trash2, Printer, Calendar, ArrowLeftRight, Package, Hash, Coins } from "lucide-react";

const fmt = (v) => "Rp " + new Intl.NumberFormat("id-ID").format(v);
const fmtDate = (d) => new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function Transaksi() {
  const [transaksi, setTransaksi] = useState([]);
  const [produk, setProduk] = useState([]);
  const [modal, setModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [createdTransaksi, setCreatedTransaksi] = useState(null);
  const [form, setForm] = useState({ tanggal: new Date().toISOString().slice(0, 16), tipe: "Penjualan", produk_id: "", qty: "", harga_satuan: "" });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [transaksiRes, produkRes] = await Promise.all([
        api.get("/transaksi"),
        api.get("/produk"),
      ]);
      setTransaksi(transaksiRes.data);
      setProduk(produkRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat transaksi");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleProdukChange = (id) => {
    const p = produk.find((x) => x.id === id);
    setForm({ ...form, produk_id: id, harga_satuan: p ? (form.tipe === "Penjualan" ? p.harga_jual : p.harga_beli) : "" });
  };

  const handleSave = async () => {
    const p = produk.find((x) => x.id === form.produk_id);
    setLoading(true);
    try {
      const res = await api.post("/transaksi", { ...form, produk_nama: p?.nama || "" });
      const created = res.data;
      setCreatedTransaksi(created);
      setModal(false);
      setSuccessModal(true);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus transaksi ini?")) return;
    await api.delete(`/transaksi/${id}`);
    load();
  };

  const handlePrint = async (id) => {
    try {
      const res = await api.get(`/transaksi/${id}/receipt`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // revoke after some time
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat struk');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0">
        <Navbar title="Transaksi" />
        <main className="p-6 space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Tambah Transaksi
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {initialLoading ? (
              <div className="flex h-56 items-center justify-center text-slate-400">Memuat transaksi...</div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Tanggal</th>
                    <th className="text-left px-4 py-3">Tipe</th>
                    <th className="text-left px-4 py-3">Produk</th>
                    <th className="text-right px-4 py-3">Qty</th>
                    <th className="text-right px-4 py-3">Harga Satuan</th>
                    <th className="text-right px-4 py-3">Total</th>
                    <th className="text-center px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transaksi.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-slate-400">Belum ada transaksi</td></tr>
                  )}
                  {transaksi.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(t.tanggal)}</td>
                      <td className="px-4 py-3"><Badge status={t.tipe} /></td>
                      <td className="px-4 py-3 font-medium text-slate-800">{t.produk_nama}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{t.qty}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{fmt(t.harga_satuan)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(t.total)}</td>
                      <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                        <button onClick={() => handlePrint(t.id)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition" title="Cetak Struk">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
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

      <Modal open={modal} onClose={() => setModal(false)} title="Tambah Transaksi">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tanggal & Waktu</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="datetime-local" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipe</label>
            <div className="relative">
              <ArrowLeftRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                <option value="Penjualan">Penjualan</option>
                <option value="PO Diterima">PO Diterima</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Produk</label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={form.produk_id} onChange={(e) => handleProdukChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none">
                <option value="">Pilih produk</option>
                {produk.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Qty</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Harga Satuan</label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" value={form.harga_satuan} onChange={(e) => setForm({ ...form, harga_satuan: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>
          {form.qty && form.harga_satuan && (
            <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              Total: {fmt(form.qty * form.harga_satuan)}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModal(false)} className="flex-1 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition">Batal</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition">
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={successModal} onClose={() => { setSuccessModal(false); setCreatedTransaksi(null); }} title="Transaksi Berhasil">
        <div className="space-y-3">
          <p className="text-sm text-slate-700">Transaksi berhasil disimpan.</p>
          {createdTransaksi && (
            <div className="text-sm text-slate-600">
              <p>Produk: <span className="font-medium">{createdTransaksi.produk_nama}</span></p>
              <p>Qty: <span className="font-medium">{createdTransaksi.qty}</span></p>
              <p>Total: <span className="font-medium">{fmt(createdTransaksi.total)}</span></p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={() => { setSuccessModal(false); setCreatedTransaksi(null); }} className="flex-1 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-50 transition">Tutup</button>
            <button onClick={() => { if (createdTransaksi) handlePrint(createdTransaksi.id); }} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition">Cetak Struk</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}