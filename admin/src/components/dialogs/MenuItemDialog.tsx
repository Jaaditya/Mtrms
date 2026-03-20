import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Flame, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface MenuItem {
  id?: number;
  category_id: string;
  name: string;
  nepali_name: string;
  description: string;
  price: string;
  is_available: boolean;
  dietary_tags: string[];
  spicy_level: number;
  preparation_station: string;
  image?: string;
  is_taxable: boolean;
  is_service_chargeable: boolean;
}

interface MenuItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: any | null;
}

const defaultValues: MenuItem = {
  name: "", nepali_name: "", description: "", category_id: "", price: "",
  dietary_tags: ["veg"], spicy_level: 0, preparation_station: "Kitchen", is_available: true,
  is_taxable: true, is_service_chargeable: true,
  image: "",
};

export function MenuItemDialog({ open, onOpenChange, item }: MenuItemDialogProps) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState<MenuItem>(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((res) => res.data),
    enabled: open,
  });

  const { data: settings } = useQuery({
    queryKey: ["financial-settings"],
    queryFn: () => api.get("/financial-settings").then((res) => res.data),
    enabled: open,
  });

  useEffect(() => {
    if (item) {
      setForm({
        ...item,
        category_id: item.category_id?.toString() || "",
        price: item.price?.toString() || "",
        dietary_tags: item.dietary_tags || ["veg"],
        is_taxable: item.is_taxable ?? true,
        is_service_chargeable: item.is_service_chargeable ?? true,
      });
    } else {
      setForm(defaultValues);
    }
  }, [item, open]);

  const calculateFinalPrice = () => {
    const base = parseFloat(form.price) || 0;
    if (base === 0 || !settings) return base;

    let total = base;
    let sc = 0;
    let tax = 0;

    if (form.is_service_chargeable && settings.is_service_charge_enabled) {
      sc = (base * settings.service_charge_rate) / 100;
    }

    const taxableBase = base + sc;

    if (form.is_taxable) {
      if (settings.tax_type === 'exclusive') {
        tax = (taxableBase * settings.vat_rate) / 100;
        total = taxableBase + tax;
      } else {
        // Inclusive: Price already contains tax, so total is just taxableBase
        total = taxableBase;
      }
    } else {
      total = taxableBase;
    }

    return total;
  };

  const finalPrice = calculateFinalPrice();

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.category_id) {
      toast.error("Name, Price and Category are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/menu-items/${item.id}`, form);
        toast.success("Item updated successfully");
      } else {
        await api.post("/menu-items", form);
        toast.success("Item created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = <K extends keyof MenuItem>(field: K, value: MenuItem[K]) =>
    setForm((p) => ({ ...p, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update item details below." : "Add a new item to the menu."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Item Name *</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Chicken Momo" className="h-9 bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Nepali Name</Label>
              <Input value={form.nepali_name} onChange={(e) => update("nepali_name", e.target.value)} placeholder="e.g. चिकन म:म:" className="h-9 bg-secondary/50" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Short description..." className="bg-secondary/50 resize-none h-16" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Image URL</Label>
            <Input value={form.image} onChange={(e) => update("image", e.target.value)} placeholder="https://example.com/item.jpg" className="h-9 bg-secondary/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Category *</Label>
              <Select value={form.category_id} onValueChange={(v) => update("category_id", v)}>
                <SelectTrigger className="h-9 bg-secondary/50"><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Base Price (Rs) *</Label>
              <div className="relative">
                <Input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="250" className="h-9 bg-secondary/50 font-mono pr-20" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold text-primary">
                  Final: {finalPrice.toFixed(2)}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                {settings?.tax_type === 'inclusive' ? "Tax inclusive price" : "Excludes dynamic VAT/SC"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex flex-col">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Apply Tax</Label>
                <span className="text-[9px] text-muted-foreground">{settings?.vat_rate}% VAT</span>
              </div>
              <Switch checked={form.is_taxable} onCheckedChange={(v) => update("is_taxable", v)} scale-75 />
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex flex-col">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Service Charge</Label>
                <span className="text-[9px] text-muted-foreground">{settings?.service_charge_rate}% SC</span>
              </div>
              <Switch checked={form.is_service_chargeable} onCheckedChange={(v) => update("is_service_chargeable", v)} scale-75 />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Station</Label>
              <Select value={form.preparation_station} onValueChange={(v) => update("preparation_station", v)}>
                <SelectTrigger className="h-9 bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Kitchen", "Bar", "Tandoor", "Bakery"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Dietary</Label>
              <Select value={form.dietary_tags[0]} onValueChange={(v) => update("dietary_tags", [v])}>
                <SelectTrigger className="h-9 bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="veg">Vegetarian</SelectItem>
                  <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Spicy Level</Label>
              <div className="flex items-center gap-1 pt-2">
                {[1, 2, 3, 4].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => update("spicy_level", form.spicy_level === level ? 0 : level)}
                    className="p-1 rounded hover:bg-secondary/50"
                  >
                    <Flame className={`h-5 w-5 ${level <= form.spicy_level ? "text-destructive" : "text-muted"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-4">
              <Label className="text-xs">Available</Label>
              <Switch checked={form.is_available} onCheckedChange={(v) => update("is_available", v)} />
            </div>
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
