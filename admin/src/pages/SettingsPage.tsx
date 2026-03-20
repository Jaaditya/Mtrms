import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Printer, FileText, Palette, Loader2, Save } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-settings"],
    queryFn: () => api.get("/settings").then((res) => res.data),
  });

  useEffect(() => {
    if (tenant) {
      setFormData(tenant);
    }
  }, [tenant]);

  const updateSettings = useMutation({
    mutationFn: (data: any) => api.put("/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
      toast.success("Settings updated successfully");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const handleSave = () => {
    updateSettings.mutate(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Configure restaurant preferences</p>
          </div>
          <Button
            size="sm"
            className="gap-2"
            onClick={handleSave}
            disabled={updateSettings.isPending}
          >
            {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All Changes
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="bg-secondary p-1">
            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
            <TabsTrigger value="invoice" className="text-xs">Invoice</TabsTrigger>
            <TabsTrigger value="printer" className="text-xs">Printer</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="glass-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Regional Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Currency</Label>
                    <Select
                      value={formData.currency || "npr"}
                      onValueChange={(v) => updateField("currency", v)}
                    >
                      <SelectTrigger className="h-8 bg-secondary/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="npr">NPR (Rs)</SelectItem>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="inr">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Timezone</Label>
                    <Select
                      value={formData.timezone || "npt"}
                      onValueChange={(v) => updateField("timezone", v)}
                    >
                      <SelectTrigger className="h-8 bg-secondary/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="npt">Asia/Kathmandu (NPT +5:45)</SelectItem>
                        <SelectItem value="ist">Asia/Kolkata (IST +5:30)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Palette className="h-4 w-4 text-info" /> Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs cursor-pointer" htmlFor="auto-print">Auto-print KOT</Label>
                    <Switch
                      id="auto-print"
                      checked={!!formData.auto_print_kot}
                      onCheckedChange={(c) => updateField("auto_print_kot", c)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs cursor-pointer" htmlFor="sound">Sound notifications</Label>
                    <Switch
                      id="sound"
                      checked={!!formData.sound_notifications}
                      onCheckedChange={(c) => updateField("sound_notifications", c)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs cursor-pointer" htmlFor="compact">Compact table view</Label>
                    <Switch
                      id="compact"
                      checked={!!formData.compact_table_view}
                      onCheckedChange={(c) => updateField("compact_table_view", c)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invoice" className="mt-4">
            <Card className="glass-card border-border max-w-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Invoice Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Bill Prefix</Label>
                  <Input
                    value={formData.bill_prefix || ""}
                    onChange={(e) => updateField("bill_prefix", e.target.value)}
                    className="h-8 bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Footer Note</Label>
                  <Textarea
                    value={formData.footer_note || ""}
                    onChange={(e) => updateField("footer_note", e.target.value)}
                    className="bg-secondary/50 text-sm"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">PAN Number</Label>
                    <Input
                      value={formData.pan || ""}
                      onChange={(e) => updateField("pan", e.target.value)}
                      className="h-8 bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">VAT Number</Label>
                    <Input
                      value={formData.vat_no || ""}
                      onChange={(e) => updateField("vat_no", e.target.value)}
                      className="h-8 bg-secondary/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Restaurant Address</Label>
                  <Input
                    value={formData.address || ""}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="h-8 bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Contact Number</Label>
                  <Input
                    value={formData.contact || ""}
                    onChange={(e) => updateField("contact", e.target.value)}
                    className="h-8 bg-secondary/50"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="printer" className="mt-4">
            <Card className="glass-card border-border max-w-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Printer className="h-4 w-4 text-warning" /> Printer Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">KOT Printer IP/Name</Label>
                  <Input
                    value={formData.kot_printer || ""}
                    onChange={(e) => updateField("kot_printer", e.target.value)}
                    placeholder="e.g. 192.168.1.10"
                    className="h-8 bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Bill Printer IP/Name</Label>
                  <Input
                    value={formData.bill_printer || ""}
                    onChange={(e) => updateField("bill_printer", e.target.value)}
                    placeholder="e.g. 192.168.1.12"
                    className="h-8 bg-secondary/50"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
