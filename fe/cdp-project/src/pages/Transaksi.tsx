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
  Ticket, Percent, Keyboard, Sliders, Volume2, VolumeX, FileEdit, StickyNote, Star
} from "lucide-react";
import { toast } from "sonner";
import { posAudio } from "../utils/audio";
import footwearLuxuryBg from "../assets/footwear_luxury_bg.jpg";
import shoeLuxuryEmblem from "../assets/shoe_luxury_emblem.jpg";

interface CartItem {
  variant_id: string;
  qty: number;
  price: number;
  name: string;
  notes?: string;
  image_url?: string;
}

interface HeldCart {
  id: string;
  name: string;
  notes?: string;
  items: CartItem[];
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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [returnReason, setReturnReason] = useState("Barang Rusak / Cacat");
  const [returnNotes, setReturnNotes] = useState("");
  
  // Audio Feedback State
  const [audioEnabled, setAudioEnabled] = useState(posAudio.enabled);

  // Store Settings (Tax, Service, Rounding)
  const [storeSettings, setStoreSettings] = useState<any>(null);

  // Item Note Editing State
  const [editingNoteVariantId, setEditingNoteVariantId] = useState<string | null>(null);
  const [itemNoteInput, setItemNoteInput] = useState("");
  
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
  const [showHotkeys, setShowHotkeys] = useState(false);

  // Manual Discount & Voucher Promo States
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [manualDiscountType, setManualDiscountType] = useState<"PERCENT" | "NOMINAL">("PERCENT");
  const [manualDiscountValue, setManualDiscountValue] = useState<number | "">("");
  const [manualDiscountReason, setManualDiscountReason] = useState("");
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [loadingVoucher, setLoadingVoucher] = useState(false);

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

  // Audio Toggle Handler
  const handleToggleAudio = () => {
    const newState = posAudio.toggleAudio();
    setAudioEnabled(newState);
    if (newState) toast.success("Suara Audio Kasir Aktif (Beep & Chime)");
    else toast.info("Suara Audio Kasir Dimatikan");
  };

  // Cart & POS Handlers
  const handleAddToCart = (vid: string, e?: React.ChangeEvent<HTMLSelectElement>) => {
    if (!activeShift) {
      posAudio.playErrorBeep();
      toast.warning("Shift kasir belum dibuka! Buka shift kasir terlebih dahulu untuk mulai transaksi.");
      setIsOpenShiftModal(true);
      if (e) e.target.value = "";
      return;
    }

    if (!vid) return;
    const inv = inventory.find(i => i.variant_id === vid);
    if (!inv) {
      posAudio.playErrorBeep();
      if (e) e.target.value = "";
      return;
    }
    
    if (tipe === 'Penjualan' && inv.qty <= 0) {
      posAudio.playErrorBeep();
      toast.error(`Stok "${inv.product_name}" habis/kosong!`);
      if (e) e.target.value = "";
      return;
    }

    const existing = cart.find(c => c.variant_id === vid);
    if (existing) {
      if (tipe === 'Penjualan' && existing.qty >= inv.qty) {
        posAudio.playErrorBeep();
        toast.warning(`Stok tidak mencukupi! Maksimal tersedia: ${inv.qty} pcs`);
        if (e) e.target.value = "";
        return;
      }
      setCart(cart.map(c => c.variant_id === vid ? { ...c, qty: c.qty + 1 } : c));
      posAudio.playScanBeep();
      toast.info(`+1 ${inv.product_name} (${inv.sku})`);
    } else {
      setCart([...cart, { 
        variant_id: inv.variant_id, 
        qty: 1, 
        price: inv.price_sell, 
        name: `${inv.product_name} (${inv.sku})`,
        image_url: inv.image_url 
      }]);
      posAudio.playScanBeep();
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
        posAudio.playErrorBeep();
        toast.warning("Shift kasir belum dibuka! Buka shift kasir terlebih dahulu untuk memproses scan barcode.");
        setIsOpenShiftModal(true);
        setBarcodeInput("");
        return;
      }

      const inv = inventory.find(i => i.sku.toLowerCase() === scanned.toLowerCase());
      if (inv) {
        handleAddToCart(inv.variant_id);
      } else {
        posAudio.playErrorBeep();
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
      posAudio.playErrorBeep();
      toast.warning("Maksimal stok tersedia: " + inv.qty);
      return;
    }
    setCart(cart.map(c => c.variant_id === vid ? { ...c, qty: Math.max(1, qty) } : c));
  };

  // Item Note Handler
  const handleSaveItemNote = (vid: string) => {
    setCart(cart.map(c => c.variant_id === vid ? { ...c, notes: itemNoteInput.trim() || undefined } : c));
    setEditingNoteVariantId(null);
    setItemNoteInput("");
    toast.success("Catatan item tersimpan");
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
  const baseDiscountedTotal = Math.max(0, rawCartTotal - totalDiscount);

  // Financial Policy: Tax & Service & Rounding
  const isTaxEnabled = Boolean(storeSettings?.enable_tax);
  const taxRate = Number(storeSettings?.tax_rate) || 11.0;
  const isTaxExclusive = storeSettings?.tax_type === "EXCLUSIVE";
  
  let taxAmount = 0;
  if (isTaxEnabled) {
    if (isTaxExclusive) {
      taxAmount = Math.round((baseDiscountedTotal * taxRate) / 100);
    } else {
      taxAmount = Math.round(baseDiscountedTotal - (baseDiscountedTotal / (1 + taxRate / 100)));
    }
  }

  const isServiceEnabled = Boolean(storeSettings?.enable_service_charge);
  const serviceRate = Number(storeSettings?.service_charge_rate) || 0;
  const serviceChargeAmount = isServiceEnabled ? Math.round((baseDiscountedTotal * serviceRate) / 100) : 0;

  const intermediateTotal = baseDiscountedTotal + (isTaxExclusive ? taxAmount : 0) + serviceChargeAmount;

  // Cash Rounding
  const isRoundingEnabled = Boolean(storeSettings?.enable_cash_rounding);
  let roundingAmount = 0;
  if (isRoundingEnabled && intermediateTotal > 0) {
    const rounded = Math.ceil(intermediateTotal / 100) * 100;
    roundingAmount = rounded - intermediateTotal;
  }

  // Final Payable Cart Total
  const cartTotal = Math.max(0, intermediateTotal + roundingAmount);
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
          toast("Kosongkan keranjang belanja?", {
            description: "Seluruh item dalam transaksi saat ini akan dihapus.",
            action: {
              label: "Ya, Kosongkan",
              onClick: () => {
                setCart([]);
                toast.info("Keranjang belanja berhasil dikosongkan");
              }
            },
            cancel: {
              label: "Batal",
              onClick: () => {}
            }
          });
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
      toast.warning(`Member dengan nomor "${memberPhoneInput}" belum terdaftar.`, {
        description: "Daftarkan pelanggan baru ke loyalty reward?",
        action: {
          label: "+ Daftar Member",
          onClick: () => setIsQuickRegisterOpen(true)
        },
        cancel: {
          label: "Batal",
          onClick: () => {}
        }
      });
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
        name: itemName,
        image_url: item.image_url
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
    const doRecall = () => {
      if (heldCart.warehouse_id && heldCart.warehouse_id !== selectedW) {
        setSelectedW(heldCart.warehouse_id);
      }
      setCart([...heldCart.items]);
      setHeldCarts(prev => prev.filter(h => h.id !== heldCart.id));
      setIsHeldListModalOpen(false);
      setIsModalOpen(true);
      toast.info(`Memuat kembali transaksi antrean "${heldCart.name}"`);
    };

    if (cart.length > 0) {
      toast.warning(`Timpa keranjang saat ini?`, {
        description: `Keranjang kasir sedang berisi ${cart.length} item. Yakin ingin menimpa dengan antrean "${heldCart.name}"?`,
        action: {
          label: "Ya, Timpa",
          onClick: doRecall
        },
        cancel: {
          label: "Batal",
          onClick: () => {}
        }
      });
      return;
    }

    doRecall();
  };

  const handleDeleteHeldCart = (heldCartId: string, name: string) => {
    toast.error(`Batalkan antrean "${name}"?`, {
      description: "Data transaksi antrean terparkir ini akan dihapus permanen.",
      action: {
        label: "Hapus Antrean",
        onClick: () => {
          setHeldCarts(prev => prev.filter(h => h.id !== heldCartId));
          toast.info(`Antrean "${name}" dibatalkan`);
        }
      },
      cancel: {
        label: "Batal",
        onClick: () => {}
      }
    });
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
        if (cashReceived === "" || Number(cashReceived) <= 0) {
          toast.warning("Masukkan nominal uang tunai yang diterima dari pembeli!", {
            description: "Silakan ketik nominal uang atau pilih salah satu tombol pecahan (Uang Pas, 50K, 100K, dll)."
          });
          return;
        }
        const received = Number(cashReceived);
        if (received < cartTotal) {
          toast.error(`Nominal uang tunai kurang ${fmt(cartTotal - received)}!`, {
            description: `Total belanja: ${fmt(cartTotal)} | Uang diterima: ${fmt(received)}`
          });
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
        items: cart.map(c => ({ variant_id: c.variant_id, qty: c.qty, price: c.price, notes: c.notes })),
        payment_method: effectivePaymentMethod,
        payment_details: {
          ...paymentDetailsPayload,
          return_reason: tipe === "Retur" ? returnReasonFormatted : undefined,
          discount_manual: manualDiscountAmount,
          discount_manual_reason: manualDiscountReason,
          discount_voucher: voucherDiscountAmount,
          voucher_code: appliedVoucher?.code || null,
          tax_amount: taxAmount,
          service_charge_amount: serviceChargeAmount,
          rounding_amount: roundingAmount
        },
        return_reason: tipe === "Retur" ? returnReasonFormatted : undefined,
        member_id: selectedMember?.id || null,
        member_name: selectedMember?.name || null,
        discount_points: pointsDiscount,
        redeemed_points: isRedeemingPoints ? maxRedeemablePoints : 0,
        discount_manual: manualDiscountAmount,
        discount_manual_reason: manualDiscountReason,
        discount_voucher: voucherDiscountAmount,
        voucher_code: appliedVoucher?.code || null,
        tax_amount: taxAmount,
        service_charge_amount: serviceChargeAmount,
        rounding_amount: roundingAmount,
        final_amount: cartTotal
      });

      setIsModalOpen(false);
      posAudio.playSuccessChime();
      
