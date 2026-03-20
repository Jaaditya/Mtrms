import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface PurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const defaultValues = {
    raw_material_id: "",
    supplier_name: "",
    quantity: "",
    cost: "",
    purchase_date: format(new Date(), "yyyy-MM-dd"),
};

export function PurchaseDialog({ open, onOpenChange }: PurchaseDialogProps) {
    const [form, setForm] = useState(defaultValues);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    const { data: materials = [] } = useQuery({
        queryKey: ["raw-materials"],
        queryFn: () => api.get("/raw-materials").then((res) => res.data),
        enabled: open,
    });

    useEffect(() => {
        if (open) setForm(defaultValues);
    }, [open]);

    const handleSave = async () => {
        if (!form.raw_material_id || !form.supplier_name || !form.quantity || !form.cost) {
            toast.error("All fields are required.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post("/purchases", form);
            toast.success("Purchase recorded successfully");
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
            queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to record purchase");
        } finally {
            setIsSubmitting(false);
        }
    };

    const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md glass-card border-border">
                <DialogHeader>
                    <DialogTitle>Record Purchase</DialogTitle>
                    <DialogDescription>Add a new purchase to update stock levels.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label className="text-xs">Material *</Label>
                        <Select value={form.raw_material_id} onValueChange={(v) => update("raw_material_id", v)}>
                            <SelectTrigger className="h-10 bg-secondary/50 border-border">
                                <SelectValue placeholder="Select a material" />
                            </SelectTrigger>
                            <SelectContent>
                                {materials.map((m: any) => (
                                    <SelectItem key={m.id} value={String(m.id)}>
                                        {m.name} ({m.unit})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs">Supplier Name *</Label>
                        <Input
                            value={form.supplier_name}
                            onChange={(e) => update("supplier_name", e.target.value)}
                            placeholder="e.g. ABC Wholesalers"
                            className="h-10 bg-secondary/50 border-border"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Quantity *</Label>
                            <Input
                                type="number"
                                value={form.quantity}
                                onChange={(e) => update("quantity", e.target.value)}
                                placeholder="0"
                                className="h-10 bg-secondary/50 border-border font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Total Cost (Rs) *</Label>
                            <Input
                                type="number"
                                value={form.cost}
                                onChange={(e) => update("cost", e.target.value)}
                                placeholder="0.00"
                                className="h-10 bg-secondary/50 border-border font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5">
                            <CalendarIcon className="h-3 w-3" /> Purchase Date *
                        </Label>
                        <Input
                            type="date"
                            value={form.purchase_date}
                            onChange={(e) => update("purchase_date", e.target.value)}
                            className="h-10 bg-secondary/50 border-border"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSubmitting} className="gradient-primary text-primary-foreground border-0">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Record Purchase"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
