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
import { toast } from "@/hooks/use-toast";
import { restaurantApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Restaurant {
  id?: number;
  name: string;
  address: string;
  contact: string;
  pan: string;
  plan: string;
  status: string;
}

interface RestaurantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant?: Restaurant | null;
}

const defaultValues: Restaurant = {
  name: "", address: "", contact: "", pan: "", plan: "Basic", status: "Active",
};

export function RestaurantDialog({ open, onOpenChange, restaurant }: RestaurantDialogProps) {
  const [form, setForm] = useState<Restaurant>(defaultValues);
  const isEdit = !!restaurant?.id;

  useEffect(() => {
    if (open) {
      setForm(restaurant || defaultValues);
    }
  }, [open, restaurant]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Restaurant) => {
      if (isEdit && data.id) return restaurantApi.update(data.id, data);
      return restaurantApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      toast({ title: isEdit ? "Restaurant Updated" : "Restaurant Created", description: `${form.name} has been saved.` });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong.",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!form.name.trim() || !form.address.trim()) {
      toast({ title: "Validation Error", description: "Name and address are required.", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  const update = (field: keyof Restaurant, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Restaurant" : "Add Restaurant"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update restaurant details below." : "Fill in the details to register a new restaurant."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Restaurant Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Kathmandu Kitchen" className="h-9 bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Address *</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="e.g. Thamel, Kathmandu" className="h-9 bg-secondary/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Contact Number</Label>
              <Input value={form.contact} onChange={(e) => update("contact", e.target.value)} placeholder="+977-..." className="h-9 bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">PAN / VAT No.</Label>
              <Input value={form.pan} onChange={(e) => update("pan", e.target.value)} placeholder="123456789" className="h-9 bg-secondary/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Subscription Plan</Label>
              <Select value={form.plan} onValueChange={(v) => update("plan", v)}>
                <SelectTrigger className="h-9 bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="h-9 bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancel</Button>
          <Button onClick={handleSave} className="gradient-primary text-primary-foreground border-0" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : (isEdit ? "Update" : "Create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
