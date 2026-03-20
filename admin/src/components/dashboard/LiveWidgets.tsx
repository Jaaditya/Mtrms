import { Clock, Users, AlertTriangle, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface LiveWidgetsProps {
  runningOrders?: any[];
  lowStock?: any[];
  tableStatus?: any[];
}

const statusStyles: Record<string, string> = {
  Ready: "border-success text-success",
  Served: "border-info text-info",
  Preparing: "border-warning text-warning",
  Pending: "border-muted-foreground text-muted-foreground",
};

const tableColorMap: Record<string, string> = {
  available: "bg-success",
  occupied: "bg-primary",
  reserved: "bg-info",
  cleaning: "bg-cleaning",
};

export function LiveWidgets({ runningOrders = [], lowStock = [], tableStatus = [] }: LiveWidgetsProps) {
  return (
    <div className="space-y-4">
      {/* Running Orders */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Utensils className="h-4 w-4 text-primary" />
            Live Orders
          </h3>
          <Badge variant="secondary" className="text-[10px] uppercase tracking-tighter">{runningOrders.length} active</Badge>
        </div>
        <div className="space-y-2">
          {runningOrders.length === 0 ? (
            <p className="text-center py-4 text-xs text-muted-foreground italic">No active orders</p>
          ) : runningOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/50">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary">{order.id}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Table {order.table}</span>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge
                  variant="outline"
                  className={`text-[9px] h-4 uppercase px-1.5 ${statusStyles[order.status] || ""}`}
                >
                  {order.status}
                </Badge>
                <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />{order.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Stock Alerts
          </h3>
        </div>
        <div className="space-y-4">
          {lowStock.length === 0 ? (
            <p className="text-center py-4 text-xs text-muted-foreground italic">All items well stocked</p>
          ) : lowStock.map((item) => (
            <div key={item.name} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>{item.name}</span>
                <span className="text-destructive font-bold">{item.current_stock} {item.unit}</span>
              </div>
              <Progress value={(parseFloat(item.current_stock) / parseFloat(item.min_stock_level)) * 100} className="h-1" />
              <p className="text-[9px] text-muted-foreground italic text-right">Min: {item.min_stock_level} {item.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Tables */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-info" />
            Floor Status
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {['available', 'occupied', 'reserved', 'cleaning'].map((status) => {
            const stat = tableStatus.find(s => s.label === status);
            return (
              <div key={status} className="text-center p-2 rounded-lg bg-secondary/20 border border-border/50">
                <div className={`w-2 h-2 rounded-full mx-auto mb-1.5 ${tableColorMap[status]}`} />
                <p className="text-lg font-bold leading-none">{stat ? stat.count : 0}</p>
                <p className="text-[9px] text-muted-foreground uppercase mt-1 truncate">{status}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
