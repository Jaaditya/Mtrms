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
import { Loader2 } from "lucide-react";

interface TableData {
  id?: number;
  table_number: string;
  capacity: string;
  shape: string;
  status: string;
  floor_id: string;
  order_index: string;
}

interface TableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: any | null;
}

const defaultValues: TableData = {
  table_number: "",
  capacity: "4",
  shape: "square",
  status: "available",
  floor_id: "",
  order_index: "0",
};

export function TableDialog({ open, onOpenChange, table }: TableDialogProps) {
  const isEdit = !!table?.id;
  const [form, setForm] = useState<TableData>(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: floors = [] } = useQuery({
    queryKey: ["floors"],
    queryFn: () => api.get("/floors").then((res) => res.data),
    enabled: open,
  });

  useEffect(() => {
    if (table) {
      setForm({
        ...table,
        table_number: table.table_number || "",
        capacity: String(table.capacity),
        floor_id: String(table.floor_id),
        order_index: String(table.order_index || 0),
      });
    } else {
      setForm({
        ...defaultValues,
        floor_id: floors.length > 0 ? String(floors[0].id) : "",
      });
    }
  }, [table, open, floors]);

  const handleSave = async () => {
    if (!form.table_number.trim() || !form.floor_id) {
      toast.error("Table number and floor are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        order_index: parseInt(form.order_index),
      };
      if (isEdit) {
        await api.put(`/tables/${table.id}`, payload);
        toast.success("Table updated successfully");
      } else {
        await api.post("/tables", payload);
        toast.success("Table added successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["floors"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save table");
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: keyof TableData, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Table" : "Add Table"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update table properties."
              : "Add a new table to the floor."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Table Number *</Label>
              <Input
                value={form.table_number}
                onChange={(e) => update("table_number", e.target.value)}
                placeholder="e.g. T-13"
                className="h-9 bg-secondary/50 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Display Order Index</Label>
              <Input
                type="number"
                value={form.order_index}
                onChange={(e) => update("order_index", e.target.value)}
                placeholder="0"
                className="h-9 bg-secondary/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Capacity (seats)</Label>
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                className="h-9 bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Shape</Label>
              <Select
                value={form.shape}
                onValueChange={(v) => update("shape", v)}
              >
                <SelectTrigger className="h-9 bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="round">Round</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Floor</Label>
              <Select
                value={form.floor_id}
                onValueChange={(v) => update("floor_id", v)}
              >
                <SelectTrigger className="h-9 bg-secondary/50">
                  <SelectValue placeholder="Select Floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v)}
              >
                <SelectTrigger className="h-9 bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
