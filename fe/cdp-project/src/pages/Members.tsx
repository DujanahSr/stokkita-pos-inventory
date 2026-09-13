import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Modal from "../components/ui/Modal";
import api from "../api/axios";
import footwearLuxuryBg from "../assets/footwear_luxury_bg.jpg";
import { 
  Users, Gift, Search, Plus, Phone, 
  Edit3, Trash2, Crown, Sparkles, TrendingUp, Download, Star 
} from "lucide-react";
import { toast } from "sonner";

const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

const INPUT_CLS = "w-full px-3 py-2 bg-[#060a14] border border-[#c5a059]/30 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-[#c5a059] outline-none transition";
const LABEL_CLS = "block text-[10px] font-mono text-[#e5c483] uppercase tracking-wider mb-1";
const BTN_GOLD = "px-3.5 py-2 bg-gradient-to-r from-[#c5a059] via-[#dfba73] to-[#c5a059] text-[#070b14] font-serif-luxury font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition shadow-lg shadow-[#c5a059]/20 flex items-center justify-center gap-1.5";
const BTN_DARK = "px-3.5 py-2 bg-[#090e1c]/70 hover:bg-[#141d33] border border-[#c5a059]/30 text-slate-200 hover:text-[#e5c483] rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5";

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    tier: "Silver"
  });
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/members?search=${encodeURIComponent(search)}`);
      setMembers(res.data || []);
    } catch (err: any) {
      console.error("Gagal memuat member:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setForm({ name: "", phone: "", email: "", tier: "Silver" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: any) => {
    setEditingMember(m);
    setForm({
      name: m.name,
      phone: m.phone,
      email: m.email || "",
      tier: m.tier || "Silver"
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingMember) {
        await api.put(`/members/${editingMember.id}`, form);
        toast.success(`Data member "${form.name}" berhasil diperbarui!`);
      } else {
        await api.post("/members", form);
        toast.success(`Member baru "${form.name}" berhasil didaftarkan!`);
      }
      setIsModalOpen(false);
      fetchMembers();
    } catch (err: any) {
      toast.error("Gagal menyimpan member: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    toast.error(`Hapus member "${name}"?`, {
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await api.delete(`/members/${id}`);
            toast.success(`Member "${name}" berhasil dihapus`);
            fetchMembers();
          } catch (err: any) {
            toast.error("Gagal menghapus member: " + (err.response?.data?.message || err.message));
          }
        }
      },
      cancel: { label: "Batal", onClick: () => {} }
    });
  };

  const handleExportExcel = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/members/export/excel", { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Database_Member_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Database member berhasil diekspor ke Excel!");
    } catch {
      toast.error("Gagal mengekspor data member");
    } finally {
      setDownloading(false);
    }
  };

  const totalPoints = members.reduce((sum, m) => sum + (Number(m.points) || 0), 0);
  const totalRevenue = members.reduce((sum, m) => sum + (Number(m.total_spent) || 0), 0);
  const platinumCount = members.filter(m => m.tier === "Platinum").length;

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
        <Navbar title="Pelanggan & Loyalty Rewards" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#e5c483] text-xs font-serif-luxury tracking-widest uppercase">
                <Crown size={16} /> Haute Footwear VIP Club
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-slate-100 mt-1">
                Kolega Member & Pelanggan VIP
              </h1>
              <p className="text-slate-400 text-xs font-mono mt-1">
                Sistem poin reward kasir, tingkatan loyalty tiering, dan rekam jejak belanja pelanggan (LTV).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={downloading}
                className={`${BTN_DARK} flex-1 sm:flex-initial`}
                title="Download Excel"
              >
                <Download size={14} className="text-[#e5c483]" />
                <span>{downloading ? "Mengunduh..." : "Ekspor Excel"}</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className={`${BTN_GOLD} flex-1 sm:flex-initial`}
              >
                <Plus size={15} /> Tambah Member
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 transition">
              <div className="w-12 h-12 rounded-2xl bg-[#c5a059]/15 border border-[#c5a059]/40 flex items-center justify-center text-[#e5c483]">
                <Users size={22} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Member Terdaftar</div>
                <div className="text-2xl font-serif-luxury font-bold text-slate-100 mt-0.5">{members.length} Kolega</div>
                <div className="text-[10px] font-mono text-[#e5c483] font-semibold mt-0.5 inline-flex items-center gap-1">
                  <span>{platinumCount} Member Platinum VIP</span>
                  <Star size={11} className="fill-[#e5c483] text-[#e5c483] shrink-0" />
                </div>
              </div>
            </div>

            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <Gift size={22} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Poin Beredar</div>
                <div className="text-2xl font-serif-luxury font-bold text-purple-200 mt-0.5">{new Intl.NumberFormat('id-ID').format(totalPoints)} Poin</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">Senilai {fmt(totalPoints * 100)} Diskon Kasir</div>
              </div>
            </div>

            <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 hover:border-[#c5a059]/60 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <TrendingUp size={22} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Omset Member (LTV)</div>
                <div className="text-2xl font-serif-luxury font-bold text-emerald-300 mt-0.5">{fmt(totalRevenue)}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">Kontribusi Penjualan Member</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.4)] flex items-center gap-3">
            <Search size={16} className="text-[#c5a059]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama kolega, nomor WhatsApp, atau email..."
              className="bg-transparent w-full text-xs font-mono text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          {/* Member Table */}
          <div className="bg-[#070c17]/30 backdrop-blur-xl border border-[#c5a059]/35 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="px-5 py-2.5 bg-[#040812]/50 border-b border-[#c5a059]/20 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Menampilkan <strong className="text-[#e5c483]">{members.length}</strong> Kolega Terdaftar</span>
              <span className="text-[10px] text-slate-500 xl:hidden flex items-center gap-1">
                ↔ Geser horizontal untuk data lengkap
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#03060e]/60 text-[#e5c483] border-b border-[#c5a059]/30 font-serif-luxury uppercase tracking-wider text-[10px]">
                    <th className="p-3.5 pl-6">Nama Kolega</th>
                    <th className="p-3.5">WhatsApp</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5 text-center">Tingkatan Tier</th>
                    <th className="p-3.5 text-center">Saldo Poin</th>
                    <th className="p-3.5 text-right">Total Belanja (LTV)</th>
                    <th className="p-3.5 text-center pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c5a059]/10">
                  {loading ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">Memuat database pelanggan...</td></tr>
                  ) : members.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">Belum ada pelanggan terdaftar.</td></tr>
                  ) : (
                    members.map(m => {
                      const isPlatinum = m.tier === "Platinum";
                      const isGold = m.tier === "Gold";
                      return (
                        <tr key={m.id} className="hover:bg-[#14203d]/40 transition text-slate-200">
                          <td className="p-3.5 pl-6 font-bold">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#c5a059]/20 border border-[#c5a059]/40 text-[#e5c483] flex items-center justify-center font-serif-luxury font-bold text-xs flex-shrink-0">
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate text-slate-100 font-serif-luxury text-sm">{m.name}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Phone size={12} className="text-[#c5a059] flex-shrink-0" />
                              <span>{m.phone}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-400">{m.email || "-"}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isPlatinum ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40' :
                              isGold ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {m.tier || "Silver"}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 bg-[#060a14] border border-[#c5a059]/30 rounded-xl whitespace-nowrap text-xs font-mono font-bold text-[#e5c483]">
                              <Star size={12} className="fill-[#e5c483] text-[#e5c483] shrink-0" />
                              <span>{new Intl.NumberFormat('id-ID').format(m.points || 0)} Poin</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-bold text-emerald-400">
                            {fmt(Number(m.total_spent) || 0)}
                          </td>
                          <td className="p-3.5 pr-6 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(m)}
                                className="p-1.5 text-slate-400 hover:text-[#e5c483] rounded-lg hover:bg-[#141d33] transition"
                                title="Edit Member"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(m.id, m.name)}
                                className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40 transition"
                                title="Hapus Member"
                              >
                                <Trash2 size={14} />
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
      </div>

      {/* MODAL TAMBAH / EDIT MEMBER */}
      {isModalOpen && (
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMember ? "Edit Profil Kolega" : "Registrasi Member Baru"}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className={LABEL_CLS}>Nama Lengkap Kolega *</label>
              <input type="text" required placeholder="Misal: Dujanah Siregar" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={INPUT_CLS} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Nomor WhatsApp *</label>
                <input type="text" required placeholder="081234567890" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={INPUT_CLS} />
              </div>

              <div>
                <label className={LABEL_CLS}>Tingkatan (Tier)</label>
                <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })} className={INPUT_CLS}>
                  <option value="Silver">Silver (Member Dasar)</option>
                  <option value="Gold">Gold (Prioritas)</option>
                  <option value="Platinum">Platinum (VIP Rewards)</option>
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL_CLS}>Alamat Email (Opsional)</label>
              <input type="email" placeholder="kolega@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={INPUT_CLS} />
            </div>

            <div className="p-3 bg-[#060a14] border border-[#c5a059]/30 rounded-xl space-y-1 text-xs font-mono">
              <div className="font-bold flex items-center gap-1.5 text-[#e5c483]">
                <Sparkles size={13} /> Konversi Poin Otomatis:
              </div>
              <p className="text-[11px] text-slate-400">
                Setiap transaksi Rp 10.000 di kasir menghasilkan 1 poin. Setiap 1 poin bernilai Rp 100 diskon langsung.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 ${BTN_DARK}`}>
                Batal
              </button>
              <button type="submit" disabled={saving} className={`flex-1 ${BTN_GOLD}`}>
                {saving ? "Menyimpan..." : "Simpan Profil"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