      // Set Receipt Data for printing
      setReceiptData({
        transaction_id: res.data.transaction_id,
        date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        kasir: activeShift?.cashier_name || "Kasir Toko",
        warehouse: warehouses.find(w => w.id === selectedW)?.name || "",
        items: [...cart],
        raw_total: rawCartTotal,
        base_discounted: baseDiscountedTotal,
        total: cartTotal,
        type: tipe,
        payment_method: effectivePaymentMethod,
        payment_details: {
          ...paymentDetailsPayload,
          discount_manual: manualDiscountAmount,
          discount_voucher: voucherDiscountAmount,
          voucher_code: appliedVoucher?.code || null,
          tax_amount: taxAmount,
          service_charge_amount: serviceChargeAmount,
          rounding_amount: roundingAmount
        },
        taxes: {
          tax_amount: taxAmount,
          tax_rate: taxRate,
          tax_type: storeSettings?.tax_type || "EXCLUSIVE",
          service_charge_amount: serviceChargeAmount,
          rounding_amount: roundingAmount
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
      toast.warning("Shift kasir belum dibuka!", {
        description: "Buka shift kasir terlebih dahulu untuk mulai melayani pembayaran.",
        action: {
          label: "Buka Shift",
          onClick: () => setIsOpenShiftModal(true)
        },
        cancel: {
          label: "Tutup",
          onClick: () => {}
        }
      });
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
    <div className="flex min-h-screen bg-[#070b14] text-slate-100 font-sans-pos relative selection:bg-[#c5a059]/30 selection:text-[#f8fafc]">
      {/* High-Resolution Luxury Neoclassical Background Layer */}
      <div 
        className="fixed inset-0 bg-cover bg-center pointer-events-none opacity-100 z-0"
        style={{ 
          backgroundImage: `url(${footwearLuxuryBg})`,
          backgroundPosition: "center 20%",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat"
        }}
      />
      {/* Subtle Ambient Vignette - High text contrast while letting classical architecture & footwear display shine through clearly */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(7, 11, 20, 0.08) 0%, rgba(7, 11, 20, 0.35) 65%, rgba(7, 11, 20, 0.65) 100%)"
        }}
      />

      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col h-screen overflow-hidden relative z-10 border-l border-r border-[#1e2538]/70">
        <Navbar 
          title="Atelier Kasir" 
          actions={
            <div 
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-mono transition ${
                activeShift ? 'bg-[#1a1408] border-[#c5a059]/40 text-[#e5c483]' : 'bg-[#070b14] border-[#1e2538] text-slate-300'
              }`}
            >
              {activeShift ? <Lock size={12} className="text-[#c5a059]" /> : <Store size={12} className="text-slate-400" />}
              <select 
                disabled={!!activeShift}
                className="bg-transparent outline-none cursor-pointer text-xs pr-1 font-medium text-slate-200"
                value={selectedW} 
                onChange={e => setSelectedW(e.target.value)}
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id} className="bg-[#0b1120] text-slate-200">{w.name}</option>
                ))}
              </select>
            </div>
          }
          centerContent={
            <div className="flex items-center gap-1.5 bg-[#070b14]/40 backdrop-blur-md p-1 rounded-full border border-[#1e2538] shadow-lg shadow-black/40">
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("pos");
                  setTipe("Penjualan");
                }}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
                  activeMainTab === "pos"
                    ? "bg-[#141d33]/80 text-[#e5c483] border border-[#c5a059]/60 shadow-[0_0_12px_rgba(197,160,89,0.2)]"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <ShoppingCart size={13} className={activeMainTab === "pos" ? "text-[#e5c483]" : "text-slate-400"} />
                <span className="font-serif-luxury uppercase tracking-[0.12em] text-[11px]">Kasir POS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMainTab("retur");
                  setTipe("Retur");
                }}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
                  activeMainTab === "retur"
                    ? "bg-[#251216]/80 text-rose-300 border border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <RefreshCw size={13} className={activeMainTab === "retur" ? "text-rose-400" : "text-slate-400"} />
                <span className="font-serif-luxury uppercase tracking-[0.12em] text-[11px]">Retur Struk</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMainTab("shift")}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider flex items-center gap-1.5 transition-all duration-300 ${
                  activeMainTab === "shift"
                    ? "bg-[#0d1c33]/80 text-sky-300 border border-sky-500/50 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <Clock size={13} className={activeMainTab === "shift" ? "text-sky-400" : "text-slate-400"} />
                <span className="font-serif-luxury uppercase tracking-[0.12em] text-[11px]">Shift & Kas</span>
              </button>
            </div>
          }
        />

        {/* MAIN BODY AREA - PROPORTIONALLY FRAMED TO REVEAL ARCHITECTURAL COLUMNS */}
        <main className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden px-3 sm:px-6 lg:px-8 py-3.5 flex justify-center">
          
          {/* TAB 1: DEDICATED POS TOUCH SCREEN */}
          {activeMainTab === "pos" && (
            <div className="w-full max-w-[1680px] h-auto lg:h-full min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-5 pb-6 lg:pb-0">
              
              {/* SISI KIRI: KATALOG PRODUK & SEARCH (LEBIH LUAS: 7-8 COLS) - LUXURY ATELIER */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-[520px] lg:h-full min-h-0 bg-[#070b14]/20 backdrop-blur-xl border border-[#c5a059]/30 rounded-2xl shadow-2xl overflow-hidden">
                
                {/* Search Bar & Barcode Scanner Bar */}
                <div className="p-3 border-b border-[#1e2538]/60 space-y-2.5 bg-[#080d1a]/25 backdrop-blur-md">
                  <div className="flex gap-2">
                    {/* Live Catalog Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={e => setCatalogSearch(e.target.value)}
                        placeholder="Cari koleksi sepatu, SKU, warna..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#070b14]/50 border border-[#1e2538] rounded-xl text-slate-100 placeholder-slate-400 focus:border-[#c5a059]/80 focus:ring-1 focus:ring-[#c5a059]/40 outline-none transition backdrop-blur-sm"
                      />
                      {catalogSearch && (
                        <button
                          type="button"
                          onClick={() => setCatalogSearch("")}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Barcode Scanner Direct Input */}
                    <div className="relative w-44 sm:w-56">
                      <Barcode className="absolute left-2.5 top-2.5 text-[#e5c483]" size={14} />
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={barcodeInput}
                        onChange={e => setBarcodeInput(e.target.value)}
                        onKeyDown={handleScanBarcode}
                        placeholder="Scan Barcode (F1)..."
                        className="w-full pl-8 pr-2 py-2 text-xs bg-[#070b14]/50 border border-[#c5a059]/50 text-[#e5c483] placeholder-[#c5a059]/50 rounded-xl focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/50 outline-none font-mono tracking-wider transition backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {/* Quick Category Filter (Momento Minimal Underline Tabs) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none border-b border-[#1e2538]/60">
                    {catalogCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCatalogCategory(cat)}
                        className={`px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase whitespace-nowrap transition-all duration-200 relative ${
                          catalogCategory === cat
                            ? "text-[#e5c483] border-b-2 border-[#c5a059] -mb-[1px]"
                            : "text-slate-400 hover:text-slate-200 border-b-2 border-transparent"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Product Grid - Multi Columns with Compact Luxury Cards */}
                <div className="flex-1 p-3 overflow-y-auto">
                  {filteredCatalog.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 space-y-2">
                      <div className="w-12 h-12 rounded-full border border-[#1e2538] flex items-center justify-center bg-[#070b14]">
                        <Package size={22} className="text-slate-500" />
                      </div>
                      <p className="text-xs font-serif-luxury uppercase tracking-wider text-slate-300">Produk Tidak Ditemukan</p>
                      <p className="text-[11px] text-slate-500">Coba kata kunci lain atau pilih kategori Semua</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                      {filteredCatalog.map(inv => {
                        const inCart = cart.find(c => c.variant_id === inv.variant_id);
                        const isOutOfStock = inv.qty <= 0;
                        const isLowStock = inv.qty > 0 && inv.qty <= 10;

                        return (
                          <div
                            key={inv.variant_id}
                            onClick={() => {
                              if (!activeShift) {
                                toast.warning("Shift kasir belum dibuka!", {
                                  description: "Buka shift kasir terlebih dahulu untuk menambahkan produk.",
                                  action: {
                                    label: "Buka Shift",
                                    onClick: () => setIsOpenShiftModal(true)
                                  },
                                  cancel: {
                                    label: "Tutup",
                                    onClick: () => {}
                                  }
                                });
                                return;
                              }
                              handleAddToCart(inv.variant_id);
                            }}
                            className={`group relative p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer select-none flex flex-col justify-between backdrop-blur-md ${
                              isOutOfStock
                                ? "bg-[#070b14]/40 border-[#1e2538]/40 opacity-40 cursor-not-allowed"
                                : inCart
                                ? "bg-[#141d33]/55 border-[#c5a059] ring-1 ring-[#c5a059]/50 shadow-xl shadow-[#c5a059]/10"
                                : "bg-[#070b14]/30 hover:bg-[#070b14]/55 border-[#1e2538]/80 hover:border-[#c5a059]/70 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/60"
                            }`}
                          >
                            {/* In-Cart Quantity Indicator Badge */}
                            {inCart && (
                              <div className="absolute -top-1.5 -right-1.5 bg-[#c5a059] text-[#070b14] font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md border border-[#070b14]">
                                {inCart.qty}
                              </div>
                            )}

                            <div>
                              {/* Category & Stock Indicator */}
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <span className="text-[10px] font-mono tracking-wider uppercase text-[#c5a059] font-medium">
                                  {inv.category || "Sepatu"}
                                </span>
                                <span className={`text-[10px] font-mono tracking-wider flex items-center gap-1.5 ${
                                  isOutOfStock
                                    ? "text-rose-400"
                                    : isLowStock
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]' : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'}`} />
                                  <span>{isOutOfStock ? "Habis" : `${inv.qty} pasang`}</span>
                                </span>
                              </div>

                              {/* Product Luxury Footwear Image */}
                              <div className="w-full h-24 mb-2.5 rounded-lg overflow-hidden bg-[#070b14]/40 border border-[#1e2538]/80 relative flex items-center justify-center group-hover:border-[#c5a059]/50 transition-colors">
                                <img 
                                  src={inv.image_url || shoeLuxuryEmblem} 
                                  alt={inv.product_name}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = shoeLuxuryEmblem;
                                  }}
                                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/80 via-transparent to-transparent pointer-events-none" />
                              </div>

                              {/* Product Title */}
                              <h3 className="font-serif-luxury text-xs sm:text-sm text-slate-100 font-semibold line-clamp-1 group-hover:text-[#e5c483] transition-colors">
                                {inv.product_name}
                              </h3>

                              {/* Variant Details - Editorial Style */}
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1.5 font-mono">
                                <span className="text-slate-200 font-semibold">Sz {inv.size}</span>
                                <span className="text-slate-600">•</span>
                                <span className="truncate text-slate-300">{inv.color}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-500 text-[9px]">{inv.sku}</span>
                              </div>
                            </div>

                            {/* Price Tag & Action */}
                            <div className="mt-3 pt-2.5 border-t border-[#1e2538]/80 flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-bold text-[#e5c483] font-mono tracking-tight">
                                {fmt(inv.price_sell)}
                              </span>
                              <div className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-medium flex items-center gap-1 transition-all duration-200 ${
                                isOutOfStock 
                                  ? 'text-slate-600 border-transparent' 
                                  : 'bg-[#141d33] border-[#c5a059]/40 text-[#e5c483] group-hover:bg-[#c5a059] group-hover:text-[#070b14] group-hover:border-[#c5a059]'
                              }`}>
                                <Plus size={11} />
                                <span className="hidden sm:inline">Pilih</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* CONDITIONAL KEYBOARD SHORTCUTS INFO STRIP */}
                {showHotkeys && (
                  <div className="bg-[#090e1c] border-t border-[#1e2538] text-slate-300 px-4 py-1.5 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2 flex-shrink-0 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-[#e5c483] font-semibold tracking-wider text-[10px] uppercase">
                      <Keyboard size={12} />
                      <span>Hotkeys:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><kbd className="bg-[#141d33] text-[#e5c483] px-1.5 py-0.2 rounded border border-[#c5a059]/40 font-mono">F1</kbd> Scan Barcode</span>
                      <span className="flex items-center gap-1"><kbd className="bg-[#141d33] text-[#e5c483] px-1.5 py-0.2 rounded border border-[#c5a059]/40 font-mono">F2</kbd> Diskon & Kupon</span>
                      <span className="flex items-center gap-1"><kbd className="bg-[#141d33] text-[#e5c483] px-1.5 py-0.2 rounded border border-[#c5a059]/40 font-mono">F4</kbd> Bayar Uang Pas</span>
                      <span className="flex items-center gap-1"><kbd className="bg-[#141d33] text-[#e5c483] px-1.5 py-0.2 rounded border border-[#c5a059]/40 font-mono">F8</kbd> Parkir Transaksi</span>
                      <span className="flex items-center gap-1"><kbd className="bg-[#141d33] text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/40 font-mono">Esc</kbd> Reset</span>
                    </div>
                  </div>
                )}

                {/* Enhanced Footer Bar with Quick POS Utilities */}
                <div className="px-4 py-2 bg-[#080d1a]/95 border-t border-[#1e2538] flex flex-wrap justify-between items-center text-[11px] text-slate-400 flex-shrink-0 gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    Koleksi: <strong className="text-[#e5c483]">{filteredCatalog.length} SKU</strong> Siap Transaksi
                  </span>

                  {/* Compact Quick Utilities */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHotkeys(!showHotkeys)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center gap-1 border transition ${
                        showHotkeys ? 'bg-[#141d33] text-[#e5c483] border-[#c5a059]/60' : 'bg-[#070b14] text-slate-400 border-[#1e2538] hover:text-slate-200'
                      }`}
                      title="Panduan hotkeys keyboard"
                    >
                      <Keyboard size={11} />
                      <span>F1-F8</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleAudio}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center gap-1 border transition ${
                        audioEnabled ? 'bg-[#071d17] text-emerald-400 border-emerald-500/50' : 'bg-[#070b14] text-slate-500 border-[#1e2538]'
                      }`}
                      title={audioEnabled ? "Suara Beep Kasir Aktif" : "Suara Beep Kasir Nonaktif"}
                    >
                      {audioEnabled ? <Volume2 size={11} className="text-emerald-400" /> : <VolumeX size={11} />}
                      <span>{audioEnabled ? 'AUDIO' : 'MUTE'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        fetchCrossBranchStock();
                        setIsCrossStockModalOpen(true);
                      }}
                      className="px-2 py-0.5 bg-[#070b14] hover:bg-[#141d33] text-slate-300 border border-[#1e2538] hover:border-[#c5a059]/40 rounded-lg text-[10px] font-mono flex items-center gap-1 transition"
                    >
                      <Eye size={11} className="text-sky-400" />
                      <span>Stok Cabang</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsHeldListModalOpen(true)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center gap-1 border transition ${
                        heldCarts.length > 0 ? 'bg-[#2d1b09] text-[#e5c483] border-[#c5a059] animate-pulse font-bold' : 'bg-[#070b14] text-slate-400 border-[#1e2538]'
                      }`}
                    >
                      <Pause size={11} className={heldCarts.length > 0 ? "text-[#e5c483]" : "text-slate-400"} />
                      <span>Parkir ({heldCarts.length})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SISI KANAN: KERANJANG BELANJA & PANEL CHECKOUT - MOMENTO LUXURY ATELIER */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[650px] lg:h-full min-h-0 bg-[#070b14]/20 backdrop-blur-xl border border-[#c5a059]/30 rounded-2xl shadow-2xl overflow-hidden relative">
                
                {/* Header Keranjang & Shift Status */}
                <div className="p-3 border-b border-[#1e2538]/60 bg-[#080d1a]/30 backdrop-blur-md space-y-2 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${activeShift ? 'bg-[#c5a059] shadow-[0_0_8px_rgba(197,160,89,0.8)]' : 'bg-amber-500'}`} />
                      <span className="font-serif-luxury text-xs tracking-wider uppercase text-slate-200">
                        {activeShift ? `Kasir: ${activeShift.cashier_name || 'Atelier'}` : 'Shift Belum Buka'}
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
                          className="text-[10px] font-mono tracking-wider text-[#e5c483] bg-[#141d33] hover:bg-[#1a2542] border border-[#c5a059]/40 px-2 py-0.5 rounded-lg transition"
                          title="Catat kas masuk/keluar laci"
                        >
                          Kas Laci
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsOpenShiftModal(true)}
                          className="text-[10px] font-bold text-[#070b14] bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 px-2.5 py-0.5 rounded-lg transition font-serif-luxury uppercase tracking-wider"
                        >
                          + Buka Shift
                        </button>
                      )}

                      {cart.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={handleOpenHoldModal}
                            className="text-[10px] font-mono text-[#e5c483] bg-[#1f160a] hover:bg-[#2e200c] border border-[#c5a059]/50 px-2 py-0.5 rounded-lg transition"
                            title="Parkir transaksi saat ini"
                          >
                            Parkir
                          </button>
                          <button
                            type="button"
                            onClick={() => setCart([])}
                            className="text-[10px] font-mono text-rose-300 bg-[#251216] hover:bg-[#381a1f] border border-rose-600/40 px-2 py-0.5 rounded-lg transition"
                            title="Kosongkan seluruh keranjang"
                          >
                            Reset
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Member Loyalty Search Bar */}
                  <div className="flex gap-1.5 items-center">
                    <div className="relative flex-1">
                      <Phone className="absolute left-2.5 top-2 text-slate-500" size={12} />
                      <input
                        type="text"
                        value={memberPhoneInput}
                        onChange={e => setMemberPhoneInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLookupMember()}
                        placeholder="WhatsApp Member..."
                        className="w-full pl-7 pr-2 py-1.5 text-xs bg-[#070b14]/50 border border-[#1e2538] rounded-xl text-slate-100 placeholder-slate-400 focus:border-[#c5a059]/80 outline-none backdrop-blur-sm"
                      />
                    </div>
                    {selectedMember ? (
                      <button
                        type="button"
                        onClick={handleRemoveMember}
                        className="px-2.5 py-1.5 bg-[#251216] text-rose-300 border border-rose-500/40 hover:bg-[#381a1f] rounded-xl text-xs font-semibold transition flex items-center gap-1 max-w-[120px]"
                        title="Lepas member"
                      >
                        <X size={11} />
                        <span className="truncate">{selectedMember.name}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleLookupMember}
                        disabled={loadingMemberLookup}
                        className="px-3 py-1.5 bg-[#141d33] border border-[#c5a059]/50 text-[#e5c483] hover:bg-[#1c2949] rounded-xl text-xs font-semibold transition disabled:opacity-50"
                      >
                        Cari
                      </button>
                    )}
                  </div>

