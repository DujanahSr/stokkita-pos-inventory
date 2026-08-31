import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../api/axios";
import { 
  ShieldCheck, ShieldAlert, Activity, Filter, 
  Search, RefreshCcw, Eye, Clock, User, Globe 
} from "lucide-react";
import Modal from "../components/ui/Modal";

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total_events: 0, critical_events: 0, module_breakdown: [] });
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [searchAction, setSearchAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDetailLog, setSelectedDetailLog] = useState<any>(null);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      let url = `/audit?limit=100`;
      if (selectedModule !== "ALL") url += `&module=${selectedModule}`;
      if (searchAction) url += `&action=${searchAction}`;

      const [logsRes, statsRes] = await Promise.all([
        api.get(url),
        api.get("/audit/stats")
      ]);

      setLogs(logsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Gagal memuat log audit:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [selectedModule, searchAction]);

  const getModuleBadgeColor = (mod: string) => {
    switch (mod) {
      case "POS": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "SHIFT": return "bg-purple-50 text-purple-700 border-purple-200";
      case "INVENTORI": return "bg-amber-50 text-amber-700 border-amber-200";
      case "PRODUK": return "bg-blue-50 text-blue-700 border-blue-200";
      case "OMNICHANNEL": return "bg-rose-50 text-rose-700 border-rose-200";
      case "PO": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const isCriticalAction = (action: string) => {
    return action.includes("VARIANCE") || action.includes("DEFICIT") || action.includes("DELETE");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Audit Trail & Keamanan Sistem" />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={32} />
                Activity Audit Trail & Anti-Fraud Log
              </h1>
              <p className="text-slate-500 mt-1">Audit forensik menyeluruh mencatat setiap aksi krusial staf, kasir, dan integrasi omnichannel</p>
            </div>

            <button
              onClick={fetchAuditData}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <RefreshCcw size={14} /> Refresh Log
            </button>
          </div>

          {/* Security Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Activity size={22} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Total Security Events</div>
                <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.total_events} Event</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Aktivitas Kritis / Selisih</div>
                <div className="text-2xl font-bold text-red-600 mt-0.5">{stats.critical_events} Kasus</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Integritas Log Forensik</div>
                <div className="text-2xl font-bold text-emerald-700 mt-0.5">100% Immutable</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-emerald-500">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari aksi (misal: SHIFT, POS, OPNAME)..."
                value={searchAction}
                onChange={e => setSearchAction(e.target.value)}
                className="bg-transparent w-full text-xs font-medium outline-none text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <Filter size={16} className="text-slate-500 flex-shrink-0" />
              {["ALL", "POS", "SHIFT", "INVENTORI", "PRODUK", "OMNICHANNEL"].map(mod => (
                <button
                  key={mod}
                  onClick={() => setSelectedModule(mod)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedModule === mod 
                      ? "bg-slate-900 text-white shadow-sm" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {mod === "ALL" ? "Semua Modul" : mod}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5 pl-6">Waktu Kejadian</th>
                    <th className="p-3.5">Pelaksana / User</th>
                    <th className="p-3.5">Modul</th>
                    <th className="p-3.5">Aksi / Event</th>
                    <th className="p-3.5">IP Address</th>
                    <th className="p-3.5 text-center pr-6">Rincian Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">Memuat log audit forensik...</td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">Tidak ada log aktivitas yang cocok dengan filter.</td>
                    </tr>
                  ) : (
                    logs.map(log => {
                      const critical = isCriticalAction(log.action);
                      return (
                        <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${critical ? 'bg-red-50/30' : ''}`}>
                          <td className="p-3.5 pl-6 whitespace-nowrap text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-slate-400" />
                              <span>{new Date(log.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(log.created_at).toLocaleTimeString('id-ID')}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                                {log.user_name ? log.user_name[0].toUpperCase() : 'S'}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{log.user_name || "System Worker"}</div>
                                <div className="text-[10px] text-slate-400">{log.user_role || "Background Task"}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getModuleBadgeColor(log.module)}`}>
                              {log.module}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className={`font-mono font-bold text-xs ${critical ? 'text-red-700' : 'text-slate-800'}`}>
                              {log.action}
                            </span>
                          </td>

                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                            <div className="flex items-center gap-1">
                              <Globe size={12} className="text-slate-400" />
                              <span>{log.ip_address || "127.0.0.1"}</span>
                            </div>
                          </td>

                          <td className="p-3.5 pr-6 text-center">
                            <button
                              onClick={() => setSelectedDetailLog(log)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 mx-auto transition"
                            >
                              <Eye size={12} /> Detail
                            </button>
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
      </div>

      {/* MODAL DETAIL AUDIT LOG */}
      {selectedDetailLog && (
        <Modal open={!!selectedDetailLog} onClose={() => setSelectedDetailLog(null)} title="Rincian Audit Forensik Event">
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-slate-700 font-medium">
              <div className="flex justify-between"><span className="text-slate-400">Event ID:</span><span className="font-mono">{selectedDetailLog.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Modul:</span><span className="font-bold">{selectedDetailLog.module}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Aksi:</span><span className="font-bold font-mono text-emerald-700">{selectedDetailLog.action}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Waktu:</span><span>{new Date(selectedDetailLog.created_at).toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Eksekutor:</span><span>{selectedDetailLog.user_name || "System Worker"} ({selectedDetailLog.user_email || "N/A"})</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Payload / Snapshot Data (JSON):</label>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-60">
                {JSON.stringify(selectedDetailLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDetailLog(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
