import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import Modal from "../components/ui/Modal";
import api from "../api/axios";
import { 
  Users, Award, Gift, Search, Plus, Phone, 
  Mail, Edit3, Trash2, Crown, Sparkles, TrendingUp 
} from "lucide-react";

const fmt = (v: number) => "Rp " + new Intl.NumberFormat("id-ID").format(v || 0);

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
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
      console.error("Gagal memuat data member:", err);
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
      } else {
        await api.post("/members", form);
      }
      setIsModalOpen(false);
      fetchMembers();
      alert("Data member berhasil disimpan!");
    } catch (err: any) {
      alert("Gagal menyimpan member: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus member "${name}"?`)) {
      try {
        await api.delete(`/members/${id}`);
        fetchMembers();
      } catch (err: any) {
        alert("Gagal menghapus member: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const totalPoints = members.reduce((sum, m) => sum + (Number(m.points) || 0), 0);
  const totalRevenue = members.reduce((sum, m) => sum + (Number(m.total_spent) || 0), 0);
  const platinumCount = members.filter(m => m.tier === "Platinum").length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0 flex flex-col">
        <Navbar title="Pelanggan & Loyalty Rewards" />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <Crown className="text-amber-500" size={32} />
                Manajemen Member & Pelanggan
              </h1>
              <p className="text-slate-500 mt-1">Sistem Poin Belanja Kasir, Tingkatan Member (Tiering), & Retensi Pelanggan</p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Plus size={16} /> Tambah Member Baru
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase">Total Member Terdaftar</div>
                <div className="text-2xl font-bold text-slate-800">{members.length} Orang</div>
                <div className="text-[11px] text-amber-600 font-semibold mt-0.5">{platinumCount} Member Platinum ⭐</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Gift size={24} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase">Total Poin Beredar</div>
                <div className="text-2xl font-bold text-purple-700">{new Intl.NumberFormat('id-ID').format(totalPoints)} Poin</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Senilai {fmt(totalPoints * 100)} Diskon Kasir</div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase">Omset Member (LTV)</div>
                <div className="text-2xl font-bold text-emerald-700">{fmt(totalRevenue)}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Kontribusi Penjualan Member</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama pelanggan, nomor WhatsApp, atau email..."
              className="bg-transparent w-full text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>

          {/* Member Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5 pl-6">Nama Pelanggan</th>
                    <th className="p-3.5">Kontak WhatsApp</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5 text-center">Tingkatan (Tier)</th>
                    <th className="p-3.5 text-center">Saldo Poin</th>
                    <th className="p-3.5 text-right">Total Belanja (LTV)</th>
                    <th className="p-3.5 text-center pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {loading ? (
                    <tr><td colSpan={7} className="py-10 text-center text-slate-400">Memuat data pelanggan...</td></tr>
                  ) : members.length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-slate-400">Belum ada data pelanggan yang cocok.</td></tr>
                  ) : (
                    members.map(m => {
                      const tierColor = m.tier === "Platinum" ? "bg-purple-100 text-purple-800 border-purple-200" : m.tier === "Gold" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200";
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 pl-6 font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px]">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{m.name}</span>
                          </td>
                          <td className="p-3.5 text-slate-700 font-mono flex items-center gap-1.5 pt-4">
                            <Phone size={13} className="text-emerald-600" />
                            <span>{m.phone}</span>
                          </td>
                          <td className="p-3.5 text-slate-500">{m.email || "-"}</td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tierColor}`}>
                              {m.tier || "Silver"}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-purple-700">
                            <span className="px-2.5 py-1 bg-purple-50 rounded-lg">
                              ⭐ {new Intl.NumberFormat('id-ID').format(m.points || 0)} Poin
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-bold text-emerald-700">
                            {fmt(Number(m.total_spent) || 0)}
                          </td>
                          <td className="p-3.5 pr-6 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(m)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                title="Edit Member"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(m.id, m.name)}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                title="Hapus Member"
                              >
                                <Trash2 size={15} />
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
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMember ? "Edit Data Pelanggan" : "Registrasi Member Baru"}>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Pelanggan *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp *</label>
                <input
                  type="text"
                  required
                  placeholder="081234567890"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tingkatan (Tier)</label>
                <select
                  value={form.tier}
                  onChange={e => setForm({ ...form, tier: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none font-medium"
                >
                  <option value="Silver">Silver (Member Dasar)</option>
                  <option value="Gold">Gold (Prioritas)</option>
                  <option value="Platinum">Platinum (VIP Rewards)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Pelanggan (Opsional)</label>
              <input
                type="email"
                placeholder="budi@gmail.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles size={14} /> Aturan Poin Otomatis:
              </div>
              <p className="text-[11px] text-purple-800">
                Setiap transaksi Rp 10.000 di kasir menghasilkan 1 poin. Tiap 1 poin bernilai Rp 100 diskon tunai saat penukaran kasir.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
              >
                {saving ? "Menyimpan..." : "Simpan Member"}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
