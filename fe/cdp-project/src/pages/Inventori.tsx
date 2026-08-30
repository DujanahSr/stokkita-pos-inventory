import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../api/axios";
import { PackageSearch, MapPin, ArrowRightLeft, X } from "lucide-react";

const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v);

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
    if (activeTab === "mutasi") {
      fetchTransfers();
    } else if (activeTab === "opname") {
      fetchOpnames(selectedW);
    }
  }, [activeTab, selectedW]);

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
      alert(`Stock Opname berhasil disimpan! Selisih tercatat: ${res.data.difference > 0 ? `+${res.data.difference}` : res.data.difference}`);
      setIsOpnameModalOpen(false);
      fetchInventory(selectedW);
      fetchOpnames(selectedW);
      setOpnameForm({ variant_id: "", actual_qty: 0, reason: "" });
    } catch (err: any) {
      setOpnameError(err.response?.data?.message || err.response?.data?.error || "Gagal melakukan opname");
    } finally {
      setLoadingOpname(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedW) {
      fetchInventory(selectedW);
    }
  }, [selectedW]);

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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError("");
    setLoadingTransfer(true);
    try {
      await api.post("/master/transfer", {
        from_warehouse_id: selectedW,
        to_warehouse_id: transferForm.to_warehouse_id,
        variant_id: transferForm.variant_id,
        qty: Number(transferForm.qty)
      });
      alert("Mutasi stok berhasil!");
      setIsModalOpen(false);
      fetchInventory(selectedW);
      fetchTransfers();
      setTransferForm({ to_warehouse_id: "", variant_id: "", qty: 0 });
    } catch (err: any) {
      setTransferError(err.response?.data?.message || "Gagal mutasi stok");
    } finally {
      setLoadingTransfer(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Inventori" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800">
                  <PackageSearch className="text-emerald-600" size={32} />
                  Sistem Manajemen Gudang (WMS)
                </h1>
                <p className="text-slate-500 mt-1">Multi-Warehouse Inventory & Variant Management</p>
              </div>

              <div className="flex bg-slate-200 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("stok")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'stok' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Stok Gudang
                </button>
                <button
                  onClick={() => setActiveTab("mutasi")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'mutasi' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Riwayat Mutasi
                </button>
                <button
                  onClick={() => setActiveTab("opname")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'opname' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Stock Opname
                </button>
              </div>
            </div>

            {activeTab === "stok" && (
              <>
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin size={20} className="text-emerald-500" />
                    <span className="font-semibold">Pilih Lokasi Gudang:</span>
                    <select 
                      className="bg-slate-50 border border-slate-200 p-2 rounded-lg font-medium focus:ring-2 focus:ring-emerald-500 outline-none ml-2"
                      value={selectedW}
                      onChange={e => setSelectedW(e.target.value)}
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsOpnameModalOpen(true)}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                    >
                      <PackageSearch size={18} />
                      Lakukan Opname
                    </button>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                    >
                      <ArrowRightLeft size={18} />
                      Mutasi Stok (Transfer)
                    </button>
                  </div>
                </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100 text-sm">
                      <th className="pb-3 font-semibold">Varian</th>
                      <th className="pb-3 font-semibold">Harga Jual</th>
                      <th className="pb-3 font-semibold text-center">Stok Fisik</th>
                      <th className="pb-3 font-semibold text-center">Teknik Industri (EOQ/ROP)</th>
                      <th className="pb-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {inventory.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada barang di gudang ini.</td>
                       </tr>
                    ) : inventory.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4">
                          <div className="font-semibold text-slate-800">{i.product_name}</div>
                          <div className="text-sm text-slate-500">{i.color} &bull; {i.size}</div>
                        </td>
                        <td className="py-4 text-emerald-600 font-medium">{fmt(i.price_sell)}</td>
                        <td className="py-4 text-center text-xl font-bold text-slate-700">
                           {i.qty}
                        </td>
                        <td className="py-4 text-center">
                           <div className="inline-block text-left text-sm bg-slate-50 border border-slate-100 rounded-lg p-2">
                             <div><span className="text-slate-400">EOQ:</span> <span className="font-bold text-slate-700">{i.eoq}</span></div>
                             <div><span className="text-slate-400">ROP:</span> <span className="font-bold text-slate-700">{i.rop}</span></div>
                           </div>
                        </td>
                        <td className="py-4 text-center">
                          {i.qty <= i.rop ? (
                             <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 border border-red-200">
                               Re-stock
                             </span>
                          ) : (
                             <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-600 border border-emerald-200">
                               Aman
                             </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </>
            )}

            {activeTab === "mutasi" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Riwayat Mutasi Barang</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-100 text-sm">
                        <th className="pb-3 font-semibold">Tanggal</th>
                        <th className="pb-3 font-semibold">Produk</th>
                        <th className="pb-3 font-semibold">Dari Gudang</th>
                        <th className="pb-3 font-semibold">Ke Gudang</th>
                        <th className="pb-3 font-semibold text-center">Qty Mutasi</th>
                        <th className="pb-3 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transfers.length === 0 ? (
                         <tr>
                           <td colSpan={6} className="py-8 text-center text-slate-400">Belum ada riwayat mutasi.</td>
                         </tr>
                      ) : transfers.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-sm text-slate-600">
                            {new Date(t.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="py-4">
                            <div className="font-semibold text-slate-800">{t.product_name}</div>
                            <div className="text-sm text-slate-500">{t.color} &bull; {t.size}</div>
                          </td>
                          <td className="py-4 font-medium text-slate-700">{t.from_warehouse}</td>
                          <td className="py-4 font-medium text-slate-700">{t.to_warehouse}</td>
                          <td className="py-4 text-center font-bold text-slate-800 text-lg">{t.qty}</td>
                          <td className="py-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "opname" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Riwayat Stock Opname (Audit Fisik)</h2>
                    <p className="text-sm text-slate-500">Log penyesuaian stok sistem dengan stok riil di gudang</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin size={18} className="text-amber-500" />
                      <select 
                        className="bg-slate-50 border border-slate-200 p-2 rounded-lg font-medium focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                        value={selectedW}
                        onChange={e => setSelectedW(e.target.value)}
                      >
                        <option value="">Semua Gudang</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={() => setIsOpnameModalOpen(true)}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm text-sm"
                    >
                      <PackageSearch size={16} />
                      Lakukan Opname
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-100 text-sm">
                        <th className="pb-3 font-semibold">Tanggal & Waktu</th>
                        <th className="pb-3 font-semibold">Gudang</th>
                        <th className="pb-3 font-semibold">Produk</th>
                        <th className="pb-3 font-semibold text-center">Stok Sistem</th>
                        <th className="pb-3 font-semibold text-center">Stok Fisik</th>
                        <th className="pb-3 font-semibold text-center">Selisih</th>
                        <th className="pb-3 font-semibold">Alasan / Catatan</th>
                        <th className="pb-3 font-semibold">Petugas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {opnames.length === 0 ? (
                         <tr>
                           <td colSpan={8} className="py-8 text-center text-slate-400">Belum ada riwayat stock opname tercatat.</td>
                         </tr>
                      ) : opnames.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-sm text-slate-600 whitespace-nowrap">
                            {new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="py-4 text-sm font-medium text-slate-700">
                            {o.warehouse_name || warehouses.find(w => w.id === o.warehouse_id)?.name || "-"}
                          </td>
                          <td className="py-4">
                            <div className="font-semibold text-slate-800">{o.product_name}</div>
                            <div className="text-xs text-slate-500">
                              SKU: {o.sku} {o.color ? `• ${o.color}` : ''} {o.size ? `• ${o.size}` : ''}
                            </div>
                          </td>
                          <td className="py-4 text-center font-medium text-slate-500">{o.expected_qty}</td>
                          <td className="py-4 text-center font-bold text-slate-800 text-base">{o.actual_qty}</td>
                          <td className="py-4 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[3.5rem] px-2.5 py-1 rounded-full text-xs font-bold ${
                              o.difference < 0 ? 'bg-red-100 text-red-700 border border-red-200' :
                              o.difference > 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {o.difference > 0 ? `+${o.difference}` : o.difference}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-600 max-w-xs truncate">{o.reason || "-"}</td>
                          <td className="py-4 text-xs font-medium text-slate-500">{o.created_by_name || "Admin"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Mutasi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Mutasi Stok Gudang</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            {transferError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gudang Asal</label>
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium">
                  {warehouses.find(w => w.id === selectedW)?.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Produk (Varian)</label>
                <select
                  required
                  value={transferForm.variant_id}
                  onChange={(e) => setTransferForm({ ...transferForm, variant_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">-- Pilih Varian --</option>
                  {inventory.filter(i => i.qty > 0).map((i) => (
                    <option key={i.variant_id} value={i.variant_id}>
                      {i.product_name} ({i.color} - {i.size}) - Stok: {i.qty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kuantitas (Qty)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transferForm.qty || ""}
                  onChange={(e) => setTransferForm({ ...transferForm, qty: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gudang Tujuan</label>
                <select
                  required
                  value={transferForm.to_warehouse_id}
                  onChange={(e) => setTransferForm({ ...transferForm, to_warehouse_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">-- Pilih Gudang Tujuan --</option>
                  {warehouses.filter(w => w.id !== selectedW).map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingTransfer}
                  className="flex-1 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors disabled:opacity-70"
                >
                  {loadingTransfer ? "Memproses..." : "Transfer Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Opname */}
      {isOpnameModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Stock Opname</h2>
              <button onClick={() => setIsOpnameModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            {opnameError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {opnameError}
              </div>
            )}

            <form onSubmit={handleOpname} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gudang</label>
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium">
                  {warehouses.find(w => w.id === selectedW)?.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Produk (Varian)</label>
                <select
                  required
                  value={opnameForm.variant_id}
                  onChange={(e) => setOpnameForm({ ...opnameForm, variant_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">-- Pilih Varian --</option>
                  {inventory.map((i) => (
                    <option key={i.variant_id} value={i.variant_id}>
                      {i.product_name} ({i.color} - {i.size})
                    </option>
                  ))}
                </select>
              </div>

              {opnameForm.variant_id && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Stok Sistem Saat Ini:</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {inventory.find(i => i.variant_id === opnameForm.variant_id)?.qty || 0}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stok Fisik Riil (Hasil Hitung)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={opnameForm.actual_qty === 0 && opnameForm.variant_id === "" ? "" : opnameForm.actual_qty}
                  onChange={(e) => setOpnameForm({ ...opnameForm, actual_qty: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-lg font-bold"
                  placeholder="0"
                />
              </div>

              {opnameForm.variant_id && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Selisih: <strong className={
                    (opnameForm.actual_qty - (inventory.find(i => i.variant_id === opnameForm.variant_id)?.qty || 0)) < 0 
                      ? 'text-red-600' : (opnameForm.actual_qty - (inventory.find(i => i.variant_id === opnameForm.variant_id)?.qty || 0)) > 0 
                      ? 'text-emerald-600' : 'text-slate-600'
                  }>
                    {(opnameForm.actual_qty - (inventory.find(i => i.variant_id === opnameForm.variant_id)?.qty || 0)) > 0 ? '+' : ''}
                    {opnameForm.actual_qty - (inventory.find(i => i.variant_id === opnameForm.variant_id)?.qty || 0)}
                  </strong></p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alasan / Catatan (Opsional)</label>
                <input
                  type="text"
                  value={opnameForm.reason}
                  onChange={(e) => setOpnameForm({ ...opnameForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Misal: Barang rusak, salah hitung sebelumnya"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpnameModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingOpname}
                  className="flex-1 px-4 py-2 text-white bg-amber-500 hover:bg-amber-600 rounded-lg font-medium transition-colors disabled:opacity-70"
                >
                  {loadingOpname ? "Menyimpan..." : "Simpan Opname"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
