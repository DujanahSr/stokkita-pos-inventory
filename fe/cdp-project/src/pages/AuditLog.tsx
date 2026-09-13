import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../api/axios";
import footwearLuxuryBg from "../assets/footwear_luxury_bg.jpg";
import { 
  ShieldCheck, ShieldAlert, Activity, Filter, 
  Search, RefreshCcw, Eye, Clock, Globe 
} from "lucide-react";
import Modal from "../components/ui/Modal";

const BTN_GOLD = "px-3 py-1.5 bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] text-[#070b14] font-serif-luxury font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-1.5";
const BTN_DARK = "px-3.5 py-2 bg-[#090e1c]/70 hover:bg-[#141d33] border border-[#c5a059]/30 text-slate-200 hover:text-[#e5c483] rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5";

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
      case "POS": return "bg-emerald-950/60 text-emerald-300 border-emerald-500/40";
      case "SHIFT": return "bg-purple-950/60 text-purple-300 border-purple-500/40";
      case "INVENTORI": return "bg-amber-950/60 text-amber-300 border-amber-500/40";
      case "PRODUK": return "bg-sky-950/60 text-sky-300 border-sky-500/40";
      case "OMNICHANNEL": return "bg-rose-950/60 text-rose-300 border-rose-500/40";
      case "PO": return "bg-indigo-950/60 text-indigo-300 border-indigo-500/40";
      default: return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const isCriticalAction = (action: string) => {
    return action.includes("VARIANCE") || action.includes("DEFICIT") || action.includes("DELETE");
  };

  return (
    <div className="flex min-h-screen bg-[#070b14] text-slate-100 font-sans-pos relative selection:bg-[#c5a059]/30 selection:text-[#f8fafc]">
      {/* Atelier Background & Vignette */}
      <div 
        className="fixed inset-0 bg-cover bg-center pointer-events-none opacity-100 z-0"
        style={{
          backgroundImage: `url(${footwearLuxuryBg})`,
          backgroundPosition: "center 20%",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat"
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: "radial-gradient(ellipse at 50% 35%, rgba(7, 11, 20, 0.12) 0%, rgba(7, 11, 20, 0.40) 65%, rgba(7, 11, 20, 0.72) 100%)"
        }}
      />

      <Sidebar />

      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col h-screen overflow-hidden relative z-10 border-l border-r border-[#1e2538]/70">
        <Navbar title="Audit Trail & Keamanan Sistem" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#e5c483] text-xs font-serif-luxury tracking-widest uppercase">
                <ShieldCheck size={16} /> Forensic Security Governance
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-slate-100 mt-1">
                Log Audit Aktivitas & Anti-Fraud
              </h1>
              <p className="text-slate-400 text-xs font-mono mt-1">
                Jejak forensik permanen mencatat setiap perubahan data, selisih rekonsiliasi kas, dan mutasi inventaris.
              </p>
            </div>

            <button
              onClick={fetchAuditData}
              className={BTN_DARK}
            >
              <RefreshCcw size={14} /> Refresh Log
            </button>
          </div>

          {/* Security Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3.5 transition">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <Activity size={20} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Security Events</div>
                <div className="text-2xl font-serif-luxury font-bold text-slate-100 mt-0.5">{stats.total_events} Event</div>
              </div>
            </div>

            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3.5 transition">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-400/40 flex items-center justify-center text-rose-300">
                <ShieldAlert size={20} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Aktivitas Kritis / Selisih</div>
                <div className="text-2xl font-serif-luxury font-bold text-rose-400 mt-0.5">{stats.critical_events} Kasus</div>
              </div>
            </div>

            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3.5 transition">
              <div className="w-11 h-11 rounded-2xl bg-[#c5a059]/15 border border-[#c5a059]/40 flex items-center justify-center text-[#e5c483]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Integritas Log Forensik</div>
                <div className="text-2xl font-serif-luxury font-bold text-[#e5c483] mt-0.5">100% Immutable</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 w-full sm:w-80 bg-[#060a14] border border-[#c5a059]/30 px-3 py-2 rounded-xl focus-within:border-[#c5a059] transition">
              <Search size={16} className="text-[#c5a059]" />
              <input
                type="text"
                placeholder="Cari aksi (misal: SHIFT, POS, OPNAME)..."
                value={searchAction}
                onChange={e => setSearchAction(e.target.value)}
                className="bg-transparent w-full text-xs font-mono outline-none text-slate-100 placeholder-slate-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <Filter size={14} className="text-[#c5a059] flex-shrink-0" />
              {["ALL", "POS", "SHIFT", "INVENTORI", "PRODUK", "OMNICHANNEL"].map(mod => (
                <button
                  key={mod}
                  onClick={() => setSelectedModule(mod)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ${
                    selectedModule === mod 
                      ? "bg-gradient-to-r from-[#c5a059] to-[#dfba73] text-[#070b14] font-bold shadow-md" 
                      : "bg-[#060a14] border border-[#c5a059]/30 text-slate-300 hover:text-[#e5c483]"
                  }`}
                >
                  {mod === "ALL" ? "Semua Modul" : mod}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="px-5 py-2.5 bg-[#040812]/50 border-b border-[#c5a059]/20 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Log Forensik Keamanan ({logs.length})</span>
              <span className="text-[10px] text-slate-500 xl:hidden flex items-center gap-1">
                ↔ Geser horizontal untuk rincian
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#03060e]/60 text-[#e5c483] border-b border-[#c5a059]/30 font-serif-luxury uppercase tracking-wider text-[10px]">
                    <th className="p-3.5 pl-6">Waktu Kejadian</th>
                    <th className="p-3.5">Pelaksana / Staf</th>
                    <th className="p-3.5">Modul</th>
                    <th className="p-3.5">Aksi / Event</th>
                    <th className="p-3.5">IP Address</th>
                    <th className="p-3.5 text-center pr-6">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c5a059]/10">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-mono text-xs">Memuat log forensik...</td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-mono text-xs">Tidak ada log aktivitas sesuai filter.</td>
                    </tr>
                  ) : (
                    logs.map(log => {
                      const critical = isCriticalAction(log.action);
                      return (
                        <tr key={log.id} className={`hover:bg-[#14203d]/40 transition text-slate-200 ${critical ? 'bg-rose-950/20' : ''}`}>
                          <td className="p-3.5 pl-6 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-[#c5a059]" />
                              <span>{new Date(log.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(log.created_at).toLocaleTimeString('id-ID')}
                              </span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/40 text-[#e5c483] flex items-center justify-center text-[10px] font-bold">
                                {log.user_name ? log.user_name[0].toUpperCase() : 'S'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-100">{log.user_name || "System Worker"}</div>
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
                            <span className={`font-mono font-bold text-xs ${critical ? 'text-rose-400' : 'text-[#e5c483]'}`}>
                              {log.action}
                            </span>
                          </td>

                          <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                            <div className="flex items-center gap-1">
                              <Globe size={11} className="text-slate-500" />
                              <span>{log.ip_address || "127.0.0.1"}</span>
                            </div>
                          </td>

                          <td className="p-3.5 pr-6 text-center">
                            <button
                              onClick={() => setSelectedDetailLog(log)}
                              className="px-2.5 py-1 bg-[#090e1c] hover:bg-[#141d33] border border-[#c5a059]/30 text-[#e5c483] rounded-lg text-[10px] font-mono flex items-center gap-1 mx-auto transition"
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
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-[#060a14] border border-[#c5a059]/30 rounded-2xl space-y-1.5 text-slate-300">
              <div className="flex justify-between"><span className="text-slate-500">Event ID:</span><span className="font-bold text-[#e5c483]">{selectedDetailLog.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Modul:</span><span className="font-bold">{selectedDetailLog.module}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Aksi:</span><span className="font-bold text-emerald-400">{selectedDetailLog.action}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Waktu:</span><span>{new Date(selectedDetailLog.created_at).toLocaleString('id-ID')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Eksekutor:</span><span>{selectedDetailLog.user_name || "System Worker"} ({selectedDetailLog.user_email || "N/A"})</span></div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#e5c483] uppercase tracking-wider mb-1">Payload / Snapshot Data (JSON):</label>
              <pre className="p-3 bg-[#03060e] border border-[#c5a059]/30 text-[#e5c483] rounded-2xl font-mono text-[11px] overflow-x-auto max-h-60">
                {JSON.stringify(selectedDetailLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDetailLog(null)}
                className={BTN_GOLD}
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