                  {/* Member Badge & Points Info */}
                  {selectedMember && (
                    <div className="p-2 bg-[#0b1f1a]/60 backdrop-blur-sm border border-emerald-800/60 rounded-xl text-[11px] flex justify-between items-center text-emerald-300">
                      <span className="font-semibold">{selectedMember.name} ({selectedMember.tier})</span>
                      {selectedMember.points > 0 && rawCartTotal > 0 ? (
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isRedeemingPoints}
                            onChange={e => setIsRedeemingPoints(e.target.checked)}
                            className="rounded border-emerald-600 bg-[#070b14] text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                          <span>Tukar {maxRedeemablePoints} poin (-{fmt(pointsDiscount)})</span>
                        </label>
                      ) : (
                        <span className="font-mono">{selectedMember.points} Poin</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Cart Items List - Generous Flexible Luxury Area */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 select-none animate-in fade-in duration-300">
                      {/* Luxury Footwear Artisan Medallion - Regal, Uncompressed */}
                      <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-[#c5a059]/50 p-1.5 shadow-[0_0_35px_rgba(197,160,89,0.18)] bg-[#070b14]/40 backdrop-blur-md ring-4 ring-[#c5a059]/10">
                        <img 
                          src={shoeLuxuryEmblem} 
                          alt="Footwear Atelier Emblem" 
                          className="w-full h-full object-cover rounded-full filter brightness-95 contrast-105"
                        />
                      </div>
                      <div className="space-y-1.5 max-w-[280px]">
                        <h4 className="font-serif-luxury text-sm tracking-[0.22em] uppercase text-[#e5c483] font-bold">Atelier Precision POS</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Keranjang masih kosong. Pindai barcode (<span className="text-[#e5c483] font-mono">F1</span>) atau pilih koleksi sepatu dari katalog.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-[10px] font-mono text-slate-400">
                        <span className="bg-[#070b14]/50 backdrop-blur-sm border border-[#1e2538] px-2 py-0.5 rounded text-slate-400">F1: Scan</span>
                        <span className="bg-[#070b14]/50 backdrop-blur-sm border border-[#1e2538] px-2 py-0.5 rounded text-slate-400">F2: Kupon</span>
                        <span className="bg-[#070b14]/50 backdrop-blur-sm border border-[#1e2538] px-2 py-0.5 rounded text-slate-400">F8: Parkir</span>
                      </div>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.variant_id} className="p-2.5 rounded-xl border border-[#1e2538] bg-[#070b14]/35 backdrop-blur-sm space-y-1.5 transition-all hover:border-[#c5a059]/40 hover:bg-[#070b14]/55">
                        <div className="flex items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <img 
                              src={item.image_url || shoeLuxuryEmblem} 
                              alt={item.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = shoeLuxuryEmblem;
                              }}
                              className="w-10 h-10 rounded-lg object-cover border border-[#1e2538] flex-shrink-0 bg-[#070b14]"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-serif-luxury text-xs text-slate-100 truncate">{item.name}</h4>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                <span className="font-mono text-[#e5c483]">{fmt(item.price)}</span>
                              {item.notes ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteVariantId(item.variant_id);
                                    setItemNoteInput(item.notes || "");
                                  }}
                                  className="text-[#e5c483] bg-[#1a1408] border border-[#c5a059]/30 px-1.5 py-0.2 rounded truncate max-w-[120px] flex items-center gap-0.5"
                                  title="Edit catatan item"
                                >
                                  <span>📝</span>
                                  <span className="truncate">{item.notes}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingNoteVariantId(item.variant_id);
                                    setItemNoteInput("");
                                  }}
                                  className="text-slate-500 hover:text-[#e5c483] transition"
                                  title="Tambah catatan khusus"
                                >
                                  +Note
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                          {/* Qty Controls */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateQty(item.variant_id, item.qty - 1)}
                              className="w-5 h-5 rounded bg-[#070b14] border border-[#1e2538] text-slate-300 hover:border-[#c5a059] hover:text-[#e5c483] flex items-center justify-center font-bold text-xs transition"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-mono font-bold text-xs text-slate-100">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.variant_id, item.qty + 1)}
                              className="w-5 h-5 rounded bg-[#070b14] border border-[#1e2538] text-slate-300 hover:border-[#c5a059] hover:text-[#e5c483] flex items-center justify-center font-bold text-xs transition"
                            >
                              +
                            </button>
                          </div>

