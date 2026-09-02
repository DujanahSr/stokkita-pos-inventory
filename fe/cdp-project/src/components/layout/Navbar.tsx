import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, AlertTriangle, ShieldAlert, Zap, ShoppingCart, ArrowRight, KeyRound, User, Lock, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";
import { toast } from "sonner";

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleLogoutClick = async () => {
    try {
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
        return;
      }
      logout();
    } catch (e) {
      logout();
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error("Gagal mengambil notifikasi:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClickNotification = async (n: any) => {
    try {
      if (!n.is_read) {
        await api.put(`/notifications/${n.id}/read`);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
      }
      setIsOpen(false);
      if (n.link) {
        navigate(n.link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "STOCK_LOW_ROP":
        return <div className="p-2 bg-amber-100 text-amber-700 rounded-xl"><AlertTriangle size={16} /></div>;
      case "SHIFT_VARIANCE":
        return <div className="p-2 bg-red-100 text-red-700 rounded-xl"><ShieldAlert size={16} /></div>;
      case "OMNICHANNEL_SURGE":
        return <div className="p-2 bg-purple-100 text-purple-700 rounded-xl"><Zap size={16} /></div>;
      default:
        return <div className="p-2 bg-blue-100 text-blue-700 rounded-xl"><ShoppingCart size={16} /></div>;
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.old_password || !passwordForm.new_password) {
      toast.warning("Semua kolom password wajib diisi!");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.warning("Password baru minimal harus 6 karakter!");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Konfirmasi password baru tidak cocok!");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put("/auth/change-password", {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      });
      toast.success(res.data.message || "Password berhasil diubah!");
      setIsPasswordModalOpen(false);
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengubah password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between pl-16 lg:pl-6 pr-6 sticky top-0 z-30 shadow-sm">
      <h1 className="text-base font-bold text-slate-800 tracking-tight">{title}</h1>

      <div className="flex items-center gap-2.5">
        {/* User Profile Quick Tag & Change Password */}
        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition"
          title="Klik untuk ubah password akun Anda"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
            {user?.nama?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="hidden sm:inline font-bold">{user?.nama || 'Pengguna'}</span>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-medium">{user?.role || 'Kasir'}</span>
          <KeyRound size={13} className="text-slate-400" />
        </button>

        {/* Notification Center Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
            title="Pusat Notifikasi Real-Time"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-md">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pusat Notifikasi Alert</h3>
                  <p className="text-[11px] text-slate-500">{unreadCount} notifikasi belum dibaca</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    <CheckCheck size={14} /> Tandai Semua Dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada notifikasi sistem saat ini.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleClickNotification(n)}
                      className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition ${
                        !n.is_read ? 'bg-amber-50/40 font-semibold' : 'text-slate-600'
                      }`}
                    >
                      {getNotificationIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-1">
                          <div className="text-xs text-slate-800 leading-snug">{n.title}</div>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex justify-between items-center mt-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(n.created_at).toLocaleTimeString('id-ID')}
                          </span>
                          {n.link && (
                            <span className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5 font-bold">
                              Tindaki <ArrowRight size={10} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
                Sistem Otomatis Pemantauan ROP & Stok Kritis
              </div>
            </div>
          )}
        </div>

        {/* Quick Logout Button */}
        <button
          type="button"
          onClick={handleLogoutClick}
          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
          title="Keluar / Logout Akun"
        >
          <LogOut size={19} />
        </button>
      </div>

      {/* Modal Ganti Password Mandiri */}
      {isPasswordModalOpen && (
        <Modal open={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Ganti Password Akun">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <Lock className="text-emerald-600 flex-shrink-0" size={16} />
              <span>Ganti kata sandi akun <strong>{user?.email}</strong> untuk menjaga keamanan POS.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password Saat Ini (Lama)</label>
              <input
                type="password"
                required
                value={passwordForm.old_password}
                onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                placeholder="Masukkan password lama Anda..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password Baru (Minimal 6 Karakter)</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.new_password}
                onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                placeholder="Masukkan password baru..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ulangi Password Baru</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.confirm_password}
                onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                placeholder="Konfirmasi password baru..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
                }}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {savingPassword ? "Menyimpan..." : "Ubah Password"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </header>
  );
}