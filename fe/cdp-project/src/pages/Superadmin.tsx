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
  ExternalLink,
  Crown,
  Key,
  Calendar,
  Layers,
} from "lucide-react";
import Modal from "../components/ui/Modal";

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
  const statusFilterId = useId();
  const planFilterId = useId();
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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* TOP OWNER NAVIGATION BAR */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-900/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">StokKita SaaS Control</h1>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Platform Owner
              </span>
            </div>
            <p className="text-xs text-slate-400">Pusat Manajemen Penyewa UMKM Sepatu & Langganan</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600/60 transition shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-700">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400 border border-slate-600">
              {user?.nama?.[0]?.toUpperCase() || "O"}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white leading-tight">{user?.nama || "Platform Owner"}</p>
              <p className="text-[11px] text-slate-400">{user?.email || "owner@stokkita.id"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 transition"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* KPI METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: TOTAL TENANTS */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Penyewa UMKM</p>
                <p className="text-3xl font-black text-white mt-1">{metrics?.tenants.total || 0}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Building2 size={22} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-700/60">
              <span className="text-emerald-400 font-bold">{metrics?.tenants.active || 0} Aktif</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-400 font-bold">{metrics?.tenants.trial || 0} Trial</span>
              <span className="text-slate-500">•</span>
              <span className="text-red-400 font-bold">{metrics?.tenants.suspended || 0} Suspend</span>
            </div>
          </div>

          {/* CARD 2: ESTIMATED MRR */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimasi MRR (SaaS)</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  {formatRupiah(metrics?.financial.estimated_mrr || 0)}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <DollarSign size={22} />
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-1 border-t border-slate-700/60">
              Pendapatan sewa langganan bulanan
            </p>
          </div>

          {/* CARD 3: TOTAL GMV PLATFORM */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total GMV Seluruh Toko</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                  {formatRupiah(metrics?.financial.total_gmv || 0)}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <TrendingUp size={22} />
              </div>
            </div>
            <p className="text-xs text-slate-400 pt-1 border-t border-slate-700/60">
              Dari <strong className="text-slate-200">{metrics?.financial.total_transactions || 0}</strong> transaksi kasir
            </p>
          </div>

          {/* CARD 4: ECOSYSTEM SCALE */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Skala Ekosistem</p>
                <p className="text-3xl font-black text-purple-400 mt-1">{metrics?.ecosystem.total_users || 0}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Users size={22} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-700/60">
              <span>{metrics?.ecosystem.total_branches || 0} Cabang</span>
              <span className="text-slate-500">•</span>
              <span>{metrics?.ecosystem.total_products || 0} Produk</span>
            </div>
          </div>
        </div>

        {/* TENANT MANAGEMENT SECTION */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Section Header & Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Store size={18} className="text-emerald-400" />
                <span>Daftar Penyewa Toko Sepatu (Tenants)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Kelola paket langganan, masa aktif sewa, dan kuota cabang toko UMKM</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition"
              >
                <Plus size={15} />
                <span>+ Daftarkan Toko Baru</span>
              </button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="p-4 border-b border-slate-700/60 bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
              <label htmlFor={searchId} className="sr-only">Cari nama toko atau domain</label>
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                id={searchId}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama toko atau domain..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <label htmlFor={statusFilterId}>Status:</label>
                <select
                  id={statusFilterId}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <label htmlFor={planFilterId}>Paket:</label>
                <select
                  id={planFilterId}
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Semua Paket</option>
                  <option value="Starter">Starter (1-2 Cabang)</option>
                  <option value="Pro">Pro (Hingga 5 Cabang)</option>
                  <option value="Enterprise">Enterprise (Unlimited)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5 pl-5">Nama Toko & Domain</th>
                  <th className="p-3.5">Pemilik & Kontak</th>
                  <th className="p-3.5">Paket SaaS</th>
                  <th className="p-3.5">Status Sewa</th>
                  <th className="p-3.5">Masa Berlaku</th>
                  <th className="p-3.5">Cabang / Gudang</th>
                  <th className="p-3.5">Omzet Toko (GMV)</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      {loading ? "Memuat data penyewa..." : "Tidak ada tenant yang sesuai dengan filter."}
                    </td>
                  </tr>
                ) : (
                  tenants.map(t => {
                    const daysLeft = getRemainingDays(t.subscription_expires_at);
                    const isSuspended = t.subscription_status === "suspended";

                    return (
                      <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                        {/* 1. TOKO */}
                        <td className="p-3.5 pl-5">
                          <div className="font-bold text-white text-sm">{t.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <span>{t.domain}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-[10px] text-slate-500">Gabung {formatDate(t.created_at)}</span>
                          </div>
                        </td>

                        {/* 2. PEMILIK */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-200">{t.owner_info?.name || "Admin"}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Mail size={11} className="text-slate-500" />
                            <span>{t.owner_info?.email || "-"}</span>
                          </div>
                          {t.contact_phone && (
                            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                              <Phone size={11} />
                              <span>{t.contact_phone}</span>
                            </div>
                          )}
                        </td>

                        {/* 3. PAKET */}
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${
                            t.subscription_plan === "Enterprise"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                              : t.subscription_plan === "Pro"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          }`}>
                            <Crown size={12} />
                            <span>{t.subscription_plan}</span>
                          </span>
                        </td>

                        {/* 4. STATUS */}
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isSuspended
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : t.is_expired
                              ? "bg-slate-700 text-slate-400 border border-slate-600"
                              : t.subscription_status === "trial"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}>
                            {isSuspended ? (
                              <XCircle size={12} />
                            ) : t.is_expired ? (
                              <Clock size={12} />
                            ) : (
                              <CheckCircle2 size={12} />
                            )}
                            <span className="capitalize">{isSuspended ? "Suspended" : t.is_expired ? "Kedaluwarsa" : t.subscription_status}</span>
                          </span>
                        </td>

                        {/* 5. MASA BERLAKU */}
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-200">
                            {formatDate(t.subscription_expires_at)}
                          </div>
                          <div className={`text-[11px] font-bold mt-0.5 ${
                            daysLeft <= 0
                              ? "text-red-400"
                              : daysLeft <= 7
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}>
                            {daysLeft <= 0 ? "Sudah Habis" : `${daysLeft} hari lagi`}
                          </div>
                        </td>

                        {/* 6. CABANG */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-200">
                            {t.branch_count} <span className="text-slate-400 font-normal">/ {t.max_branches >= 999 ? "∞" : t.max_branches} Cabang</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {t.product_count} Produk • {t.user_count} User
                          </div>
                        </td>

                        {/* 7. GMV */}
                        <td className="p-3.5">
                          <div className="font-bold text-amber-300">
                            {formatRupiah(t.gmv)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {t.transaction_count} Transaksi
                          </div>
                        </td>

                        {/* 8. AKSI */}
                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Impersonate */}
                            <button
                              type="button"
                              onClick={() => handleImpersonate(t)}
                              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-emerald-600 text-slate-300 hover:text-white transition"
                              title="Masuk ke toko sebagai Admin (Impersonate)"
                            >
                              <LogIn size={14} />
                            </button>

                            {/* Tombol Edit Langganan */}
                            <button
                              type="button"
                              onClick={() => openEditModal(t)}
                              className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                              title="Edit Paket / Perpanjang Langganan"
                            >
                              <Edit size={14} />
                            </button>

                            {/* Tombol Toggle Suspend */}
                            <button
                              type="button"
                              onClick={() => handleToggleSuspend(t)}
                              className={`p-1.5 rounded-lg transition ${
                                isSuspended
                                  ? "bg-emerald-950/60 hover:bg-emerald-800 text-emerald-400"
                                  : "bg-red-950/60 hover:bg-red-800 text-red-400"
                              }`}
                              title={isSuspended ? "Aktifkan Toko" : "Suspend Toko (Kunci Akses)"}
                            >
                              <AlertTriangle size={14} />
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
                <label htmlFor={editPlanId} className="block font-bold text-slate-700 mb-1">Paket SaaS</label>
                <select
                  id={editPlanId}
                  value={editForm.subscription_plan}
                  onChange={e => setEditForm({ ...editForm, subscription_plan: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Starter">Starter (Rp 150rb/bln, max 2 cabang)</option>
                  <option value="Pro">Pro (Rp 350rb/bln, max 5 cabang)</option>
                  <option value="Enterprise">Enterprise (Rp 750rb/bln, unlimited cabang)</option>
                </select>
              </div>

              <div>
                <label htmlFor={editStatusId} className="block font-bold text-slate-700 mb-1">Status Akses</label>
                <select
                  id={editStatusId}
                  value={editForm.subscription_status}
                  onChange={e => setEditForm({ ...editForm, subscription_status: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Active (Akses Penuh)</option>
                  <option value="trial">Trial (Masa Percobaan)</option>
                  <option value="suspended">Suspended (Toko Diblokir)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={editExtendId} className="block font-bold text-slate-700 mb-1">Perpanjang Durasi Sewa</label>
                <select
                  id={editExtendId}
                  value={editForm.extend_months}
                  onChange={e => setEditForm({ ...editForm, extend_months: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={0}>Tidak Perpanjang (+0 Bulan)</option>
                  <option value={1}>+ 1 Bulan</option>
                  <option value={3}>+ 3 Bulan (Diskon Kuartal)</option>
                  <option value={6}>+ 6 Bulan (Diskon Semester)</option>
                  <option value={12}>+ 12 Bulan (1 Tahun Penuh)</option>
                </select>
              </div>

              <div>
                <label htmlFor={editBranchesId} className="block font-bold text-slate-700 mb-1">Batas Maksimal Cabang</label>
                <input
                  id={editBranchesId}
                  type="number"
                  value={editForm.max_branches}
                  onChange={e => setEditForm({ ...editForm, max_branches: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor={editPhoneId} className="block font-bold text-slate-700 mb-1">Nomor WhatsApp Pemilik</label>
              <input
                id={editPhoneId}
                type="text"
                value={editForm.contact_phone}
                onChange={e => setEditForm({ ...editForm, contact_phone: e.target.value })}
                placeholder="Contoh: 081234567890"
                className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor={editNotesId} className="block font-bold text-slate-700 mb-1">Catatan Internal Platform Owner</label>
              <textarea
                id={editNotesId}
                rows={2}
                value={editForm.notes}
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Catatan khusus, nomor invoice, dll..."
                className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
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
          title="Daftarkan Toko Sepatu Baru (Tenant)"
        >
          <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Toko UMKM *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Contoh: Sneaker Berkah"
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Domain / Slug (Opsional)</label>
                <input
                  type="text"
                  value={createForm.domain}
                  onChange={e => setCreateForm({ ...createForm, domain: e.target.value })}
                  placeholder="Contoh: sneakerberkah"
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={createPlanId} className="block font-bold text-slate-700 mb-1">Paket SaaS</label>
                <select
                  id={createPlanId}
                  value={createForm.plan}
                  onChange={e => setCreateForm({ ...createForm, plan: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Starter">Starter (Max 2 Cabang)</option>
                  <option value="Pro">Pro (Max 5 Cabang)</option>
                  <option value="Enterprise">Enterprise (Unlimited)</option>
                </select>
              </div>

              <div>
                <label htmlFor={createDurationId} className="block font-bold text-slate-700 mb-1">Durasi Sewa Awal</label>
                <select
                  id={createDurationId}
                  value={createForm.duration_months}
                  onChange={e => setCreateForm({ ...createForm, duration_months: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={1}>1 Bulan</option>
                  <option value={3}>3 Bulan</option>
                  <option value={6}>6 Bulan</option>
                  <option value={12}>1 Tahun (12 Bulan)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="font-bold text-slate-800 mb-2">Akun Pemilik Toko (Admin)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Pemilik *</label>
                  <input
                    type="text"
                    required
                    value={createForm.admin_name}
                    onChange={e => setCreateForm({ ...createForm, admin_name: e.target.value })}
                    placeholder="Nama lengkap pemilik"
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={createForm.contact_phone}
                    onChange={e => setCreateForm({ ...createForm, contact_phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Login *</label>
                  <input
                    type="email"
                    required
                    value={createForm.admin_email}
                    onChange={e => setCreateForm({ ...createForm, admin_email: e.target.value })}
                    placeholder="email@toko.com"
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password Awal *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createForm.admin_password}
                    onChange={e => setCreateForm({ ...createForm, admin_password: e.target.value })}
                    placeholder="Min. 6 karakter"
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingCreate}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
              >
                {savingCreate ? "Mendaftarkan..." : "Daftarkan Toko Sekarang"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
