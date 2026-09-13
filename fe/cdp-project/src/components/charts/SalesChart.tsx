import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const fmt = (v: any) =>
  new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(Number(v) || 0);

const formatDate = (dateStr: any) => {
  if (!dateStr) return '';
  const d = new Date(String(dateStr));
  return d.toLocaleDateString("id-ID", { day: '2-digit', month: 'short' });
};

interface SalesChartProps {
  data?: any[];
  theme?: "dark" | "light";
}

export default function SalesChart({ data, theme = "dark" }: SalesChartProps) {
  const isDark = theme === "dark";

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isDark ? "#e5c483" : "#6366f1"} stopOpacity={isDark ? 0.35 : 0.2} />
            <stop offset="95%" stopColor={isDark ? "#c5a059" : "#6366f1"} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={isDark ? "#34d399" : "#10b981"} stopOpacity={isDark ? 0.3 : 0.2} />
            <stop offset="95%" stopColor={isDark ? "#10b981" : "#10b981"} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={isDark ? "rgba(197, 160, 89, 0.12)" : "#f1f5f9"} 
        />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#94a3b8" }} 
          tickFormatter={formatDate} 
          axisLine={{ stroke: isDark ? "rgba(197, 160, 89, 0.2)" : "#e2e8f0" }}
        />
        <YAxis 
          tick={{ fontSize: 11, fill: isDark ? "#94a3b8" : "#94a3b8" }} 
          tickFormatter={fmt} 
          width={55} 
          axisLine={{ stroke: isDark ? "rgba(197, 160, 89, 0.2)" : "#e2e8f0" }}
        />
        <Tooltip
          formatter={(v: any, name: any) => [
            "Rp " + new Intl.NumberFormat("id-ID").format(Number(v) || 0), 
            name === 'total' ? 'Omzet Penjualan' : 'Laba Kotor'
          ]}
          labelFormatter={(l: any) => "Tgl: " + (l ? new Date(String(l)).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' }) : '')}
          contentStyle={{ 
            borderRadius: 14, 
            border: isDark ? "1px solid rgba(197, 160, 89, 0.35)" : "1px solid #e2e8f0", 
            backgroundColor: isDark ? "rgba(7, 11, 20, 0.95)" : "#ffffff",
            color: isDark ? "#f8fafc" : "#1e293b",
            backdropFilter: "blur(12px)",
            boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.8)" : "0 4px 12px rgba(0,0,0,0.1)",
            fontSize: 12,
            fontFamily: "Plus Jakarta Sans, sans-serif"
          }}
          itemStyle={{ color: isDark ? "#e2e8f0" : "#1e293b", fontWeight: 500 }}
          labelStyle={{ color: isDark ? "#e5c483" : "#0f172a", fontWeight: "bold", marginBottom: 4 }}
        />
        <Area 
          type="monotone" 
          dataKey="total" 
          stroke={isDark ? "#e5c483" : "#6366f1"} 
          strokeWidth={2.5} 
          fill="url(#colorTotal)" 
          activeDot={{ r: 6, fill: isDark ? '#e5c483' : '#6366f1', stroke: '#070b14', strokeWidth: 2 }} 
          dot={{ stroke: isDark ? '#e5c483' : '#6366f1', strokeWidth: 2, r: 3, fill: isDark ? '#070b14' : '#fff' }} 
        />
        <Area 
          type="monotone" 
          dataKey="profit" 
          stroke={isDark ? "#34d399" : "#10b981"} 
          strokeWidth={2} 
          fill="url(#colorProfit)" 
          activeDot={{ r: 6, fill: isDark ? '#34d399' : '#10b981', stroke: '#070b14', strokeWidth: 2 }} 
          dot={{ stroke: isDark ? '#34d399' : '#10b981', strokeWidth: 2, r: 3, fill: isDark ? '#070b14' : '#fff' }} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}