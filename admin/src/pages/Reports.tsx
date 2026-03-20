import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, FileSpreadsheet, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const chartStyle = {
  background: "hsl(230, 14%, 14%)",
  border: "1px solid hsl(230, 10%, 22%)",
  borderRadius: "8px",
  fontSize: 12,
};

export default function Reports() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: () => api.get("/reports/summary").then((res) => res.data),
  });

  const { data: salesData = [], isLoading: salesLoading } = useQuery({
    queryKey: ["reports-sales"],
    queryFn: () => api.get("/reports/sales").then((res) => res.data),
  });

  const { data: categoryData = [], isLoading: categoryLoading } = useQuery({
    queryKey: ["reports-categories"],
    queryFn: () => api.get("/reports/categories").then((res) => res.data),
  });

  const { data: staffData = [], isLoading: staffLoading } = useQuery({
    queryKey: ["reports-staff"],
    queryFn: () => api.get("/reports/staff").then((res) => res.data),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground">Detailed insights and exportable reports</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2 text-xs">
              <FileText className="h-3.5 w-3.5" /> Export PDF
            </Button>
            <Button size="sm" variant="outline" className="gap-2 text-xs">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Export Excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="glass-card p-4 animate-pulse h-24 bg-secondary/20" />
            ))
          ) : (
            <>
              <SummaryCard
                label="Weekly Revenue"
                value={`Rs ${summary?.weekly_revenue?.toLocaleString()}`}
                sub={summary?.revenue_change}
              />
              <SummaryCard
                label="Total Orders"
                value={summary?.total_orders?.toString()}
                sub={summary?.orders_change}
              />
              <SummaryCard
                label="Avg Order Value"
                value={`Rs ${summary?.avg_order_value}`}
                sub="+3%"
              />
              <SummaryCard
                label="Table Turnover"
                value={`${summary?.table_turnover}x`}
                sub="Per day average"
              />
            </>
          )}
        </div>

        <Tabs defaultValue="sales">
          <TabsList className="bg-secondary p-1">
            <TabsTrigger value="sales" className="text-xs">Sales</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">Categories</TabsTrigger>
            <TabsTrigger value="staff" className="text-xs">Staff Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Weekly Revenue & Orders
              </h3>
              {salesLoading ? (
                <div className="h-[300px] flex items-center justify-center"><Loader2 className="animate-spin" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 10%, 22%)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartStyle} cursor={{ fill: 'hsl(230, 10%, 22%)' }} />
                    <Bar dataKey="revenue" fill="hsl(36, 95%, 55%)" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-6">Category-wise Sales</h3>
              {categoryLoading ? (
                <div className="h-[300px] flex items-center justify-center"><Loader2 className="animate-spin" /></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 10%, 22%)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fill: "hsl(215, 12%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={chartStyle} />
                    <Bar dataKey="sales" fill="hsl(152, 60%, 42%)" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="staff" className="mt-4">
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold">Employee Performance</h3>
              </div>
              <div className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/30">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Staff member</th>
                      <th className="text-right py-3 px-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Orders</th>
                      <th className="text-right py-3 px-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {staffLoading ? (
                      <tr><td colSpan={3} className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
                    ) : staffData.map((s: any) => (
                      <tr key={s.name} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 font-medium">{s.name}</td>
                        <td className="py-3 px-4 text-right font-mono">{s.orders_count}</td>
                        <td className="py-3 px-4 text-right font-bold">Rs {parseFloat(s.total_sales).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const isPositive = sub?.startsWith('+');
  return (
    <div className="glass-card p-4 hover:border-primary/30 transition-colors">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold tracking-tight">{value}</p>
      {sub && (
        <p className={`text-[10px] mt-1 flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
          {sub}
        </p>
      )}
    </div>
  );
}
