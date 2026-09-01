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
  Pause, Play, ShoppingCart, Bookmark,
  Crown, Gift, Sparkles, UserCheck, Search, X, Phone,
  Coins, ArrowUpRight, ArrowDownLeft, Building, UserPlus, Eye, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

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

  // Petty Cash / Kas Laci Movements State
  const [isPettyCashModalOpen, setIsPettyCashModalOpen] = useState(false);
  const [pettyCashType, setPettyCashType] = useState<"CASH_IN" | "CASH_OUT">("CASH_OUT");
  const [pettyCashAmount, setPettyCashAmount] = useState<number | "">("");
  const [pettyCashReason, setPettyCashReason] = useState("");
  const [pettyCashMovements, setPettyCashMovements] = useState<any[]>([]);
  const [loadingPettyCash, setLoadingPettyCash] = useState(false);

  // Cart & POS Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [tipe, setTipe] = useState("Penjualan");
  const [cart, setCart] = useState<{ variant_id: string; qty: number; price: number; name: string }[]>([]);
  const [returnReason, setReturnReason] = useState("Barang Rusak / Cacat");
  const [returnNotes, setReturnNotes] = useState("");
  
  // Struk Lookup for Returns State
  const [receiptLookupInput, setReceiptLookupInput] = useState("");
  const [originalReceiptData, setOriginalReceiptData] = useState<any>(null);
  const [loadingReceiptLookup, setLoadingReceiptLookup] = useState(false);
  const [showManualReturnInput, setShowManualReturnInput] = useState(false);
  const [refundMethod, setRefundMethod] = useState<"Tunai" | "Transfer">("Tunai");

  // Member & Loyalty Points State
  const [memberPhoneInput, setMemberPhoneInput] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isRedeemingPoints, setIsRedeemingPoints] = useState(false);
  const [loadingMemberLookup, setLoadingMemberLookup] = useState(false);
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);
  const [quickMemberName, setQuickMemberName] = useState("");
  const [quickMemberTier, setQuickMemberTier] = useState("Silver");
  const [savingQuickMember, setSavingQuickMember] = useState(false);

  // Cross-Branch Stock Checker State
  const [isCrossStockModalOpen, setIsCrossStockModalOpen] = useState(false);
  const [crossStockSearch, setCrossStockSearch] = useState("");
  const [crossStockList, setCrossStockList] = useState<any[]>([]);
  const [loadingCrossStock, setLoadingCrossStock] = useState(false);

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
      toast.warning("Masukkan nominal modal kas awal yang valid");
      return;
    }
    setLoadingShift(true);
    try {
      await api.post("/shift/open", {
        warehouse_id: selectedW,
        start_cash: Number(startCashInput),
        notes: shiftNotes || "Buka Kasir Pagi/Siang"
      });
      toast.success("Shift kasir berhasil dibuka! Selamat bertugas.");
      setIsOpenShiftModal(false);
      setShiftNotes("");
      fetchActiveShift(selectedW);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal membuka shift kasir");
    } finally {
      setLoadingShift(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    if (endCashActualInput === "" || Number(endCashActualInput) < 0) {
      toast.warning("Masukkan jumlah fisik uang kas di laci");
      return;
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
      toast.success("Shift kasir berhasil ditutup dan Z-Report telah diterbitkan");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menutup shift kasir");
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
      toast.error(`Stok "${inv.product_name}" habis/kosong!`);
      if (e) e.target.value = "";
      return;
    }

    const existing = cart.find(c => c.variant_id === vid);
    if (existing) {
      if (tipe === 'Penjualan' && existing.qty >= inv.qty) {
        toast.warning(`Stok tidak mencukupi! Maksimal tersedia: ${inv.qty} pcs`);
        if (e) e.target.value = "";
        return;
      }
      setCart(cart.map(c => c.variant_id === vid ? { ...c, qty: c.qty + 1 } : c));
      toast.info(`+1 ${inv.product_name} (${inv.sku})`);
    } else {
      setCart([...cart, { variant_id: inv.variant_id, qty: 1, price: inv.price_sell, name: `${inv.product_name} (${inv.sku})` }]);
      toast.success(`Ditambahkan: ${inv.product_name}`);
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
        toast.error(`Produk dengan Barcode/SKU "${scanned}" tidak ditemukan!`);
      }
      setBarcodeInput("");
    }
  };

  const removeCart = (vid: string) => {
    const item = cart.find(c => c.variant_id === vid);
    setCart(cart.filter(c => c.variant_id !== vid));
    if (item) toast.info(`Dihapus: ${item.name}`);
  };
  
  const updateQty = (vid: string, qty: number) => {
    const inv = inventory.find(i => i.variant_id === vid);
    if (tipe === 'Penjualan' && inv && qty > inv.qty) {
      toast.warning("Maksimal stok tersedia: " + inv.qty);
      return;
    }
    setCart(cart.map(c => c.variant_id === vid ? { ...c, qty: Math.max(1, qty) } : c));
  };

  // Member & Cart Total Calculations
  const rawCartTotal = cart.reduce((sum, c) => sum + c.qty * c.price, 0);
  const maxRedeemablePoints = selectedMember ? Math.min(Number(selectedMember.points) || 0, Math.floor(rawCartTotal / 100)) : 0;
  const pointsDiscount = (isRedeemingPoints && selectedMember) ? (maxRedeemablePoints * 100) : 0;
  const cartTotal = Math.max(0, rawCartTotal - pointsDiscount);
  const potentialPointsEarned = tipe === "Penjualan" ? Math.floor(cartTotal / 10000) : 0;

  const handleLookupMember = async () => {
    if (!memberPhoneInput.trim()) return;
    setLoadingMemberLookup(true);
    try {
      const res = await api.get(`/members/lookup?phone=${encodeURIComponent(memberPhoneInput.trim())}`);
      setSelectedMember(res.data);
      setIsRedeemingPoints(false);
      toast.success(`Member "${res.data.name}" ditemukan!`);
    } catch (err: any) {
      setSelectedMember(null);
      if (confirm(`Member dengan nomor "${memberPhoneInput}" belum terdaftar. Apakah Anda ingin mendaftarkannya sekarang secara cepat?`)) {
        setIsQuickRegisterOpen(true);
      }
    } finally {
      setLoadingMemberLookup(false);
    }
  };

  const handleQuickRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMemberName.trim() || !memberPhoneInput.trim()) {
      toast.warning("Nama dan nomor WhatsApp wajib diisi!");
      return;
    }
    setSavingQuickMember(true);
    try {
      const res = await api.post("/members", {
        name: quickMemberName.trim(),
        phone: memberPhoneInput.trim(),
        tier: quickMemberTier
      });
      setSelectedMember(res.data.member);
      setIsQuickRegisterOpen(false);
      setQuickMemberName("");
      toast.success(`Member "${res.data.member.name}" berhasil didaftarkan dan langsung terpilih!`);
    } catch (err: any) {
      toast.error("Gagal mendaftarkan member: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingQuickMember(false);
    }
  };

  const handleRemoveMember = () => {
    setSelectedMember(null);
    setMemberPhoneInput("");
    setIsRedeemingPoints(false);
    toast.info("Member loyalty dilepas dari transaksi ini");
  };

  // Receipt Lookup for Return Handlers
  const handleLookupReceipt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!receiptLookupInput.trim()) {
      toast.warning("Masukkan nomor struk atau potongan ID transaksi!");
      return;
    }
    setLoadingReceiptLookup(true);
    try {
      const res = await api.get(`/transaksi/lookup-receipt?query=${encodeURIComponent(receiptLookupInput.trim())}`);
      setOriginalReceiptData(res.data);
      if (res.data.transaction?.warehouse_id && res.data.transaction.warehouse_id !== selectedW) {
        setSelectedW(res.data.transaction.warehouse_id);
      }
      toast.success(`Struk ditemukan: #${res.data.transaction.id.slice(0, 8)} (${res.data.items.length} item)`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Struk transaksi tidak ditemukan!");
      setOriginalReceiptData(null);
    } finally {
      setLoadingReceiptLookup(false);
    }
  };

  const handleAddReceiptItemToCart = (item: any) => {
    const existing = cart.find(c => c.variant_id === item.variant_id);
    const maxQty = Number(item.qty);
    const itemName = item.product_name + ((item.size || item.color) ? ` (${[item.size, item.color].filter(Boolean).join(", ")})` : "");

    if (existing) {
      if (existing.qty >= maxQty) {
        toast.warning(`Jumlah retur tidak boleh melebihi jumlah pembelian asli (${maxQty} pcs)!`);
        return;
      }
      setCart(cart.map(c => c.variant_id === item.variant_id ? { ...c, qty: c.qty + 1 } : c));
      toast.info(`+1 Retur: ${itemName}`);
    } else {
      setCart(prev => [...prev, {
        variant_id: item.variant_id,
        qty: 1,
        price: Number(item.price),
        name: itemName
      }]);
      toast.success(`Ditambahkan ke retur: ${itemName}`);
    }
  };

  // Petty Cash Handlers
  const fetchPettyCashMovements = async (shiftId: string) => {
    if (!shiftId) return;
    try {
      const res = await api.get(`/shift/cash-movements?shift_id=${shiftId}`);
      setPettyCashMovements(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePettyCash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) {
      toast.warning("Buka shift kasir terlebih dahulu!");
      return;
    }
    if (!pettyCashAmount || Number(pettyCashAmount) <= 0 || !pettyCashReason.trim()) {
      toast.warning("Nominal kas dan alasan pengeluaran/pemasukan wajib diisi!");
      return;
    }
    setLoadingPettyCash(true);
    try {
      await api.post("/shift/cash-movement", {
        shift_id: activeShift.id,
        warehouse_id: selectedW,
        type: pettyCashType,
        amount: Number(pettyCashAmount),
        reason: pettyCashReason.trim()
      });
      toast.success(`Kas ${pettyCashType === 'CASH_IN' ? 'Masuk' : 'Keluar'} senilai ${fmt(Number(pettyCashAmount))} berhasil dicatat!`);
      setIsPettyCashModalOpen(false);
      setPettyCashAmount("");
      setPettyCashReason("");
      fetchPettyCashMovements(activeShift.id);
    } catch (err: any) {
      toast.error("Gagal mencatat kas laci: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingPettyCash(false);
    }
  };

  // Cross Branch Stock Checker Handlers
  const fetchCrossBranchStock = async (keyword = "") => {
    setLoadingCrossStock(true);
    try {
      const res = await api.get(`/master/cross-branch-stock?search=${encodeURIComponent(keyword)}`);
      setCrossStockList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCrossStock(false);
    }
  };

  // Reprint Receipt Handler
  const handleReprintReceipt = (trx: any) => {
    const paymentDetails = typeof trx.payment_details === 'string' ? JSON.parse(trx.payment_details || '{}') : (trx.payment_details || {});
    setReceiptData({
      transaction_id: trx.id,
      date: new Date(trx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      kasir: trx.kasir_name || trx.cashier_name || activeShift?.cashier_name || "Kasir Toko",
      warehouse: trx.warehouse_name || warehouses.find(w => w.id === trx.warehouse_id)?.name || "Toko",
      items: trx.items || [
        { name: "Transaksi Penjualan Toko", qty: 1, price: Number(trx.total_amount) }
      ],
      raw_total: Number(trx.total_amount) + Number(paymentDetails.discount_points || 0),
      total: Number(trx.total_amount),
      type: trx.type || "Penjualan",
      payment_method: trx.payment_method || "Tunai",
      payment_details: paymentDetails,
      member: paymentDetails.member_name ? {
        name: paymentDetails.member_name,
        tier: "Member",
        discount_points: Number(paymentDetails.discount_points || 0),
        redeemed_points: Number(paymentDetails.redeemed_points || 0),
        earned_points: Number(paymentDetails.earned_points || 0),
        points_balance: Number(paymentDetails.earned_points || 0)
      } : null
    });
    toast.info(`Memuat struk #${trx.id.slice(0, 8)} untuk cetak ulang...`);
  };

  // Multi-Cart & Hold Transaksi Handlers
  const handleOpenHoldModal = () => {
    if (cart.length === 0) {
      toast.warning("Keranjang belanja masih kosong, tidak ada transaksi yang perlu diparkir!");
      return;
    }
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
    toast.success(`Transaksi "${newHeldCart.name}" berhasil diparkir! Silakan layani antrean berikutnya.`);
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
    toast.info(`Memuat kembali transaksi antrean "${heldCart.name}"`);
  };

  const handleDeleteHeldCart = (heldCartId: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin membatalkan dan menghapus antrean terparkir "${name}"?`)) {
      setHeldCarts(prev => prev.filter(h => h.id !== heldCartId));
      toast.info(`Antrean "${name}" dibatalkan`);
    }
  };

  // Submit Transaction
  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.warning("Keranjang masih kosong!");
      return;
    }
    if (!selectedW) {
      toast.warning("Pilih cabang toko dulu!");
      return;
    }

    // Validate Payment
    let paymentDetailsPayload: any = {};
    const effectivePaymentMethod = tipe === "Retur" ? refundMethod : paymentMethod;

    if (tipe === "Retur") {
      paymentDetailsPayload = {
        refund_method: refundMethod,
        original_receipt_id: originalReceiptData?.transaction?.id || receiptLookupInput || null,
        refund_amount: cartTotal
      };
    } else {
      if (paymentMethod === "Tunai") {
        const received = Number(cashReceived) || cartTotal;
        if (received < cartTotal) {
          toast.error(`Nominal uang tunai kurang! Total: ${fmt(cartTotal)}, Diterima: ${fmt(received)}`);
          return;
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
          toast.warning("Pada Split Payment, nominal tunai harus lebih dari 0 dan kurang dari total belanja!");
          return;
        }
        paymentDetailsPayload = {
          split: [
            { method: "Tunai", amount: cashPart },
            { method: splitNonCashMethod, amount: nonCashPart, ref: `${splitNonCashMethod}-${Date.now().toString().slice(-4)}` }
          ]
        };
      }
    }

    setLoadingSubmit(true);
    try {
      const returnReasonFormatted = returnReason + (returnNotes ? ` (${returnNotes})` : "");
      const res = await api.post("/transaksi", {
        warehouse_id: selectedW,
        type: tipe,
        items: cart.map(c => ({ variant_id: c.variant_id, qty: c.qty, price: c.price })),
        payment_method: effectivePaymentMethod,
        payment_details: {
          ...paymentDetailsPayload,
          return_reason: tipe === "Retur" ? returnReasonFormatted : undefined
        },
        return_reason: tipe === "Retur" ? returnReasonFormatted : undefined,
        member_id: selectedMember?.id || null,
        member_name: selectedMember?.name || null,
        discount_points: pointsDiscount,
        redeemed_points: isRedeemingPoints ? maxRedeemablePoints : 0
      });

      setIsModalOpen(false);
      
      // Set Receipt Data for printing
      setReceiptData({
        transaction_id: res.data.transaction_id,
        date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        kasir: activeShift?.cashier_name || "Kasir Toko",
        warehouse: warehouses.find(w => w.id === selectedW)?.name || "",
        items: [...cart],
        raw_total: rawCartTotal,
        total: cartTotal,
        type: tipe,
        payment_method: effectivePaymentMethod,
        payment_details: paymentDetailsPayload,
        return_reason: tipe === "Retur" ? returnReasonFormatted : null,
        member: selectedMember ? {
          name: selectedMember.name,
          phone: selectedMember.phone,
          tier: selectedMember.tier,
          discount_points: pointsDiscount,
          redeemed_points: isRedeemingPoints ? maxRedeemablePoints : 0,
          earned_points: potentialPointsEarned,
          points_balance: Math.max(0, (Number(selectedMember.points) || 0) - (isRedeemingPoints ? maxRedeemablePoints : 0) + potentialPointsEarned)
        } : null
      });

      fetchTransaksi();
      fetchInventory(selectedW);
      fetchActiveShift(selectedW);
      setCart([]);
      setSelectedMember(null);
      setMemberPhoneInput("");
      setIsRedeemingPoints(false);
      setCashReceived("");
      setCardLast4("");
      setApprovalCode("");
      setSplitCash("");
      setQrisSimulatorSuccess(false);
      setOriginalReceiptData(null);
      setReceiptLookupInput("");
      setReturnNotes("");
      
      toast.success(tipe === "Retur" ? "Retur & refund berhasil diproses!" : `Transaksi senilai ${fmt(cartTotal)} berhasil diselesaikan!`);
    } catch (err: any) {
      toast.error("Gagal memproses transaksi: " + (err.response?.data?.message || err.message));
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

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Tombol Cek Stok Lintas Cabang */}
                <button
                  type="button"
                  onClick={() => {
                    fetchCrossBranchStock();
                    setIsCrossStockModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  title="Cek ketersediaan stok barang di cabang toko lain"
                >
                  <Eye size={16} className="text-blue-600" />
                  <span>Cek Stok Cabang</span>
                </button>

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
                      ? `Kasir: ${activeShift.cashier_name || 'Admin'} • Modal Awal: ${fmt(Number(activeShift.start_cash))} • Total Omset: ${fmt(Number(activeShift.total_sales))}`
                      : "Harap buka shift dan masukkan modal uang laci kasir sebelum melayani transaksi."
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeShift ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        fetchPettyCashMovements(activeShift.id);
                        setIsPettyCashModalOpen(true);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                      title="Catat kas masuk atau kas keluar laci kasir (Petty Cash)"
                    >
                      <Coins size={15} /> Kas Masuk/Keluar
                    </button>

                    <button
                      onClick={() => setIsCloseShiftModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <ShieldCheck size={16} /> Tutup Shift (Z-Report)
                    </button>
                  </>
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
                      <th className="pb-3 text-center font-semibold pr-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transaksiList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">Belum ada riwayat transaksi.</td>
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
                        <td className="py-4 text-center pr-2">
                          <button
                            type="button"
                            onClick={() => handleReprintReceipt(t)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 mx-auto transition"
                            title="Cetak ulang struk thermal"
                          >
                            <Printer size={13} />
                            <span>Struk</span>
                          </button>
                        </td>
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
              {pettyCashMovements.some(m => m.type === 'CASH_IN') && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Kas Masuk (Petty In):</span>
                  <span>+{fmt(pettyCashMovements.filter(m => m.type === 'CASH_IN').reduce((sum, m) => sum + Number(m.amount), 0))}</span>
                </div>
              )}
              {pettyCashMovements.some(m => m.type === 'CASH_OUT') && (
                <div className="flex justify-between text-red-600">
                  <span>Total Kas Keluar (Petty Out):</span>
                  <span>-{fmt(pettyCashMovements.filter(m => m.type === 'CASH_OUT').reduce((sum, m) => sum + Number(m.amount), 0))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Penjualan Non-Tunai (QRIS/Debit):</span>
                <span className="font-semibold text-blue-700">+{fmt(Number(activeShift.total_non_cash_sales))}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm">
                <span className="text-slate-700">Kas Seharusnya di Laci:</span>
                <span className="text-emerald-800">
                  {fmt(
                    Number(activeShift.start_cash) + 
                    Number(activeShift.total_cash_sales) + 
                    pettyCashMovements.filter(m => m.type === 'CASH_IN').reduce((sum, m) => sum + Number(m.amount), 0) -
                    pettyCashMovements.filter(m => m.type === 'CASH_OUT').reduce((sum, m) => sum + Number(m.amount), 0)
                  )}
                </span>
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
                  (Number(endCashActualInput) - (
                    Number(activeShift.start_cash) + 
                    Number(activeShift.total_cash_sales) + 
                    pettyCashMovements.filter(m => m.type === 'CASH_IN').reduce((sum, m) => sum + Number(m.amount), 0) -
                    pettyCashMovements.filter(m => m.type === 'CASH_OUT').reduce((sum, m) => sum + Number(m.amount), 0)
                  )) === 0 ? 'text-emerald-600' :
                  (Number(endCashActualInput) - (
                    Number(activeShift.start_cash) + 
                    Number(activeShift.total_cash_sales) + 
                    pettyCashMovements.filter(m => m.type === 'CASH_IN').reduce((sum, m) => sum + Number(m.amount), 0) -
                    pettyCashMovements.filter(m => m.type === 'CASH_OUT').reduce((sum, m) => sum + Number(m.amount), 0)
                  )) > 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {(Number(endCashActualInput) - (
                    Number(activeShift.start_cash) + 
                    Number(activeShift.total_cash_sales) + 
                    pettyCashMovements.filter(m => m.type === 'CASH_IN').reduce((sum, m) => sum + Number(m.amount), 0) -
                    pettyCashMovements.filter(m => m.type === 'CASH_OUT').reduce((sum, m) => sum + Number(m.amount), 0)
                  )) > 0 ? '+' : ''}
                  {fmt(Number(endCashActualInput) - (
                    Number(activeShift.start_cash) + 
                    Number(activeShift.total_cash_sales) + 
                    pettyCashMovements.filter(m => m.type === 'CASH_IN').reduce((sum, m) => sum + Number(m.amount), 0) -
                    pettyCashMovements.filter(m => m.type === 'CASH_OUT').reduce((sum, m) => sum + Number(m.amount), 0)
                  ))}
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
                className={`w-full px-3 py-2 rounded-lg border text-sm font-semibold outline-none focus:ring-2 ${
                  tipe === 'Retur' 
                    ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-500' 
                    : 'border-slate-300 bg-white text-slate-700 focus:ring-emerald-500'
                }`}
                value={tipe} onChange={e => setTipe(e.target.value)}
              >
                <option value="Penjualan">Penjualan (Kasir Reguler)</option>
                <option value="Retur">Retur Pembeli & Refund Kas</option>
              </select>
            </div>
          </div>

          {/* ======================================================== */}
          {/* JIKA MODE RETUR: ALUR RETUR OTOMATIS BERBASIS STRUK */}
          {/* ======================================================== */}
          {tipe === "Retur" ? (
            <div className="space-y-4">
              {/* 1. KOTAK CARI STRUK ASLI / KODE TRANSAKSI */}
              <div className="p-4 bg-red-50/90 border border-red-200 rounded-2xl space-y-3 text-xs text-red-950">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-red-700 text-sm">
                    <Receipt size={16} />
                    <span>Langkah 1: Masukkan Nomor Struk / ID Transaksi Asli</span>
                  </div>
                  <span className="text-[11px] text-red-600 font-medium">Bisa ketik 8 karakter awal struk</span>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={receiptLookupInput}
                      onChange={e => setReceiptLookupInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLookupReceipt(); } }}
                      placeholder="Contoh: 72f2b963 atau scan barcode struk belanja..."
                      className="w-full pl-8 pr-3 py-2 bg-white border border-red-300 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-red-500 text-slate-800"
                    />
                    <Search size={14} className="absolute left-2.5 top-3 text-red-400" />
                  </div>
                  <button
                    type="button"
                    onClick={handleLookupReceipt}
                    disabled={loadingReceiptLookup || !receiptLookupInput.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={loadingReceiptLookup ? "animate-spin" : ""} />
                    {loadingReceiptLookup ? "Mencari..." : "Muat Barang Struk"}
                  </button>
                </div>

                {/* HASIL DATA STRUK YANG DITEMUKAN */}
                {originalReceiptData && (
                  <div className="p-3 bg-white border border-red-200 rounded-xl space-y-2.5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 border-b border-slate-100 pb-2">
                      <div>
                        <div className="font-bold text-slate-800">
                          Struk #{originalReceiptData.transaction.id.slice(0, 12)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Waktu: {new Date(originalReceiptData.transaction.created_at).toLocaleString('id-ID')} • Kasir: {originalReceiptData.transaction.kasir_name || "Kasir"} • Toko: {originalReceiptData.transaction.warehouse_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500">Total Belanja Asli:</span>
                        <div className="font-bold text-emerald-700">{fmt(Number(originalReceiptData.transaction.total_amount))}</div>
                      </div>
                    </div>

                    <div className="font-bold text-slate-700 text-[11px]">Daftar Barang pada Struk Ini (Klik untuk Retur):</div>
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                      {originalReceiptData.items.map((item: any) => (
                        <div key={item.id} className="p-2 flex justify-between items-center hover:bg-red-50/40 transition">
                          <div>
                            <div className="font-semibold text-slate-800">{item.product_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.sku} • {item.size} {item.color} • Beli: {item.qty} pcs @ {fmt(Number(item.price))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddReceiptItemToCart(item)}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition shadow-xs"
                          >
                            <Plus size={12} /> Retur Barang Ini
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opsi manual jika struk hilang */}
                <div className="flex justify-between items-center pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setShowManualReturnInput(!showManualReturnInput)}
                    className="text-red-700 hover:text-red-900 underline font-semibold"
                  >
                    {showManualReturnInput ? "Sembunyikan Pilihan Manual" : "Atau pilih/scan barang manual (Jika struk pembeli hilang)"}
                  </button>
                </div>

                {showManualReturnInput && (
                  <div className="pt-2 border-t border-red-200">
                    <label className="block font-semibold text-slate-700 mb-1">Pilih Barang dari Katalog Toko</label>
                    <select 
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs outline-none"
                      onChange={e => handleAddToCart(e.target.value, e)}
                      defaultValue=""
                    >
                      <option value="" disabled>+ Pilih barang manual...</option>
                      {inventory.map(inv => (
                        <option key={inv.variant_id} value={inv.variant_id}>
                          {inv.sku} - {inv.product_name} ({inv.size} {inv.color}) - Harga: {fmt(inv.price_sell)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 2. ALASAN RETUR PELANGGAN */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-slate-800">Langkah 2: Alasan Retur & Keterangan</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Alasan Retur *</label>
                    <select
                      value={returnReason}
                      onChange={e => setReturnReason(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="Barang Rusak / Cacat">Barang Rusak / Cacat Pabrik</option>
                      <option value="Salah Ukuran / Warna">Salah Ukuran / Salah Warna</option>
                      <option value="Salah Beli / Pembatalan">Salah Beli / Pembatalan Pelanggan</option>
                      <option value="Tidak Sesuai Ekspektasi">Tidak Sesuai Ekspektasi</option>
                      <option value="Lainnya">Alasan Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Catatan Tambahan (Opsional)</label>
                    <input
                      type="text"
                      value={returnNotes}
                      onChange={e => setReturnNotes(e.target.value)}
                      placeholder="Misal: Jahitan lepas sebelah kanan"
                      className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. DAFTAR BARANG YANG DIRETUR (KERANJANG RETUR) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase">
                  <span>Langkah 3: Barang yang Dikembalikan ({cart.length} Item)</span>
                  {cart.length > 0 && (
                    <button type="button" onClick={() => setCart([])} className="text-red-500 hover:text-red-700 font-normal lowercase">
                      kosongkan
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 font-semibold">Produk</th>
                        <th className="p-2.5 font-semibold w-16 text-center">Qty Retur</th>
                        <th className="p-2.5 font-semibold text-right">Harga</th>
                        <th className="p-2.5 font-semibold text-right">Subtotal Refund</th>
                        <th className="p-2.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.length === 0 ? (
                        <tr><td colSpan={5} className="p-6 text-center text-slate-400">Belum ada barang yang dipilih untuk diretur.</td></tr>
                      ) : cart.map(c => (
                        <tr key={c.variant_id}>
                          <td className="p-2.5 text-slate-800 font-medium">{c.name}</td>
                          <td className="p-2.5 text-center">
                            <input 
                              type="number" min="1" 
                              className="w-12 bg-slate-50 border border-slate-200 rounded p-1 text-center font-bold text-red-700"
                              value={c.qty}
                              onChange={e => setCart(cart.map(item => item.variant_id === c.variant_id ? { ...item, qty: Math.max(1, parseInt(e.target.value) || 1) } : item))}
                            />
                          </td>
                          <td className="p-2.5 text-right text-slate-600">{fmt(c.price)}</td>
                          <td className="p-2.5 text-right font-bold text-red-600">{fmt(c.price * c.qty)}</td>
                          <td className="p-2.5 text-center">
                            <button type="button" onClick={() => removeCart(c.variant_id)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. METODE PENGEMBALIAN DANA (REFUND) */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                  <span className="font-bold text-slate-700 uppercase">Total Dana yang Harus Di-refund:</span>
                  <span className="text-xl font-bold text-red-600">{fmt(cartTotal)}</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-2">Pilih Cara Pengembalian Uang ke Pelanggan:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRefundMethod("Tunai")}
                      className={`p-3 rounded-xl border text-left transition ${
                        refundMethod === "Tunai"
                          ? "bg-amber-500 text-white border-amber-600 shadow-sm font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <Wallet size={16} /> Kas Tunai Laci (Cash Refund)
                      </div>
                      <div className={`text-[10px] mt-1 ${refundMethod === "Tunai" ? "text-white/90" : "text-slate-500"}`}>
                        Uang kas laci dipotong otomatis & masuk Z-Report
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRefundMethod("Transfer")}
                      className={`p-3 rounded-xl border text-left transition ${
                        refundMethod === "Transfer"
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <CreditCard size={16} /> Transfer Bank / Non-Tunai
                      </div>
                      <div className={`text-[10px] mt-1 ${refundMethod === "Transfer" ? "text-white/90" : "text-slate-500"}`}>
                        Refund dikirim via m-Banking/rekening toko
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* JIKA MODE PENJUALAN REGULER (POS BIASA) */
            /* ======================================================== */
            <div className="space-y-4">
              {/* MEMBER LOYALTY SEARCH & BADGE */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Crown size={14} className="text-amber-500" />
                    Member & Loyalty Points
                  </label>
                  {selectedMember && (
                    <button
                      type="button"
                      onClick={handleRemoveMember}
                      className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                    >
                      <X size={12} /> Hapus Member
                    </button>
                  )}
                </div>

                {!selectedMember ? (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={memberPhoneInput}
                        onChange={e => setMemberPhoneInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLookupMember(); } }}
                        placeholder="Ketik nomor WhatsApp member (Misal: 081298765432)..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      <Phone size={13} className="absolute left-2.5 top-2.5 text-purple-400" />
                    </div>
                    <button
                      type="button"
                      onClick={handleLookupMember}
                      disabled={loadingMemberLookup || !memberPhoneInput.trim()}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <Search size={13} /> {loadingMemberLookup ? "..." : "Cek Member"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQuickRegisterOpen(true)}
                      className="px-3 py-1.5 bg-white hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      title="Daftarkan pelanggan baru langsung tanpa keluar kasir"
                    >
                      <UserPlus size={13} /> Daftar Baru
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-white border border-purple-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-xs">{selectedMember.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          ⭐ {selectedMember.tier || "Silver"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Saldo: <strong>{new Intl.NumberFormat('id-ID').format(selectedMember.points || 0)} Poin</strong></span>
                        <span>• Nilai: {fmt((selectedMember.points || 0) * 100)}</span>
                      </div>
                    </div>

                    {/* Checkbox Redeem Points */}
                    {selectedMember.points > 0 && (
                      <label className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 p-2 rounded-lg cursor-pointer border border-purple-200 text-xs transition">
                        <input
                          type="checkbox"
                          checked={isRedeemingPoints}
                          onChange={e => setIsRedeemingPoints(e.target.checked)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-purple-900">Tukarkan Poin</div>
                          <div className="text-[10px] text-purple-700 font-semibold">Potong {fmt(maxRedeemablePoints * 100)}</div>
                        </div>
                      </label>
                    )}
                  </div>
                )}

                {selectedMember && (
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <Sparkles size={13} /> Member akan mendapatkan <strong>+{potentialPointsEarned} Poin</strong> dari transaksi ini.
                  </div>
                )}
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
                  <div className="bg-slate-50 p-3 border-t border-slate-200 space-y-1">
                    {pointsDiscount > 0 && (
                      <div className="flex justify-between items-center text-xs text-purple-700 font-semibold">
                        <span className="flex items-center gap-1"><Gift size={13} /> Diskon Poin Member ({maxRedeemablePoints} Poin):</span>
                        <span>-{fmt(pointsDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      <span className="font-semibold text-slate-600 text-sm">Total Pembayaran:</span>
                      <span className="text-xl font-bold text-emerald-700">{fmt(cartTotal)}</span>
                    </div>
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
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium text-sm">Batal</button>
            <button 
              type="submit" 
              disabled={loadingSubmit || cart.length === 0}
              className={`px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all text-sm disabled:opacity-60 flex items-center gap-2 text-white ${
                tipe === 'Retur'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loadingSubmit 
                ? "Memproses..." 
                : tipe === "Retur" 
                ? "Selesaikan Retur & Keluarkan Refund" 
                : "Selesaikan Pembayaran"}
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
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                  {receiptData.type === "Retur" ? "BUKTI RETUR & REFUND DANA" : "StokKita POS Retail"}
                </div>
              </div>

              <div className="border-t border-dashed my-2"></div>

              <div className="space-y-0.5 text-slate-600 text-[11px]">
                <div className="flex justify-between"><span>No Trx:</span><span>{receiptData.transaction_id.slice(0, 12)}</span></div>
                <div className="flex justify-between"><span>Waktu:</span><span>{receiptData.date}</span></div>
                <div className="flex justify-between"><span>Kasir:</span><span>{receiptData.kasir}</span></div>
                <div className="flex justify-between">
                  <span>Tipe Transaksi:</span>
                  <span className={`font-bold ${receiptData.type === 'Retur' ? 'text-red-600' : 'text-emerald-700'}`}>
                    {receiptData.type === 'Retur' ? 'RETUR BARANG (REFUND)' : 'PENJUALAN'}
                  </span>
                </div>
                {receiptData.return_reason && (
                  <div className="p-1.5 bg-red-50 text-red-900 rounded font-sans text-[10px] mt-1 border border-red-200">
                    <strong>Alasan Retur:</strong> {receiptData.return_reason}
                  </div>
                )}
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
                {receiptData.member && (
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5 mb-1 font-sans">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>👑 Member: {receiptData.member.name}</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-semibold">{receiptData.member.tier}</span>
                    </div>
                    {receiptData.member.discount_points > 0 && (
                      <div className="flex justify-between text-purple-700 font-semibold">
                        <span>Diskon Poin ({receiptData.member.points_redeemed} Poin):</span>
                        <span>-{fmt(receiptData.member.discount_points)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-700">
                      <span>Poin Didapat:</span>
                      <span>+{receiptData.member.earned_points} Poin</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px] pt-0.5 border-t">
                      <span>Sisa Saldo Poin:</span>
                      <span>{new Intl.NumberFormat('id-ID').format(receiptData.member.points_balance)} Poin</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between font-bold text-sm text-slate-900">
                  <span>{receiptData.type === 'Retur' ? 'TOTAL DANA DIREFUND' : 'TOTAL PEMBAYARAN'}</span>
                  <span className={receiptData.type === 'Retur' ? 'text-red-600' : 'text-slate-900'}>{fmt(receiptData.total)}</span>
                </div>

                <div className="flex justify-between text-slate-700 pt-1">
                  <span>{receiptData.type === 'Retur' ? 'Metode Refund:' : 'Metode Bayar:'}</span>
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

      {/* MODAL 7: PETTY CASH / KAS MASUK & KELUAR LACI */}
      {isPettyCashModalOpen && (
        <Modal open={isPettyCashModalOpen} onClose={() => setIsPettyCashModalOpen(false)} title="Mutasi Kas Laci (Petty Cash)">
          <div className="space-y-5 text-xs">
            {/* Form Input Petty Cash */}
            <form onSubmit={handleSavePettyCash} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Catat Kas Masuk / Keluar Baru</span>
                <span className="text-[11px] text-slate-500">Shift #{activeShift?.id?.slice(0, 8)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPettyCashType("CASH_OUT")}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                    pettyCashType === "CASH_OUT"
                      ? "bg-red-600 text-white border-red-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <ArrowDownLeft size={14} /> Kas Keluar (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => setPettyCashType("CASH_IN")}
                  className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                    pettyCashType === "CASH_IN"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <ArrowUpRight size={14} /> Kas Masuk (Topup/Modal)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Uang (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={pettyCashAmount}
                  onChange={e => setPettyCashAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Misal: 25000"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keperluan / Keterangan Alasan *</label>
                <input
                  type="text"
                  required
                  value={pettyCashReason}
                  onChange={e => setPettyCashReason(e.target.value)}
                  placeholder="Misal: Beli galon air minum toko, bensin kurir, lakban"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPettyCashModalOpen(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingPettyCash}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {loadingPettyCash ? "Menyimpan..." : "Simpan Mutasi Kas"}
                </button>
              </div>
            </form>

            {/* Riwayat Kas Laci Shift Aktif */}
            <div className="space-y-2">
              <div className="font-bold text-slate-800 flex justify-between">
                <span>Riwayat Kas Laci Shift Ini:</span>
                <span className="text-slate-500 font-normal">{pettyCashMovements.length} Catatan</span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {pettyCashMovements.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">Belum ada mutasi kas masuk/keluar pada shift ini.</div>
                ) : (
                  pettyCashMovements.map(m => (
                    <div key={m.id} className="p-2.5 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            m.type === 'CASH_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {m.type === 'CASH_IN' ? '+ KAS MASUK' : '- KAS KELUAR'}
                          </span>
                          <span className="font-semibold text-slate-800">{m.reason}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {new Date(m.created_at).toLocaleTimeString('id-ID')} • oleh {m.cashier_name}
                        </div>
                      </div>
                      <div className={`font-bold ${m.type === 'CASH_IN' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {m.type === 'CASH_IN' ? '+' : '-'}{fmt(Number(m.amount))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 8: QUICK REGISTER MEMBER */}
      {isQuickRegisterOpen && (
        <Modal open={isQuickRegisterOpen} onClose={() => setIsQuickRegisterOpen(false)} title="Registrasi Cepat Member Baru">
          <form onSubmit={handleQuickRegisterMember} className="space-y-4 text-xs">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
              <span className="font-bold flex items-center gap-1"><Sparkles size={14} /> Pelanggan Baru Terdeteksi</span>
              <p className="text-[11px] mt-0.5">Daftarkan langsung agar pembeli dapat mengumpulkan poin loyalitas dari transaksi ini.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp Pelanggan</label>
              <input
                type="text"
                disabled
                value={memberPhoneInput}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono text-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Pelanggan *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Contoh: Rina Andriani"
                value={quickMemberName}
                onChange={e => setQuickMemberName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tingkatan Awal (Tier)</label>
              <select
                value={quickMemberTier}
                onChange={e => setQuickMemberTier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none font-medium"
              >
                <option value="Silver">Silver (Member Reguler)</option>
                <option value="Gold">Gold (Prioritas)</option>
                <option value="Platinum">Platinum (VIP Rewards)</option>
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsQuickRegisterOpen(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingQuickMember}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {savingQuickMember ? "Mendaftarkan..." : "Daftar & Pilih Member"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 9: CEK STOK LINTAS CABANG (CROSS-BRANCH STOCK CHECKER) */}
      {isCrossStockModalOpen && (
        <Modal open={isCrossStockModalOpen} onClose={() => setIsCrossStockModalOpen(false)} title="Pemeriksaan Stok Lintas Cabang">
          <div className="space-y-4 text-xs">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={crossStockSearch}
                  onChange={e => {
                    setCrossStockSearch(e.target.value);
                    fetchCrossBranchStock(e.target.value);
                  }}
                  placeholder="Ketik nama produk, SKU, warna, ukuran, atau nama cabang..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              </div>
              <button
                type="button"
                onClick={() => fetchCrossBranchStock(crossStockSearch)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition"
              >
                <RefreshCw size={14} className={loadingCrossStock ? "animate-spin" : ""} />
                Segarkan
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px] sticky top-0">
                  <tr>
                    <th className="p-3 pl-4">Produk & Varian</th>
                    <th className="p-3">Cabang / Toko</th>
                    <th className="p-3 text-center">Stok Tersedia</th>
                    <th className="p-3 text-right pr-4">Harga Jual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {loadingCrossStock ? (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-400">Memeriksa ketersediaan stok seluruh cabang...</td></tr>
                  ) : crossStockList.length === 0 ? (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-400">Tidak ada produk yang cocok dengan pencarian.</td></tr>
                  ) : (
                    crossStockList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 pl-4">
                          <div className="font-bold text-slate-800">{item.product_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.sku} • {item.color} • {item.size}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                            <Building size={13} className="text-slate-400" />
                            <span>{item.warehouse_name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            Number(item.stock_qty) <= 0 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : Number(item.stock_qty) < 10
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {item.stock_qty} pcs
                          </span>
                        </td>
                        <td className="p-3 text-right pr-4 font-bold text-slate-800">
                          {fmt(Number(item.price_sell))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
