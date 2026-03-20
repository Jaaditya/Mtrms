import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Printer, ShoppingBag, CreditCard, Table as TableIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Banknote, CreditCard as CardIcon, Smartphone } from "lucide-react";

interface OrderDetailsDialogProps {
    order: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const statusStyles: Record<string, string> = {
    Pending: "bg-info/10 text-info border-info/20",
    Preparing: "bg-warning/10 text-warning border-warning/20",
    Ready: "bg-success/10 text-success border-success/20",
    Served: "bg-primary/10 text-primary border-primary/20",
    Completed: "bg-muted text-muted-foreground border-muted-foreground/20",
    Cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
    const queryClient = useQueryClient();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("Cash");

    const updateStatusMutation = useMutation({
        mutationFn: (newStatus: string) =>
            api.patch(`/orders/${order.id}`, { status: newStatus }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            toast.success("Order status updated successfully");
            setIsUpdating(false);
        },
        onError: () => {
            toast.error("Failed to update order status");
            setIsUpdating(false);
        }
    });

    const processPaymentMutation = useMutation({
        mutationFn: () =>
            api.post(`/orders/${order.id}/payments`, {
                method: paymentMethod,
                amount: order.total,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            toast.success(`Payment processed and order completed`);
            setIsPaying(false);
            onOpenChange(false); // Close dialog on success
        },
        onError: () => {
            toast.error("Failed to process payment");
            setIsPaying(false);
        }
    });

    if (!order) return null;

    const handleStatusChange = (newStatus: string) => {
        setIsUpdating(true);
        updateStatusMutation.mutate(newStatus);
    };

    const handlePayment = () => {
        setIsPaying(true);
        processPaymentMutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl glass-card border-border p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-secondary/30 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold flex items-center gap-3">
                                Order #{order.id}
                                <Select
                                    defaultValue={order.status}
                                    onValueChange={handleStatusChange}
                                    disabled={isUpdating}
                                >
                                    <SelectTrigger className={`h-7 px-2 text-[10px] uppercase tracking-wider font-bold border-none shadow-none ${statusStyles[order.status]}`}>
                                        <SelectValue placeholder="Status" />
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
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground font-medium">
                                Placed on {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 gap-2 bg-background/50" onClick={() => window.print()}>
                                <Printer className="h-3.5 w-3.5" />
                                Print
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                                <ShoppingBag className="h-3 w-3" /> Type
                            </span>
                            <p className="text-sm font-semibold">{order.type}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                                <TableIcon className="h-3 w-3" /> Table
                            </span>
                            <p className="text-sm font-semibold">{order.table?.table_number || "N/A"}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                                <TableIcon className="h-3 w-3" /> Floor
                            </span>
                            <p className="text-sm font-semibold">{order.table?.floor?.name || "N/A"}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                                <CreditCard className="h-3 w-3" /> Payment
                            </span>
                            <p className="text-sm font-semibold">
                                {order.payments?.[0]?.method || "Unpaid"}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total Items</span>
                            <p className="text-sm font-semibold">{order.items?.length || 0} Items</p>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Items Table */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Items</h3>
                        <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-secondary/30">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-bold text-xs">Item</th>
                                        <th className="text-center py-3 px-4 font-bold text-xs">Qty</th>
                                        <th className="text-right py-3 px-4 font-bold text-xs">Price</th>
                                        <th className="text-right py-3 px-4 font-bold text-xs">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {order.items?.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-secondary/10 transition-colors">
                                            <td className="py-3 px-4 font-medium">{item.menu_item?.name}</td>
                                            <td className="py-3 px-4 text-center">{item.quantity}</td>
                                            <td className="py-3 px-4 text-right font-mono">Rs. {parseFloat(item.unit_price).toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right font-bold">Rs. {(item.quantity * parseFloat(item.unit_price)).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    {/* Summary Section -- Corrected structure */}
                    <div className="flex justify-end">
                        <div className="w-full max-w-xs space-y-3 bg-secondary/20 p-4 rounded-2xl border border-border/50">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="font-mono">Rs. {parseFloat(order.subtotal).toLocaleString()}</span>
                            </div>

                            {parseFloat(order.service_charge) > 0 && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Service Charge ({parseFloat(order.tenant?.service_charge_rate || 10)}%)</span>
                                    <span className="font-mono">Rs. {parseFloat(order.service_charge).toLocaleString()}</span>
                                </div>
                            )}

                            {parseFloat(order.tax) > 0 && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Tax ({parseFloat(order.tenant?.vat_rate || 13)}%)</span>
                                    <span className="font-mono">Rs. {parseFloat(order.tax).toLocaleString()}</span>
                                </div>
                            )}

                            <Separator className="bg-border/50" />
                            <div className="flex justify-between text-lg font-bold text-primary">
                                <span>Total Amount</span>
                                <span>Rs. {parseFloat(order.total).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Process Payment Section */}
                    {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                        <>
                            <Separator className="bg-border/50" />
                            <div className="bg-secondary/10 p-5 rounded-xl border border-border mt-6">
                                <h3 className="text-sm font-bold mb-4">Process Payment</h3>
                                <div className="space-y-4">
                                    <RadioGroup
                                        defaultValue="Cash"
                                        value={paymentMethod}
                                        onValueChange={setPaymentMethod}
                                        className="grid grid-cols-3 gap-4"
                                    >
                                        <div>
                                            <RadioGroupItem value="Cash" id="pm-cash" className="peer sr-only" />
                                            <Label
                                                htmlFor="pm-cash"
                                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                            >
                                                <Banknote className="mb-2 h-6 w-6" />
                                                Cash
                                            </Label>
                                        </div>
                                        <div>
                                            <RadioGroupItem value="Card" id="pm-card" className="peer sr-only" />
                                            <Label
                                                htmlFor="pm-card"
                                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                            >
                                                <CardIcon className="mb-2 h-6 w-6" />
                                                Card
                                            </Label>
                                        </div>
                                        <div>
                                            <RadioGroupItem value="Digital Wallet" id="pm-wallet" className="peer sr-only" />
                                            <Label
                                                htmlFor="pm-wallet"
                                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                                            >
                                                <Smartphone className="mb-2 h-6 w-6" />
                                                Wallet
                                            </Label>
                                        </div>
                                    </RadioGroup>

                                    <Button
                                        className="w-full h-12 text-base font-bold"
                                        disabled={isPaying}
                                        onClick={handlePayment}
                                    >
                                        {isPaying ? "Processing..." : `Complete Order & Process Rs. ${parseFloat(order.total).toLocaleString()}`}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
