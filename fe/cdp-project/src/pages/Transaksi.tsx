import { useEffect, useState, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Modal from "../components/ui/Modal";
import api from "../api/axios";
import { Receipt, Plus, Trash2, Store, Printer, Barcode } from "lucide-react";

const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v);

export default function Transaksi() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedW, setSelectedW] = useState<string>("");
  const [inventory, setInventory] = useState<any[]>([]);
  
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  // Form
  const [tipe, setTipe] = useState("Penjualan");
  const [cart, setCart] = useState<{ variant_id: string; qty: number; price: number; name: string }[]>([]);

  useEffect(() => {
    fetchWarehouses();
    fetchTransaksi();
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

  const fetchTransaksi = async () => {
    try {
      const res = await api.get("/transaksi");
      setTransaksiList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Keranjang kosong!");
    if (!selectedW) return alert("Pilih cabang toko dulu!");

    try {
      const res = await api.post("/transaksi", {
        warehouse_id: selectedW,
        type: tipe,
        items: cart.map(c => ({ variant_id: c.variant_id, qty: c.qty, price: c.price }))
      });
      setIsModalOpen(false);
      
      // Set Receipt Data for printing
      setReceiptData({
          transaction_id: res.data.transaction_id,
          date: new Date().toLocaleString('id-ID'),
          kasir: "Kasir (Current User)",
          warehouse: warehouses.find(w => w.id === selectedW)?.name || "",
          items: cart,
          total: cartTotal,
          type: tipe
      });

      fetchTransaksi();
      fetchInventory(selectedW);
      setCart([]);
      
    } catch (err: any) {
      alert("Gagal memproses transaksi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddToCart = (vid: string, e?: React.ChangeEvent<HTMLSelectElement>) => {
    if (!vid) return;
    const inv = inventory.find(i => i.variant_id === vid);
    if (!inv) {
        if (e) e.target.value = "";
        return;
    }
    
    if (tipe === 'Penjualan' && inv.qty <= 0) {
        alert("Stok kosong!");
        if (e) e.target.value = "";
        return;
    }

    const existing = cart.find(c => c.variant_id === vid);
    if (existing) {
      if (tipe === 'Penjualan' && existing.qty >= inv.qty) {
          alert("Stok tidak mencukupi!");
          if (e) e.target.value = "";
          return;
      }
      setCart(cart.map(c => c.variant_id === vid ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { variant_id: inv.variant_id, qty: 1, price: inv.price_sell, name: `${inv.product_name} (${inv.sku})` }]);
    }
    if (e) e.target.value = "";
  };

  const handleScanBarcode = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const scanned = barcodeInput.trim();
      if (!scanned) return;
      const inv = inventory.find(i => i.sku === scanned);
      if (inv) {
        handleAddToCart(inv.variant_id);
      } else {
        alert(`Produk dengan Barcode/SKU ${scanned} tidak ditemukan!`);
      }
      setBarcodeInput("");
    }
  };

  const removeCart = (vid: string) => setCart(cart.filter(c => c.variant_id !== vid));
  
  const updateQty = (vid: string, qty: number) => {
      const inv = inventory.find(i => i.variant_id === vid);
      if (tipe === 'Penjualan' && inv && qty > inv.qty) {
          alert("Maksimal stok: " + inv.qty);
          return;
      }
      setCart(cart.map(c => c.variant_id === vid ? { ...c, qty } : c));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.qty * c.price, 0);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Kasir SaaS" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800">
                  <Receipt className="text-emerald-600" size={32} />
                  Mesin Kasir (POS)
                </h1>
                <p className="text-slate-500 mt-1">Transaksi multi-cabang terintegrasi</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm"
              >
                <Plus size={20} /> Transaksi Baru
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-slate-800">Riwayat Transaksi Terakhir</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200 text-sm">
                      <th className="pb-3 font-semibold">Tanggal</th>
                      <th className="pb-3 font-semibold">Cabang/Gudang</th>
                      <th className="pb-3 font-semibold">Tipe</th>
                      <th className="pb-3 font-semibold">Kasir</th>
                      <th className="pb-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transaksiList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 text-sm text-slate-600">{new Date(t.created_at).toLocaleString('id-ID')}</td>
                        <td className="py-4 font-medium text-emerald-700">{t.warehouse_name}</td>
                        <td className="py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${t.type==='Retur'?'bg-red-50 text-red-600 border border-red-100':'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                {t.type}
                            </span>
                        </td>
                        <td className="py-4 text-slate-600 text-sm">{t.kasir_name}</td>
                        <td className="py-4 text-right font-bold text-slate-800">{fmt(t.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isSuccessModal && (
          <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl animate-bounce">
              Transaksi Berhasil Disimpan!
          </div>
      )}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Kasir Toko Cabang">
        <form onSubmit={handleSimpan} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Toko / Cabang</label>
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-2.5">
                        <Store size={18} className="text-emerald-600" />
                        <select 
                            className="bg-transparent w-full focus:outline-none text-slate-700" 
                            value={selectedW} 
                            onChange={e => setSelectedW(e.target.value)}
                        >
                            <option value="">-- Pilih Cabang --</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Transaksi</label>
                    <select 
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={tipe} onChange={e => setTipe(e.target.value)}
                    >
                        <option value="Penjualan">Penjualan (Kasir)</option>
                        <option value="Retur">Retur Pembeli</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scan Barcode / SKU</label>
                <div className="flex items-center gap-2 mb-3 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 focus-within:ring-2 focus-within:ring-emerald-500">
                    <Barcode size={20} className="text-emerald-600" />
                    <input 
                        type="text"
                        ref={barcodeInputRef}
                        value={barcodeInput}
                        onChange={e => setBarcodeInput(e.target.value)}
                        onKeyDown={handleScanBarcode}
                        placeholder="Klik disini dan Scan barcode (Tekan Enter)..."
                        className="bg-transparent w-full focus:outline-none text-slate-800 placeholder:text-emerald-600/50 font-medium"
                    />
                </div>

                <label className="block text-sm font-medium text-slate-700 mb-1">Atau Pilih Manual dari Katalog</label>
                <select 
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                    onChange={e => handleAddToCart(e.target.value, e)}
                    defaultValue=""
                >
                    <option value="" disabled>+ Tambah produk ke keranjang</option>
                    {inventory.map(inv => (
                        <option key={inv.variant_id} value={inv.variant_id}>
                            {inv.sku} - {inv.product_name} ({inv.size} {inv.color}) - Stok: {inv.qty}
                        </option>
                    ))}
                </select>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="p-3 font-semibold">Produk</th>
                            <th className="p-3 font-semibold w-20">Qty</th>
                            <th className="p-3 font-semibold text-right">Harga</th>
                            <th className="p-3 font-semibold text-right">Subtotal</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {cart.length === 0 && (
                            <tr><td colSpan={5} className="p-4 text-center text-slate-400">Keranjang kosong</td></tr>
                        )}
                        {cart.map(c => (
                            <tr key={c.variant_id}>
                                <td className="p-3 text-slate-800 font-medium truncate max-w-[150px]">{c.name}</td>
                                <td className="p-3">
                                    <input 
                                        type="number" min="1" 
                                        className="w-full bg-white border border-slate-300 rounded p-1 text-slate-800 text-center focus:ring-1 focus:ring-emerald-500"
                                        value={c.qty}
                                        onChange={e => updateQty(c.variant_id, parseInt(e.target.value) || 1)}
                                    />
                                </td>
                                <td className="p-3 text-right text-slate-600">{fmt(c.price)}</td>
                                <td className="p-3 text-right font-semibold text-slate-800">{fmt(c.price * c.qty)}</td>
                                <td className="p-3 text-center">
                                    <button type="button" onClick={() => removeCart(c.variant_id)} className="text-red-500 hover:text-red-700 p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-semibold text-slate-600">Total Pembayaran</span>
                    <span className="text-xl font-bold text-emerald-700">{fmt(cartTotal)}</span>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors font-medium border border-transparent">Batal</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all">Selesaikan Transaksi</button>
            </div>
        </form>
      </Modal>

      {/* MODAL STRUK (RECEIPT) */}
      {receiptData && (
        <Modal open={!!receiptData} onClose={() => setReceiptData(null)} title="Struk Pembayaran">
            <div className="flex flex-col items-center">
                <div id="print-receipt" className="bg-white p-4 w-full max-w-sm text-sm border border-slate-200">
                    <div className="text-center font-bold text-lg mb-1">{receiptData.warehouse}</div>
                    <div className="text-center text-xs mb-4">Waktu: {receiptData.date}</div>
                    <div className="text-xs mb-2">Trx ID: {receiptData.transaction_id}</div>
                    <div className="text-xs mb-4">Kasir: {receiptData.kasir}</div>
                    <div className="border-t border-dashed border-slate-400 my-2"></div>
                    
                    <table className="w-full text-xs">
                        <tbody>
                            {receiptData.items.map((item: any) => (
                                <tr key={item.variant_id}>
                                    <td className="py-1">{item.name} <br/> <span className="text-[10px] text-slate-500">{item.qty} x {fmt(item.price)}</span></td>
                                    <td className="py-1 text-right align-bottom">{fmt(item.qty * item.price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="border-t border-dashed border-slate-400 my-2"></div>
                    <div className="flex justify-between font-bold text-sm">
                        <span>TOTAL</span>
                        <span>{fmt(receiptData.total)}</span>
                    </div>
                    <div className="text-center text-xs mt-6">
                        Terima kasih atas kunjungan Anda
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 w-full max-w-sm">
                    <button type="button" onClick={() => setReceiptData(null)} className="px-5 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium">Tutup</button>
                    <button type="button" onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2">
                        <Printer size={18} /> Cetak Struk
                    </button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
}
