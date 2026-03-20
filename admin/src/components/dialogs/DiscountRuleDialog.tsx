import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface DiscountRule {
  id?: number;
  name: string;
  type: string;
  value: string;
  conditions: string;
  is_active: boolean;
}

interface DiscountRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: any | null;
}

const defaultValues: DiscountRule = { name: "", type: "Bill Level", value: "", conditions: "", is_active: true };

export function DiscountRuleDialog({ open, onOpenChange, rule }: DiscountRuleDialogProps) {
  const isEdit = !!rule?.id;
  const [form, setForm] = useState<DiscountRule>(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (rule) {
      setForm({
        ...rule,
        value: String(parseFloat(rule.value)),
      });
    } else {
      setForm(defaultValues);
    }
  }, [rule, open]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.value) {
      toast.error("Name and discount value are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/discount-rules/${rule.id}`, form);
        toast.success("Rule updated successfully");
      } else {
        await api.post("/discount-rules", form);
        toast.success("Rule created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["discount-rules"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = <K extends keyof DiscountRule>(field: K, value: DiscountRule[K]) =>
    setForm((p) => ({ ...p, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Discount Rule" : "Add Discount Rule"}</DialogTitle>
          <DialogDescription>Configure discount rule settings.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Rule Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Happy Hour" className="h-9 bg-secondary/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger className="h-9 bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bill Level">Bill Level</SelectItem>
                  <SelectItem value="Item Level">Item Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Discount (%) *</Label>
              <Input value={form.value} onChange={(e) => update("value", e.target.value)} placeholder="15" className="h-9 bg-secondary/50 font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Conditions</Label>
            <Input value={form.conditions} onChange={(e) => update("conditions", e.target.value)} placeholder="e.g. 4PM - 6PM" className="h-9 bg-secondary/50" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Active</Label>
            <Switch checked={form.is_active} onCheckedChange={(v) => update("is_active", v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="gradient-primary text-primary-foreground border-0">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEdit ? "Update" : "Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
