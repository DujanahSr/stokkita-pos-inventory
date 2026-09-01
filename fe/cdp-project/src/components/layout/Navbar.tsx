import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, AlertTriangle, ShieldAlert, Zap, ShoppingCart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between pl-16 lg:pl-6 pr-6 sticky top-0 z-30 shadow-sm">
      <h1 className="text-base font-bold text-slate-800 tracking-tight">{title}</h1>

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
    </header>
  );
}