                          {/* Subtotal & Delete */}
                          <div className="text-right min-w-[70px] font-bold text-xs font-mono text-[#e5c483]">
                            {fmt(item.qty * item.price)}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCart(item.variant_id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Inline Note Editor */}
                        {editingNoteVariantId === item.variant_id && (
                          <div className="mt-1 p-2 bg-[#090e1c] border border-[#c5a059]/40 rounded-xl flex items-center gap-1.5">
                            <input
                              type="text"
                              value={itemNoteInput}
                              onChange={e => setItemNoteInput(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveItemNote(item.variant_id)}
                              placeholder="Catatan item..."
                              className="flex-1 px-2.5 py-1 text-[11px] border border-[#1e2538] rounded-lg bg-[#070b14] text-slate-200 outline-none focus:border-[#c5a059]"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveItemNote(item.variant_id)}
                              className="px-2.5 py-1 bg-[#141d33] border border-[#c5a059]/50 text-[#e5c483] hover:bg-[#1a2642] rounded-lg text-[10px] font-semibold"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNoteVariantId(null)}
                              className="px-1.5 text-slate-400 hover:text-slate-200 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Checkout & Payment Bottom Section - Active only when cart has items */}
                {cart.length > 0 ? (
                  <div className="p-3 border-t border-[#1e2538] bg-[#070b14]/50 backdrop-blur-md space-y-2 flex-shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  
                  {/* Diskon & Kupon Promo Trigger Bar */}
                  <div className="flex items-center justify-between text-xs bg-[#070b14]/50 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-[#1e2538]">
                    <button
                      type="button"
                      onClick={() => setIsDiscountModalOpen(true)}
                      className="flex items-center gap-1.5 font-serif-luxury uppercase tracking-wider text-[#e5c483] hover:brightness-125 text-[11px]"
                      title="Tambah diskon / kupon (F2)"
                    >
                      <Ticket size={13} className="text-[#c5a059]" />
                      <span>Kupon / Diskon (F2)</span>
                    </button>

                    <div className="flex items-center gap-1 text-[10px]">
                      {appliedVoucher && (
                        <span className="font-mono font-semibold bg-[#0f1d33] text-sky-300 px-2 py-0.5 rounded-lg border border-sky-600/40 flex items-center gap-1">
                          {appliedVoucher.code} (-{fmt(appliedVoucher.discount_amount)})
                          <button type="button" onClick={handleRemoveVoucher} className="text-slate-400 hover:text-rose-400 font-bold ml-1">×</button>
                        </span>
                      )}
                      {manualDiscountAmount > 0 && (
                        <span className="font-mono font-semibold bg-[#0b1f1a] text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-600/40 flex items-center gap-1">
                          -{fmt(manualDiscountAmount)}
                          <button type="button" onClick={() => { setManualDiscountValue(""); setManualDiscountReason(""); }} className="text-slate-400 hover:text-rose-400 font-bold ml-1">×</button>
                        </span>
                      )}
                      {!appliedVoucher && manualDiscountAmount === 0 && (
                        <span className="text-slate-500 text-[10px] font-mono">Tidak ada promo</span>
                      )}
                    </div>
                  </div>

                  {/* Clean Financial Totals */}
                  <div className="bg-[#070b14]/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-[#1e2538] space-y-1 text-xs">
                    {(totalDiscount > 0 || isTaxEnabled || isRoundingEnabled) && (
                      <div className="flex justify-between text-[11px] text-slate-400 leading-tight">
                        <span>Subtotal ({cart.reduce((a, c) => a + c.qty, 0)} item):</span>
                        <span className="font-mono">{fmt(rawCartTotal)}</span>
                      </div>
                    )}
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-[11px] text-emerald-400 font-semibold leading-tight">
                        <span>Total Hemat:</span>
                        <span className="font-mono">-{fmt(totalDiscount)}</span>
                      </div>
                    )}
                    {(isTaxEnabled || (isRoundingEnabled && roundingAmount !== 0)) && (
                      <div className="flex justify-between text-[11px] text-slate-400 leading-tight">
                        <span>Pajak ({taxRate}%) & Bulat:</span>
                        <span className="font-mono">{fmt(taxAmount + roundingAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline pt-1.5 border-t border-[#1e2538] font-bold">
                      <span className="font-serif-luxury text-slate-300 text-[11px] uppercase tracking-[0.18em]">TOTAL AKHIR:</span>
                      <span className="font-mono text-base font-bold text-[#e5c483]">{fmt(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Payment Method Tabs */}
                  <div className="grid grid-cols-4 gap-1 bg-[#070b14] p-1 rounded-xl border border-[#1e2538] text-[11px] font-medium text-center">
                    {(["Tunai", "QRIS", "Debit", "Split"] as const).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-1 rounded-lg transition-all duration-200 font-serif-luxury uppercase tracking-wider text-[10px] ${
                          paymentMethod === method
                            ? "bg-[#141d33] text-[#e5c483] border border-[#c5a059]/60 shadow-[0_0_8px_rgba(197,160,89,0.15)]"
                            : "text-slate-400 hover:text-slate-200 hover:bg-[#0d1424]"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  {/* Cash Payment Options */}
                  {paymentMethod === "Tunai" && (
                    <div className="space-y-1.5 bg-[#070b14] p-2 rounded-xl border border-[#1e2538]">
                      {/* Quick Cash Buttons */}
                      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                        {quickCashAmounts.map(qc => (
                          <button
                            key={qc.label}
                            type="button"
                            onClick={() => setCashReceived(qc.val)}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium bg-[#0d1424] hover:bg-[#141d33] hover:text-[#e5c483] text-slate-300 border border-[#1e2538] hover:border-[#c5a059]/50 whitespace-nowrap transition"
                          >
                            {qc.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1 text-[#c5a059] text-xs font-mono font-bold">Rp</span>
                          <input
                            type="number"
                            value={cashReceived}
                            onChange={e => setCashReceived(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="Uang Diterima..."
                            className="w-full pl-8 pr-2 py-1 text-xs font-mono font-bold bg-[#0d1424] border border-[#1e2538] text-[#e5c483] rounded-lg outline-none focus:border-[#c5a059]"
                          />
                        </div>
                        {cashReceived === "" ? (
                          <div className="text-right text-[10px] font-mono font-bold text-amber-400 whitespace-nowrap bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                            Wajib Diisi
                          </div>
                        ) : Number(cashReceived) < cartTotal ? (
                          <div className="text-right text-[11px] font-mono font-bold text-rose-400 whitespace-nowrap bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded">
                            Kurang: {fmt(cartTotal - Number(cashReceived))}
                          </div>
                        ) : (
                          <div className="text-right text-[11px] font-mono font-bold text-emerald-400 whitespace-nowrap bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                            Kembali: {fmt(Number(cashReceived) - cartTotal)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentMethod === "QRIS" && (
                    <div className="bg-[#070b14] p-2 rounded-xl border border-sky-800/40 text-center text-xs">
                      <span className="text-sky-300 font-serif-luxury uppercase tracking-wider text-[11px]">QRIS Dinamis Siap Scan</span>
                    </div>
                  )}

                  {paymentMethod === "Debit" && (
                    <div className="bg-[#070b14] p-2 rounded-xl border border-purple-800/40 grid grid-cols-2 gap-1.5 text-xs">
                      <select
                        value={debitBank}
                        onChange={e => setDebitBank(e.target.value)}
                        className="p-1 bg-[#0d1424] border border-[#1e2538] text-slate-200 rounded-lg text-xs font-mono"
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
                        className="p-1 bg-[#0d1424] border border-[#1e2538] text-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  )}

                  {paymentMethod === "Split" && (
                    <div className="bg-[#070b14] p-2 rounded-xl border border-amber-800/40 flex gap-2 text-xs items-center">
                      <input
                        type="number"
                        value={splitCash}
                        onChange={e => setSplitCash(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Nominal Tunai..."
                        className="w-28 p-1 bg-[#0d1424] border border-[#1e2538] text-[#e5c483] rounded-lg text-xs font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-400 font-mono truncate">
                        Non-Tunai: {fmt(Math.max(0, cartTotal - (Number(splitCash) || 0)))}
                      </span>
                    </div>
                  )}

                  {/* ALWAYS VISIBLE BIG CHECKOUT BUTTON - LUXURY ATELIER */}
                  {(() => {
                    const isCashEmpty = paymentMethod === "Tunai" && cashReceived === "";
                    const isCashUnder = paymentMethod === "Tunai" && cashReceived !== "" && Number(cashReceived) < cartTotal;
                    const isDisabled = cart.length === 0 || loadingSubmit || isCashEmpty || isCashUnder;

                    let btnClass = "w-full py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 font-serif-luxury shadow-lg ";
                    if (cart.length === 0) {
                      btnClass += "bg-[#0e1626] border border-[#1e2538] text-slate-500 cursor-not-allowed opacity-50";
                    } else if (isCashEmpty) {
                      btnClass += "bg-[#181308] border border-amber-600/50 text-amber-300 cursor-not-allowed shadow-amber-900/20";
                    } else if (isCashUnder) {
                      btnClass += "bg-[#250d12] border border-rose-600/60 text-rose-300 cursor-not-allowed shadow-rose-900/20";
                    } else {
                      btnClass += "bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] hover:brightness-110 active:scale-[0.99] text-[#070b14] border border-[#e5c483]/60 cursor-pointer shadow-[#c5a059]/20";
                    }

                    return (
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={handleSimpan}
                        className={btnClass}
                      >
                        {loadingSubmit ? (
                          <span>Memproses Transaksi...</span>
                        ) : cart.length === 0 ? (
                          <span>Keranjang Masih Kosong</span>
                        ) : isCashEmpty ? (
                          <>
                            <AlertCircle size={16} className="text-amber-400" />
                            <span>INPUT UANG DITERIMA (TOTAL: {fmt(cartTotal)})</span>
                          </>
                        ) : isCashUnder ? (
                          <>
                            <AlertCircle size={16} className="text-rose-400" />
                            <span>UANG KURANG {fmt(cartTotal - Number(cashReceived))}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} />
                            <span>
                              SELESAIKAN PEMBAYARAN {paymentMethod === "Tunai" ? `(KEMBALI ${fmt(Number(cashReceived) - cartTotal)})` : `(${fmt(cartTotal)})`}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
                ) : (
                  <div className="px-4 py-3 bg-[#070b14]/30 backdrop-blur-md border-t border-[#1e2538] flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
                    <span className="flex items-center gap-2 text-[#e5c483] font-serif-luxury text-[11px] uppercase tracking-wider">
                      <Sparkles size={14} className="text-[#c5a059]" />
                      Terminal Siap Transaksi
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">0 Item Terpilih</span>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* TAB 2: DEDICATED RECEIPT RETURN & REFUND WORKFLOW - LUXURY ATELIER */}
          {activeMainTab === "retur" && (
            <div className="h-full bg-[#0b1120]/95 backdrop-blur-md border border-[#1e2538] rounded-2xl shadow-xl p-6 overflow-y-auto max-w-5xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-serif-luxury font-bold text-slate-100 flex items-center gap-2">
                  <RefreshCw className="text-rose-400" size={22} />
                  Modul Retur Pelanggan & Pengembalian Dana (Refund)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Cari struk transaksi asli pelanggan untuk mengisi barang retur secara otomatis dan memproses refund
                </p>
              </div>

              {/* Step 1: Lookup Receipt */}
              <div className="p-4 bg-[#0d1424] border border-[#1e2538] rounded-2xl space-y-3">
                <label className="block text-xs font-serif-luxury tracking-wider uppercase text-slate-300">1. Masukkan Nomor Struk / ID Transaksi</label>
                <form onSubmit={handleLookupReceipt} className="flex gap-2">
                  <input
                    type="text"
                    value={receiptLookupInput}
                    onChange={e => setReceiptLookupInput(e.target.value)}
                    placeholder="Contoh: 1b2c3d4e atau tempelkan ID struk..."
                    className="flex-1 px-3 py-2 text-xs bg-[#070b14] border border-[#1e2538] rounded-xl text-slate-100 placeholder-slate-500 focus:border-rose-500 outline-none font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loadingReceiptLookup}
                    className="px-4 py-2 bg-[#251216] border border-rose-600/50 hover:bg-[#381a1f] text-rose-300 rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Search size={14} />
                    <span>{loadingReceiptLookup ? "Mencari..." : "Muat Data Struk"}</span>
                  </button>
                </form>
              </div>

              {/* Step 2: Display Original Receipt Items */}
              {originalReceiptData && (
                <div className="p-4 bg-[#140b0e] border border-rose-900/40 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-serif-luxury font-bold text-sm text-rose-200">
                        Struk Terverifikasi: #{originalReceiptData.transaction.id.slice(0, 8)}
                      </h3>
                      <p className="text-xs text-rose-400/80">
                        Tanggal: {new Date(originalReceiptData.transaction.created_at).toLocaleString('id-ID')} • Kasir: {originalReceiptData.transaction.kasir_name || "Kasir"}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-[#251216] text-rose-300 font-mono font-bold text-xs rounded-full border border-rose-800/40">
                      Total Beli: {fmt(originalReceiptData.transaction.total_amount)}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-serif-luxury tracking-wider uppercase text-slate-300">Pilih item barang yang ingin diretur oleh pembeli:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {originalReceiptData.items.map((item: any) => (
                        <div key={item.id} className="p-3 bg-[#0d1424] border border-[#1e2538] rounded-xl flex items-center justify-between gap-2 shadow-xs">
                          <div>
                            <h4 className="font-serif-luxury text-xs text-slate-100">{item.product_name}</h4>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              SKU: {item.sku} • Sz: {item.size} • Beli: {item.qty} pcs @ {fmt(item.price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddReceiptItemToCart(item)}
                            className="px-2.5 py-1.5 bg-[#251216] border border-rose-600/50 hover:bg-[#381a1f] text-rose-300 rounded-lg text-xs font-semibold transition flex items-center gap-1"
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
                  <h3 className="font-serif-luxury font-bold text-sm text-slate-200">Daftar Barang yang Diretur ({cart.length} item):</h3>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.variant_id} className="p-3 bg-[#0d1424] border border-[#1e2538] rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <img 
                            src={item.image_url || shoeLuxuryEmblem} 
                            alt={item.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = shoeLuxuryEmblem;
                            }}
                            className="w-10 h-10 rounded-lg object-cover border border-[#1e2538] flex-shrink-0 bg-[#070b14]"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif-luxury text-xs text-slate-100 truncate">{item.name}</h4>
                            <span className="text-[11px] text-slate-400 font-mono">{fmt(item.price)} / pcs</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-300">{item.qty} pcs</span>
                          <span className="text-xs font-mono font-bold text-rose-400">{fmt(item.qty * item.price)}</span>
                          <button
                            type="button"
                            onClick={() => removeCart(item.variant_id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
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
                      <label className="block text-xs font-serif-luxury tracking-wider uppercase text-slate-300 mb-1">Alasan Retur</label>
                      <select
                        value={returnReason}
                        onChange={e => setReturnReason(e.target.value)}
                        className="w-full px-3 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl text-xs text-slate-200 font-medium outline-none focus:border-[#c5a059]"
                      >
                        <option value="Barang Rusak / Cacat" className="bg-[#0b1120]">Barang Rusak / Cacat</option>
                        <option value="Salah Ukuran / Size Tidak Pas" className="bg-[#0b1120]">Salah Ukuran / Size Tidak Pas</option>
                        <option value="Salah Model / Warna" className="bg-[#0b1120]">Salah Model / Warna</option>
                        <option value="Permintaan Pembeli" className="bg-[#0b1120]">Permintaan Pembeli</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-serif-luxury tracking-wider uppercase text-slate-300 mb-1">Metode Pengembalian Dana (Refund)</label>
                      <select
                        value={refundMethod}
                        onChange={e => setRefundMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl text-xs text-slate-200 font-medium outline-none focus:border-[#c5a059]"
                      >
                        <option value="Tunai" className="bg-[#0b1120]">Uang Tunai Laci Kasir (Cash Refund)</option>
                        <option value="Transfer" className="bg-[#0b1120]">Transfer Bank / E-Wallet</option>
                      </select>
                    </div>
                  </div>

                  {/* Total Refund & Submit */}
                  <div className="p-4 bg-[#140b0e] border border-rose-900/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-xs font-serif-luxury tracking-wider uppercase text-rose-300">Total Dana yang Wajib Dikembalikan:</span>
                      <div className="text-2xl font-mono font-bold text-rose-400 mt-1">{fmt(cartTotal)}</div>
                    </div>

                    <button
                      type="button"
                      disabled={loadingSubmit}
                      onClick={handleSimpan}
                      className="px-6 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-110 text-white rounded-xl font-serif-luxury uppercase tracking-wider text-xs shadow-md transition flex items-center gap-2 cursor-pointer border border-rose-400/30"
                    >
                      <CheckCircle2 size={16} />
                      <span>{loadingSubmit ? "Memproses..." : "Selesaikan Retur & Refund"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEDICATED SHIFT & RIWAYAT KASIR - LUXURY ATELIER */}
          {activeMainTab === "shift" && (
            <div className="h-full bg-[#0b1120]/95 backdrop-blur-md border border-[#1e2538] rounded-2xl shadow-xl p-6 overflow-y-auto space-y-6">
              
              {/* Shift Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-[#0d1424] border border-[#1e2538] rounded-2xl relative overflow-hidden">
                  <span className="text-[10px] font-serif-luxury tracking-[0.18em] text-[#e5c483] uppercase block">Total Omzet Shift Saya</span>
                  <div className="text-xl font-mono font-bold text-slate-100 mt-1">
                    {fmt(Number(activeShift?.total_sales || 0))}
                  </div>
                  <span className="text-[11px] text-emerald-400 mt-1 block font-mono">
                    {activeShift ? "• Shift Sedang Aktif" : "• Shift Belum Dibuka"}
                  </span>
                </div>

                <div className="p-4 bg-[#0d1424] border border-[#1e2538] rounded-2xl">
                  <span className="text-[10px] font-serif-luxury tracking-[0.18em] text-sky-400 uppercase block">Modal Kas Awal Laci</span>
                  <div className="text-xl font-mono font-bold text-slate-100 mt-1">
                    {fmt(Number(activeShift?.start_cash || 0))}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Float Kasir
                  </span>
                </div>

                <div className="p-4 bg-[#0d1424] border border-[#1e2538] rounded-2xl">
                  <span className="text-[10px] font-serif-luxury tracking-[0.18em] text-purple-400 uppercase block">Penjualan Non-Tunai</span>
                  <div className="text-xl font-mono font-bold text-slate-100 mt-1">
                    {fmt(Number(activeShift?.total_non_cash_sales || 0))}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    QRIS & Kartu Debit
                  </span>
                </div>

                <div className="p-4 bg-[#0d1424] border border-[#1e2538] rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-serif-luxury tracking-[0.18em] text-[#e5c483] uppercase block">Aksi Shift Kasir</span>
                    <p className="text-xs text-slate-300 mt-0.5 font-medium">{activeShift?.cashier_name || "Kasir Atelier"}</p>
                  </div>
                  {activeShift ? (
                    <button
                      type="button"
                      onClick={() => setIsCloseShiftModal(true)}
                      className="mt-2 w-full py-1.5 bg-[#251216] border border-rose-600/50 hover:bg-[#381a1f] text-rose-300 rounded-lg font-serif-luxury uppercase tracking-wider text-xs transition"
                    >
                      Tutup Shift (Z-Report)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsOpenShiftModal(true)}
                      className="mt-2 w-full py-1.5 bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] rounded-lg font-serif-luxury uppercase tracking-wider text-xs transition"
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
                    <h3 className="font-serif-luxury font-bold text-base text-slate-100">Riwayat Transaksi Kasir</h3>
                    <p className="text-xs text-slate-400">Daftar transaksi dan cetak ulang struk pelanggan</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2 text-slate-500" size={14} />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                      placeholder="Cari struk / kasir / metode..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#070b14] border border-[#1e2538] text-slate-100 placeholder-slate-500 rounded-xl focus:border-[#c5a059] outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#1e2538] rounded-xl bg-[#0d1424]">
                  <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                    <thead className="bg-[#080d1a] border-b border-[#1e2538] text-slate-400 font-serif-luxury tracking-wider text-[10px] uppercase">
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
                    <tbody className="divide-y divide-[#1e2538]">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">Belum ada riwayat transaksi.</td>
                        </tr>
                      ) : (
                        filteredHistory.map(t => (
                          <tr key={t.id} className="hover:bg-[#141d33] transition-colors">
                            <td className="p-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                              {new Date(t.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                            </td>
                            <td className="p-3 font-mono font-bold text-[#e5c483]">#{t.id.slice(0, 8)}</td>
                            <td className="p-3 text-slate-300 font-medium">{t.warehouse_name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase border ${
                                t.type === 'Retur' 
                                  ? 'bg-rose-950/60 text-rose-300 border-rose-800/40' 
                                  : 'bg-[#0b1f1a] text-emerald-300 border-emerald-800/40'
                              }`}>
                                {t.type}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-300">{t.payment_method}</td>
                            <td className="p-3 text-slate-400">{t.kasir_name || "Kasir"}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-100">{fmt(t.total_amount)}</td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleReprintReceipt(t)}
                                className="px-2 py-1 bg-[#141d33] border border-[#1e2538] hover:border-[#c5a059] text-slate-300 hover:text-[#e5c483] rounded-lg text-[10px] font-mono transition inline-flex items-center gap-1"
                              >
                                <Printer size={12} />
                                <span>Cetak</span>
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
          <form onSubmit={handleOpenShift} className="space-y-4 font-sans text-xs">
            <div className="p-3 bg-[#0e241b]/60 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
              <span>Masukkan uang kas awal yang ada di laci sebagai modal kembalian transaksi.</span>
            </div>

            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Cabang / Toko</label>
              <div className="px-3.5 py-2.5 bg-[#070b14] border border-[#1e2538] rounded-xl text-slate-200 font-medium">
                {warehouses.find(w => w.id === selectedW)?.name}
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Modal Kas Awal Laci (Float Cash)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#c5a059] font-mono font-bold text-sm">Rp</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={startCashInput}
                  onChange={e => setStartCashInput(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="100000"
                  className="w-full pl-11 pr-3.5 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl focus:border-[#c5a059] outline-none font-mono font-bold text-lg text-slate-100 placeholder:text-slate-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Catatan Shift (Opsional)</label>
              <input
                type="text"
                value={shiftNotes}
                onChange={e => setShiftNotes(e.target.value)}
                placeholder="Misal: Shift Pagi Kasir 1"
                className="w-full px-3.5 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl focus:border-[#c5a059] outline-none text-xs text-slate-200 placeholder:text-slate-600 transition"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpenShiftModal(false)}
                className="flex-1 py-2.5 bg-[#0e1626] hover:bg-[#152033] border border-[#1e2538] text-slate-400 hover:text-white rounded-xl font-serif-luxury uppercase tracking-wider text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loadingShift}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] font-serif-luxury uppercase tracking-wider font-bold rounded-xl shadow-sm transition disabled:opacity-60"
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
          <form onSubmit={handleCloseShift} className="space-y-4 font-sans text-xs">
            <div className="p-3.5 bg-[#070b14] border border-[#1e2538] rounded-xl space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Kasir Bertugas:</span>
                <span className="font-serif-luxury uppercase tracking-wider text-[#e5c483] font-bold">{activeShift.cashier_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Modal Kas Awal:</span>
                <span className="font-mono text-slate-200">{fmt(Number(activeShift.start_cash))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Penjualan Tunai:</span>
                <span className="font-mono font-bold text-emerald-400">+{fmt(Number(activeShift.total_cash_sales))}</span>
              </div>
              {pettyCashMovements.some(m => m.type === 'CASH_IN') && (
                <div className="flex justify-between text-emerald-400 font-mono">
                  <span className="font-sans text-slate-400">Total Kas Masuk (Petty In):</span>
                  <span>+{fmt(pettyCashMovements.filter(m => m.type === 'CASH_IN').reduce((sum, m) => sum + Number(m.amount), 0))}</span>
                </div>
              )}
              {pettyCashMovements.some(m => m.type === 'CASH_OUT') && (
                <div className="flex justify-between text-rose-400 font-mono">
                  <span className="font-sans text-slate-400">Total Kas Keluar (Petty Out):</span>
                  <span>-{fmt(pettyCashMovements.filter(m => m.type === 'CASH_OUT').reduce((sum, m) => sum + Number(m.amount), 0))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Penjualan Non-Tunai (QRIS/Debit):</span>
                <span className="font-mono font-bold text-sky-400">+{fmt(Number(activeShift.total_non_cash_sales))}</span>
              </div>
              <div className="border-t border-[#1e2538] pt-2 flex justify-between font-bold text-sm">
                <span className="font-serif-luxury uppercase tracking-wider text-slate-300 text-xs">Kas Seharusnya di Laci:</span>
                <span className="font-mono text-emerald-400 text-base">
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
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Jumlah Fisik Uang di Laci (Hasil Hitung)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-[#c5a059] font-mono font-bold text-sm">Rp</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={endCashActualInput}
                  onChange={e => setEndCashActualInput(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-11 pr-3.5 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl focus:border-[#c5a059] outline-none font-mono font-bold text-lg text-slate-100 placeholder:text-slate-600 transition"
                />
              </div>
            </div>

            {endCashActualInput !== "" && (
              <div className="p-3 rounded-xl border border-[#1e2538] bg-[#070b14] text-xs flex justify-between items-center font-medium">
                <span className="font-serif-luxury uppercase tracking-wider text-slate-400">Selisih Rekonsiliasi:</span>
                <span className={`font-mono font-bold text-sm ${
                  (Number(endCashActualInput) - (
                    Number(activeShift.start_cash) + 
                    Number(activeShift.total_cash_sales) + 
                    pettyCashMovements.filter(m => m.type === 'CASH_IN').reduce((sum, m) => sum + Number(m.amount), 0) -
                    pettyCashMovements.filter(m => m.type === 'CASH_OUT').reduce((sum, m) => sum + Number(m.amount), 0)
                  )) === 0 ? 'text-emerald-400' :
                  (Number(endCashActualInput) - (
                    Number(activeShift.start_cash) + 
                    Number(activeShift.total_cash_sales) + 
                    pettyCashMovements.filter(m => m.type === 'CASH_IN').reduce((sum, m) => sum + Number(m.amount), 0) -
                    pettyCashMovements.filter(m => m.type === 'CASH_OUT').reduce((sum, m) => sum + Number(m.amount), 0)
                  )) > 0 ? 'text-sky-400' : 'text-rose-400'
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
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Catatan Penutupan</label>
              <input
                type="text"
                value={shiftNotes}
                onChange={e => setShiftNotes(e.target.value)}
                placeholder="Misal: Uang diserahkan ke brankas toko"
                className="w-full px-3.5 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl focus:border-[#c5a059] outline-none text-xs text-slate-200 placeholder:text-slate-600 transition"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsCloseShiftModal(false)}
                className="flex-1 py-2.5 bg-[#0e1626] hover:bg-[#152033] border border-[#1e2538] text-slate-400 hover:text-white rounded-xl font-serif-luxury uppercase tracking-wider text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loadingShift}
                className="flex-1 py-2.5 bg-[#251216] hover:bg-[#381a1f] border border-rose-600/50 text-rose-300 font-serif-luxury uppercase tracking-wider font-bold rounded-xl transition disabled:opacity-60"
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
            <div id="print-zreport" className="bg-[#070b14] text-slate-200 p-6 w-full max-w-sm text-xs border border-[#1e2538] rounded-2xl space-y-3 font-mono shadow-2xl">
              <div className="text-center border-b border-[#1e2538] pb-3">
                <div className="font-serif-luxury tracking-widest text-[#e5c483] uppercase font-bold text-sm">LAPORAN Z-REPORT KASIR</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">StokKita Footwear POS Enterprise</div>
              </div>

              <div className="space-y-1 text-slate-400 text-[11px]">
                <div className="flex justify-between"><span>Shift ID:</span><span className="text-slate-200 font-mono">#{zReportData.shift_id.slice(0, 8)}</span></div>
                <div className="flex justify-between"><span>Buka:</span><span className="text-slate-200">{new Date(zReportData.opened_at).toLocaleTimeString('id-ID')}</span></div>
                <div className="flex justify-between"><span>Tutup:</span><span className="text-slate-200">{new Date(zReportData.closed_at).toLocaleTimeString('id-ID')}</span></div>
              </div>

              <div className="border-t border-dashed border-[#1e2538] my-2"></div>

              <div className="space-y-1.5 text-slate-300 text-xs">
                <div className="flex justify-between"><span>Modal Kas Awal:</span><span className="font-mono text-slate-100">{fmt(zReportData.start_cash)}</span></div>
                <div className="flex justify-between text-emerald-400"><span>Penjualan Tunai:</span><span className="font-mono">+{fmt(zReportData.total_cash_sales)}</span></div>
                <div className="flex justify-between text-sky-400"><span>Penjualan Non-Tunai:</span><span className="font-mono">+{fmt(zReportData.total_non_cash_sales)}</span></div>
                <div className="flex justify-between font-bold text-[#e5c483] pt-2 border-t border-[#1e2538] font-serif-luxury tracking-wider">
                  <span>TOTAL OMSET SHIFT:</span><span className="font-mono text-sm">{fmt(zReportData.total_sales)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-[#1e2538] my-2"></div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400"><span>Kas Seharusnya:</span><span className="font-mono text-slate-200">{fmt(zReportData.expected_cash)}</span></div>
                <div className="flex justify-between font-bold text-slate-200"><span>Kas Fisik Riil:</span><span className="font-mono">{fmt(zReportData.end_cash_actual)}</span></div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-[#1e2538]">
                  <span className="font-serif-luxury text-xs tracking-wider">SELISIH:</span>
                  <span className={`font-mono ${zReportData.difference === 0 ? 'text-emerald-400' : zReportData.difference > 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                    {zReportData.difference > 0 ? '+' : ''}{fmt(zReportData.difference)}
                  </span>
                </div>
                <div className="text-center font-serif-luxury tracking-wider text-[10px] uppercase mt-2 py-1.5 bg-[#0e1626] border border-[#1e2538] text-[#c5a059] rounded-lg">
                  STATUS: {zReportData.status_reconciliation}
                </div>
              </div>

              <div className="text-center text-[10px] font-mono text-slate-600 pt-2">
                Dokumen Rekonsiliasi Kas Sah
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 w-full max-w-sm">
              <button type="button" onClick={() => setZReportData(null)} className="px-4 py-2 bg-[#0e1626] hover:bg-[#152033] border border-[#1e2538] text-slate-400 hover:text-white rounded-xl text-xs font-serif-luxury uppercase tracking-wider transition">
                Tutup
              </button>
              <button type="button" onClick={() => window.print()} className="bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] px-5 py-2 rounded-xl text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center gap-2 transition">
                <Printer size={15} /> Cetak Z-Report
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: TRANSAKSI POS & MULTI-PAYMENT */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title="Transaksi Kasir Multi-Payment">
        <form onSubmit={handleSimpan} className="space-y-5 font-sans text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Toko / Cabang</label>
              <div className="px-3.5 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl text-slate-200 font-medium text-xs">
                {warehouses.find(w => w.id === selectedW)?.name}
              </div>
            </div>
            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Tipe Transaksi</label>
              <select 
                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-semibold outline-none transition ${
                  tipe === 'Retur' 
                    ? 'border-rose-600/50 bg-[#251216] text-rose-300 focus:border-rose-500' 
                    : 'border-[#1e2538] bg-[#070b14] text-slate-200 focus:border-[#c5a059]'
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
              <div className="p-4 bg-[#140a0d] border border-rose-900/30 rounded-2xl space-y-3 text-xs text-rose-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-rose-400 text-xs font-serif-luxury uppercase tracking-wider">
                    <Receipt size={15} />
                    <span>Langkah 1: Masukkan Nomor Struk / ID Transaksi Asli</span>
                  </div>
                  <span className="text-[11px] font-mono text-rose-400/80">Ketik 8 karakter awal struk</span>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={receiptLookupInput}
                      onChange={e => setReceiptLookupInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleLookupReceipt(); } }}
                      placeholder="Contoh: 72f2b963 atau scan barcode struk belanja..."
                      className="w-full pl-8 pr-3.5 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl font-mono text-xs outline-none focus:border-rose-500 text-slate-100 placeholder:text-slate-600 transition"
                    />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-rose-500/60" />
                  </div>
                  <button
                    type="button"
                    onClick={handleLookupReceipt}
                    disabled={loadingReceiptLookup || !receiptLookupInput.trim()}
                    className="px-4 py-2 bg-[#251216] hover:bg-[#381a1f] border border-rose-600/50 text-rose-300 rounded-xl font-serif-luxury uppercase tracking-wider font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={loadingReceiptLookup ? "animate-spin" : ""} />
                    {loadingReceiptLookup ? "Mencari..." : "Muat Barang"}
                  </button>
                </div>

                {/* HASIL DATA STRUK YANG DITEMUKAN */}
                {originalReceiptData && (
                  <div className="p-3.5 bg-[#070b14] border border-rose-900/40 rounded-xl space-y-2.5">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 border-b border-[#1e2538] pb-2">
                      <div>
                        <div className="font-serif-luxury tracking-wider text-slate-200 font-bold">
                          Struk #{originalReceiptData.transaction.id.slice(0, 12)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {new Date(originalReceiptData.transaction.created_at).toLocaleString('id-ID')} • Kasir: {originalReceiptData.transaction.kasir_name || "Kasir"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-serif-luxury tracking-wider text-slate-500">Total Belanja:</span>
                        <div className="font-mono font-bold text-emerald-400 text-sm">{fmt(Number(originalReceiptData.transaction.total_amount))}</div>
                      </div>
                    </div>

                    <div className="font-serif-luxury uppercase tracking-wider text-slate-400 text-[11px]">Pilih Barang yang Diretur:</div>
                    <div className="divide-y divide-[#1e2538] border border-[#1e2538] rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-[#070b14]">
                      {originalReceiptData.items.map((item: any) => (
                        <div key={item.id} className="p-2.5 flex justify-between items-center hover:bg-[#150a0d] transition">
                          <div>
                            <div className="font-medium text-slate-200">{item.product_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.sku} • {item.size} {item.color} • Beli: {item.qty} pcs @ {fmt(Number(item.price))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddReceiptItemToCart(item)}
                            className="px-3 py-1 bg-[#251216] hover:bg-[#381a1f] border border-rose-600/50 text-rose-300 rounded-lg font-serif-luxury uppercase tracking-wider text-[10px] font-bold flex items-center gap-1 transition"
                          >
                            <Plus size={11} /> Retur
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
                    className="text-rose-400 hover:text-rose-300 underline font-medium transition"
                  >
                    {showManualReturnInput ? "Sembunyikan Pilihan Manual" : "Atau pilih/scan barang manual (Jika struk pembeli hilang)"}
                  </button>
                </div>

                {showManualReturnInput && (
                  <div className="pt-2 border-t border-rose-900/30">
                    <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1">Pilih Barang dari Katalog Toko</label>
                    <select 
                      className="w-full p-2 rounded-xl border border-[#1e2538] bg-[#070b14] text-slate-200 text-xs outline-none focus:border-[#c5a059]"
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
              <div className="p-3.5 bg-[#070b14] border border-[#1e2538] rounded-2xl space-y-2.5 text-xs">
                <div className="font-serif-luxury uppercase tracking-wider text-slate-300 font-bold">Langkah 2: Alasan Retur & Keterangan</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Alasan Retur *</label>
                    <select
                      value={returnReason}
                      onChange={e => setReturnReason(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0e1626] border border-[#1e2538] rounded-xl text-slate-200 outline-none focus:border-rose-500"
                    >
                      <option value="Barang Rusak / Cacat">Barang Rusak / Cacat Pabrik</option>
                      <option value="Salah Ukuran / Warna">Salah Ukuran / Salah Warna</option>
                      <option value="Salah Beli / Pembatalan">Salah Beli / Pembatalan Pelanggan</option>
                      <option value="Tidak Sesuai Ekspektasi">Tidak Sesuai Ekspektasi</option>
                      <option value="Lainnya">Alasan Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Catatan Tambahan (Opsional)</label>
                    <input
                      type="text"
                      value={returnNotes}
                      onChange={e => setReturnNotes(e.target.value)}
                      placeholder="Misal: Jahitan lepas sebelah kanan"
                      className="w-full px-3 py-2 bg-[#0e1626] border border-[#1e2538] rounded-xl text-slate-200 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. DAFTAR BARANG YANG DIRETUR (KERANJANG RETUR) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-serif-luxury uppercase tracking-wider text-slate-400 font-bold">
                  <span>Langkah 3: Barang yang Dikembalikan ({cart.length} Item)</span>
                  {cart.length > 0 && (
                    <button type="button" onClick={() => setCart([])} className="text-rose-400 hover:text-rose-300 font-normal lowercase">
                      kosongkan
                    </button>
                  )}
                </div>

                <div className="border border-[#1e2538] rounded-xl overflow-hidden bg-[#070b14]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0e1626] text-slate-400 border-b border-[#1e2538] font-serif-luxury uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Produk</th>
                        <th className="p-3 w-16 text-center">Qty Retur</th>
                        <th className="p-3 text-right">Harga</th>
                        <th className="p-3 text-right">Subtotal Refund</th>
                        <th className="p-3 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2538]">
                      {cart.length === 0 ? (
                        <tr><td colSpan={5} className="p-6 text-center text-slate-500">Belum ada barang yang dipilih untuk diretur.</td></tr>
                      ) : cart.map(c => (
                        <tr key={c.variant_id} className="hover:bg-[#0e1626]/60 transition">
                          <td className="p-3 text-slate-200 font-medium">{c.name}</td>
                          <td className="p-3 text-center">
                            <input 
                              type="number" min="1" 
                              className="w-12 bg-[#0e1626] border border-[#1e2538] rounded p-1 text-center font-bold text-rose-400 font-mono"
                              value={c.qty}
                              onChange={e => setCart(cart.map(item => item.variant_id === c.variant_id ? { ...item, qty: Math.max(1, parseInt(e.target.value) || 1) } : item))}
                            />
                          </td>
                          <td className="p-3 text-right text-slate-400 font-mono">{fmt(c.price)}</td>
                          <td className="p-3 text-right font-mono font-bold text-rose-400">{fmt(c.price * c.qty)}</td>
                          <td className="p-3 text-center">
                            <button type="button" onClick={() => removeCart(c.variant_id)} className="text-rose-400 hover:text-rose-300">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. METODE PENGEMBALIAN DANA (REFUND) */}
              <div className="p-4 bg-[#070b14] border border-[#1e2538] rounded-2xl space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-[#1e2538] pb-2.5">
                  <span className="font-serif-luxury uppercase tracking-wider text-slate-400 font-bold">Total Dana Refund:</span>
                  <span className="text-lg font-mono font-bold text-rose-400">{fmt(cartTotal)}</span>
                </div>

                <div>
                  <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-2">Metode Pengembalian Uang:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRefundMethod("Tunai")}
                      className={`p-3 rounded-xl border text-left transition ${
                        refundMethod === "Tunai"
                          ? "bg-[#1f160a] text-[#e5c483] border-[#c5a059] shadow-sm font-bold"
                          : "bg-[#0e1626] text-slate-400 border-[#1e2538] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold font-serif-luxury uppercase tracking-wider text-xs">
                        <Wallet size={15} /> Kas Tunai Laci
                      </div>
                      <div className="text-[10px] mt-1 text-slate-400">
                        Uang kas laci dipotong otomatis & tercatat di Z-Report
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRefundMethod("Transfer")}
                      className={`p-3 rounded-xl border text-left transition ${
                        refundMethod === "Transfer"
                          ? "bg-[#1a0f2e] text-purple-300 border-purple-500/60 shadow-sm font-bold"
                          : "bg-[#0e1626] text-slate-400 border-[#1e2538] hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold font-serif-luxury uppercase tracking-wider text-xs">
                        <CreditCard size={15} /> Transfer Bank / Non-Tunai
                      </div>
                      <div className="text-[10px] mt-1 text-slate-400">
                        Refund ditransfer via m-Banking/rekening toko
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
              <div className="bg-[#0e1626] border border-[#1e2538] rounded-xl p-3.5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-serif-luxury uppercase tracking-wider text-[#e5c483] font-bold flex items-center gap-1.5">
                    <Crown size={14} className="text-[#c5a059]" />
                    Member & Loyalty Points
                  </label>
                  {selectedMember && (
                    <button
                      type="button"
                      onClick={handleRemoveMember}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition"
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
                        placeholder="Ketik WhatsApp member (081298765432)..."
                        className="w-full pl-8 pr-3 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl text-xs font-mono outline-none focus:border-[#c5a059] text-slate-100 placeholder:text-slate-600 transition"
                      />
                      <Phone size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
                    </div>
                    <button
                      type="button"
                      onClick={handleLookupMember}
                      disabled={loadingMemberLookup || !memberPhoneInput.trim()}
                      className="px-3.5 py-2 bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] rounded-xl text-xs font-serif-luxury uppercase tracking-wider font-bold transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <Search size={13} /> {loadingMemberLookup ? "..." : "Cek"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQuickRegisterOpen(true)}
                      className="px-3.5 py-2 bg-[#070b14] hover:bg-[#152033] text-slate-300 border border-[#1e2538] rounded-xl text-xs font-serif-luxury uppercase tracking-wider transition flex items-center gap-1"
                      title="Daftarkan pelanggan baru langsung"
                    >
                      <UserPlus size={13} /> Daftar
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-[#070b14] border border-[#1e2538] rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif-luxury uppercase tracking-wider text-slate-100 font-bold text-xs">{selectedMember.name}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1f160a] text-[#e5c483] border border-[#c5a059]/40 font-mono whitespace-nowrap">
                          <Star size={10} className="fill-[#e5c483] text-[#e5c483] shrink-0" />
                          <span>{selectedMember.tier || "Silver"}</span>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                        <span>Saldo: <strong className="text-slate-200">{new Intl.NumberFormat('id-ID').format(selectedMember.points || 0)} Poin</strong></span>
                        <span>• Nilai: {fmt((selectedMember.points || 0) * 100)}</span>
                      </div>
                    </div>

                    {/* Checkbox Redeem Points */}
                    {selectedMember.points > 0 && (
                      <label className="flex items-center gap-2 bg-[#0e1626] hover:bg-[#152033] p-2 rounded-xl cursor-pointer border border-[#1e2538] text-xs transition">
                        <input
                          type="checkbox"
                          checked={isRedeemingPoints}
                          onChange={e => setIsRedeemingPoints(e.target.checked)}
                          className="w-4 h-4 text-[#c5a059] rounded focus:ring-0 cursor-pointer accent-[#c5a059]"
                        />
                        <div>
                          <div className="font-serif-luxury uppercase tracking-wider text-[#e5c483] font-bold text-[10px]">Tukarkan Poin</div>
                          <div className="text-[10px] text-emerald-400 font-mono">Potong {fmt(maxRedeemablePoints * 100)}</div>
                        </div>
                      </label>
                    )}
                  </div>
                )}

                {selectedMember && (
                  <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <Sparkles size={13} /> Transaksi ini akan menghasilkan <strong className="font-mono">+{potentialPointsEarned} Poin</strong> untuk member.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Scan Barcode / SKU</label>
                <div className="flex items-center gap-2 mb-2 bg-[#070b14] border border-[#1e2538] rounded-xl p-2.5 focus-within:border-[#c5a059] transition">
                  <Barcode size={18} className="text-[#c5a059]" />
                  <input 
                    type="text"
                    ref={barcodeInputRef}
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    onKeyDown={handleScanBarcode}
                    placeholder="Scan barcode sepatu disini (Enter)..."
                    className="bg-transparent w-full focus:outline-none text-slate-100 placeholder:text-slate-600 font-mono text-xs"
                  />
                </div>

                <select 
                  className="w-full p-2.5 rounded-xl border border-[#1e2538] bg-[#070b14] text-slate-300 text-xs focus:border-[#c5a059] outline-none transition"
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
                  <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 font-bold">
                    Keranjang Belanja ({cart.length} Item)
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={cart.length === 0}
                      onClick={handleOpenHoldModal}
                      className="px-2.5 py-1 bg-[#1f160a] hover:bg-[#2e200c] text-[#e5c483] border border-[#c5a059]/40 rounded-lg text-xs font-serif-luxury uppercase tracking-wider flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Parkir keranjang saat ini"
                    >
                      <Pause size={12} />
                      <span>Parkir</span>
                    </button>

                    {heldCarts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsHeldListModalOpen(true)}
                        className="px-2.5 py-1 bg-[#0e1626] hover:bg-[#152033] text-slate-200 border border-[#1e2538] rounded-lg text-xs font-serif-luxury uppercase tracking-wider flex items-center gap-1.5 transition"
                      >
                        <Bookmark size={12} />
                        <span>Antrean ({heldCarts.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Cart Table */}
                <div className="border border-[#1e2538] rounded-xl overflow-hidden bg-[#070b14]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0e1626] text-slate-400 border-b border-[#1e2538] font-serif-luxury uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-2.5">Produk</th>
                        <th className="p-2.5 w-16 text-center">Qty</th>
                        <th className="p-2.5 text-right">Harga</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                        <th className="p-2.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2538]">
                      {cart.length === 0 ? (
                        <tr><td colSpan={5} className="p-6 text-center text-slate-500">Keranjang kosong</td></tr>
                      ) : cart.map(c => (
                        <tr key={c.variant_id} className="hover:bg-[#0e1626]/50 transition">
                          <td className="p-2.5 text-slate-200 font-medium truncate max-w-[160px]">{c.name}</td>
                          <td className="p-2.5 text-center">
                            <input 
                              type="number" min="1" 
                              className="w-12 bg-[#0e1626] border border-[#1e2538] rounded p-1 text-center font-mono font-bold text-[#c5a059]"
                              value={c.qty}
                              onChange={e => updateQty(c.variant_id, parseInt(e.target.value) || 1)}
                            />
                          </td>
                          <td className="p-2.5 text-right text-slate-400 font-mono">{fmt(c.price)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-200">{fmt(c.price * c.qty)}</td>
                          <td className="p-2.5 text-center">
                            <button type="button" onClick={() => removeCart(c.variant_id)} className="text-slate-500 hover:text-rose-400 transition">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-[#0e1626] p-3 border-t border-[#1e2538] space-y-1">
                    {pointsDiscount > 0 && (
                      <div className="flex justify-between items-center text-xs text-purple-300 font-mono">
                        <span className="flex items-center gap-1 font-serif-luxury uppercase tracking-wider text-[10px] text-purple-400"><Gift size={12} /> Diskon Poin ({maxRedeemablePoints} Poin):</span>
                        <span>-{fmt(pointsDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-[#1e2538]">
                      <span className="font-serif-luxury uppercase tracking-wider text-slate-400 text-xs">Total Pembayaran:</span>
                      <span className="text-lg font-mono font-bold text-[#e5c483]">{fmt(cartTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MULTI-PAYMENT METHOD SELECTOR */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 font-bold">Pilih Metode Pembayaran</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Tunai")}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-serif-luxury uppercase tracking-wider transition-all ${
                      paymentMethod === 'Tunai' 
                        ? 'bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold border-transparent shadow-md' 
                        : 'bg-[#070b14] text-slate-400 border-[#1e2538] hover:text-white hover:bg-[#0e1626]'
                    }`}
                  >
                    <Wallet size={16} className="mb-1" />
                    Tunai
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("QRIS");
                      setQrisSimulatorSuccess(false);
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-serif-luxury uppercase tracking-wider transition-all ${
                      paymentMethod === 'QRIS' 
                        ? 'bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold border-transparent shadow-md' 
                        : 'bg-[#070b14] text-slate-400 border-[#1e2538] hover:text-white hover:bg-[#0e1626]'
                    }`}
                  >
                    <QrCode size={16} className="mb-1" />
                    QRIS
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Debit")}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-serif-luxury uppercase tracking-wider transition-all ${
                      paymentMethod === 'Debit' 
                        ? 'bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold border-transparent shadow-md' 
                        : 'bg-[#070b14] text-slate-400 border-[#1e2538] hover:text-white hover:bg-[#0e1626]'
                    }`}
                  >
                    <CreditCard size={16} className="mb-1" />
                    Debit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("Split");
                      setSplitCash(Math.floor(cartTotal / 2));
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-serif-luxury uppercase tracking-wider transition-all ${
                      paymentMethod === 'Split' 
                        ? 'bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold border-transparent shadow-md' 
                        : 'bg-[#070b14] text-slate-400 border-[#1e2538] hover:text-white hover:bg-[#0e1626]'
                    }`}
                  >
                    <Layers size={16} className="mb-1" />
                    Split
                  </button>
                </div>

                {/* TAB PANEL 1: TUNAI */}
                {paymentMethod === "Tunai" && (
                  <div className="p-3.5 bg-[#070b14] border border-[#1e2538] rounded-2xl space-y-3">
                    <div>
                      <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Nominal Uang Diterima</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2 text-[#c5a059] font-mono font-bold text-sm">Rp</span>
                        <input
                          type="number"
                          min={cartTotal}
                          value={cashReceived}
                          onChange={e => setCashReceived(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder={cartTotal.toString()}
                          className="w-full pl-11 pr-3.5 py-2 bg-[#0e1626] border border-[#1e2538] rounded-xl text-lg font-mono font-bold text-slate-100 outline-none focus:border-[#c5a059] transition"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button type="button" onClick={() => setCashReceived(cartTotal)} className="px-3 py-1 bg-[#0e1626] border border-[#1e2538] rounded-lg text-xs font-mono text-slate-300 hover:text-white hover:border-[#c5a059] transition">Uang Pas</button>
                      <button type="button" onClick={() => setCashReceived(Math.ceil(cartTotal / 50000) * 50000)} className="px-3 py-1 bg-[#0e1626] border border-[#1e2538] rounded-lg text-xs font-mono text-slate-300 hover:text-white hover:border-[#c5a059] transition">Pas 50K</button>
                      <button type="button" onClick={() => setCashReceived(Math.ceil(cartTotal / 100000) * 100000)} className="px-3 py-1 bg-[#0e1626] border border-[#1e2538] rounded-lg text-xs font-mono text-slate-300 hover:text-white hover:border-[#c5a059] transition">Pas 100K</button>
                    </div>

                    {cashReceived !== "" && Number(cashReceived) >= cartTotal && (
                      <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-[#1e2538]">
                        <span className="font-serif-luxury uppercase tracking-wider text-slate-400 text-xs">Uang Kembalian:</span>
                        <span className="font-mono text-emerald-400 text-base">{fmt(Number(cashReceived) - cartTotal)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB PANEL 2: QRIS DINAMIS SIMULATOR */}
                {paymentMethod === "QRIS" && (
                  <div className="p-4 bg-[#070b14] border border-[#1e2538] rounded-2xl flex flex-col items-center text-center space-y-3">
                    <div className="text-xs font-serif-luxury tracking-widest text-[#e5c483] uppercase font-bold">QRIS Standar Pembayaran Nasional</div>
                    
                    <div className="p-3 bg-white rounded-2xl shadow-inner border border-slate-200">
                      <QRCodeSVG value={`00020101021226600016ID.CO.STOKKITA.WWW011893600999${cartTotal}5802ID5910STOKKITAPOS6007JAKARTA62070703A016304`} size={150} />
                    </div>

                    <div className="text-base font-mono font-bold text-slate-100">{fmt(cartTotal)}</div>
                    
                    <div className="w-full bg-[#0e1626] p-2.5 rounded-xl border border-[#1e2538] flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                        <Clock size={14} className="animate-spin" /> Menunggu Pembeli Scan...
                      </span>
                      <span className="text-slate-500 font-mono">04:59</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setQrisSimulatorSuccess(true)}
                      className={`w-full py-2.5 rounded-xl text-xs font-serif-luxury uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 ${
                        qrisSimulatorSuccess 
                          ? 'bg-[#0e241b] border border-emerald-500/50 text-emerald-300' 
                          : 'bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] shadow-sm'
                      }`}
                    >
                      {qrisSimulatorSuccess ? (
                        <><CheckCircle2 size={16} /> QRIS Sukses Terverifikasi!</>
                      ) : (
                        <>⚡ [Simulasi Scan & Bayar Sukses]</>
                      )}
                    </button>
                  </div>
                )}

                {/* TAB PANEL 3: DEBIT / EDC */}
                {paymentMethod === "Debit" && (
                  <div className="p-3.5 bg-[#070b14] border border-[#1e2538] rounded-2xl space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1">Bank Penerbit</label>
                        <select
                          value={debitBank}
                          onChange={e => setDebitBank(e.target.value)}
                          className="w-full p-2 bg-[#0e1626] border border-[#1e2538] rounded-xl text-xs text-slate-200 outline-none focus:border-[#c5a059]"
                        >
                          <option value="BCA">Bank BCA</option>
                          <option value="Mandiri">Bank Mandiri</option>
                          <option value="BRI">Bank BRI</option>
                          <option value="BNI">Bank BNI</option>
                          <option value="CIMB">CIMB Niaga</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1">4 Digit Terakhir</label>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Contoh: 4242"
                          value={cardLast4}
                          onChange={e => setCardLast4(e.target.value)}
                          className="w-full p-2 bg-[#0e1626] border border-[#1e2538] rounded-xl text-xs font-mono font-bold text-slate-200 outline-none focus:border-[#c5a059]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1">Trace / Approval Code EDC (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Contoh: APV-89472"
                        value={approvalCode}
                        onChange={e => setApprovalCode(e.target.value)}
                        className="w-full p-2 bg-[#0e1626] border border-[#1e2538] rounded-xl text-xs font-mono text-slate-200 outline-none focus:border-[#c5a059]"
                      />
                    </div>
                  </div>
                )}

                {/* TAB PANEL 4: SPLIT PAYMENT */}
                {paymentMethod === "Split" && (
                  <div className="p-3.5 bg-[#070b14] border border-[#1e2538] rounded-2xl space-y-3">
                    <div className="text-xs font-serif-luxury uppercase tracking-wider text-[#e5c483] font-bold">Kombinasi Pembayaran Tunai & Non-Tunai</div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Bagian 1: Tunai</label>
                        <input
                          type="number"
                          min="1"
                          max={cartTotal - 1}
                          value={splitCash}
                          onChange={e => setSplitCash(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Nominal Tunai"
                          className="w-full p-2 bg-[#0e1626] border border-[#1e2538] rounded-xl text-xs font-mono font-bold text-slate-100 outline-none focus:border-[#c5a059]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Bagian 2: Sisa via</label>
                        <select
                          value={splitNonCashMethod}
                          onChange={e => setSplitNonCashMethod(e.target.value as any)}
                          className="w-full p-2 bg-[#0e1626] border border-[#1e2538] rounded-xl text-xs text-slate-200 outline-none focus:border-[#c5a059]"
                        >
                          <option value="QRIS">QRIS Dinamis</option>
                          <option value="Debit">Kartu Debit</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-[#0e1626] p-3 rounded-xl border border-[#1e2538] text-xs space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Tunai:</span>
                        <span className="font-bold text-slate-200">{fmt(Number(splitCash) || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">{splitNonCashMethod}:</span>
                        <span className="font-bold text-sky-400">{fmt(cartTotal - (Number(splitCash) || 0))}</span>
                      </div>
                      <div className="flex justify-between border-t border-[#1e2538] pt-1.5 font-bold">
                        <span className="font-serif-luxury uppercase tracking-wider text-slate-400 text-xs font-sans">Total Pembayaran:</span>
                        <span className="text-[#e5c483] text-sm">{fmt(cartTotal)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#1e2538]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-[#0e1626] hover:bg-[#152033] border border-[#1e2538] text-slate-400 hover:text-white font-serif-luxury uppercase tracking-wider text-xs transition">
              Batal
            </button>
            {(() => {
              const isCashEmpty = tipe === "Penjualan" && paymentMethod === "Tunai" && cashReceived === "";
              const isCashUnder = tipe === "Penjualan" && paymentMethod === "Tunai" && cashReceived !== "" && Number(cashReceived) < cartTotal;
              const isModalSubmitDisabled = loadingSubmit || cart.length === 0 || isCashEmpty || isCashUnder;

              return (
                <button 
                  type="submit" 
                  disabled={isModalSubmitDisabled}
                  className={`px-6 py-2.5 rounded-xl font-serif-luxury uppercase tracking-wider font-bold shadow-sm transition-all text-xs disabled:cursor-not-allowed flex items-center gap-2 ${
                    loadingSubmit || cart.length === 0
                      ? 'bg-[#0e1626] border border-[#1e2538] text-slate-500 opacity-50'
                      : isCashEmpty
                      ? 'bg-[#181308] border border-amber-600/50 text-amber-300 opacity-80'
                      : isCashUnder
                      ? 'bg-[#250d12] border border-rose-600/60 text-rose-300 opacity-90'
                      : tipe === 'Retur'
                      ? 'bg-[#251216] hover:bg-[#381a1f] border border-rose-600/50 text-rose-300 cursor-pointer'
                      : 'bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] cursor-pointer'
                  }`}
                >
                  {loadingSubmit ? (
                    "Memproses..."
                  ) : cart.length === 0 ? (
                    "Keranjang Kosong"
                  ) : isCashEmpty ? (
                    <>
                      <AlertCircle size={15} className="text-amber-400" />
                      <span>Input Uang Diterima</span>
                    </>
                  ) : isCashUnder ? (
                    <>
                      <AlertCircle size={15} className="text-rose-400" />
                      <span>Uang Kurang {fmt(cartTotal - Number(cashReceived))}</span>
                    </>
                  ) : tipe === "Retur" ? (
                    <>
                      <span>Selesaikan Retur & Refund</span>
                      <ArrowRight size={15} />
                    </>
                  ) : (
                    <>
                      <span>Selesaikan Pembayaran {paymentMethod === "Tunai" ? `(Kembali: ${fmt(Number(cashReceived) - cartTotal)})` : ""}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              );
            })()}
          </div>
        </form>
      </Modal>

      {/* MODAL 5: PARKIR TRANSAKSI / HOLD CART */}
      {isHoldModalOpen && (
        <Modal open={isHoldModalOpen} onClose={() => setIsHoldModalOpen(false)} title="Parkir / Tahan Transaksi Kasir">
          <form onSubmit={handleConfirmHoldCart} className="space-y-4 font-sans text-xs">
            <div className="p-3 bg-[#1f160a] border border-[#c5a059]/30 rounded-xl space-y-1 text-xs text-[#e5c483]">
              <div className="flex items-center gap-1.5 font-bold font-serif-luxury uppercase tracking-wider">
                <Pause size={13} className="text-[#c5a059]" />
                <span>Simpan Keranjang Belanja Sementara</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Keranjang aktif ({cart.length} item • {fmt(cartTotal)}) akan diparkir dan kasir dapat melayani pelanggan berikutnya.
              </p>
            </div>

            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Nama / Label Antrean *</label>
              <input
                type="text"
                required
                value={holdCartName}
                onChange={e => setHoldCartName(e.target.value)}
                placeholder="Contoh: Bpk. Dani / Meja 2"
                className="w-full px-3.5 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#c5a059] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                value={holdCartNotes}
                onChange={e => setHoldCartNotes(e.target.value)}
                placeholder="Misal: Ambil kaus kaki tambahan di rak 2"
                className="w-full px-3.5 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#c5a059] transition"
              />
            </div>

            {/* Preview Items */}
            <div className="border border-[#1e2538] rounded-xl p-3 max-h-32 overflow-y-auto space-y-1 bg-[#070b14] text-xs">
              {cart.map(c => (
                <div key={c.variant_id} className="flex justify-between text-slate-300 font-mono text-[11px]">
                  <span className="truncate max-w-[200px] text-slate-200 font-sans">{c.name} (x{c.qty})</span>
                  <span>{fmt(c.price * c.qty)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsHoldModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#0e1626] hover:bg-[#152033] border border-[#1e2538] text-slate-400 hover:text-white font-serif-luxury uppercase tracking-wider text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] font-serif-luxury uppercase tracking-wider text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition"
              >
                <Pause size={13} /> Simpan & Parkir
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 6: DAFTAR TRANSAKSI DIPARKIR / HELD CARTS LIST */}
      {isHeldListModalOpen && (
        <Modal open={isHeldListModalOpen} onClose={() => setIsHeldListModalOpen(false)} title="Daftar Transaksi Diparkir">
          <div className="space-y-3 font-sans text-xs">
            {heldCarts.length === 0 ? (
              <div className="py-10 text-center text-slate-500 font-serif-luxury uppercase tracking-wider text-xs">
                Tidak ada antrean transaksi yang sedang diparkir.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                {heldCarts.map((hc, idx) => (
                  <div key={hc.id} className="p-3.5 bg-[#070b14] border border-[#1e2538] hover:border-[#c5a059]/50 rounded-2xl shadow-sm space-y-2.5 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#1f160a] border border-[#c5a059]/40 text-[#e5c483] flex items-center justify-center text-[10px] font-mono font-bold">
                            #{idx + 1}
                          </span>
                          <span className="font-serif-luxury uppercase tracking-wider text-slate-100 font-bold text-xs">{hc.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 ml-7 font-mono">
                          <Clock size={11} />
                          <span>{new Date(hc.held_at).toLocaleTimeString('id-ID')}</span>
                          {hc.warehouse_name && <span>• {hc.warehouse_name}</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-[#e5c483] text-sm">{fmt(hc.total)}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{hc.items.length} Item</div>
                      </div>
                    </div>

                    {hc.notes && (
                      <div className="p-2 bg-[#0e1626] border border-[#1e2538] rounded-xl text-[11px] text-slate-400 ml-7 italic">
                        "{hc.notes}"
                      </div>
                    )}

                    {/* Item list snapshot */}
                    <div className="ml-7 space-y-1 text-xs text-slate-300 bg-[#0e1626] p-2.5 rounded-xl border border-[#1e2538] font-mono text-[11px]">
                      {hc.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="truncate max-w-[220px] font-sans text-slate-200">{item.name}</span>
                          <span className="text-slate-400">{item.qty} pcs • {fmt(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteHeldCart(hc.id, hc.name)}
                        className="px-3 py-1.5 bg-[#251216] hover:bg-[#381a1f] border border-rose-600/50 text-rose-300 rounded-xl text-xs font-serif-luxury uppercase tracking-wider flex items-center gap-1 transition"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRecallCart(hc)}
                        className="px-4 py-1.5 bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] rounded-xl text-xs font-serif-luxury uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Play size={12} /> Lanjutkan
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
                className="px-4 py-2 bg-[#0e1626] hover:bg-[#152033] border border-[#1e2538] text-slate-400 hover:text-white rounded-xl text-xs font-serif-luxury uppercase tracking-wider transition"
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
                        {item.notes && (
                          <div className="text-[9px] text-slate-500 italic pl-1">Note: {item.notes}</div>
                        )}
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

                {/* Pajak & Biaya Layanan */}
                {receiptData.taxes?.tax_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>PPN {receiptData.taxes.tax_rate || 11}% ({receiptData.taxes.tax_type === 'EXCLUSIVE' ? 'Excl' : 'Incl'}):</span>
                    <span>{receiptData.taxes.tax_type === 'EXCLUSIVE' ? `+${fmt(receiptData.taxes.tax_amount)}` : fmt(receiptData.taxes.tax_amount)}</span>
                  </div>
                )}
                {receiptData.taxes?.service_charge_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Layanan:</span>
                    <span>+{fmt(receiptData.taxes.service_charge_amount)}</span>
                  </div>
                )}
                {receiptData.taxes?.rounding_amount !== 0 && receiptData.taxes?.rounding_amount !== undefined && (
                  <div className="flex justify-between text-slate-600">
                    <span>Pembulatan:</span>
                    <span>{receiptData.taxes.rounding_amount > 0 ? `+${fmt(receiptData.taxes.rounding_amount)}` : fmt(receiptData.taxes.rounding_amount)}</span>
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

            <div className="flex justify-end gap-2.5 mt-5 w-full max-w-sm">
              <button type="button" onClick={() => setReceiptData(null)} className="px-5 py-2.5 rounded-xl bg-[#0e1626] hover:bg-[#152033] border border-[#1e2538] text-slate-400 hover:text-white font-serif-luxury uppercase tracking-wider text-xs transition">
                Tutup
              </button>
              <button type="button" onClick={() => window.print()} className="bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] px-5 py-2.5 rounded-xl font-serif-luxury uppercase tracking-wider font-bold flex items-center gap-2 text-xs shadow-sm transition">
                <Printer size={15} /> Cetak Struk
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL DISKON MANUAL & KUPON PROMO (HOTKEY F2) */}
      {isDiscountModalOpen && (
        <Modal open={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} title="Diskon Manual & Kupon Promo (F2)">
          <div className="space-y-4 font-sans text-xs">
            
            {/* SECTION 1: KODE VOUCHER PROMO */}
            <div className="bg-[#0e1626] border border-[#1e2538] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Ticket className="text-[#c5a059]" size={16} />
                <h3 className="text-xs font-serif-luxury uppercase tracking-wider text-[#e5c483] font-bold">Kupon Diskon / Voucher Promo</h3>
              </div>

              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                  placeholder="Ketik kode kupon (mis: PROMO10)..."
                  className="flex-1 px-3.5 py-2 text-xs bg-[#070b14] border border-[#1e2538] rounded-xl uppercase font-mono font-bold text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#c5a059] transition"
                />
                <button
                  type="submit"
                  disabled={loadingVoucher || !voucherInput.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] text-xs font-serif-luxury uppercase tracking-wider font-bold rounded-xl shadow-xs disabled:opacity-50 transition"
                >
                  {loadingVoucher ? "Mengecek..." : "Terapkan"}
                </button>
              </form>

              {appliedVoucher && (
                <div className="bg-[#070b14] p-3 rounded-xl border border-[#1e2538] flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#e5c483]">{appliedVoucher.code}</span>
                    <p className="text-[11px] text-emerald-400 font-mono mt-0.5">Hemat {fmt(appliedVoucher.discount_amount)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    className="text-xs text-rose-400 hover:text-rose-300 font-serif-luxury uppercase tracking-wider font-bold bg-[#251216] border border-rose-600/40 px-2.5 py-1 rounded-lg transition"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>

            {/* SECTION 2: DISKON MANUAL TOKO (Persen / Nominal) */}
            <div className="bg-[#070b14] border border-[#1e2538] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sliders className="text-[#c5a059]" size={16} />
                <h3 className="text-xs font-serif-luxury uppercase tracking-wider text-slate-300 font-bold">Diskon Khusus Toko / Display</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#0e1626] p-1 rounded-xl border border-[#1e2538] text-xs font-serif-luxury uppercase tracking-wider font-bold text-center">
                <button
                  type="button"
                  onClick={() => setManualDiscountType("PERCENT")}
                  className={`py-1.5 rounded-lg transition ${manualDiscountType === 'PERCENT' ? 'bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] shadow-xs' : 'text-slate-400 hover:text-white'}`}
                >
                  Persentase (%)
                </button>
                <button
                  type="button"
                  onClick={() => setManualDiscountType("NOMINAL")}
                  className={`py-1.5 rounded-lg transition ${manualDiscountType === 'NOMINAL' ? 'bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] shadow-xs' : 'text-slate-400 hover:text-white'}`}
                >
                  Nominal (Rp)
                </button>
              </div>

              <div>
                <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">
                  {manualDiscountType === 'PERCENT' ? 'Persentase Diskon (%)' : 'Potongan Nominal (Rp)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={manualDiscountType === 'PERCENT' ? 100 : rawCartTotal}
                  value={manualDiscountValue}
                  onChange={e => setManualDiscountValue(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder={manualDiscountType === 'PERCENT' ? 'Misal: 10' : 'Misal: 50000'}
                  className="w-full px-3.5 py-2 text-xs border border-[#1e2538] rounded-xl font-mono font-bold outline-none focus:border-[#c5a059] bg-[#0e1626] text-slate-100 placeholder:text-slate-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Alasan Diskon (Opsional)</label>
                <input
                  type="text"
                  value={manualDiscountReason}
                  onChange={e => setManualDiscountReason(e.target.value)}
                  placeholder="Misal: Promo Opening, Diskon Cuci Gudang, Cacat Jahitan"
                  className="w-full px-3.5 py-2 text-xs border border-[#1e2538] rounded-xl outline-none focus:border-[#c5a059] bg-[#0e1626] text-slate-200 placeholder:text-slate-600 transition"
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
                className="px-4 py-2.5 bg-[#0e1626] hover:bg-[#152033] border border-[#1e2538] text-slate-400 hover:text-white rounded-xl text-xs font-serif-luxury uppercase tracking-wider transition"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] rounded-xl text-xs font-serif-luxury uppercase tracking-wider font-bold shadow-xs transition"
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
          <div className="space-y-4 font-sans text-xs">
            {/* Form Input Petty Cash */}
            <form onSubmit={handleSavePettyCash} className="p-4 bg-[#070b14] border border-[#1e2538] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif-luxury uppercase tracking-wider text-slate-200 font-bold">Catat Kas Masuk / Keluar</span>
                <span className="text-[11px] font-mono text-[#e5c483]">Shift #{activeShift?.id?.slice(0, 8)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPettyCashType("CASH_OUT")}
                  className={`py-2 rounded-xl font-serif-luxury uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    pettyCashType === "CASH_OUT"
                      ? "bg-[#251216] text-rose-300 border-rose-600/60 shadow-sm"
                      : "bg-[#0e1626] text-slate-400 border-[#1e2538] hover:text-white"
                  }`}
                >
                  <ArrowDownLeft size={13} /> Kas Keluar (Beban)
                </button>
                <button
                  type="button"
                  onClick={() => setPettyCashType("CASH_IN")}
                  className={`py-2 rounded-xl font-serif-luxury uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    pettyCashType === "CASH_IN"
                      ? "bg-[#0e241b] text-emerald-300 border-emerald-600/60 shadow-sm"
                      : "bg-[#0e1626] text-slate-400 border-[#1e2538] hover:text-white"
                  }`}
                >
                  <ArrowUpRight size={13} /> Kas Masuk (Topup)
                </button>
              </div>

              <div>
                <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Nominal Uang (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={pettyCashAmount}
                  onChange={e => setPettyCashAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Misal: 25000"
                  className="w-full px-3.5 py-2 bg-[#0e1626] border border-[#1e2538] rounded-xl font-mono font-bold text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#c5a059] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Keperluan / Keterangan Alasan *</label>
                <input
                  type="text"
                  required
                  value={pettyCashReason}
                  onChange={e => setPettyCashReason(e.target.value)}
                  placeholder="Misal: Beli galon air minum toko, bensin kurir, lakban"
                  className="w-full px-3.5 py-2 bg-[#0e1626] border border-[#1e2538] rounded-xl text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-[#c5a059] transition"
                />
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPettyCashModalOpen(false)}
                  className="flex-1 py-2.5 bg-[#0e1626] hover:bg-[#152033] border border-[#1e2538] rounded-xl text-slate-400 hover:text-white font-serif-luxury uppercase tracking-wider text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingPettyCash}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] font-serif-luxury uppercase tracking-wider font-bold rounded-xl shadow-sm transition disabled:opacity-50 text-xs"
                >
                  {loadingPettyCash ? "Menyimpan..." : "Simpan Mutasi"}
                </button>
              </div>
            </form>

            {/* Riwayat Kas Laci Shift Aktif */}
            <div className="space-y-2">
              <div className="font-serif-luxury uppercase tracking-wider text-xs text-slate-400 flex justify-between">
                <span>Riwayat Kas Laci Shift Ini:</span>
                <span className="font-mono text-slate-500">{pettyCashMovements.length} Catatan</span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-[#1e2538] rounded-xl divide-y divide-[#1e2538] bg-[#070b14]">
                {pettyCashMovements.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 font-serif-luxury uppercase tracking-wider text-xs">Belum ada mutasi kas pada shift ini.</div>
                ) : (
                  pettyCashMovements.map(m => (
                    <div key={m.id} className="p-2.5 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                            m.type === 'CASH_IN' ? 'bg-[#0e241b] text-emerald-300 border border-emerald-600/40' : 'bg-[#251216] text-rose-300 border border-rose-600/40'
                          }`}>
                            {m.type === 'CASH_IN' ? '+ MASUK' : '- KELUAR'}
                          </span>
                          <span className="font-medium text-slate-200">{m.reason}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {new Date(m.created_at).toLocaleTimeString('id-ID')} • oleh {m.cashier_name}
                        </div>
                      </div>
                      <div className={`font-mono font-bold ${m.type === 'CASH_IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
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
          <form onSubmit={handleQuickRegisterMember} className="space-y-4 font-sans text-xs">
            <div className="p-3 bg-[#1a0f2e] border border-purple-500/30 rounded-xl text-purple-200">
              <span className="font-serif-luxury uppercase tracking-wider text-[#e5c483] font-bold flex items-center gap-1"><Sparkles size={14} /> Pelanggan Baru Terdeteksi</span>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Daftarkan langsung agar pembeli mendapatkan poin loyalitas belanja.</p>
            </div>

            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Nomor WhatsApp</label>
              <input
                type="text"
                disabled
                value={memberPhoneInput}
                className="w-full px-3.5 py-2 bg-[#0e1626] border border-[#1e2538] rounded-xl font-mono text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Nama Lengkap *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Contoh: Rina Andriani"
                value={quickMemberName}
                onChange={e => setQuickMemberName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl outline-none focus:border-[#c5a059] text-slate-100 placeholder:text-slate-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-serif-luxury uppercase tracking-wider text-slate-400 mb-1.5">Tingkatan Awal (Tier)</label>
              <select
                value={quickMemberTier}
                onChange={e => setQuickMemberTier(e.target.value)}
                className="w-full px-3.5 py-2 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-200 outline-none focus:border-[#c5a059] transition"
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
                className="flex-1 py-2.5 bg-[#0e1626] hover:bg-[#152033] border border-[#1e2538] rounded-xl text-slate-400 hover:text-white font-serif-luxury uppercase tracking-wider text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingQuickMember}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] font-serif-luxury uppercase tracking-wider font-bold rounded-xl shadow-sm transition disabled:opacity-50 text-xs"
              >
                {savingQuickMember ? "Mendaftarkan..." : "Daftar & Pasang"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 9: CEK STOK LINTAS CABANG (CROSS-BRANCH STOCK CHECKER) */}
      {isCrossStockModalOpen && (
        <Modal open={isCrossStockModalOpen} onClose={() => setIsCrossStockModalOpen(false)} title="Pemeriksaan Stok Lintas Cabang">
          <div className="space-y-4 font-sans text-xs">
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
                  className="w-full pl-9 pr-3.5 py-2 bg-[#070b14] border border-[#1e2538] rounded-xl text-xs text-slate-100 placeholder:text-slate-600 outline-none focus:border-[#c5a059] transition"
                />
                <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
              </div>
              <button
                type="button"
                onClick={() => fetchCrossBranchStock(crossStockSearch)}
                className="px-4 py-2 bg-[#0e1626] hover:bg-[#152033] border border-[#1e2538] text-slate-300 hover:text-white rounded-xl font-serif-luxury uppercase tracking-wider text-xs flex items-center gap-1.5 transition"
              >
                <RefreshCw size={13} className={loadingCrossStock ? "animate-spin" : ""} />
                Segarkan
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto border border-[#1e2538] rounded-2xl overflow-hidden shadow-sm bg-[#070b14]">
              <table className="w-full text-left">
                <thead className="bg-[#0e1626] text-slate-400 font-serif-luxury uppercase tracking-wider text-[10px] border-b border-[#1e2538] sticky top-0">
                  <tr>
                    <th className="p-3 pl-4">Produk & Varian</th>
                    <th className="p-3">Cabang / Toko</th>
                    <th className="p-3 text-center">Stok Tersedia</th>
                    <th className="p-3 text-right pr-4">Harga Jual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2538]">
                  {loadingCrossStock ? (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-500 font-serif-luxury uppercase tracking-wider">Memeriksa ketersediaan stok seluruh cabang...</td></tr>
                  ) : crossStockList.length === 0 ? (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-500 font-serif-luxury uppercase tracking-wider">Tidak ada produk yang cocok dengan pencarian.</td></tr>
                  ) : (
                    crossStockList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#0e1626]/50 transition">
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#070b14] border border-[#1e2538] flex-shrink-0 flex items-center justify-center">
                              <img 
                                src={item.image_url || shoeLuxuryEmblem} 
                                alt={item.product_name}
                                onError={(e) => { (e.target as HTMLImageElement).src = shoeLuxuryEmblem; }}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-medium text-slate-200">{item.product_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.sku} • {item.color} • {item.size}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                            <Building size={13} className="text-slate-500" />
                            <span>{item.warehouse_name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                            Number(item.stock_qty) <= 0 
                              ? 'bg-[#251216] text-rose-300 border border-rose-600/40' 
                              : Number(item.stock_qty) < 10
                              ? 'bg-[#1f160a] text-[#e5c483] border border-[#c5a059]/40'
                              : 'bg-[#0e241b] text-emerald-300 border border-emerald-600/40'
                          }`}>
                            {item.stock_qty} pcs
                          </span>
                        </td>
                        <td className="p-3 text-right pr-4 font-mono font-bold text-[#e5c483]">
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
