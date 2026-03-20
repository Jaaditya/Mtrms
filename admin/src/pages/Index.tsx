import { AdminLayout } from "@/components/layout/AdminLayout";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { OrderTypeChart } from "@/components/dashboard/OrderTypeChart";
import { LiveWidgets } from "@/components/dashboard/LiveWidgets";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  Star,
  Users,
  Loader2
} from "lucide-react";

const Index = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/reports/dashboard").then((res) => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const kpi = stats?.kpi || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-sm text-muted-foreground">Real-time performance metrics for today</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full border border-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Live Updates Enabled
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            title="Today's Sales"
            value={`Rs ${kpi.today_sales?.toLocaleString()}`}
            change="+12.5%"
            changeType="positive"
            icon={DollarSign}
          />
          <KpiCard
            title="Total Orders"
            value={kpi.total_orders?.toString() || "0"}
            change="+8 this hour"
            changeType="positive"
            icon={ShoppingCart}
          />
          <KpiCard
            title="Avg Order Value"
            value={`Rs ${kpi.avg_order_value || "0"}`}
            change="+3.2%"
            changeType="positive"
            icon={TrendingUp}
          />
          <KpiCard
            title="Pending Orders"
            value={kpi.pending_orders?.toString() || "0"}
            change="Action required"
            changeType="neutral"
            icon={Clock}
          />
          <KpiCard
            title="Top Item"
            value={kpi.top_item || "N/A"}
            change="Best seller today"
            changeType="positive"
            icon={Star}
          />
          <KpiCard
            title="Total Staff"
            value={kpi.active_staff?.toString() || "0"}
            change="Active on shift"
            changeType="neutral"
            icon={Users}
          />
        </div>

        {/* Charts + Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <SalesChart data={stats?.hourly_sales} />
            <OrderTypeChart data={stats?.distribution} />
          </div>
          <LiveWidgets
            runningOrders={stats?.running_orders}
            lowStock={stats?.low_stock}
            tableStatus={stats?.table_status}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default Index;
