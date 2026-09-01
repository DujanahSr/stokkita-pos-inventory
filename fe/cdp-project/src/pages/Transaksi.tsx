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
  Coins, ArrowUpRight, ArrowDownLeft, Building, UserPlus, Eye, RefreshCw, Package,
  Ticket, Percent, Keyboard, Sliders
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

  // Dedicated POS Interface State
  const [activeMainTab, setActiveMainTab] = useState<"pos" | "retur" | "shift">("pos");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("Semua");
  const [historySearch, setHistorySearch] = useState("");

  // Manual Discount & Voucher Promo States
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [manualDiscountType, setManualDiscountType] = useState<"PERCENT" | "NOMINAL">("PERCENT");
  const [manualDiscountValue, setManualDiscountValue] = useState<number | "">("");
  const [manualDiscountReason, setManualDiscountReason] = useState("");
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [loadingVoucher, setLoadingVoucher] = useState(false);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  useEffect(() => {
    fetchWarehouses();
    fetchStoreSettings();
  }, []);

  const fetchStoreSettings = async () => {
    try {
      const res = await api.get("/settings");
      if (res.data) setStoreSettings(res.data);
    } catch (e) {
      // ignore
    }
  };

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
      if (res.data.length > 0) {
        // Cek apakah kasir sedang memiliki shift aktif di cabang manapun
        try {
          const shiftRes = await api.get("/shift/active");
          if (shiftRes.data?.active_shift?.warehouse_id) {
            setSelectedW(shiftRes.data.active_shift.warehouse_id);
            return;
          }
        } catch (e) {
          // ignore
        }
        setSelectedW(res.data[0].id);
      }
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
    if (!activeShift) {
      toast.warning("Shift kasir belum dibuka! Buka shift kasir terlebih dahulu untuk mulai transaksi.");
      setIsOpenShiftModal(true);
      if (e) e.target.value = "";
      return;
    }

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

      if (!activeShift) {
        toast.warning("Shift kasir belum dibuka! Buka shift kasir terlebih dahulu untuk memproses scan barcode.");
        setIsOpenShiftModal(true);
        setBarcodeInput("");
        return;
      }

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

  // Member, Discounts & Cart Total Calculations
  const rawCartTotal = cart.reduce((sum, c) => sum + c.qty * c.price, 0);
  const maxRedeemablePoints = selectedMember ? Math.min(Number(selectedMember.points) || 0, Math.floor(rawCartTotal / 100)) : 0;
  const pointsDiscount = (isRedeemingPoints && selectedMember) ? (maxRedeemablePoints * 100) : 0;
  
  // Manual discount calculation
  let manualDiscountAmount = 0;
  if (manualDiscountValue && Number(manualDiscountValue) > 0) {
    if (manualDiscountType === "PERCENT") {
      manualDiscountAmount = Math.round((rawCartTotal * Number(manualDiscountValue)) / 100);
    } else {
      manualDiscountAmount = Math.min(rawCartTotal, Number(manualDiscountValue));
    }
  }

  // Voucher discount calculation
  const voucherDiscountAmount = appliedVoucher ? Number(appliedVoucher.discount_amount || 0) : 0;

  const totalDiscount = pointsDiscount + manualDiscountAmount + voucherDiscountAmount;
  const cartTotal = Math.max(0, rawCartTotal - totalDiscount);
  const potentialPointsEarned = tipe === "Penjualan" ? Math.floor(cartTotal / 10000) : 0;

  // Keyboard Hotkeys for Cashier Speed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea unless it's a dedicated Function key
      const isInputFocused = ["INPUT", "TEXTAREA", "SELECT"].includes((document.activeElement?.tagName || ""));

      if (e.key === "F1") {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        toast.info("Fokus ke Barcode Scanner (F1)");
      } else if (e.key === "F2") {
        e.preventDefault();
        setIsDiscountModalOpen(prev => !prev);
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) {
          setPaymentMethod("Tunai");
          setCashReceived(cartTotal);
          toast.success(`Mode Tunai: Uang Pas (${fmt(cartTotal)}) dipilih (F4)`);
        } else {
          toast.warning("Keranjang masih kosong!");
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) {
          handleOpenHoldModal();
        } else {
          toast.warning("Tidak ada transaksi untuk diparkir!");
        }
      } else if (e.key === "Escape") {
        if (isDiscountModalOpen) {
          setIsDiscountModalOpen(false);
        } else if (isModalOpen) {
          setIsModalOpen(false);
        } else if (isHeldListModalOpen) {
          setIsHeldListModalOpen(false);
        } else if (isCrossStockModalOpen) {
          setIsCrossStockModalOpen(false);
        } else if (!isInputFocused && cart.length > 0) {
          if (confirm("Kosongkan keranjang belanja? (Esc)")) {
            setCart([]);
            toast.info("Keranjang belanja dikosongkan");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, cartTotal, isDiscountModalOpen, isModalOpen, isHeldListModalOpen, isCrossStockModalOpen]);

  // Apply Voucher Code
  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherInput.trim()) {
      toast.warning("Masukkan kode voucher terlebih dahulu!");
      return;
    }
    setLoadingVoucher(true);
    try {
      const res = await api.post("/vouchers/validate", {
        code: voucherInput.trim(),
        cart_total: rawCartTotal - pointsDiscount - manualDiscountAmount
      });
      setAppliedVoucher(res.data);
      toast.success(res.data.message || `Voucher "${res.data.code}" berhasil diterapkan!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Kode voucher tidak valid");
      setAppliedVoucher(null);
    } finally {
      setLoadingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput("");
    toast.info("Voucher promo dilepas");
  };

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
          return_reason: tipe === "Retur" ? returnReasonFormatted : undefined,
          discount_manual: manualDiscountAmount,
          discount_manual_reason: manualDiscountReason,
          discount_voucher: voucherDiscountAmount,
          voucher_code: appliedVoucher?.code || null
        },
        return_reason: tipe === "Retur" ? returnReasonFormatted : undefined,
        member_id: selectedMember?.id || null,
        member_name: selectedMember?.name || null,
        discount_points: pointsDiscount,
        redeemed_points: isRedeemingPoints ? maxRedeemablePoints : 0,
        discount_manual: manualDiscountAmount,
        discount_manual_reason: manualDiscountReason,
        discount_voucher: voucherDiscountAmount,
        voucher_code: appliedVoucher?.code || null
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
        payment_details: {
          ...paymentDetailsPayload,
          discount_manual: manualDiscountAmount,
          discount_voucher: voucherDiscountAmount,
          voucher_code: appliedVoucher?.code || null
        },
        return_reason: tipe === "Retur" ? returnReasonFormatted : null,
        discounts: {
          points: pointsDiscount,
          manual: manualDiscountAmount,
          manual_reason: manualDiscountReason,
          voucher: voucherDiscountAmount,
          voucher_code: appliedVoucher?.code || null,
          total: totalDiscount
        },
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
      setManualDiscountValue("");
      setManualDiscountReason("");
      setAppliedVoucher(null);
      setVoucherInput("");
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

  // Unique categories for filtering
  const catalogCategories = ["Semua", ...Array.from(new Set(inventory.map(i => i.category || "Sepatu").filter(Boolean)))];
  
  // Filtered Catalog
  const filteredCatalog = inventory.filter(item => {
    const q = catalogSearch.toLowerCase().trim();
    const matchSearch = !q || 
      (item.product_name || "").toLowerCase().includes(q) || 
      (item.sku || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q) ||
      (item.color || "").toLowerCase().includes(q) ||
      (item.size || "").toString().toLowerCase().includes(q);
    const matchCategory = catalogCategory === "Semua" || (item.category || "Sepatu").toLowerCase() === catalogCategory.toLowerCase();
    return matchSearch && matchCategory;
  });

  // Filtered History
  const filteredHistory = transaksiList.filter(t => {
    const q = historySearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (t.id || "").toLowerCase().includes(q) ||
      (t.kasir_name || "").toLowerCase().includes(q) ||
      (t.payment_method || "").toLowerCase().includes(q) ||
      (t.warehouse_name || "").toLowerCase().includes(q) ||
      (t.type || "").toLowerCase().includes(q)
    );
  });

  // Quick Cash Amounts
  const quickCashAmounts = [
    { label: "Uang Pas", val: cartTotal },
    { label: "Rp 50.000", val: 50000 },
    { label: "Rp 100.000", val: 100000 },
    { label: "Rp 200.000", val: 200000 },
    { label: "Rp 500.000", val: 500000 },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col h-screen overflow-hidden">
        <Navbar title="Mesin Kasir (POS Terminal Enterprise)" />
        
        {/* TOP POS NAVIGATION BAR */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 shadow-xs">
          {/* Main Tab Switchers */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveMainTab("pos");
                setTipe("Penjualan");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeMainTab === "pos"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingCart size={15} />
              <span>Kasir POS Touch</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMainTab("retur");
                setTipe("Retur");
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeMainTab === "retur"
                  ? "bg-white text-red-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <RefreshCw size={15} />
              <span>Retur Struk & Refund</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab("shift")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeMainTab === "shift"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock size={15} />
              <span>Shift & Riwayat Kasir</span>
            </button>
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-2">
            {/* Cek Stok Cabang */}
            <button
              type="button"
              onClick={() => {
                fetchCrossBranchStock();
                setIsCrossStockModalOpen(true);
              }}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Eye size={14} className="text-blue-600" />
              <span className="hidden sm:inline">Cek Stok Cabang</span>
            </button>

            {/* Antrean Terparkir */}
            <button
              type="button"
              onClick={() => setIsHeldListModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-2xs border ${
                heldCarts.length > 0
                  ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-pulse"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              <Pause size={14} />
              <span>Parkir ({heldCarts.length})</span>
            </button>

            {/* Warehouse Lock / Selector */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold ${
                activeShift ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {activeShift ? <Lock size={13} className="text-amber-600" /> : <Store size={13} className="text-emerald-600" />}
              <select 
                disabled={!!activeShift}
                className="bg-transparent outline-none cursor-pointer pr-1"
                value={selectedW} 
                onChange={e => setSelectedW(e.target.value)}
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* KEYBOARD SHORTCUTS INFO STRIP */}
        <div className="bg-slate-800 text-slate-300 px-4 py-1 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 shadow-inner flex-shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Keyboard size={13} />
            <span>Hotkeys Kasir:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><kbd className="bg-slate-700 text-white px-1.5 py-0.5 rounded border border-slate-600 font-bold">F1</kbd> Scan Barcode</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-700 text-white px-1.5 py-0.5 rounded border border-slate-600 font-bold">F2</kbd> Diskon & Kupon</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-700 text-white px-1.5 py-0.5 rounded border border-slate-600 font-bold">F4</kbd> Bayar Uang Pas</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-700 text-white px-1.5 py-0.5 rounded border border-slate-600 font-bold">F8</kbd> Parkir Transaksi</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-700 text-white px-1.5 py-0.5 rounded border border-slate-600 font-bold">Esc</kbd> Reset / Batal</span>
          </div>
        </div>

        {/* MAIN BODY AREA */}
        <main className="flex-1 overflow-hidden p-3 sm:p-4">
          
          {/* TAB 1: DEDICATED POS TOUCH SCREEN */}
          {activeMainTab === "pos" && (
            <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 overflow-hidden">
              
              {/* SISI KIRI: KATALOG PRODUK & SEARCH (7 COLS = ~60% LAYAR) */}
              <div className="lg:col-span-7 flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                
                {/* Search Bar & Barcode Scanner Bar */}
                <div className="p-3 border-b border-slate-100 space-y-2.5 bg-slate-50/50">
                  <div className="flex gap-2">
                    {/* Live Catalog Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={e => setCatalogSearch(e.target.value)}
                        placeholder="Cari produk sepatu, SKU, warna..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      {catalogSearch && (
                        <button
                          type="button"
                          onClick={() => setCatalogSearch("")}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Barcode Scanner Direct Input */}
                    <div className="relative w-48 sm:w-56">
                      <Barcode className="absolute left-3 top-2.5 text-emerald-600" size={16} />
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeInput}
                        onChange={e => setBarcodeInput(e.target.value)}
                        onKeyDown={handleScanBarcode}
                        placeholder="Scan Barcode (Enter)..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Quick Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    {catalogCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCatalogCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                          catalogCategory === cat
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Product Grid */}
                <div className="flex-1 p-3 overflow-y-auto">
                  {filteredCatalog.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                      <Package size={48} className="text-slate-300 mb-2" />
                      <p className="text-sm font-semibold">Tidak ada produk ditemukan</p>
                      <p className="text-xs text-slate-400 mt-0.5">Coba ubah kata kunci pencarian atau kategori</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-2.5">
                      {filteredCatalog.map(inv => {
                        const inCart = cart.find(c => c.variant_id === inv.variant_id);
                        const isOutOfStock = inv.qty <= 0;
                        const isLowStock = inv.qty > 0 && inv.qty <= 10;

                        return (
                          <div
                            key={inv.variant_id}
                            onClick={() => {
                              if (!activeShift) {
                                if (confirm("Shift kasir belum dibuka. Buka shift kasir terlebih dahulu?")) {
                                  setIsOpenShiftModal(true);
                                }
                                return;
                              }
                              handleAddToCart(inv.variant_id);
                            }}
                            className={`group relative p-3 rounded-xl border text-left transition-all cursor-pointer select-none flex flex-col justify-between ${
                              isOutOfStock
                                ? "bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed"
                                : inCart
                                ? "bg-emerald-50/50 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs"
                                : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm"
                            }`}
                          >
                            {/* In-Cart Quantity Indicator Badge */}
                            {inCart && (
                              <div className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                                {inCart.qty}
                              </div>
                            )}

                            <div>
                              {/* Category & Stock Pill */}
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {inv.category || "Sepatu"}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isOutOfStock
                                    ? "bg-red-100 text-red-700"
                                    : isLowStock
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {isOutOfStock ? "Habis" : `Stok: ${inv.qty}`}
                                </span>
                              </div>

                              {/* Product Title */}
                              <h3 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                                {inv.product_name}
                              </h3>

                              {/* Variant Details */}
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                                <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded">{inv.sku}</span>
                                <span>•</span>
                                <span>Sz {inv.size}</span>
                                <span>•</span>
                                <span>{inv.color}</span>
                              </div>
                            </div>

                            {/* Price Tag */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900">
                                {fmt(inv.price_sell)}
                              </span>
                              <div className={`p-1 rounded-lg ${isOutOfStock ? 'text-slate-300' : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition'}`}>
                                <Plus size={13} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Quick Status */}
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span>Katalog: <strong>{filteredCatalog.length} item</strong> varian siap jual</span>
                  <span>Klik kartu produk untuk menambah keranjang</span>
                </div>
              </div>

              {/* SISI KANAN: KERANJANG BELANJA & PANEL CHECKOUT (5 COLS = ~40% LAYAR) */}
              <div className="lg:col-span-5 flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                
                {/* Header Keranjang & Shift Status */}
                <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${activeShift ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                      <span className="font-bold text-xs text-slate-800">
                        {activeShift ? `Kasir: ${activeShift.cashier_name || 'Admin'}` : 'Shift Kasir Belum Dibuka'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {activeShift ? (
                        <button
                          type="button"
                          onClick={() => {
                            fetchPettyCashMovements(activeShift.id);
                            setIsPettyCashModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg transition"
                          title="Catat kas masuk/keluar laci"
                        >
                          Kas Laci
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsOpenShiftModal(true)}
                          className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-lg transition"
                        >
                          + Buka Shift
                        </button>
                      )}

                      {cart.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={handleOpenHoldModal}
                            className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded-lg transition"
                            title="Parkir transaksi saat ini"
                          >
                            Parkir
                          </button>
                          <button
                            type="button"
                            onClick={() => setCart([])}
                            className="text-[10px] font-bold text-red-700 bg-red-100 hover:bg-red-200 px-2 py-1 rounded-lg transition"
                            title="Kosongkan seluruh keranjang"
                          >
                            Reset
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Member Loyalty Input Dropdown */}
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Phone className="absolute left-2.5 top-2 text-slate-400" size={13} />
                      <input
                        type="text"
                        value={memberPhoneInput}
                        onChange={e => setMemberPhoneInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLookupMember()}
                        placeholder="No WhatsApp Member..."
                        className="w-full pl-7 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    {selectedMember ? (
                      <button
                        type="button"
                        onClick={handleRemoveMember}
                        className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        title="Lepas member"
                      >
                        <X size={12} />
                        <span>{selectedMember.name}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleLookupMember}
                        disabled={loadingMemberLookup}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                      >
                        {loadingMemberLookup ? "..." : "Cari"}
                      </button>
                    )}
                  </div>

                  {/* Member Badge & Points Info */}
                  {selectedMember && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold text-emerald-900">
                        <span>{selectedMember.name} ({selectedMember.tier})</span>
                        <span>{selectedMember.points} Poin</span>
                      </div>
                      {selectedMember.points > 0 && rawCartTotal > 0 && (
                        <label className="flex items-center gap-1.5 text-[11px] text-emerald-800 cursor-pointer pt-1 border-t border-emerald-200/60">
                          <input
                            type="checkbox"
                            checked={isRedeemingPoints}
                            onChange={e => setIsRedeemingPoints(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>Tukarkan {maxRedeemablePoints} poin (-{fmt(pointsDiscount)})</span>
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                      <ShoppingCart size={40} className="text-slate-300 mb-2" />
                      <p className="text-xs font-semibold">Keranjang Masih Kosong</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Pilih produk dari katalog di sebelah kiri</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.variant_id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                          <span className="text-[11px] text-slate-500">{fmt(item.price)} / pcs</span>
                        </div>

                        {/* Interactive Qty Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQty(item.variant_id, item.qty - 1)}
                            className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-bold text-xs text-slate-800">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.variant_id, item.qty + 1)}
                            className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal & Trash */}
                        <div className="text-right min-w-[70px]">
                          <div className="font-bold text-xs text-slate-900">{fmt(item.qty * item.price)}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeCart(item.variant_id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Checkout & Payment Bottom Section */}
                <div className="p-3 border-t border-slate-200 bg-slate-50/80 space-y-2.5">
                  
                  {/* Diskon & Kupon Promo Trigger Bar */}
                  <div className="flex items-center justify-between gap-1.5 bg-emerald-50/80 border border-emerald-200 p-2 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setIsDiscountModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
                      title="Tambah diskon manual atau masukkan kupon voucher (Tekan F2)"
                    >
                      <Ticket size={14} className="text-emerald-600" />
                      <span>+ Diskon / Kupon Promo</span>
                      <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-1 rounded font-mono">F2</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {manualDiscountAmount > 0 && (
                        <span className="text-[10px] font-bold bg-white text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          -{fmt(manualDiscountAmount)}
                          <button
                            type="button"
                            onClick={() => {
                              setManualDiscountValue("");
                              setManualDiscountReason("");
                            }}
                            className="text-slate-400 hover:text-red-500 font-bold ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      )}

                      {appliedVoucher && (
                        <span className="text-[10px] font-bold bg-white text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                          {appliedVoucher.code} (-{fmt(appliedVoucher.discount_amount)})
                          <button
                            type="button"
                            onClick={handleRemoveVoucher}
                            className="text-slate-400 hover:text-red-500 font-bold ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Totals & Discounts Breakdown */}
                  <div className="space-y-1 text-xs">
                    {pointsDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Diskon Loyalty Poin:</span>
                        <span>-{fmt(pointsDiscount)}</span>
                      </div>
                    )}
                    {manualDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Diskon Manual {manualDiscountReason ? `(${manualDiscountReason})` : ''}:</span>
                        <span>-{fmt(manualDiscountAmount)}</span>
                      </div>
                    )}
                    {voucherDiscountAmount > 0 && (
                      <div className="flex justify-between text-blue-700 font-medium">
                        <span>Voucher Promo ({appliedVoucher?.code}):</span>
                        <span>-{fmt(voucherDiscountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline font-black pt-0.5 border-t border-slate-200">
                      <span className="text-slate-700 text-xs uppercase tracking-wider">Total Akhir:</span>
                      <span className="text-emerald-700 text-lg font-black">{fmt(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Payment Method Tabs */}
                  <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-bold text-center">
                    {(["Tunai", "QRIS", "Debit", "Split"] as const).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-1.5 rounded-lg transition-all ${
                          paymentMethod === method
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  {/* Payment Specific Input Area */}
                  {paymentMethod === "Tunai" && (
                    <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200">
                      {/* Quick Cash Buttons */}
                      <div className="flex flex-wrap gap-1">
                        {quickCashAmounts.map(qc => (
                          <button
                            key={qc.label}
                            type="button"
                            onClick={() => setCashReceived(qc.val)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 transition"
                          >
                            {qc.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold">Rp</span>
                          <input
                            type="number"
                            value={cashReceived}
                            onChange={e => setCashReceived(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Uang Diterima..."
                            className="w-full pl-8 pr-2 py-1 text-xs font-bold border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        {Number(cashReceived) >= cartTotal && (
                          <div className="text-right text-[11px] font-bold text-emerald-700">
                            Kembali: {fmt(Number(cashReceived) - cartTotal)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentMethod === "QRIS" && (
                    <div className="bg-white p-2 rounded-xl border border-blue-200 text-center space-y-1">
                      <p className="text-[11px] font-bold text-blue-800">QRIS Dinamis Otomatis</p>
                      <p className="text-[10px] text-slate-500">Scan QR Code pelanggan melalui aplikasi banking/e-wallet</p>
                    </div>
                  )}

                  {paymentMethod === "Debit" && (
                    <div className="bg-white p-2 rounded-xl border border-purple-200 grid grid-cols-2 gap-2 text-xs">
                      <select
                        value={debitBank}
                        onChange={e => setDebitBank(e.target.value)}
                        className="p-1 border border-slate-200 rounded-lg text-xs font-semibold"
                      >
                        <option value="BCA">EDC BCA</option>
                        <option value="Mandiri">EDC Mandiri</option>
                        <option value="BRI">EDC BRI</option>
                        <option value="BNI">EDC BNI</option>
                      </select>
                      <input
                        type="text"
                        maxLength={4}
                        value={cardLast4}
                        onChange={e => setCardLast4(e.target.value)}
                        placeholder="4 Digit Kartu"
                        className="p-1 border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  )}

                  {paymentMethod === "Split" && (
                    <div className="bg-white p-2 rounded-xl border border-amber-200 space-y-1 text-xs">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={splitCash}
                          onChange={e => setSplitCash(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Nominal Tunai..."
                          className="flex-1 p-1 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                        <span className="text-[10px] self-center text-slate-500">
                          Non-Tunai: {fmt(Math.max(0, cartTotal - (Number(splitCash) || 0)))}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Big Checkout Button */}
                  <button
                    type="button"
                    disabled={cart.length === 0 || loadingSubmit}
                    onClick={handleSimpan}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {loadingSubmit ? (
                      <span>Memproses Transaksi...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>BAYAR SEKARANG ({fmt(cartTotal)})</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: DEDICATED RECEIPT RETURN & REFUND WORKFLOW */}
          {activeMainTab === "retur" && (
            <div className="h-full bg-white border border-slate-200 rounded-2xl shadow-xs p-6 overflow-y-auto max-w-5xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <RefreshCw className="text-red-600" size={24} />
                  Modul Retur Pelanggan & Pengembalian Dana (Refund)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cari struk transaksi asli pelanggan untuk mengisi barang retur secara otomatis dan memproses refund
                </p>
              </div>

              {/* Step 1: Lookup Receipt */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-slate-700">1. Masukkan Nomor Struk / ID Transaksi</label>
                <form onSubmit={handleLookupReceipt} className="flex gap-2">
                  <input
                    type="text"
                    value={receiptLookupInput}
                    onChange={e => setReceiptLookupInput(e.target.value)}
                    placeholder="Contoh: 1b2c3d4e atau tempelkan ID struk..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loadingReceiptLookup}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Search size={14} />
                    <span>{loadingReceiptLookup ? "Mencari..." : "Muat Data Struk"}</span>
                  </button>
                </form>
              </div>

              {/* Step 2: Display Original Receipt Items */}
              {originalReceiptData && (
                <div className="p-4 bg-red-50/50 border border-red-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm text-red-950">
                        Struk Terverifikasi: #{originalReceiptData.transaction.id.slice(0, 8)}
                      </h3>
                      <p className="text-xs text-red-700">
                        Tanggal: {new Date(originalReceiptData.transaction.created_at).toLocaleString('id-ID')} • Kasir: {originalReceiptData.transaction.kasir_name || "Kasir"}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold text-xs rounded-full">
                      Total Beli: {fmt(originalReceiptData.transaction.total_amount)}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-slate-700">Pilih item barang yang ingin diretur oleh pembeli:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {originalReceiptData.items.map((item: any) => (
                        <div key={item.id} className="p-3 bg-white border border-red-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                          <div>
                            <h4 className="font-bold text-xs text-slate-800">{item.product_name}</h4>
                            <p className="text-[11px] text-slate-500">
                              SKU: {item.sku} • Sz: {item.size} • Beli: {item.qty} pcs @ {fmt(item.price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddReceiptItemToCart(item)}
                            className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Plus size={13} />
                            <span>+ Retur</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Return Items List & Refund Reason */}
              {cart.length > 0 && (
                <div className="space-y-4 pt-2">
                  <h3 className="font-bold text-sm text-slate-800">Daftar Barang yang Diretur ({cart.length} item):</h3>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.variant_id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-xs text-slate-800">{item.name}</h4>
                          <span className="text-[11px] text-slate-500">{fmt(item.price)} / pcs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">{item.qty} pcs</span>
                          <span className="text-xs font-black text-red-600">{fmt(item.qty * item.price)}</span>
                          <button
                            type="button"
                            onClick={() => removeCart(item.variant_id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Return Reasons & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Retur</label>
                      <select
                        value={returnReason}
                        onChange={e => setReturnReason(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value="Barang Rusak / Cacat">Barang Rusak / Cacat</option>
                        <option value="Salah Ukuran / Size Tidak Pas">Salah Ukuran / Size Tidak Pas</option>
                        <option value="Salah Model / Warna">Salah Model / Warna</option>
                        <option value="Permintaan Pembeli">Permintaan Pembeli</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Metode Pengembalian Dana (Refund)</label>
                      <select
                        value={refundMethod}
                        onChange={e => setRefundMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold outline-none"
                      >
                        <option value="Tunai">Uang Tunai Laci Kasir (Cash Refund)</option>
                        <option value="Transfer">Transfer Bank / E-Wallet</option>
                      </select>
                    </div>
                  </div>

                  {/* Total Refund & Submit */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-xs font-bold text-red-900 uppercase">Total Dana yang Wajib Dikembalikan:</span>
                      <div className="text-2xl font-black text-red-600">{fmt(cartTotal)}</div>
                    </div>

                    <button
                      type="button"
                      disabled={loadingSubmit}
                      onClick={handleSimpan}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>{loadingSubmit ? "Memproses..." : "Selesaikan Retur & Refund"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEDICATED SHIFT & RIWAYAT KASIR */}
          {activeMainTab === "shift" && (
            <div className="h-full bg-white border border-slate-200 rounded-2xl shadow-xs p-6 overflow-y-auto space-y-6">
              
              {/* Shift Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Total Omzet Shift Saya</span>
                  <div className="text-xl font-black text-emerald-950 mt-1">
                    {fmt(Number(activeShift?.total_sales || 0))}
                  </div>
                  <span className="text-[11px] text-emerald-700 mt-1 block">
                    {activeShift ? "Shift Sedang Aktif" : "Shift Belum Dibuka"}
                  </span>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <span className="text-xs font-bold text-blue-800 uppercase">Modal Kas Awal Laci</span>
                  <div className="text-xl font-black text-blue-950 mt-1">
                    {fmt(Number(activeShift?.start_cash || 0))}
                  </div>
                  <span className="text-[11px] text-blue-700 mt-1 block">
                    Float Kasir
                  </span>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                  <span className="text-xs font-bold text-purple-800 uppercase">Penjualan Non-Tunai</span>
                  <div className="text-xl font-black text-purple-950 mt-1">
                    {fmt(Number(activeShift?.total_non_cash_sales || 0))}
                  </div>
                  <span className="text-[11px] text-purple-700 mt-1 block">
                    QRIS & Kartu Debit
                  </span>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-800 uppercase">Aksi Shift Kasir</span>
                    <p className="text-xs text-amber-900 mt-0.5 font-medium">{activeShift?.cashier_name || "Kasir"}</p>
                  </div>
                  {activeShift ? (
                    <button
                      type="button"
                      onClick={() => setIsCloseShiftModal(true)}
                      className="mt-2 w-full py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition"
                    >
                      Tutup Shift (Z-Report)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsOpenShiftModal(true)}
                      className="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition"
                    >
                      Buka Shift Baru
                    </button>
                  )}
                </div>
              </div>

              {/* Riwayat Transaksi Table */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-800">Riwayat Transaksi Kasir</h3>
                    <p className="text-xs text-slate-500">Daftar transaksi dan cetak ulang struk pelanggan</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2 text-slate-400" size={15} />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                      placeholder="Cari struk / kasir / metode..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3">Waktu</th>
                        <th className="p-3">ID Struk</th>
                        <th className="p-3">Cabang</th>
                        <th className="p-3">Tipe</th>
                        <th className="p-3">Metode Bayar</th>
                        <th className="p-3">Kasir</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">Belum ada riwayat transaksi.</td>
                        </tr>
                      ) : (
                        filteredHistory.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-600 whitespace-nowrap">
                              {new Date(t.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-700">#{t.id.slice(0, 8)}</td>
                            <td className="p-3 text-slate-700 font-medium">{t.warehouse_name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                t.type === 'Retur' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-700">{t.payment_method || "Tunai"}</td>
                            <td className="p-3 text-slate-600">{t.kasir_name || "Kasir"}</td>
                            <td className="p-3 text-right font-bold text-slate-900">{fmt(t.total_amount)}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleReprintReceipt(t)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition"
                              >
                                <Printer size={12} />
                                <span>Struk</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

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
              {/* Header Toko Dinamis dari Pengaturan */}
              <div className="text-center font-bold text-sm space-y-0.5">
                <div className="text-base uppercase tracking-wide">{storeSettings?.store_name || receiptData.warehouse.toUpperCase()}</div>
                {storeSettings?.slogan && <div className="text-[10px] font-normal text-slate-500">{storeSettings.slogan}</div>}
                {storeSettings?.address && <div className="text-[10px] font-normal text-slate-600">{storeSettings.address}</div>}
                {storeSettings?.phone && <div className="text-[10px] font-normal text-slate-600">Telp: {storeSettings.phone}</div>}
                <div className="text-[10px] font-bold text-emerald-800 pt-1">
                  {receiptData.type === "Retur" ? "BUKTI RETUR & REFUND DANA" : (storeSettings?.receipt_header || "StokKita POS Retail")}
                </div>
              </div>

              <div className="border-t border-dashed my-2"></div>

              <div className="space-y-0.5 text-slate-600 text-[11px]">
                <div className="flex justify-between"><span>No Trx:</span><span>{receiptData.transaction_id.slice(0, 12)}</span></div>
                <div className="flex justify-between"><span>Waktu:</span><span>{receiptData.date}</span></div>
                <div className="flex justify-between"><span>Kasir:</span><span>{receiptData.kasir}</span></div>
                <div className="flex justify-between"><span>Cabang:</span><span>{receiptData.warehouse}</span></div>
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
                {/* Rincian Potongan Diskon */}
                {receiptData.discounts?.points > 0 && (
                  <div className="flex justify-between text-purple-700">
                    <span>Diskon Loyalty Poin:</span>
                    <span>-{fmt(receiptData.discounts.points)}</span>
                  </div>
                )}
                {receiptData.discounts?.manual > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Diskon Manual {receiptData.discounts.manual_reason ? `(${receiptData.discounts.manual_reason})` : ''}:</span>
                    <span>-{fmt(receiptData.discounts.manual)}</span>
                  </div>
                )}
                {receiptData.discounts?.voucher > 0 && (
                  <div className="flex justify-between text-blue-700">
                    <span>Voucher ({receiptData.discounts.voucher_code}):</span>
                    <span>-{fmt(receiptData.discounts.voucher)}</span>
                  </div>
                )}

                {receiptData.member && (
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] space-y-0.5 my-1 font-sans">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>👑 Member: {receiptData.member.name}</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-semibold">{receiptData.member.tier}</span>
                    </div>
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

                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
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

              {/* Footer Toko Dinamis dari Pengaturan */}
              <div className="text-center text-[10px] text-slate-600 pt-2 space-y-1">
                <p className="whitespace-pre-line leading-relaxed">
                  {storeSettings?.receipt_footer || "Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli dapat ditukar max 3 hari dengan struk ini."}
                </p>
                {storeSettings?.instagram && (
                  <p className="font-bold text-slate-800">
                    Follow IG: {storeSettings.instagram}
                  </p>
                )}
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

      {/* MODAL DISKON MANUAL & KUPON PROMO (HOTKEY F2) */}
      {isDiscountModalOpen && (
        <Modal open={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} title="Diskon Manual & Kupon Promo (F2)">
          <div className="space-y-5 font-sans">
            
            {/* SECTION 1: KODE VOUCHER PROMO */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Ticket className="text-blue-600" size={18} />
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Punya Kupon Diskon / Voucher?</h3>
              </div>

              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                  placeholder="Ketik kode kupon (mis: PROMO10)..."
                  className="flex-1 px-3 py-2 text-xs bg-white border border-blue-300 rounded-xl uppercase font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loadingVoucher || !voucherInput.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition"
                >
                  {loadingVoucher ? "Mengecek..." : "Terapkan"}
                </button>
              </form>

              {appliedVoucher && (
                <div className="bg-white p-2.5 rounded-xl border border-blue-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-blue-900">{appliedVoucher.code}</span>
                    <p className="text-[11px] text-emerald-700 font-semibold">Hemat {fmt(appliedVoucher.discount_amount)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="text-xs text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 2: DISKON MANUAL TOKO (Persen / Nominal) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sliders className="text-slate-700" size={18} />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Diskon Khusus Toko / Display</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold text-center">
                <button
                  type="button"
                  onClick={() => setManualDiscountType("PERCENT")}
                  className={`py-1.5 rounded-lg transition ${manualDiscountType === 'PERCENT' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Persentase (%)
                </button>
                <button
                  type="button"
                  onClick={() => setManualDiscountType("NOMINAL")}
                  className={`py-1.5 rounded-lg transition ${manualDiscountType === 'NOMINAL' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Nominal Tetap (Rp)
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {manualDiscountType === 'PERCENT' ? 'Persentase Diskon (%)' : 'Potongan Nominal (Rp)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={manualDiscountType === 'PERCENT' ? 100 : rawCartTotal}
                  value={manualDiscountValue}
                  onChange={e => setManualDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder={manualDiscountType === 'PERCENT' ? 'Misal: 10%' : 'Misal: 50000'}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Alasan Diskon (Opsional)</label>
                <input
                  type="text"
                  value={manualDiscountReason}
                  onChange={e => setManualDiscountReason(e.target.value)}
                  placeholder="Misal: Promo Opening, Diskon Cuci Gudang, Cacat Jahitan"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setManualDiscountValue("");
                  setManualDiscountReason("");
                  setAppliedVoucher(null);
                  setVoucherInput("");
                  setIsDiscountModalOpen(false);
                }}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold"
              >
                Reset Semua
              </button>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Simpan & Pasang Diskon
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
