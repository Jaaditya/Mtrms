import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface Category {
  id?: number;
  name: string;
  nepali_name: string;
  order_index: number;
  is_active: boolean;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

const defaultValues: Category = { name: "", nepali_name: "", order_index: 0, is_active: true };

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const isEdit = !!category?.id;
  const [form, setForm] = useState<Category>(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (category) {
      setForm(category);
    } else {
      setForm(defaultValues);
    }
  }, [category, open]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/categories/${category!.id}`, form);
        toast.success("Category updated successfully");
      } else {
        await api.post("/categories", form);
        toast.success("Category created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>Manage menu category details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Category Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Appetizers"
              className="h-9 bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Nepali Name</Label>
            <Input
              value={form.nepali_name}
              onChange={(e) => setForm((p) => ({ ...p, nepali_name: e.target.value }))}
              placeholder="e.g. खाजा"
              className="h-9 bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Sort Order</Label>
            <Input
              type="number"
              value={form.order_index}
              onChange={(e) => setForm((p) => ({ ...p, order_index: parseInt(e.target.value) }))}
              className="h-9 bg-secondary/50"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Active</Label>
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
            />
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
