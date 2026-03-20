import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { OrderDetailsDialog } from "@/components/dialogs/OrderDetailsDialog";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  Pending: "border-info text-info bg-info/5",
  Preparing: "border-warning text-warning bg-warning/5",
  Ready: "border-success text-success bg-success/5",
  Served: "border-primary text-primary bg-primary/5",
  Completed: "border-muted-foreground text-muted-foreground bg-muted/5",
  Cancelled: "border-destructive text-destructive bg-destructive/5",
};

export default function Orders() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const today = format(new Date(), "yyyy-MM-dd");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", typeFilter, statusFilter, searchTerm, fromDate, toDate],
    queryFn: () => api.get("/orders", {
      params: {
        type: typeFilter,
        status: statusFilter,
        search: searchTerm,
        from_date: fromDate,
        to_date: toDate
      }
    }).then((res) => res.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated");
      setUpdatingOrderId(null);
    },
    onError: () => {
      toast.error("Update failed");
      setUpdatingOrderId(null);
    }
  });

  const handleStatusChange = (id: number, newStatus: string) => {
    setUpdatingOrderId(id);
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Order Monitoring</h1>
          <p className="text-sm text-muted-foreground">View and track all orders in real-time</p>
        </div>

        <div className="glass-card">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-8 h-8 text-sm bg-secondary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32 h-8 text-xs bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Dine-in">Dine-in</SelectItem>
                <SelectItem value="Takeaway">Takeaway</SelectItem>
                <SelectItem value="Delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8 text-xs bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Preparing">Preparing</SelectItem>
                <SelectItem value="Ready">Ready</SelectItem>
                <SelectItem value="Served">Served</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">From</span>
              <Input
                type="date"
                className="h-8 text-xs bg-secondary/50 w-36 px-2"
                value={fromDate}
                max={today}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span className="text-[10px] text-muted-foreground uppercase font-medium">To</span>
              <Input
                type="date"
                className="h-8 text-xs bg-secondary/50 w-36 px-2"
                value={toDate}
                max={today}
                onChange={(e) => setToDate(e.target.value)}
              />
              {(fromDate || toDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-[10px] text-primary hover:text-primary hover:bg-primary/10"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  All Time
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-xs">Order ID</TableHead>
                  <TableHead className="text-xs">Table</TableHead>
                  <TableHead className="text-xs">Floor</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs text-right">Items</TableHead>
                  <TableHead className="text-xs text-right">Total (Rs)</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Payment</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs w-10">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o: any) => (
                  <TableRow key={o.id} className="border-border group">
                    <TableCell className="text-sm font-mono text-primary truncate max-w-[100px]">#{o.id}</TableCell>
                    <TableCell className="text-sm">{o.table?.table_number || "-"}</TableCell>
                    <TableCell className="text-sm">{o.table?.floor?.name || "-"}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{o.type}</Badge></TableCell>
                    <TableCell className="text-sm text-right">{o.items?.length || 0}</TableCell>
                    <TableCell className="text-sm text-right font-bold">{parseFloat(o.total).toLocaleString()}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={o.status}
                        onValueChange={(val) => handleStatusChange(o.id, val)}
                        disabled={updatingOrderId === o.id}
                      >
                        <SelectTrigger className={`h-7 px-2 text-[10px] uppercase tracking-wider font-bold w-28 ${statusStyles[o.status] || ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Preparing">Preparing</SelectItem>
                          <SelectItem value="Ready">Ready</SelectItem>
                          <SelectItem value="Served">Served</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {o.payments?.length > 0 ? o.payments[0].method : "Pending"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(o.created_at), "h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setSelectedOrder(o);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                      No orders found matching filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <OrderDetailsDialog
        order={selectedOrder}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </AdminLayout>
  );
}
