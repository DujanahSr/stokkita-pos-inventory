/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import SalesChart from "../components/charts/SalesChart";
import Badge from "../components/ui/Badge";
import StatCard from "../components/ui/StatCard";
import api from "../api/axios";
import { TrendingUp, Package, ShoppingBag, Layers } from "lucide-react";

const fmt = (v) => "Rp " + new Intl.NumberFormat("id-ID").format(v);

export default function Laporan() {
  const [data, setData] = useState(null);
  const [periode, setPeriode] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type) => {
    setIsExporting(true);
    try {
      const response = await api.get(`/laporan/export/${type}?periode=${periode}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_${periode}_hari.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(`Gagal mengunduh laporan ${type.toUpperCase()}`);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError("");

    api.get(`/laporan?periode=${periode}`)
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || "Gagal memuat laporan"))
      .finally(() => setLoading(false));
  }, [periode]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 lg:ml-60 ml-0 min-w-0">
        <Navbar title="Laporan" />
        <main className="p-6 space-y-6">
          {/* Filter & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              {[7, 14, 30, 90].map((p) => (
                <button key={p} onClick={() => setPeriode(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    periode === p ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-300"
                  }`}>
                  {p} Hari
                </button>
              ))}
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('excel')}
                disabled={isExporting}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-semibold hover:bg-emerald-100 disabled:opacity-50 transition"
              >
                Export Excel (.xlsx)
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition"
              >
                {isExporting ? 'Memproses...' : 'Export PDF'}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-56 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
              Memuat laporan...
            </div>
          ) : data ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                {[
                  { label: "Omzet Penjualan", val: fmt(data.summary.totalPenjualan), icon: TrendingUp, color: "green", sub: "Berdasarkan filter" },
                  { label: "Laba Kotor (Profit)", val: fmt(data.summary.totalLabaKotor), icon: TrendingUp, color: "emerald", sub: "Omzet - HPP" },
                  { label: "Total Transaksi", val: data.summary.totalTransaksi, icon: ShoppingBag, color: "green", sub: "Berdasarkan filter" },
                  { label: "Unit Terjual", val: data.summary.totalUnit, icon: Package, color: "amber", sub: "Berdasarkan filter" },
                  { label: "Nilai Stok", val: fmt(data.summary.totalNilaiStok), icon: Layers, color: "red", sub: "Keseluruhan" },
                ].map(({ label, val, icon: Icon, color, sub }) => (
                  <StatCard key={label} label={label} value={val} icon={Icon} color={color} sub={sub} />
                ))}
              </div>

              {/* Chart */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Grafik Penjualan {periode} Hari</h3>
                <SalesChart data={data.penjualanPerHari} />
              </div>

              {/* Top produk */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Top 10 Produk Terlaris</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="text-left pb-2">#</th>
                        <th className="text-left pb-2">Produk</th>
                        <th className="text-right pb-2">Qty Terjual</th>
                        <th className="text-right pb-2">Total Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.topProduk.map((p, i) => (
                        <tr key={i}>
                          <td className="py-2 text-slate-400 font-bold text-xs">{i + 1}</td>
                          <td className="py-2 font-medium text-slate-700">{p.produk_nama}</td>
                          <td className="py-2 text-right text-slate-600">{p.qty}</td>
                          <td className="py-2 text-right font-semibold text-slate-800">{fmt(p.total)}</td>
                        </tr>
                      ))}
                      {data.topProduk.length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-slate-400">Belum ada data penjualan</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : !error ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
              Tidak ada data laporan.
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}