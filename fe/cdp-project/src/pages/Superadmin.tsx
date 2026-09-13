import { useState, useEffect, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { toast } from "sonner";
import {
  ShieldCheck,
  Building2,
  DollarSign,
  TrendingUp,
  Users,
  Store,
  Search,
  Plus,
  Edit,
  LogIn,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  RefreshCw,
  LogOut,
  Crown,
  Sparkles,
  Layers,
  Key,
  ArrowRight,
  Activity,
  Sliders,
  Check,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import superadminSovereignBg from "../assets/superadmin_sovereign_bg.jpg";

interface TenantData {
  id: string;
  name: string;
  domain: string;
  created_at: string;
  subscription_status: "active" | "trial" | "suspended" | "expired";
  subscription_plan: "Starter" | "Pro" | "Enterprise";
  subscription_expires_at: string;
  max_branches: number;
  contact_phone?: string;
  notes?: string;
  owner_info?: {
    id: string;
    name: string;
    email: string;
  };
  branch_count: number;
  product_count: number;
  user_count: number;
  transaction_count: number;
  gmv: number;
  is_expired: boolean;
}

interface MetricsData {
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    expired: number;
    plans: {
      Starter: number;
      Pro: number;
      Enterprise: number;
    };
  };
  financial: {
    total_gmv: number;
    total_transactions: number;
    estimated_mrr: number;
  };
  ecosystem: {
    total_users: number;
    admin_users: number;
    cashier_users: number;
    total_branches: number;
    total_products: number;
    total_variants: number;
  };
}

export default function Superadmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");

  // Modal Edit Subscription
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    subscription_status: "active",
    subscription_plan: "Starter",
    extend_months: 0,
    max_branches: 2,
    contact_phone: "",
    notes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal Create Tenant
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    domain: "",
    plan: "Starter",
    duration_months: 1,
    admin_name: "",
    admin_email: "",
    admin_password: "",
    contact_phone: "",
    notes: "",
  });
  const [savingCreate, setSavingCreate] = useState(false);

  const searchId = useId();
  const editPlanId = useId();
  const editStatusId = useId();
  const editExtendId = useId();
  const editBranchesId = useId();
  const editPhoneId = useId();
  const editNotesId = useId();
  const createPlanId = useId();
  const createDurationId = useId();

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const getRemainingDays = (expiresAt?: string) => {
    if (!expiresAt) return 0;
    const diffTime = new Date(expiresAt).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, tenantsRes] = await Promise.all([
        api.get("/superadmin/metrics"),
        api.get("/superadmin/tenants", {
          params: {
            search: search || undefined,
            status: statusFilter !== "ALL" ? statusFilter : undefined,
            plan: planFilter !== "ALL" ? planFilter : undefined,
          },
        }),
      ]);
      setMetrics(metricsRes.data);
      setTenants(tenantsRes.data.tenants || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memuat data platform");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const openEditModal = (t: TenantData) => {
    setSelectedTenant(t);
    setEditForm({
      subscription_status: t.subscription_status,
      subscription_plan: t.subscription_plan,
      extend_months: 0,
      max_branches: t.max_branches || 2,
      contact_phone: t.contact_phone || "",
      notes: t.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setSavingEdit(true);
    try {
      const res = await api.put(`/superadmin/tenants/${selectedTenant.id}/subscription`, editForm);
      toast.success(res.data.message || "Langganan berhasil diperbarui");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memperbarui langganan");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleSuspend = async (t: TenantData) => {
    const newStatus = t.subscription_status === "suspended" ? "active" : "suspended";
    const confirmMessage = newStatus === "suspended" 
      ? `Yakin ingin menangguhkan (suspend) toko "${t.name}"? Pengguna toko tidak akan bisa mengakses sistem hingga diaktifkan kembali.`
      : `Aktifkan kembali akses toko "${t.name}"?`;

    toast(confirmMessage, {
      duration: 8000,
      action: {
        label: newStatus === "suspended" ? "Ya, Suspend Toko" : "Ya, Aktifkan",
        onClick: async () => {
          try {
            await api.put(`/superadmin/tenants/${t.id}/subscription`, {
              subscription_status: newStatus,
            });
            toast.success(`Status toko "${t.name}" berhasil diubah menjadi ${newStatus}`);
            fetchData();
          } catch (err: any) {
            toast.error(err.response?.data?.message || "Gagal mengubah status toko");
          }
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      },
    });
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCreate(true);
    try {
      const res = await api.post("/superadmin/tenants", createForm);
      toast.success(res.data.message || "Tenant baru berhasil didaftarkan");
      setIsCreateModalOpen(false);
      setCreateForm({
        name: "",
        domain: "",
        plan: "Starter",
        duration_months: 1,
        admin_name: "",
        admin_email: "",
        admin_password: "",
        contact_phone: "",
        notes: "",
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mendaftarkan tenant baru");
    } finally {
      setSavingCreate(false);
    }
  };

  const handleImpersonate = async (t: TenantData) => {
    toast(`Masuk ke toko "${t.name}" sebagai Admin toko?`, {
      description: "Anda akan beralih tampilan menjadi Admin toko untuk kebutuhan bantuan teknis.",
      duration: 8000,
      action: {
        label: "Masuk Toko",
        onClick: async () => {
          try {
            const res = await api.post(`/superadmin/tenants/${t.id}/impersonate`);
            const { token, user: impersonatedUser } = res.data;
            
            // 1. Simpan session Superadmin asli agar bisa kembali dengan 1-klik tanpa login ulang
            const currentToken = localStorage.getItem("token");
            const currentUser = localStorage.getItem("umkm_user");
            if (currentToken) {
              localStorage.setItem("superadmin_original_token", currentToken);
            }
            if (currentUser) {
              localStorage.setItem("superadmin_original_user", currentUser);
            }

            // 2. Pasang session impersonasi tenant
            localStorage.setItem("token", token);
            localStorage.setItem("umkm_user", JSON.stringify(impersonatedUser));
            api.defaults.headers.common.Authorization = `Bearer ${token}`;
            
            toast.success(`Berhasil masuk ke toko ${t.name}!`);
            window.location.href = "/";
          } catch (err: any) {
            toast.error(err.response?.data?.message || "Gagal melakukan impersonasi toko");
          }
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 font-sans relative selection:bg-[#c5a059]/30 selection:text-[#f3d99d]">
      {/* Master Footwear Atelier Background - Vividly Visible */}
      <div 
        className="fixed inset-0 bg-cover bg-center pointer-events-none z-0 opacity-100 transition-opacity duration-700"
        style={{ 
          backgroundImage: `url(${superadminSovereignBg})`,
          backgroundPosition: "center 25%",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat"
        }}
      />
      {/* Subtle Smoked Architectural Vignette: keeps the background artwork clearly visible */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: "radial-gradient(ellipse at 50% 30%, rgba(6, 10, 20, 0.20) 0%, rgba(6, 10, 20, 0.50) 65%, rgba(6, 10, 20, 0.85) 100%)"
        }}
      />

      {/* TOP SOVEREIGN COMMAND BAR */}
      <header className="sticky top-0 z-40 bg-[#060913]/40 backdrop-blur-xl border-b border-[#c5a059]/30 px-4 sm:px-8 py-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Crest */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl border border-[#c5a059]/50 bg-gradient-to-tr from-[#1a1408]/80 to-[#0d1527]/80 flex items-center justify-center shadow-[0_0_20px_rgba(197,160,89,0.25)] ring-1 ring-[#c5a059]/30 backdrop-blur-md">
              <Crown className="w-5 h-5 text-[#e5c483]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-serif-luxury text-base sm:text-lg font-bold tracking-[0.16em] text-[#e5c483] uppercase drop-shadow-sm">
                  StokKita Sovereign
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#181206]/80 border border-[#c5a059]/40 text-[#f3d99d] text-[9px] font-mono tracking-widest uppercase font-bold backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  Cluster Master
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-300 drop-shadow-xs">
                Pusat Kendali Ekosistem Multi-Tenant & Langganan SaaS
              </p>
            </div>
          </div>

          {/* Action Hub & Profile */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl bg-[#090e1c]/60 hover:bg-[#141d33]/90 text-slate-200 hover:text-[#e5c483] border border-[#c5a059]/30 hover:border-[#c5a059]/60 transition shadow-sm cursor-pointer backdrop-blur-md"
              title="Sinkronisasi Data Ekosistem"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-[#c5a059]" : ""} />
            </button>

            {/* Profile Capsule */}
            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-[#c5a059]/20">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#c5a059]/30 to-[#e5c483]/20 border border-[#c5a059]/50 flex items-center justify-center font-serif-luxury font-bold text-xs text-[#e5c483]">
                {user?.nama?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="text-left">
                <p className="text-xs font-serif-luxury font-semibold text-slate-200 leading-tight">
                  {user?.nama || "Platform Owner"}
                </p>
                <p className="text-[10px] font-mono text-[#c5a059]">{user?.email || "owner@stokkita.id"}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold text-rose-300 bg-[#250d12]/60 hover:bg-[#341118]/80 border border-rose-700/50 hover:border-rose-600 transition cursor-pointer backdrop-blur-md"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Keluar Sesi</span>
            </button>
          </div>

        </div>
      </header>

      {/* MAIN COMMAND DECK VIEWPORT */}
      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">

        {/* EDITORIAL SOVEREIGN BANNER */}
        <div className="p-5 sm:p-6 rounded-3xl border border-[#c5a059]/35 bg-[#070c17]/25 backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181308]/80 border border-[#c5a059]/50 text-[#e5c483] text-[10px] font-mono tracking-widest uppercase mb-2 backdrop-blur-xs">
              <Sparkles size={11} className="text-[#c5a059]" />
              <span>Haute Footwear Maison • Command Deck</span>
            </div>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              Konsol Kendali <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e5c483] via-[#f3d99d] to-[#c5a059]">Sovereign Atelier</span>
            </h2>
            <p className="text-xs font-mono text-slate-300 mt-1 max-w-2xl drop-shadow-xs">
              Pengawasan terpusat ekosistem brand sepatu terdaftar, omzet kasir real-time, dan tata kelola sewa multi-tenant.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-[#e5c483] bg-[#090e1c]/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#c5a059]/30 self-start md:self-auto shadow-sm">
            <ShieldCheck size={18} className="text-[#c5a059]" />
            <div>
              <span className="font-semibold block text-slate-200">Enkripsi 256-Bit Aktif</span>
              <span className="text-[10px] text-slate-400">Database & Kuota Terisolasi</span>
            </div>
          </div>
        </div>

        {/* ASYMMETRICAL EXECUTIVE METRIC DECK (7 : 5 GRID) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* DECK KIRI (7 KOLOM): MASTER FINANCIAL ENGINE */}
          <div className="lg:col-span-7 rounded-3xl border border-[#c5a059]/35 hover:border-[#c5a059]/70 bg-[#070c17]/25 backdrop-blur-md p-6 sm:p-7 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between transition-all duration-300">
            {/* Ambient Corner Accent */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#c5a059]/20 via-transparent to-transparent pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181308]/80 border border-[#c5a059]/40 text-[#e5c483] text-[10px] font-mono tracking-widest uppercase backdrop-blur-xs">
                  <TrendingUp size={12} className="text-[#c5a059]" />
                  <span>Kinerja Finansial Platform</span>
                </div>
                <span className="text-[11px] font-mono text-slate-300 drop-shadow-xs">Real-Time Aggregation</span>
              </div>

              <div className="mt-5">
                <p className="text-xs font-serif-luxury uppercase tracking-widest text-slate-300 font-semibold drop-shadow-xs">
                  Total Volume Transaksi (GMV Ekosistem)
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif-luxury font-bold text-[#f3d99d] tracking-tight mt-1.5 drop-shadow-[0_2px_12px_rgba(197,160,89,0.35)]">
                  {formatRupiah(metrics?.financial.total_gmv || 0)}
                </h2>
                <p className="text-xs font-mono text-slate-300 mt-2 flex items-center gap-2 drop-shadow-xs">
                  <Activity size={13} className="text-emerald-400" />
                  <span>Dihasilkan dari <strong className="text-slate-100">{metrics?.financial.total_transactions || 0}</strong> transaksi kasir di seluruh toko</span>
                </p>
              </div>
            </div>

            {/* Split Financial Sub-Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 pt-6 border-t border-[#c5a059]/25">
              <div className="p-4 rounded-2xl bg-[#060a14]/30 border border-[#c5a059]/30 backdrop-blur-sm flex items-center justify-between hover:border-[#c5a059]/55 hover:bg-[#060a14]/45 transition">
                <div>
                  <p className="text-[11px] font-serif-luxury uppercase tracking-wider text-slate-300 font-semibold">
                    Estimasi MRR (SaaS)
                  </p>
                  <p className="text-xl sm:text-2xl font-serif-luxury font-bold text-emerald-400 mt-1 drop-shadow-xs">
                    {formatRupiah(metrics?.financial.estimated_mrr || 0)}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">Pendapatan langganan berulang bulanan</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <DollarSign size={20} />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#060a14]/30 border border-[#c5a059]/30 backdrop-blur-sm flex items-center justify-between hover:border-[#c5a059]/55 hover:bg-[#060a14]/45 transition">
                <div>
                  <p className="text-[11px] font-serif-luxury uppercase tracking-wider text-slate-300 font-semibold">
                    Rata-rata Nilai Keranjang (AOV)
                  </p>
                  <p className="text-xl sm:text-2xl font-serif-luxury font-bold text-[#e5c483] mt-1 drop-shadow-xs">
                    {formatRupiah(
                      metrics?.financial.total_transactions 
                        ? Math.round((metrics.financial.total_gmv || 0) / metrics.financial.total_transactions) 
                        : 0
                    )}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">Rata-rata transaksi per penjualan</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#e5c483]">
                  <Sparkles size={18} />
                </div>
              </div>
            </div>

          </div>

          {/* DECK KANAN (5 KOLOM): ECOSYSTEM SCALE MATRIX */}
          <div className="lg:col-span-5 rounded-3xl border border-[#c5a059]/35 hover:border-[#c5a059]/70 bg-[#070c17]/25 backdrop-blur-md p-6 sm:p-7 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10192e]/80 border border-blue-500/40 text-blue-400 text-[10px] font-mono tracking-widest uppercase backdrop-blur-xs">
                  <Layers size={12} />
                  <span>Matriks Skala Ekosistem</span>
                </div>
                <span className="text-[11px] font-mono text-slate-300 drop-shadow-xs">Multi-Tenant Network</span>
              </div>

              {/* Total Tenants Main Counter */}
              <div className="mt-5 flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-serif-luxury uppercase tracking-widest text-slate-300 font-semibold drop-shadow-xs">
                    Total Brand Sepatu Terdaftar
                  </p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-4xl sm:text-5xl font-serif-luxury font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                      {metrics?.tenants.total || 0}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Atelier Aktif</span>
                  </div>
                </div>

                {/* Status Chips */}
                <div className="space-y-1.5 text-right font-mono text-xs">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[11px] font-semibold backdrop-blur-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{metrics?.tenants.active || 0} Aktif</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400">
                    <span className="text-amber-400 font-semibold">{metrics?.tenants.trial || 0} Trial</span>
                    <span>•</span>
                    <span className="text-rose-400 font-semibold">{metrics?.tenants.suspended || 0} Suspend</span>
                  </div>
                </div>
              </div>

              {/* Subscription Plan Distribution Bar */}
              <div className="mt-5 p-3.5 rounded-2xl bg-[#060a14]/30 border border-[#c5a059]/30 backdrop-blur-sm space-y-2">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Distribusi Paket Berlangganan</span>
                  <span className="text-[#e5c483]">Enterprise • Pro • Starter</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/40 text-purple-300 backdrop-blur-xs">
                    <p className="text-[10px] uppercase text-purple-400 font-bold">Enterprise</p>
                    <p className="text-sm font-bold mt-0.5">{metrics?.tenants.plans?.Enterprise || 0}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/40 text-blue-300 backdrop-blur-xs">
                    <p className="text-[10px] uppercase text-blue-400 font-bold">Pro</p>
                    <p className="text-sm font-bold mt-0.5">{metrics?.tenants.plans?.Pro || 0}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 backdrop-blur-xs">
                    <p className="text-[10px] uppercase text-amber-400 font-bold">Starter</p>
                    <p className="text-sm font-bold mt-0.5">{metrics?.tenants.plans?.Starter || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Ecosystem Totals */}
            <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-[#c5a059]/25 text-center font-mono">
              <div>
                <p className="text-lg font-bold text-slate-100">{metrics?.ecosystem.total_branches || 0}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Cabang/Gudang</p>
              </div>
              <div className="border-x border-[#c5a059]/20">
                <p className="text-lg font-bold text-[#e5c483]">{metrics?.ecosystem.total_products || 0}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Model Sepatu</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-100">{metrics?.ecosystem.total_users || 0}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Staf & Kasir</p>
              </div>
            </div>

          </div>

        </div>

        {/* TENANT ATELIER EXPLORER & COMMAND CONSOLE */}
        <div className="rounded-3xl border border-[#c5a059]/35 bg-[#070c17]/25 backdrop-blur-md shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Header & Main Actions */}
          <div className="p-5 sm:p-7 border-b border-[#c5a059]/25 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#050811]/30">
            <div>
              <div className="flex items-center gap-2.5">
                <Store size={20} className="text-[#c5a059]" />
                <h2 className="text-lg font-serif-luxury font-bold text-white tracking-wide uppercase">
                  Daftar Penyewa Brand Sepatu (Tenants)
                </h2>
              </div>
              <p className="text-xs font-mono text-slate-300 mt-1">
                Pantau performa atelier, kuota cabang, masa aktif sewa, dan lakukan inspeksi teknis (impersonasi).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] hover:brightness-110 active:scale-[0.99] text-[#070b14] font-serif-luxury text-xs font-bold tracking-wider uppercase transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Daftarkan Toko Baru</span>
            </button>
          </div>

          {/* Search, Filter Pills, and Status Bar */}
          <div className="p-4 sm:p-5 border-b border-[#c5a059]/20 bg-[#050812]/30 backdrop-blur-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[260px] max-w-lg">
              <label htmlFor={searchId} className="sr-only">Cari brand atau domain</label>
              <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
              <input
                id={searchId}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama brand, domain, atau email pemilik..."
                className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-[#090e1c]/40 border border-[#c5a059]/30 rounded-xl text-slate-100 placeholder-slate-400 focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059]/40 outline-none transition shadow-inner backdrop-blur-xs"
              />
            </form>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Pills */}
              <div className="flex items-center p-1 rounded-xl bg-[#090e1c]/40 border border-[#c5a059]/30 text-xs font-mono backdrop-blur-xs">
                {["ALL", "active", "trial", "suspended"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg transition text-[11px] font-semibold capitalize cursor-pointer ${
                      statusFilter === st
                        ? "bg-[#161f36]/80 text-[#e5c483] border border-[#c5a059]/60 shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {st === "ALL" ? "Semua Status" : st}
                  </button>
                ))}
              </div>

              {/* Plan Pills */}
              <div className="flex items-center p-1 rounded-xl bg-[#090e1c]/40 border border-[#c5a059]/30 text-xs font-mono backdrop-blur-xs">
                {["ALL", "Starter", "Pro", "Enterprise"].map((pl) => (
                  <button
                    key={pl}
                    type="button"
                    onClick={() => setPlanFilter(pl)}
                    className={`px-3 py-1.5 rounded-lg transition text-[11px] font-semibold cursor-pointer ${
                      planFilter === pl
                        ? "bg-[#161f36]/80 text-[#e5c483] border border-[#c5a059]/60 shadow-xs"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {pl === "ALL" ? "Semua Paket" : pl}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Atelier Tenants Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#03060e]/50 text-slate-300 border-b border-[#c5a059]/30 font-serif-luxury uppercase tracking-[0.14em] text-[10px] backdrop-blur-md">
                  <th className="p-4 pl-6">Brand Sepatu & Domain</th>
                  <th className="p-4">Pemilik & Kontak</th>
                  <th className="p-4">Paket SaaS</th>
                  <th className="p-4">Status Sewa</th>
                  <th className="p-4">Masa Berlaku</th>
                  <th className="p-4">Kapasitas Cabang</th>
                  <th className="p-4">Omzet GMV</th>
                  <th className="p-4 pr-6 text-right">Aksi Eksekutif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c5a059]/15 text-slate-200">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 font-mono">
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw size={16} className="animate-spin text-[#c5a059]" />
                          <span>Memuat data atelier...</span>
                        </div>
                      ) : (
                        "Tidak ada tenant brand sepatu yang sesuai dengan filter."
                      )}
                    </td>
                  </tr>
                ) : (
                  tenants.map(t => {
                    const daysLeft = getRemainingDays(t.subscription_expires_at);
                    const isSuspended = t.subscription_status === "suspended";

                    return (
                      <tr 
                        key={t.id} 
                        className="bg-[#070c17]/20 backdrop-blur-xs hover:bg-[#14203d]/45 transition-colors group border-b border-[#c5a059]/15"
                      >
                        {/* 1. BRAND & DOMAIN */}
                        <td className="p-4 pl-6">
                          <div className="font-serif-luxury font-bold text-white text-sm group-hover:text-[#f3d99d] transition drop-shadow-xs">
                            {t.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-[#090e1c]/60 border border-[#c5a059]/25 text-slate-300">
                              {t.domain || "toko.local"}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="text-[10px] text-slate-500">Sejak {formatDate(t.created_at)}</span>
                          </div>
                        </td>

                        {/* 2. OWNER & CONTACT */}
                        <td className="p-4">
                          <div className="font-semibold text-slate-200">{t.owner_info?.name || "Admin"}</div>
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Mail size={12} className="text-slate-500" />
                            <span>{t.owner_info?.email || "-"}</span>
                          </div>
                          {t.contact_phone && (
                            <div className="text-[11px] font-mono text-[#c5a059] flex items-center gap-1.5 mt-0.5">
                              <Phone size={11} />
                              <span>{t.contact_phone}</span>
                            </div>
                          )}
                        </td>

                        {/* 3. PAKET SAAS */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-mono font-bold border backdrop-blur-xs ${
                            t.subscription_plan === "Enterprise"
                              ? "bg-purple-950/40 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                              : t.subscription_plan === "Pro"
                              ? "bg-[#181308]/80 text-[#e5c483] border-[#c5a059]/50 shadow-[0_0_12px_rgba(197,160,89,0.15)]"
                              : "bg-[#0b1424]/80 text-blue-300 border-blue-500/30"
                          }`}>
                            <Crown size={12} className={t.subscription_plan === "Enterprise" ? "text-purple-400" : "text-[#c5a059]"} />
                            <span>{t.subscription_plan}</span>
                          </span>
                        </td>

                        {/* 4. STATUS SEWA */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold backdrop-blur-xs ${
                            isSuspended
                              ? "bg-rose-950/50 text-rose-300 border border-rose-600/40"
                              : t.is_expired
                              ? "bg-slate-800/80 text-slate-400 border border-slate-700"
                              : t.subscription_status === "trial"
                              ? "bg-amber-950/50 text-amber-300 border border-amber-500/40"
                              : "bg-emerald-950/50 text-emerald-300 border border-emerald-500/40"
                          }`}>
                            {isSuspended ? (
                              <XCircle size={12} className="text-rose-400" />
                            ) : t.is_expired ? (
                              <Clock size={12} className="text-slate-400" />
                            ) : (
                              <CheckCircle2 size={12} className="text-emerald-400" />
                            )}
                            <span className="capitalize">{isSuspended ? "Suspended" : t.is_expired ? "Kedaluwarsa" : t.subscription_status}</span>
                          </span>
                        </td>

                        {/* 5. MASA BERLAKU */}
                        <td className="p-4">
                          <div className="font-semibold text-slate-200">
                            {formatDate(t.subscription_expires_at)}
                          </div>
                          <div className={`text-[11px] font-mono font-bold mt-0.5 ${
                            daysLeft <= 0
                              ? "text-rose-400"
                              : daysLeft <= 7
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}>
                            {daysLeft <= 0 ? "Expired" : `${daysLeft} hari lagi`}
                          </div>
                        </td>

                        {/* 6. CABANG & PRODUK */}
                        <td className="p-4 font-mono">
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{t.branch_count}</span>
                            <span className="text-slate-400 font-normal">/ {t.max_branches >= 999 ? "∞" : t.max_branches} Cabang</span>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-24 h-1.5 bg-[#090e1c]/60 rounded-full overflow-hidden mt-1.5 border border-[#c5a059]/25">
                            <div 
                              className="h-full bg-gradient-to-r from-[#c5a059] to-[#e5c483] rounded-full" 
                              style={{ 
                                width: `${Math.min(100, Math.round((t.branch_count / (t.max_branches || 1)) * 100))}%` 
                              }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {t.product_count} Produk • {t.user_count} Staf
                          </div>
                        </td>

                        {/* 7. GMV */}
                        <td className="p-4 font-mono">
                          <div className="font-bold text-[#f3d99d] text-sm drop-shadow-xs">
                            {formatRupiah(t.gmv)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {t.transaction_count} Transaksi
                          </div>
                        </td>

                        {/* 8. AKSI EKSEKUTIF */}
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Tombol Impersonate */}
                            <button
                              type="button"
                              onClick={() => handleImpersonate(t)}
                              className="p-2 rounded-xl bg-[#090e1c]/50 hover:bg-emerald-950/70 text-slate-300 hover:text-emerald-400 border border-[#c5a059]/30 hover:border-emerald-500/50 transition cursor-pointer backdrop-blur-xs"
                              title="Masuk ke toko sebagai Admin (Support Impersonation)"
                            >
                              <LogIn size={15} />
                            </button>

                            {/* Tombol Edit Langganan */}
                            <button
                              type="button"
                              onClick={() => openEditModal(t)}
                              className="p-2 rounded-xl bg-[#090e1c]/50 hover:bg-[#141d33]/80 text-slate-300 hover:text-[#e5c483] border border-[#c5a059]/30 hover:border-[#c5a059]/70 transition cursor-pointer backdrop-blur-xs"
                              title="Kelola Paket / Perpanjang Masa Sewa"
                            >
                              <Sliders size={15} />
                            </button>

                            {/* Tombol Toggle Suspend */}
                            <button
                              type="button"
                              onClick={() => handleToggleSuspend(t)}
                              className={`p-2 rounded-xl transition cursor-pointer border backdrop-blur-xs ${
                                isSuspended
                                  ? "bg-emerald-950/50 hover:bg-emerald-900/80 text-emerald-400 border-emerald-700/60"
                                  : "bg-[#250d12]/50 hover:bg-[#341118]/80 text-rose-400 border-rose-800/50"
                              }`}
                              title={isSuspended ? "Aktifkan Kembali Toko" : "Suspend Toko (Kunci Akses)"}
                            >
                              <AlertTriangle size={15} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>

      {/* MODAL: EDIT SUBSCRIPTION */}
      {isEditModalOpen && selectedTenant && (
        <Modal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Kelola Langganan: ${selectedTenant.name}`}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={editPlanId} className="block font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                  Paket SaaS
                </label>
                <select
                  id={editPlanId}
                  value={editForm.subscription_plan}
                  onChange={e => setEditForm({ ...editForm, subscription_plan: e.target.value as any })}
                  className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                >
                  <option value="Starter">Starter (Rp 150rb/bln, max 2 cabang)</option>
                  <option value="Pro">Pro (Rp 350rb/bln, max 5 cabang)</option>
                  <option value="Enterprise">Enterprise (Rp 750rb/bln, unlimited)</option>
                </select>
              </div>

              <div>
                <label htmlFor={editStatusId} className="block font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                  Status Akses
                </label>
                <select
                  id={editStatusId}
                  value={editForm.subscription_status}
                  onChange={e => setEditForm({ ...editForm, subscription_status: e.target.value as any })}
                  className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                >
                  <option value="active">Active (Akses Penuh)</option>
                  <option value="trial">Trial (Masa Percobaan)</option>
                  <option value="suspended">Suspended (Toko Diblokir)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={editExtendId} className="block font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                  Perpanjang Masa Sewa
                </label>
                <select
                  id={editExtendId}
                  value={editForm.extend_months}
                  onChange={e => setEditForm({ ...editForm, extend_months: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                >
                  <option value={0}>Tidak Perpanjang (+0 Bulan)</option>
                  <option value={1}>+ 1 Bulan</option>
                  <option value={3}>+ 3 Bulan (Kuartal)</option>
                  <option value={6}>+ 6 Bulan (Semester)</option>
                  <option value={12}>+ 12 Bulan (1 Tahun Penuh)</option>
                </select>
              </div>

              <div>
                <label htmlFor={editBranchesId} className="block font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                  Batas Maksimal Cabang
                </label>
                <input
                  id={editBranchesId}
                  type="number"
                  value={editForm.max_branches}
                  onChange={e => setEditForm({ ...editForm, max_branches: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            <div>
              <label htmlFor={editPhoneId} className="block font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                Nomor WhatsApp Pemilik
              </label>
              <input
                id={editPhoneId}
                type="text"
                value={editForm.contact_phone}
                onChange={e => setEditForm({ ...editForm, contact_phone: e.target.value })}
                placeholder="081234567890"
                className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label htmlFor={editNotesId} className="block font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                Catatan Internal Platform Owner
              </label>
              <textarea
                id={editNotesId}
                rows={2}
                value={editForm.notes}
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Catatan khusus kesepakatan, nomor faktur..."
                className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-[#1e2538]">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#141d33] font-mono text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] font-serif-luxury font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition cursor-pointer"
              >
                {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: CREATE NEW TENANT */}
      {isCreateModalOpen && (
        <Modal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Daftarkan Brand Sepatu Baru (Tenant)"
        >
          <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                  Nama Brand Toko *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Contoh: Atelier Footwear"
                  className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                  Domain / Slug Toko
                </label>
                <input
                  type="text"
                  value={createForm.domain}
                  onChange={e => setCreateForm({ ...createForm, domain: e.target.value })}
                  placeholder="atelierfootwear"
                  className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={createPlanId} className="block font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                  Paket Langganan
                </label>
                <select
                  id={createPlanId}
                  value={createForm.plan}
                  onChange={e => setCreateForm({ ...createForm, plan: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                >
                  <option value="Starter">Starter (Maks 2 Cabang)</option>
                  <option value="Pro">Pro (Maks 5 Cabang)</option>
                  <option value="Enterprise">Enterprise (Unlimited Cabang)</option>
                </select>
              </div>

              <div>
                <label htmlFor={createDurationId} className="block font-serif-luxury uppercase tracking-wider text-slate-300 mb-1.5 font-semibold">
                  Durasi Sewa Awal
                </label>
                <select
                  id={createDurationId}
                  value={createForm.duration_months}
                  onChange={e => setCreateForm({ ...createForm, duration_months: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                >
                  <option value={1}>1 Bulan</option>
                  <option value={3}>3 Bulan</option>
                  <option value={6}>6 Bulan</option>
                  <option value={12}>1 Tahun (12 Bulan)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-[#1e2538] pt-3">
              <p className="font-serif-luxury uppercase tracking-wider text-[#e5c483] font-bold mb-2">
                Kredensial Pemilik Toko (Admin Baru)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1 text-[11px]">Nama Pemilik *</label>
                  <input
                    type="text"
                    required
                    value={createForm.admin_name}
                    onChange={e => setCreateForm({ ...createForm, admin_name: e.target.value })}
                    placeholder="Nama lengkap pemilik"
                    className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1 text-[11px]">No. WhatsApp</label>
                  <input
                    type="text"
                    value={createForm.contact_phone}
                    onChange={e => setCreateForm({ ...createForm, contact_phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1 text-[11px]">Email Login *</label>
                  <input
                    type="email"
                    required
                    value={createForm.admin_email}
                    onChange={e => setCreateForm({ ...createForm, admin_email: e.target.value })}
                    placeholder="owner@toko.com"
                    className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1 text-[11px]">Kata Sandi Awal *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createForm.admin_password}
                    onChange={e => setCreateForm({ ...createForm, admin_password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2.5 border border-[#1e2538] rounded-xl bg-[#070b14] text-slate-100 font-mono outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-[#1e2538]">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#141d33] font-mono text-xs transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingCreate}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#dfba73] hover:brightness-110 text-[#070b14] font-serif-luxury font-bold text-xs uppercase tracking-wider disabled:opacity-50 transition cursor-pointer"
              >
                {savingCreate ? "Mendaftarkan..." : "Daftarkan Brand Sekarang"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
