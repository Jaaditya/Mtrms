import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface FloorData {
    id?: number;
    name: string;
    order_index: number;
}

interface FloorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    floor?: FloorData | null;
}

const defaultValues: FloorData = {
    name: "",
    order_index: 0,
};

export function FloorDialog({ open, onOpenChange, floor }: FloorDialogProps) {
    const isEdit = !!floor?.id;
    const [form, setForm] = useState<FloorData>(defaultValues);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (floor) {
            setForm({
                name: floor.name || "",
                order_index: floor.order_index || 0,
            });
        } else {
            setForm(defaultValues);
        }
    }, [floor, open]);

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast.error("Floor name is required.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEdit) {
                await api.put(`/floors/${floor.id}`, form);
                toast.success("Floor updated successfully");
            } else {
                await api.post("/floors", form);
                toast.success("Floor added successfully");
            }
            queryClient.invalidateQueries({ queryKey: ["floors"] });
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save floor");
        } finally {
            setIsSubmitting(false);
        }
    };

    const update = (field: keyof FloorData, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Floor" : "Add Floor"}</DialogTitle>
                    <DialogDescription>{isEdit ? "Update floor name and order." : "Create a new floor to organize your tables."}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label className="text-xs">Floor Name *</Label>
                        <Input
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                            placeholder="e.g. Ground Floor"
                            className="h-9 bg-secondary/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs">Order Index</Label>
                        <Input
                            type="number"
                            value={form.order_index}
                            onChange={(e) => update("order_index", parseInt(e.target.value) || 0)}
                            placeholder="e.g. 1"
                            className="h-9 bg-secondary/50"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSubmitting} className="gradient-primary text-primary-foreground border-0">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? "Update" : "Add")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
