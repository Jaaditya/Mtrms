import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChefHat, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Kitchen() {
    const queryClient = useQueryClient();
    const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

    // Poll for new orders every 10 seconds
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["kitchen-orders"],
        queryFn: () => api.get("/orders", {
            params: {
                // Fetch statuses relevant to the kitchen
                status: "Pending,Preparing"
            }
        }).then((res) => setKitchenOrders(res.data)),
        refetchInterval: 10000,
    });

    const setKitchenOrders = (data: any[]) => {
        // Manually filter out orders that only have 'Ready', 'Served', or 'Cancelled' items
        return data.filter(order => {
            if (order.status === 'Ready' || order.status === 'Completed' || order.status === 'Cancelled' || order.status === 'Served') {
                return false;
            }
            return true;
        });
    };

    const updateItemStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            api.patch(`/order-items/${id}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
            setUpdatingItemId(null);
        },
        onError: () => {
            toast.error("Failed to update item status");
            setUpdatingItemId(null);
        }
    });

    const updateOrderStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            api.patch(`/orders/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
            toast.success("Order marked as Ready");
            setUpdatingOrderId(null);
        },
        onError: () => {
            toast.error("Failed to update order status");
            setUpdatingOrderId(null);
        }
    });

    const handleItemStatusChange = (id: number, newStatus: string) => {
        setUpdatingItemId(id);
        updateItemStatusMutation.mutate({ id, status: newStatus });
    };

    const handleOrderReady = (id: number) => {
        setUpdatingOrderId(id);
        updateOrderStatusMutation.mutate({ id, status: "Ready" });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <ChefHat className="h-6 w-6 text-primary" /> Kitchen Display System
                        </h1>
                        <p className="text-sm text-muted-foreground">Manage active orders and item preparation</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-3">
                        <ChefHat className="h-12 w-12 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-bold">No Active Orders</h3>
                        <p className="text-sm text-muted-foreground">The kitchen is clear. Waiting for new orders to arrive.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {orders.map((order: any) => (
                            <div key={order.id} className="glass-card p-0 overflow-hidden flex flex-col border-warning/20">
                                {/* Order Header */}
                                <div className={`p-4 border-b flex justify-between items-start ${order.type === 'Takeaway' ? 'bg-info/10' : order.type === 'Delivery' ? 'bg-primary/10' : 'bg-secondary/30'}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-lg">#{order.id}</span>
                                            <Badge variant="outline" className="text-[10px] uppercase">{order.type}</Badge>
                                        </div>
                                        <div className="text-sm font-medium">
                                            Table: <span className="text-primary">{order.table?.table_number || "N/A"}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground flex items-center justify-end gap-1 mb-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(order.created_at), "h:mm a")}
                                        </div>
                                        {order.status === 'Preparing' && (
                                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px] uppercase">
                                                Cooking
                                            </Badge>
                                        )}
                                        {order.status === 'Pending' && (
                                            <Badge variant="outline" className="bg-info/10 text-info border-info/20 text-[10px] uppercase">
                                                New
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-4 flex-1 space-y-3">
                                    {order.items?.map((item: any) => {
                                        if (item.status === 'Ready' || item.status === 'Served' || item.status === 'Cancelled') {
                                            return null; // Hide finished items in KDS
                                        }

                                        const isCooking = item.status === 'Preparing';

                                        return (
                                            <div key={item.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border/50 bg-background/50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="font-bold text-sm">{item.quantity}x </span>
                                                        <span className="text-sm font-medium">{item.menu_item?.name}</span>
                                                    </div>
                                                </div>
                                                {item.instructions && (
                                                    <p className="text-xs text-warning bg-warning/10 p-1.5 rounded border border-warning/20">
                                                        Note: {item.instructions}
                                                    </p>
                                                )}
                                                <div className="flex justify-end gap-2 mt-2">
                                                    {!isCooking ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs bg-warning/10 hover:bg-warning/20 text-warning border-warning/20"
                                                            disabled={updatingItemId === item.id}
                                                            onClick={() => handleItemStatusChange(item.id, 'Preparing')}
                                                        >
                                                            {updatingItemId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Start"}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-xs bg-success/10 hover:bg-success/20 text-success border-success/20"
                                                            disabled={updatingItemId === item.id}
                                                            onClick={() => handleItemStatusChange(item.id, 'Ready')}
                                                        >
                                                            {updatingItemId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                                                            Ready
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Order Footer - Mark All Ready */}
                                <div className="p-4 border-t border-border bg-secondary/10">
                                    <Button
                                        className="w-full"
                                        variant="default"
                                        disabled={updatingOrderId === order.id}
                                        onClick={() => handleOrderReady(order.id)}
                                    >
                                        {updatingOrderId === order.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                        Mark Order Ready
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
