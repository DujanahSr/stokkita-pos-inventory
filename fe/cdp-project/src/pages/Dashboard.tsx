/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import StatCard from "../components/ui/StatCard";
import SalesChart from "../components/charts/SalesChart";
import Badge from "../components/ui/Badge";
import api from "../api/axios";
import supabase from "../lib/supabaseClient";
import { TrendingUp, Package, ShoppingBag, AlertTriangle } from "lucide-react";

const fmt = (v: any) => "Rp " + new Intl.NumberFormat("id-ID").format(v);

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [periode, setPeriode] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");

    api.get(`/laporan?periode=${periode}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Gagal memuat dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard(true);

    // Setup Supabase Realtime
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaksi' }, (payload) => {
        console.log("Realtime: Transaksi berubah!", payload);
        loadDashboard(false); // Update tanpa spinner loading
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produk' }, (payload) => {
        console.log("Realtime: Produk berubah!", payload);
        loadDashboard(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [periode]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0">
        <Navbar title="Dashboard" />
        <main className="p-6 space-y-6">
          {/* Periode filter */}
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((p) => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  periode === p
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"
                }`}
              >
                {p} Hari
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          ) : data ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                <StatCard label="Omzet Penjualan" value={fmt(data.summary.totalPenjualan)} icon={TrendingUp} color="green" sub={`${periode} hari terakhir`} />
                <StatCard label="Laba Kotor" value={fmt(data.summary.totalLabaKotor)} icon={TrendingUp} color="emerald" sub="Omzet - HPP" />
                <StatCard label="Total Transaksi" value={data.summary.totalTransaksi} icon={ShoppingBag} color="green" sub={`${periode} hari terakhir`} />
                <StatCard label="Unit Terjual" value={data.summary.totalUnit} icon={Package} color="amber" sub={`${periode} hari terakhir`} />
                <StatCard label="Nilai Stok" value={fmt(data.summary.totalNilaiStok)} icon={Package} color="red" sub="Keseluruhan" />
              </div>

              {/* Chart + Top Produk */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">Penjualan per Hari</h3>
                  <SalesChart data={data.penjualanPerHari} />
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Produk</h3>
                  <div className="space-y-3">
                    {data.topProduk.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">Belum ada data</p>
                    )}
                    {data.topProduk.map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{p.produk_nama}</p>
                          <p className="text-xs text-slate-400">{p.qty} unit</p>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{fmt(p.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stok Kritis */}
              {data.stokKritis.length > 0 && (
                <div className="bg-white rounded-xl border border-amber-200 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Stok Kritis</h3>
                    <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {data.stokKritis.length} produk
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-100">
                          <th className="text-left pb-2">Produk</th>
                          <th className="text-left pb-2">Kategori</th>
                          <th className="text-right pb-2">Stok</th>
                          <th className="text-right pb-2">Safety Stock</th>
                          <th className="text-right pb-2">Kekurangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {data.stokKritis.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2 font-medium text-slate-700">{p.nama}</td>
                            <td className="py-2 text-slate-500">{p.kategori}</td>
                            <td className="py-2 text-right text-red-600 font-semibold">{p.stok}</td>
                            <td className="py-2 text-right text-slate-500">{p.safety_stock}</td>
                            <td className="py-2 text-right text-amber-600 font-semibold">{p.kekurangan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : !error ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
              Tidak ada data dashboard.
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}