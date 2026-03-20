import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SalesChartProps {
  data?: any[];
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold">Hourly Sales Trend</h3>
          <p className="text-xs text-muted-foreground">Today's revenue performance by hour</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data || []}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(36, 95%, 55%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(36, 95%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 10%, 22%)" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(230, 14%, 14%)",
              border: "1px solid hsl(230, 10%, 22%)",
              borderRadius: "8px",
              fontSize: 12,
            }}
          />
          <Area type="monotone" dataKey="sales" stroke="hsl(36, 95%, 55%)" fill="url(#salesGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
