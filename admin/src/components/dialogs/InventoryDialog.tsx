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
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface Material {
  id?: number;
  name: string;
  unit: string;
  current_stock: string;
  min_stock_level: string;
}

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: any | null;
}

const defaultValues: Material = { name: "", unit: "kg", current_stock: "", min_stock_level: "" };

export function InventoryDialog({ open, onOpenChange, material }: InventoryDialogProps) {
  const isEdit = !!material?.id;
  const [form, setForm] = useState<Material>(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (material) {
      setForm({
        ...material,
        current_stock: String(material.current_stock),
        min_stock_level: String(material.min_stock_level),
      });
    } else {
      setForm(defaultValues);
    }
  }, [material, open]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.current_stock || !form.min_stock_level) {
      toast.error("Name, stock, and minimum stock are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/raw-materials/${material.id}`, form);
        toast.success("Material updated successfully");
      } else {
        await api.post("/raw-materials", form);
        toast.success("Material added successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save material");
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: keyof Material, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Material" : "Add Material"}</DialogTitle>
          <DialogDescription>Manage raw material details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Material Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Basmati Rice"
              className="h-9 bg-secondary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Unit</Label>
              <Select value={form.unit} onValueChange={(v) => update("unit", v)}>
                <SelectTrigger className="h-9 bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ltr">liter</SelectItem>
                  <SelectItem value="pcs">pieces</SelectItem>
                  <SelectItem value="gm">grams</SelectItem>
                  <SelectItem value="pkt">packet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Current Stock *</Label>
              <Input
                type="number"
                value={form.current_stock}
                onChange={(e) => update("current_stock", e.target.value)}
                placeholder="0"
                className="h-9 bg-secondary/50 font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Minimum Stock Level *</Label>
            <Input
              type="number"
              value={form.min_stock_level}
              onChange={(e) => update("min_stock_level", e.target.value)}
              placeholder="10"
              className="h-9 bg-secondary/50 font-mono"
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
