import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["hsl(36, 95%, 55%)", "hsl(152, 60%, 42%)", "hsl(210, 80%, 55%)", "hsl(280, 65%, 60%)"];

interface OrderTypeChartProps {
  data?: any[];
}

export function OrderTypeChart({ data = [] }: OrderTypeChartProps) {
  // Map data to include colors
  const chartData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  }));

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="glass-card p-5 h-full">
      <h3 className="text-sm font-semibold mb-1">Order Distribution</h3>
      <p className="text-xs text-muted-foreground mb-4">Breakdown by order type of today's volume</p>

      {chartData.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
          No order data today
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(230, 14%, 14%)",
                  border: "1px solid hsl(230, 10%, 22%)",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2 rounded-full h-2" style={{ background: entry.color }} />
                <span className="text-[10px] whitespace-nowrap text-muted-foreground lowercase">
                  {entry.name} ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
