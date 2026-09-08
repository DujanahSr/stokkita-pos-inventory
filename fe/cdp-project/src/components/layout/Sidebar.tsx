import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  BarChart3,
  LogOut,
  Store,
  Users as UsersIcon,
  Menu,
  X,
  Tag,
  ShieldCheck,
  Crown,
  Ticket,
  Settings as SettingsIcon,
} from "lucide-react";

const allNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", adminOnly: true },
  { to: "/produk", icon: Tag, label: "Katalog Produk", adminOnly: true },
  { to: "/inventori", icon: Package, label: "Inventori & Mutasi", adminOnly: true },
  { to: "/transaksi", icon: ArrowLeftRight, label: "Transaksi", adminOnly: false },
  { to: "/reorder", icon: ShoppingCart, label: "Purchase Order", adminOnly: true },
  { to: "/members", icon: Crown, label: "Pelanggan & Member", adminOnly: true },
  { to: "/vouchers", icon: Ticket, label: "Kupon Promo", adminOnly: true },
  { to: "/laporan", icon: BarChart3, label: "Laporan", adminOnly: true },
];

const adminItems = [
  { to: "/users", icon: UsersIcon, label: "User / Kasir" },
  { to: "/settings", icon: SettingsIcon, label: "Pengaturan Toko" },
  { to: "/audit", icon: ShieldCheck, label: "Audit Log & Keamanan" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    setLoggingOut(true);
    try {
      // Cek apakah ada shift kasir yang masih aktif/belum ditutup
      const res = await api.get("/shift/active");
      const activeShift = res.data?.active_shift;

      if (activeShift) {
        toast.warning(`Shift kasir di "${activeShift.warehouse_name}" masih aktif!`, {
          description: "Shift belum ditutup (Z-Report). Yakin ingin tetap keluar sekarang?",
          duration: 10000,
          action: {
            label: "Tetap Keluar",
            onClick: () => logout()
          },
          cancel: {
            label: "Batal / Tutup Shift",
            onClick: () => {
              navigate("/transaksi");
              toast.info(`Silakan tutup shift kasir di cabang "${activeShift.warehouse_name}"`);
            }
          }
        });
        setLoggingOut(false);
        return;
      }

      logout();
    } catch (e) {
      logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-600 shadow-sm transition hover:bg-slate-50"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div
        className={`fixed inset-0 z-30 bg-slate-900/30 transition-opacity lg:hidden ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-40 h-full w-60 transform flex flex-col bg-white border-r border-slate-200 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">StokKita</p>
              <p className="text-xs text-slate-500">Manajemen UMKM</p>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden rounded-md p-2 text-slate-500 hover:bg-slate-100"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto min-h-0">
          {allNavItems.filter(item => !item.adminOnly || user?.role?.toLowerCase() === 'admin').map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}

          {user?.role?.toLowerCase() === "admin" && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-0.5">
              {adminItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0 bg-white">
          {user?.impersonated_by && (
            <div className="mb-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-xs">
              <p className="font-bold flex items-center gap-1">
                <span>🛡️</span> Mode Bantuan Toko
              </p>
              <button
                type="button"
                onClick={() => {
                  const originalToken = localStorage.getItem("superadmin_original_token");
                  const originalUser = localStorage.getItem("superadmin_original_user");
                  if (originalToken && originalUser) {
                    localStorage.setItem("token", originalToken);
                    localStorage.setItem("umkm_user", originalUser);
                    localStorage.removeItem("superadmin_original_token");
                    localStorage.removeItem("superadmin_original_user");
                    api.defaults.headers.common.Authorization = `Bearer ${originalToken}`;
                    toast.success("Berhasil kembali ke Portal Superadmin!");
                    window.location.href = "/superadmin";
                  } else {
                    toast.info("Kembali ke login Superadmin...");
                    window.location.href = "/login";
                  }
                }}
                className="mt-1.5 w-full py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-xs cursor-pointer active:scale-95"
              >
                ← Kembali ke Superadmin
              </button>
            </div>
          )}

          {user?.role?.toLowerCase() === "superadmin" && (
            <NavLink
              to="/superadmin"
              className="mb-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-slate-900 text-emerald-400 font-bold text-xs hover:bg-slate-800 transition"
            >
              <ShieldCheck size={14} />
              <span>Portal Superadmin</span>
            </NavLink>
          )}

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-emerald-700">
                {user?.nama?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.nama}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogoutClick}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? "Memeriksa..." : "Keluar / Logout"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
