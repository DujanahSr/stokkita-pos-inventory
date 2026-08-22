export default function Badge({ status }) {
  const map = {
    Menunggu: "bg-amber-100 text-amber-700",
    Diterima: "bg-emerald-100 text-emerald-700",
    Dibatalkan: "bg-red-100 text-red-700",
    Penjualan: "bg-emerald-100 text-emerald-700",
    "PO Diterima": "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}