import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Percent, Receipt, Tag, MoreHorizontal, Trash2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DiscountRuleDialog } from "@/components/dialogs/DiscountRuleDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function TaxAndDiscounts() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const queryClient = useQueryClient();

  // Settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["financial-settings"],
    queryFn: () => api.get("/financial-settings").then((res) => res.data),
  });

  const [vatRate, setVatRate] = useState("");
  const [taxType, setTaxType] = useState("");
  const [scEnabled, setScEnabled] = useState(false);
  const [scRate, setScRate] = useState("");

  useEffect(() => {
    if (settings) {
      setVatRate(String(parseFloat(settings.vat_rate)));
      setTaxType(settings.tax_type);
      setScEnabled(!!settings.is_service_charge_enabled);
      setScRate(String(parseFloat(settings.service_charge_rate)));
    }
  }, [settings]);

  // Discount Rules
  const { data: discountRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["discount-rules"],
    queryFn: () => api.get("/discount-rules").then((res) => res.data),
  });

  // Promo Codes
  const { data: promoCodes = [], isLoading: promosLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: () => api.get("/promo-codes").then((res) => res.data),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => api.put("/financial-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-settings"] });
      toast.success("Settings updated successfully");
    },
    onError: () => toast.error("Failed to update settings"),
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.put(`/discount-rules/${id}`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["discount-rules"] }),
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/discount-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-rules"] });
      toast.success("Rule deleted");
    },
  });

  // Promo Code Mutations
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("");

  const addPromoMutation = useMutation({
    mutationFn: (data: any) => api.post("/promo-codes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      setNewPromoCode("");
      setNewPromoDiscount("");
      toast.success("Promo code created");
    },
    onError: (error: any) => toast.error(error.response?.data?.message || "Failed to create promo"),
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/promo-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast.success("Promo code deleted");
    },
  });

  const handleCreatePromo = () => {
    if (!newPromoCode || !newPromoDiscount) {
      toast.error("Please fill all fields");
      return;
    }
    addPromoMutation.mutate({
      code: newPromoCode,
      discount_value: newPromoDiscount,
      type: "percentage",
      is_active: true
    });
  };

  const handleAddRule = () => { setEditingRule(null); setDialogOpen(true); };
  const handleEditRule = (r: any) => { setEditingRule(r); setDialogOpen(true); };

  const onSaveTax = () => updateSettingsMutation.mutate({ vat_rate: vatRate, tax_type: taxType });
  const onSaveSC = () => updateSettingsMutation.mutate({ is_service_charge_enabled: scEnabled, service_charge_rate: scRate });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Tax, Service Charge & Discounts</h1>
          <p className="text-sm text-muted-foreground">Configure financial settings for this restaurant</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="glass-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" /> Tax Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">VAT Rate (%)</Label>
                <Input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="h-8 bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Tax Type</Label>
                <Select value={taxType} onValueChange={setTaxType}>
                  <SelectTrigger className="h-8 bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inclusive">Inclusive</SelectItem>
                    <SelectItem value="exclusive">Exclusive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" className="w-full" onClick={onSaveTax} disabled={updateSettingsMutation.isPending}>
                {updateSettingsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                Save Tax Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-info" /> Service Charge
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Enable Service Charge</Label>
                <Switch checked={scEnabled} onCheckedChange={setScEnabled} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Percentage (%)</Label>
                <Input
                  type="number"
                  value={scRate}
                  onChange={(e) => setScRate(e.target.value)}
                  className="h-8 bg-secondary/50"
                />
              </div>
              <Button size="sm" className="w-full" onClick={onSaveSC} disabled={updateSettingsMutation.isPending}>
                {updateSettingsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                Save Service Charge
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-border h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4 text-success" /> Promo Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Promo Code</Label>
                <Input
                  placeholder="e.g. WELCOME20"
                  className="h-8 bg-secondary/50"
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Discount (%)</Label>
                <Input
                  type="number"
                  placeholder="20"
                  className="h-8 bg-secondary/50"
                  value={newPromoDiscount}
                  onChange={(e) => setNewPromoDiscount(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="w-full gradient-primary text-primary-foreground border-0"
                onClick={handleCreatePromo}
                disabled={addPromoMutation.isPending}
              >
                {addPromoMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                Create Promo
              </Button>

              <div className="mt-4 space-y-2">
                {promosLoading ? (
                  <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : promoCodes.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded bg-secondary/30 text-xs">
                    <div>
                      <span className="font-bold">{p.code}</span>
                      <span className="ml-2 text-muted-foreground">{parseFloat(p.discount_value)}%</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => deletePromoMutation.mutate(p.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="glass-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">Discount Rules</h3>
            <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={handleAddRule}><Plus className="h-3.5 w-3.5" /> Add Rule</Button>
          </div>
          <div className="p-4 space-y-3">
            {rulesLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : discountRules.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No discount rules configured.</div>
            ) : discountRules.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={d.is_active}
                    onCheckedChange={(v) => toggleRuleMutation.mutate({ id: d.id, is_active: v })}
                  />
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.conditions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{d.type}</Badge>
                  <Badge variant="secondary" className="text-xs font-mono">{parseFloat(d.value)}%</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditRule(d)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => deleteRuleMutation.mutate(d.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DiscountRuleDialog open={dialogOpen} onOpenChange={setDialogOpen} rule={editingRule} />
    </AdminLayout>
  );
}
