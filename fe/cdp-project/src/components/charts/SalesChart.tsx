import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const fmt = (v) =>
  new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(v);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: '2-digit', month: 'short' });
};

export default function SalesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={formatDate} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={fmt} width={50} />
        <Tooltip
          formatter={(v, name) => ["Rp " + new Intl.NumberFormat("id-ID").format(v), name === 'total' ? 'Omzet' : 'Laba Kotor']}
          labelFormatter={(l) => "Tgl: " + (l ? new Date(l).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }) : '')}
          contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Area 
          type="monotone" 
          dataKey="total" 
          stroke="#6366f1" 
          strokeWidth={2} 
          fill="url(#colorTotal)" 
          activeDot={{ r: 6, fill: '#6366f1' }} 
          dot={{ stroke: '#6366f1', strokeWidth: 2, r: 3, fill: '#fff' }} 
        />
        <Area 
          type="monotone" 
          dataKey="profit" 
          stroke="#10b981" 
          strokeWidth={2} 
          fill="url(#colorProfit)" 
          activeDot={{ r: 6, fill: '#10b981' }} 
          dot={{ stroke: '#10b981', strokeWidth: 2, r: 3, fill: '#fff' }} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}