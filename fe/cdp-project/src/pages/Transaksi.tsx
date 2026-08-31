import { useEffect, useState, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Modal from "../components/ui/Modal";
import QRCodeSVG from "../components/ui/QRCodeSVG";
import api from "../api/axios";
import { 
  Receipt, Plus, Trash2, Store, Printer, Barcode, 
  Wallet, QrCode, CreditCard, Layers, Clock, CheckCircle2, 
  AlertCircle, ShieldCheck, DollarSign, ArrowRight, Lock,
  Pause, Play, ShoppingCart, Bookmark
} from "lucide-react";

interface HeldCart {
  id: string;
  name: string;
  notes?: string;
  items: { variant_id: string; qty: number; price: number; name: string }[];
  total: number;
  held_at: string;
  warehouse_id: string;
  warehouse_name?: string;
}

const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

export default function Transaksi() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedW, setSelectedW] = useState<string>("");
  const [inventory, setInventory] = useState<any[]>([]);
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  
  // Shift Management State
  const [activeShift, setActiveShift] = useState<any>(null);
  const [isOpenShiftModal, setIsOpenShiftModal] = useState(false);
  const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);
  const [startCashInput, setStartCashInput] = useState<number | "">(100000);
  const [endCashActualInput, setEndCashActualInput] = useState<number | "">("");
  const [shiftNotes, setShiftNotes] = useState("");
  const [zReportData, setZReportData] = useState<any>(null);
  const [loadingShift, setLoadingShift] = useState(false);

  // Cart & POS Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [tipe, setTipe] = useState("Penjualan");
  const [cart, setCart] = useState<{ variant_id: string; qty: number; price: number; name: string }[]>([]);

  // Multi-Cart / Hold Transaction State
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => {
    try {
      const saved = localStorage.getItem("stokkita_held_carts");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdCartName, setHoldCartName] = useState("");
  const [holdCartNotes, setHoldCartNotes] = useState("");
  const [isHeldListModalOpen, setIsHeldListModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("stokkita_held_carts", JSON.stringify(heldCarts));
    } catch (e) {
      console.error(e);
    }
  }, [heldCarts]);

  // Multi-Payment State
  const [paymentMethod, setPaymentMethod] = useState<"Tunai" | "QRIS" | "Debit" | "Split">("Tunai");
  const [cashReceived, setCashReceived] = useState<number | "">("");
  const [debitBank, setDebitBank] = useState("BCA");
  const [cardLast4, setCardLast4] = useState("");
  const [approvalCode, setApprovalCode] = useState("");
  const [splitCash, setSplitCash] = useState<number | "">("");
  const [splitNonCashMethod, setSplitNonCashMethod] = useState<"QRIS" | "Debit">("QRIS");
  const [qrisSimulatorSuccess, setQrisSimulatorSuccess] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedW) {
      fetchInventory(selectedW);
      fetchActiveShift(selectedW);
      fetchTransaksi(selectedW);
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

  const fetchTransaksi = async (wid?: string) => {
    try {
      const url = wid ? `/transaksi?warehouse_id=${wid}` : "/transaksi";
      const res = await api.get(url);
      setTransaksiList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActiveShift = async (wid: string) => {
    try {
      const res = await api.get(`/shift/active?warehouse_id=${wid}`);
      const shift = res.data.active_shift;
      setActiveShift(shift);
      if (shift && shift.warehouse_id && shift.warehouse_id !== wid) {
        setSelectedW(shift.warehouse_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Shift Handlers
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startCashInput === "" || Number(startCashInput) < 0) {
      return alert("Masukkan nominal modal kas awal yang valid");
    }
    setLoadingShift(true);
    try {
      await api.post("/shift/open", {
        warehouse_id: selectedW,
        start_cash: Number(startCashInput),
        notes: shiftNotes || "Buka Kasir Pagi/Siang"
      });
      alert("Shift kasir berhasil dibuka! Selamat bertugas.");
      setIsOpenShiftModal(false);
      setShiftNotes("");
      fetchActiveShift(selectedW);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal membuka shift kasir");
    } finally {
      setLoadingShift(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    if (endCashActualInput === "" || Number(endCashActualInput) < 0) {
      return alert("Masukkan jumlah fisik uang kas di laci");
    }
    setLoadingShift(true);
    try {
      const res = await api.post("/shift/close", {
        shift_id: activeShift.id,
        end_cash_actual: Number(endCashActualInput),
        notes: shiftNotes || "Tutup Kasir Harian"
      });
      setIsCloseShiftModal(false);
      setZReportData(res.data.z_report);
      setEndCashActualInput("");
      setShiftNotes("");
      fetchActiveShift(selectedW);
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menutup shift kasir");
    } finally {
      setLoadingShift(false);
    }
  };

  // Cart & POS Handlers
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
      const inv = inventory.find(i => i.sku.toLowerCase() === scanned.toLowerCase());
      if (inv) {
        handleAddToCart(inv.variant_id);
      } else {
        alert(`Produk dengan Barcode/SKU "${scanned}" tidak ditemukan!`);
      }
      setBarcodeInput("");
    }
  };

  const removeCart = (vid: string) => setCart(cart.filter(c => c.variant_id !== vid));
  
  const updateQty = (vid: string, qty: number) => {
    const inv = inventory.find(i => i.variant_id === vid);
    if (tipe === 'Penjualan' && inv && qty > inv.qty) {
      alert("Maksimal stok tersedia: " + inv.qty);
      return;
    }
    setCart(cart.map(c => c.variant_id === vid ? { ...c, qty: Math.max(1, qty) } : c));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.qty * c.price, 0);

  // Multi-Cart & Hold Transaksi Handlers
  const handleOpenHoldModal = () => {
    if (cart.length === 0) return alert("Keranjang belanja masih kosong, tidak ada transaksi yang perlu diparkir!");
    const defaultLabel = `Antrean #${heldCarts.length + 1} (${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`;
    setHoldCartName(defaultLabel);
    setHoldCartNotes("");
    setIsHoldModalOpen(true);
  };

  const handleConfirmHoldCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const currentWarehouseName = warehouses.find(w => w.id === selectedW)?.name || "";
    const newHeldCart: HeldCart = {
      id: `HOLD-${Date.now()}`,
      name: holdCartName.trim() || `Antrean #${heldCarts.length + 1}`,
      notes: holdCartNotes.trim() || undefined,
      items: [...cart],
      total: cartTotal,
      held_at: new Date().toISOString(),
      warehouse_id: selectedW,
      warehouse_name: currentWarehouseName
    };

    setHeldCarts(prev => [newHeldCart, ...prev]);
    setCart([]);
    setIsHoldModalOpen(false);
    setIsModalOpen(false);
    alert(`Transaksi "${newHeldCart.name}" berhasil diparkir! Anda dapat melayani antrean pelanggan berikutnya.`);
  };

  const handleRecallCart = (heldCart: HeldCart) => {
    if (cart.length > 0) {
      if (!confirm(`Keranjang kasir saat ini sedang berisi ${cart.length} item. Apakah Anda ingin menimpa keranjang dengan antrean "${heldCart.name}"?`)) {
        return;
      }
    }

    if (heldCart.warehouse_id && heldCart.warehouse_id !== selectedW) {
      setSelectedW(heldCart.warehouse_id);
    }

    setCart([...heldCart.items]);
    setHeldCarts(prev => prev.filter(h => h.id !== heldCart.id));
    setIsHeldListModalOpen(false);
    setIsModalOpen(true);
  };

  const handleDeleteHeldCart = (heldCartId: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin membatalkan dan menghapus antrean terparkir "${name}"?`)) {
      setHeldCarts(prev => prev.filter(h => h.id !== heldCartId));
    }
  };

  // Submit Transaction
  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Keranjang kosong!");
    if (!selectedW) return alert("Pilih cabang toko dulu!");

    // Validate Payment
    let paymentDetailsPayload: any = {};

    if (paymentMethod === "Tunai") {
      const received = Number(cashReceived) || cartTotal;
      if (received < cartTotal) {
        return alert(`Nominal uang tunai kurang! Total belanja: ${fmt(cartTotal)}, Uang diterima: ${fmt(received)}`);
      }
      paymentDetailsPayload = {
        cash_received: received,
        change: received - cartTotal
      };
    } else if (paymentMethod === "QRIS") {
      paymentDetailsPayload = {
        qris_id: `QRIS-${Date.now().toString().slice(-6)}`,
        status: "PAID",
        payment_gateway: "Simulator QRIS Sandbox",
        paid_at: new Date().toISOString()
      };
    } else if (paymentMethod === "Debit") {
      paymentDetailsPayload = {
        bank: debitBank,
        card_last4: cardLast4 || "8888",
        approval_code: approvalCode || `APV-${Math.floor(100000 + Math.random() * 900000)}`
      };
    } else if (paymentMethod === "Split") {
      const cashPart = Number(splitCash) || 0;
      const nonCashPart = cartTotal - cashPart;
      if (cashPart <= 0 || cashPart >= cartTotal) {
        return alert("Pada Split Payment, nominal tunai harus lebih dari 0 dan kurang dari total belanja!");
      }
      paymentDetailsPayload = {
        split: [
          { method: "Tunai", amount: cashPart },
          { method: splitNonCashMethod, amount: nonCashPart, ref: `${splitNonCashMethod}-${Date.now().toString().slice(-4)}` }
        ]
      };
    }

    setLoadingSubmit(true);
    try {
      const res = await api.post("/transaksi", {
        warehouse_id: selectedW,
        type: tipe,
        items: cart.map(c => ({ variant_id: c.variant_id, qty: c.qty, price: c.price })),
        payment_method: paymentMethod,
        payment_details: paymentDetailsPayload
      });

      setIsModalOpen(false);
      
      // Set Receipt Data for printing
      setReceiptData({
        transaction_id: res.data.transaction_id,
        date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        kasir: activeShift?.cashier_name || "Kasir Toko",
        warehouse: warehouses.find(w => w.id === selectedW)?.name || "",
        items: [...cart],
        total: cartTotal,
        type: tipe,
        payment_method: paymentMethod,
        payment_details: paymentDetailsPayload
      });

      fetchTransaksi();
      fetchInventory(selectedW);
      fetchActiveShift(selectedW);
      setCart([]);
      setCashReceived("");
      setCardLast4("");
      setApprovalCode("");
      setSplitCash("");
      setQrisSimulatorSuccess(false);
      
    } catch (err: any) {
      alert("Gagal memproses transaksi: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleOpenTransactionModal = () => {
    if (!activeShift) {
      if (confirm("Shift kasir belum dibuka. Buka shift kasir terlebih dahulu untuk mulai melayani transaksi?")) {
        setIsOpenShiftModal(true);
      }
      return;
    }
    setCashReceived(cartTotal || "");
    setSplitCash(cartTotal ? Math.floor(cartTotal / 2) : "");
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Kasir SaaS & POS" />
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header & Warehouse Selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-800">
                  <Receipt className="text-emerald-600" size={32} />
                  Mesin Kasir (POS Enterprise)
                </h1>
                <p className="text-slate-500 mt-1">Multi-Payment, QRIS Sandbox, Split Payment & Cash Drawer Reconciliation</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div 
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl shadow-sm border transition-all ${
                    activeShift 
                      ? 'bg-amber-50/70 border-amber-300' 
                      : 'bg-white border-slate-200'
                  }`}
                  title={activeShift ? "Cabang toko terkunci selama shift kasir aktif. Tutup shift terlebih dahulu untuk berpindah cabang." : "Pilih cabang toko"}
                >
                  {activeShift ? (
                    <Lock size={18} className="text-amber-600" />
                  ) : (
                    <Store size={18} className="text-emerald-600" />
                  )}
                  <select 
                    disabled={!!activeShift}
                    className={`bg-transparent font-medium outline-none text-sm ${
                      activeShift ? 'text-amber-900 cursor-not-allowed font-semibold' : 'text-slate-700 cursor-pointer'
                    }`}
                    value={selectedW} 
                    onChange={e => setSelectedW(e.target.value)}
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                  {activeShift && (
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded">Terkunci</span>
                  )}
                </div>

                {/* Tombol Antrean Diparkir */}
                <button
                  type="button"
                  onClick={() => setIsHeldListModalOpen(true)}
                  className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-sm border ${
                    heldCarts.length > 0
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <Pause size={16} />
                  <span>Antrean Diparkir</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    heldCarts.length > 0 ? 'bg-white text-amber-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {heldCarts.length}
                  </span>
                </button>

                <button 
                  onClick={handleOpenTransactionModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-sm"
                >
                  <Plus size={18} /> Transaksi Baru
                </button>
              </div>
            </div>

            {/* Shift Status Banner */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm ${
              activeShift 
                ? 'bg-emerald-50/70 border-emerald-200' 
                : 'bg-amber-50/80 border-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${activeShift ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                  {activeShift ? <Clock size={22} /> : <AlertCircle size={22} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      {activeShift ? "Status Shift: AKTIF" : "Status Shift: BELUM DIBUKA"}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      activeShift ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {activeShift ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {activeShift 
                      ? `Kasir: ${activeShift.cashier_name || 'Admin'} • Modal Awal Kas: ${fmt(Number(activeShift.start_cash))} • Total Omset Shift: ${fmt(Number(activeShift.total_sales))}`
                      : "Harap buka shift dan masukkan modal uang laci kasir sebelum melayani transaksi."
                    }
                  </p>
                </div>
              </div>

              <div>
                {activeShift ? (
                  <button
                    onClick={() => setIsCloseShiftModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <ShieldCheck size={16} /> Tutup Shift (Z-Report)
                  </button>
                ) : (
                  <button
                    onClick={() => setIsOpenShiftModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <DollarSign size={16} /> Buka Shift Kasir
                  </button>
                )}
              </div>
            </div>

            {/* Banner Antrean Tertahan jika ada */}
            {heldCarts.length > 0 && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex justify-between items-center text-xs text-amber-900 shadow-sm">
                <div className="flex items-center gap-2">
                  <Pause size={16} className="text-amber-600 flex-shrink-0" />
                  <span>
                    Terdapat <strong>{heldCarts.length} antrean transaksi</strong> yang sedang ditahan/diparkir.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHeldListModalOpen(true)}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                >
                  <Play size={13} /> Buka Daftar Antrean
                </button>
              </div>
            )}

            {/* Table Riwayat Transaksi */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800">Riwayat Transaksi Kasir</h2>
                <span className="text-xs text-slate-500">Menampilkan 50 transaksi terakhir</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100 text-sm">
                      <th className="pb-3 font-semibold">Waktu</th>
                      <th className="pb-3 font-semibold">Cabang / Gudang</th>
                      <th className="pb-3 font-semibold">Tipe</th>
                      <th className="pb-3 font-semibold">Metode Bayar</th>
                      <th className="pb-3 font-semibold">Kasir</th>
                      <th className="pb-3 text-right font-semibold">Total Belanja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transaksiList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">Belum ada riwayat transaksi.</td>
                      </tr>
                    ) : transaksiList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 text-sm text-slate-600 whitespace-nowrap">
                          {new Date(t.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="py-4 font-medium text-slate-700">{t.warehouse_name}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            t.type === 'Retur' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            t.payment_method === 'QRIS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            t.payment_method === 'Debit' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            t.payment_method === 'Split' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {t.payment_method || 'Tunai'}
                          </span>
                        </td>
                        <td className="py-4 text-slate-600 text-sm">{t.kasir_name || "Kasir"}</td>
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

      {/* MODAL 1: BUKA SHIFT KASIR */}
      {isOpenShiftModal && (
        <Modal open={isOpenShiftModal} onClose={() => setIsOpenShiftModal(false)} title="Buka Shift Kasir Baru">
          <form onSubmit={handleOpenShift} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
              <span>Masukkan uang kas awal yang ada di laci sebagai modal kembalian transaksi.</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cabang / Toko</label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium">
                {warehouses.find(w => w.id === selectedW)?.name}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modal Kas Awal Laci (Float Cash)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-medium text-sm">Rp</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={startCashInput}
                  onChange={e => setStartCashInput(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="100000"
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Shift (Opsional)</label>
              <input
                type="text"
                value={shiftNotes}
                onChange={e => setShiftNotes(e.target.value)}
                placeholder="Misal: Shift Pagi Kasir 1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-emerald-500 outline-none text-sm"
              />
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpenShiftModal(false)}
                className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loadingShift}
                className="flex-1 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors disabled:opacity-60"
              >
                {loadingShift ? "Membuka..." : "Buka Shift Kasir"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: TUTUP SHIFT KASIR (Z-REPORT) */}
      {isCloseShiftModal && activeShift && (
        <Modal open={isCloseShiftModal} onClose={() => setIsCloseShiftModal(false)} title="Tutup Shift Kasir (Z-Report)">
          <form onSubmit={handleCloseShift} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir Bertugas:</span>
                <span className="font-semibold text-slate-800">{activeShift.cashier_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Modal Kas Awal:</span>
                <span className="font-semibold text-slate-800">{fmt(Number(activeShift.start_cash))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penjualan Tunai:</span>
                <span className="font-semibold text-emerald-700">+{fmt(Number(activeShift.total_cash_sales))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penjualan Non-Tunai (QRIS/Debit):</span>
                <span className="font-semibold text-blue-700">+{fmt(Number(activeShift.total_non_cash_sales))}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm">
                <span className="text-slate-700">Kas Seharusnya di Laci:</span>
                <span className="text-emerald-800">{fmt(Number(activeShift.start_cash) + Number(activeShift.total_cash_sales))}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Fisik Uang di Laci (Hasil Hitung)</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-medium text-sm">Rp</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={endCashActualInput}
                  onChange={e => setEndCashActualInput(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-bold text-lg text-slate-800"
                />
              </div>
            </div>

            {endCashActualInput !== "" && (
              <div className="p-3 rounded-lg border text-sm flex justify-between items-center font-medium bg-slate-50 border-slate-200">
                <span>Selisih Rekonsiliasi:</span>
                <span className={`font-bold ${
                  (Number(endCashActualInput) - (Number(activeShift.start_cash) + Number(activeShift.total_cash_sales))) === 0 ? 'text-emerald-600' :
                  (Number(endCashActualInput) - (Number(activeShift.start_cash) + Number(activeShift.total_cash_sales))) > 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {(Number(endCashActualInput) - (Number(activeShift.start_cash) + Number(activeShift.total_cash_sales))) > 0 ? '+' : ''}
                  {fmt(Number(endCashActualInput) - (Number(activeShift.start_cash) + Number(activeShift.total_cash_sales)))}
                </span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Penutupan</label>
              <input
                type="text"
                value={shiftNotes}
                onChange={e => setShiftNotes(e.target.value)}
                placeholder="Misal: Uang diserahkan ke brankas toko"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-red-500 outline-none text-sm"
              />
            </div>

            <div className="pt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setIsCloseShiftModal(false)}
                className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loadingShift}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors disabled:opacity-60"
              >
                {loadingShift ? "Menutup..." : "Tutup Shift & Rekonsiliasi"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: Z-REPORT PRINTABLE SHEET */}
      {zReportData && (
        <Modal open={!!zReportData} onClose={() => setZReportData(null)} title="Laporan Tutup Kasir (Z-Report)">
          <div className="flex flex-col items-center">
            <div id="print-zreport" className="bg-white p-5 w-full max-w-sm text-xs border border-slate-300 rounded-lg space-y-3 font-mono">
              <div className="text-center font-bold text-sm border-b pb-2">
                <div>LAPORAN Z-REPORT KASIR</div>
                <div className="text-[10px] font-normal text-slate-500 mt-1">StokKita POS Enterprise</div>
              </div>

              <div className="space-y-1 text-slate-700">
                <div className="flex justify-between"><span>Shift ID:</span><span>{zReportData.shift_id.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span>Buka:</span><span>{new Date(zReportData.opened_at).toLocaleTimeString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Tutup:</span><span>{new Date(zReportData.closed_at).toLocaleTimeString('id-ID')}</span></div>
              </div>

              <div className="border-t border-dashed my-2"></div>

              <div className="space-y-1 text-slate-800">
                <div className="flex justify-between"><span>Modal Kas Awal:</span><span>{fmt(zReportData.start_cash)}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Penjualan Tunai:</span><span>+{fmt(zReportData.total_cash_sales)}</span></div>
                <div className="flex justify-between text-blue-700"><span>Penjualan Non-Tunai:</span><span>+{fmt(zReportData.total_non_cash_sales)}</span></div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t">
                  <span>TOTAL OMSET SHIFT:</span><span>{fmt(zReportData.total_sales)}</span>
                </div>
              </div>

              <div className="border-t border-dashed my-2"></div>

              <div className="space-y-1">
                <div className="flex justify-between"><span>Kas Seharusnya:</span><span>{fmt(zReportData.expected_cash)}</span></div>
                <div className="flex justify-between font-bold"><span>Kas Fisik Riil:</span><span>{fmt(zReportData.end_cash_actual)}</span></div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t">
                  <span>SELISIH:</span>
                  <span className={zReportData.difference === 0 ? 'text-emerald-700' : zReportData.difference > 0 ? 'text-blue-700' : 'text-red-700'}>
                    {zReportData.difference > 0 ? '+' : ''}{fmt(zReportData.difference)}
                  </span>
                </div>
                <div className="text-center font-bold text-[10px] mt-2 py-1 bg-slate-100 rounded">
                  STATUS: {zReportData.status_reconciliation}
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-3">
                Dokumen Rekonsiliasi Kas Sah
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5 w-full max-w-sm">
              <button type="button" onClick={() => setZReportData(null)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">Tutup</button>
              <button type="button" onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Printer size={16} /> Cetak Z-Report
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: TRANSAKSI POS & MULTI-PAYMENT */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Transaksi Kasir Multi-Payment">
        <form onSubmit={handleSimpan} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Toko / Cabang</label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium text-sm">
                {warehouses.find(w => w.id === selectedW)?.name}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe Transaksi</label>
              <select 
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                value={tipe} onChange={e => setTipe(e.target.value)}
              >
                <option value="Penjualan">Penjualan (Kasir)</option>
                <option value="Retur">Retur Pembeli</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Scan Barcode / SKU</label>
            <div className="flex items-center gap-2 mb-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 focus-within:ring-2 focus-within:ring-emerald-500">
              <Barcode size={20} className="text-emerald-600" />
              <input 
                type="text"
                ref={barcodeInputRef}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={handleScanBarcode}
                placeholder="Scan barcode disini (Tekan Enter)..."
                className="bg-transparent w-full focus:outline-none text-slate-800 placeholder:text-emerald-600/50 font-medium text-sm"
              />
            </div>

            <select 
              className="w-full p-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              onChange={e => handleAddToCart(e.target.value, e)}
              defaultValue=""
            >
              <option value="" disabled>+ Pilih manual dari katalog...</option>
              {inventory.map(inv => (
                <option key={inv.variant_id} value={inv.variant_id}>
                  {inv.sku} - {inv.product_name} ({inv.size} {inv.color}) - Stok: {inv.qty}
                </option>
              ))}
            </select>
          </div>

          {/* Cart Header & Hold Actions */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Keranjang Belanja ({cart.length} Item)
              </label>

              <div className="flex items-center gap-2">
                {/* Tombol Parkir / Hold Transaksi */}
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleOpenHoldModal}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Simpan keranjang saat ini untuk melayani pembeli berikutnya"
                >
                  <Pause size={13} />
                  <span>Parkir Transaksi</span>
                </button>

                {/* Tombol Buka Antrean Tertahan */}
                {heldCarts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsHeldListModalOpen(true)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Bookmark size={13} />
                    <span>Antrean ({heldCarts.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cart Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 font-semibold">Produk</th>
                  <th className="p-2.5 font-semibold w-16 text-center">Qty</th>
                  <th className="p-2.5 font-semibold text-right">Harga</th>
                  <th className="p-2.5 font-semibold text-right">Subtotal</th>
                  <th className="p-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-400">Keranjang kosong</td></tr>
                ) : cart.map(c => (
                  <tr key={c.variant_id}>
                    <td className="p-2.5 text-slate-800 font-medium truncate max-w-[150px]">{c.name}</td>
                    <td className="p-2.5 text-center">
                      <input 
                        type="number" min="1" 
                        className="w-12 bg-slate-50 border border-slate-200 rounded p-1 text-center font-bold"
                        value={c.qty}
                        onChange={e => updateQty(c.variant_id, parseInt(e.target.value) || 1)}
                      />
                    </td>
                    <td className="p-2.5 text-right text-slate-600">{fmt(c.price)}</td>
                    <td className="p-2.5 text-right font-bold text-slate-800">{fmt(c.price * c.qty)}</td>
                    <td className="p-2.5 text-center">
                      <button type="button" onClick={() => removeCart(c.variant_id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-between items-center">
              <span className="font-semibold text-slate-600 text-sm">Total Belanja:</span>
              <span className="text-xl font-bold text-emerald-700">{fmt(cartTotal)}</span>
            </div>
          </div>
          </div>

          {/* MULTI-PAYMENT METHOD SELECTOR */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Pilih Metode Pembayaran</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("Tunai")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'Tunai' 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Wallet size={18} className="mb-1" />
                Tunai
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("QRIS");
                  setQrisSimulatorSuccess(false);
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'QRIS' 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <QrCode size={18} className="mb-1" />
                QRIS Dinamis
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("Debit")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'Debit' 
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard size={18} className="mb-1" />
                Debit / EDC
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("Split");
                  setSplitCash(Math.floor(cartTotal / 2));
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'Split' 
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md' 
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Layers size={18} className="mb-1" />
                Split Pay
              </button>
            </div>

            {/* TAB PANEL 1: TUNAI */}
            {paymentMethod === "Tunai" && (
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Uang Diterima</label>
                  <input
                    type="number"
                    min={cartTotal}
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={cartTotal.toString()}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => setCashReceived(cartTotal)} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100">Uang Pas</button>
                  <button type="button" onClick={() => setCashReceived(Math.ceil(cartTotal / 50000) * 50000)} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100">Pas 50K</button>
                  <button type="button" onClick={() => setCashReceived(Math.ceil(cartTotal / 100000) * 100000)} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-100">Pas 100K</button>
                </div>

                {cashReceived !== "" && Number(cashReceived) >= cartTotal && (
                  <div className="flex justify-between items-center text-sm font-bold text-emerald-800 pt-1">
                    <span>Uang Kembalian:</span>
                    <span>{fmt(Number(cashReceived) - cartTotal)}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB PANEL 2: QRIS DINAMIS SIMULATOR */}
            {paymentMethod === "QRIS" && (
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex flex-col items-center text-center space-y-3">
                <div className="text-xs font-bold text-blue-900 uppercase">QRIS Standar Pembayaran Nasional</div>
                
                <QRCodeSVG value={`00020101021226600016ID.CO.STOKKITA.WWW011893600999${cartTotal}5802ID5910STOKKITAPOS6007JAKARTA62070703A016304`} size={150} />

                <div className="text-sm font-bold text-slate-800">{fmt(cartTotal)}</div>
                
                <div className="w-full bg-white p-2.5 rounded-lg border border-blue-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                    <Clock size={14} className="animate-spin" /> Menunggu Pembeli Scan...
                  </span>
                  <span className="text-slate-400 font-mono">04:59</span>
                </div>

                {/* SIMULATOR TRIGGER */}
                <button
                  type="button"
                  onClick={() => setQrisSimulatorSuccess(true)}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    qrisSimulatorSuccess 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm'
                  }`}
                >
                  {qrisSimulatorSuccess ? (
                    <><CheckCircle2 size={16} /> Pembayaran QRIS Sukses Terverifikasi!</>
                  ) : (
                    <>⚡ [Simulasi Scan Pembeli & Bayar Otomatis]</>
                  )}
                </button>
              </div>
            )}

            {/* TAB PANEL 3: DEBIT / EDC */}
            {paymentMethod === "Debit" && (
              <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Penerbit</label>
                    <select
                      value={debitBank}
                      onChange={e => setDebitBank(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="BCA">Bank BCA</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="BNI">Bank BNI</option>
                      <option value="CIMB">CIMB Niaga</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">4 Digit Terakhir Kartu</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Contoh: 4242"
                      value={cardLast4}
                      onChange={e => setCardLast4(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trace No / Approval Code EDC (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: APV-89472"
                    value={approvalCode}
                    onChange={e => setApprovalCode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* TAB PANEL 4: SPLIT PAYMENT */}
            {paymentMethod === "Split" && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-amber-900">Kombinasi Pembayaran Tunai & Non-Tunai</div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bagian 1: Tunai</label>
                    <input
                      type="number"
                      min="1"
                      max={cartTotal - 1}
                      value={splitCash}
                      onChange={e => setSplitCash(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="Nominal Tunai"
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bagian 2: Sisa via</label>
                    <select
                      value={splitNonCashMethod}
                      onChange={e => setSplitNonCashMethod(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                    >
                      <option value="QRIS">QRIS Dinamis</option>
                      <option value="Debit">Kartu Debit</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tunai:</span>
                    <span className="font-bold text-slate-800">{fmt(Number(splitCash) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{splitNonCashMethod}:</span>
                    <span className="font-bold text-blue-700">{fmt(cartTotal - (Number(splitCash) || 0))}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-bold">
                    <span>Total Pembayaran:</span>
                    <span>{fmt(cartTotal)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium text-sm">Batal</button>
            <button 
              type="submit" 
              disabled={loadingSubmit || cart.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm transition-all text-sm disabled:opacity-60 flex items-center gap-2"
            >
              {loadingSubmit ? "Memproses Transaksi..." : "Selesaikan Pembayaran"}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: PARKIR TRANSAKSI / HOLD CART */}
      {isHoldModalOpen && (
        <Modal open={isHoldModalOpen} onClose={() => setIsHoldModalOpen(false)} title="Parkir / Tahan Transaksi Kasir">
          <form onSubmit={handleConfirmHoldCart} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold">
                <Pause size={14} className="text-amber-600" />
                <span>Simpan Keranjang Belanja Sementara</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Keranjang saat ini ({cart.length} item • Total {fmt(cartTotal)}) akan disimpan dan keranjang aktif akan direset untuk melayani pembeli berikutnya.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama / Label Antrean *</label>
              <input
                type="text"
                required
                value={holdCartName}
                onChange={e => setHoldCartName(e.target.value)}
                placeholder="Contoh: Pelanggan Baju Hitam / Meja 4"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                value={holdCartNotes}
                onChange={e => setHoldCartNotes(e.target.value)}
                placeholder="Misal: Tinggal ambil kaus kaki di rak 2"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Preview Items */}
            <div className="border border-slate-200 rounded-xl p-2.5 max-h-32 overflow-y-auto space-y-1 bg-slate-50 text-xs">
              {cart.map(c => (
                <div key={c.variant_id} className="flex justify-between text-slate-700">
                  <span className="truncate max-w-[200px] font-medium">{c.name} (x{c.qty})</span>
                  <span className="font-semibold">{fmt(c.price * c.qty)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsHoldModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
              >
                <Pause size={14} /> Simpan & Parkir Antrean
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 6: DAFTAR TRANSAKSI DIPARKIR / HELD CARTS LIST */}
      {isHeldListModalOpen && (
        <Modal open={isHeldListModalOpen} onClose={() => setIsHeldListModalOpen(false)} title="Daftar Transaksi Diparkir">
          <div className="space-y-3">
            {heldCarts.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Tidak ada antrean transaksi yang sedang diparkir.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                {heldCarts.map((hc, idx) => (
                  <div key={hc.id} className="p-3.5 bg-white border border-slate-200 hover:border-amber-400 rounded-2xl shadow-sm space-y-2.5 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{hc.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 ml-7">
                          <Clock size={12} />
                          <span>{new Date(hc.held_at).toLocaleTimeString('id-ID')}</span>
                          {hc.warehouse_name && <span>• {hc.warehouse_name}</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-emerald-700 text-sm">{fmt(hc.total)}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{hc.items.length} Macam Barang</div>
                      </div>
                    </div>

                    {hc.notes && (
                      <div className="p-2 bg-amber-50/60 rounded-xl text-[11px] text-amber-900 ml-7 italic">
                        "{hc.notes}"
                      </div>
                    )}

                    {/* Item list snapshot */}
                    <div className="ml-7 space-y-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {hc.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate max-w-[220px]">{item.name}</span>
                          <span className="font-semibold text-slate-800">{item.qty} pcs • {fmt(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteHeldCart(hc.id, hc.name)}
                        className="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Trash2 size={13} /> Batalkan
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRecallCart(hc)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Play size={13} /> Lanjutkan Transaksi (Recall)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsHeldListModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 5: STRUK THERMAL DETAIL (RECEIPT) */}
      {receiptData && (
        <Modal open={!!receiptData} onClose={() => setReceiptData(null)} title="Struk Pembayaran">
          <div className="flex flex-col items-center">
            <div id="print-receipt" className="bg-white p-5 w-full max-w-sm text-xs border border-slate-300 rounded-lg shadow-sm font-mono space-y-3">
              <div className="text-center font-bold text-sm">
                <div>{receiptData.warehouse.toUpperCase()}</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">StokKita POS Retail</div>
              </div>

              <div className="border-t border-dashed my-2"></div>

              <div className="space-y-0.5 text-slate-600 text-[11px]">
                <div className="flex justify-between"><span>No Trx:</span><span>{receiptData.transaction_id.slice(0, 12)}</span></div>
                <div className="flex justify-between"><span>Waktu:</span><span>{receiptData.date}</span></div>
                <div className="flex justify-between"><span>Kasir:</span><span>{receiptData.kasir}</span></div>
              </div>

              <div className="border-t border-dashed my-2"></div>
              
              <table className="w-full text-xs">
                <tbody>
                  {receiptData.items.map((item: any) => (
                    <tr key={item.variant_id}>
                      <td className="py-1">
                        <div className="font-semibold text-slate-800">{item.name}</div>
                        <div className="text-[10px] text-slate-500">{item.qty} x {fmt(item.price)}</div>
                      </td>
                      <td className="py-1 text-right align-bottom font-bold text-slate-800">{fmt(item.qty * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed my-2"></div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-sm text-slate-900">
                  <span>TOTAL</span>
                  <span>{fmt(receiptData.total)}</span>
                </div>

                <div className="flex justify-between text-slate-700 pt-1">
                  <span>Metode Bayar:</span>
                  <span className="font-bold">{receiptData.payment_method}</span>
                </div>

                {receiptData.payment_method === 'Tunai' && receiptData.payment_details && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Uang Diterima:</span>
                      <span>{fmt(receiptData.payment_details.cash_received)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Kembalian:</span>
                      <span>{fmt(receiptData.payment_details.change)}</span>
                    </div>
                  </>
                )}

                {receiptData.payment_method === 'QRIS' && receiptData.payment_details && (
                  <div className="flex justify-between text-blue-700 text-[11px]">
                    <span>Status QRIS:</span>
                    <span>PAID ({receiptData.payment_details.qris_id})</span>
                  </div>
                )}

                {receiptData.payment_method === 'Debit' && receiptData.payment_details && (
                  <div className="flex justify-between text-purple-700 text-[11px]">
                    <span>Bank / Kartu:</span>
                    <span>{receiptData.payment_details.bank} (**** {receiptData.payment_details.card_last4})</span>
                  </div>
                )}

                {receiptData.payment_method === 'Split' && receiptData.payment_details?.split && (
                  <div className="pt-1 text-[11px] text-slate-600 space-y-0.5">
                    {receiptData.payment_details.split.map((s: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>- {s.method}:</span>
                        <span className="font-semibold">{fmt(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-dashed my-2"></div>

              <div className="text-center text-[10px] text-slate-500 pt-2">
                Terima kasih atas kunjungan Anda!<br/>
                Barang yang sudah dibeli dapat ditukar max 3 hari dengan struk ini.
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5 w-full max-w-sm">
              <button type="button" onClick={() => setReceiptData(null)} className="px-5 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium text-sm">Tutup</button>
              <button type="button" onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-medium flex items-center gap-2 text-sm shadow-sm">
                <Printer size={16} /> Cetak Struk
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
