import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, AlertTriangle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { InventoryDialog } from "@/components/dialogs/InventoryDialog";
import { PurchaseDialog } from "@/components/dialogs/PurchaseDialog";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ShoppingCart, Package, TrendingUp } from "lucide-react";

export default function Inventory() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseSearch, setPurchaseSearch] = useState("");

  const { data: rawMaterials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: () => api.get("/raw-materials").then((res) => res.data),
  });

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: () => api.get("/purchases").then((res) => res.data),
  });

  const filteredMaterials = rawMaterials.filter((m: any) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPurchases = purchases.filter((p: any) =>
    p.supplier_name.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
    p.raw_material?.name?.toLowerCase().includes(purchaseSearch.toLowerCase())
  );

  const lowStockCount = rawMaterials.filter((m: any) => Number(m.current_stock) < Number(m.min_stock_level)).length;
  const totalSpend = purchases.reduce((acc: number, p: any) => acc + Number(p.cost), 0);

  const handleAdd = () => { setEditingMaterial(null); setDialogOpen(true); };
  const handleEdit = (m: any) => { setEditingMaterial(m); setDialogOpen(true); };

  const isLoading = materialsLoading || purchasesLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Inventory</h1>
            <p className="text-sm text-muted-foreground">Track raw materials and purchases</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-background" onClick={() => setPurchaseDialogOpen(true)}>
              <ShoppingCart className="h-4 w-4" /> Record Purchase
            </Button>
            <Button size="sm" className="gap-2 gradient-primary text-primary-foreground border-0" onClick={handleAdd}>
              <Plus className="h-4 w-4" /> Add Material
            </Button>
          </div>
        </div>

        {/* Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Items</p>
              <h3 className="text-xl font-bold">{rawMaterials.length}</h3>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-l-warning">
            <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Low Stock</p>
              <h3 className="text-xl font-bold text-warning">{lowStockCount} Items</h3>
            </div>
          </div>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Inventory Cost</p>
              <h3 className="text-xl font-bold">Rs. {totalSpend.toLocaleString()}</h3>
            </div>
          </div>
        </div>

        <Tabs defaultValue="stock">
          <TabsList className="bg-secondary">
            <TabsTrigger value="stock">Stock Levels</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="mt-4">
            <div className="glass-card">
              <div className="p-4 border-b border-border">
                <div className="relative max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search materials..."
                    className="pl-8 h-8 text-sm bg-secondary/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              {materialsLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-xs">Material</TableHead>
                      <TableHead className="text-xs">Unit</TableHead>
                      <TableHead className="text-xs">Stock Level</TableHead>
                      <TableHead className="text-xs text-right">Current / Min</TableHead>
                      <TableHead className="text-xs text-center">Status</TableHead>
                      <TableHead className="text-xs text-right">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((m: any) => {
                      const stock = Number(m.current_stock);
                      const minStock = Number(m.min_stock_level);
                      const pct = minStock > 0 ? (stock / minStock) * 100 : 100;
                      const isLow = stock < minStock;
                      return (
                        <TableRow key={m.id} className="border-border cursor-pointer hover:bg-secondary/30" onClick={() => handleEdit(m)}>
                          <TableCell className="text-sm font-medium">
                            <div className="flex items-center gap-2">
                              {isLow && <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />}
                              {m.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{m.unit}</TableCell>
                          <TableCell className="w-40"><Progress value={Math.min(pct, 100)} className="h-2" /></TableCell>
                          <TableCell className="text-sm text-right font-mono">{m.current_stock} / {m.min_stock_level}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-xs ${isLow ? "border-warning text-warning" : "border-success text-success"}`}>
                              {isLow ? "Low Stock" : "Adequate"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground text-right">
                            {new Date(m.updated_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="purchases" className="mt-4">
            <div className="glass-card">
              <div className="p-4 border-b border-border">
                <div className="relative max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search purchases..."
                    className="pl-8 h-8 text-sm bg-secondary/50"
                    value={purchaseSearch}
                    onChange={(e) => setPurchaseSearch(e.target.value)}
                  />
                </div>
              </div>
              {purchasesLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-xs">Supplier</TableHead>
                      <TableHead className="text-xs">Item</TableHead>
                      <TableHead className="text-xs text-right">Qty</TableHead>
                      <TableHead className="text-xs text-right">Cost (Rs)</TableHead>
                      <TableHead className="text-xs text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((p: any) => (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="text-sm font-medium">{p.supplier_name}</TableCell>
                        <TableCell className="text-sm">{p.raw_material?.name || "Unknown"}</TableCell>
                        <TableCell className="text-sm text-right">{p.quantity} {p.raw_material?.unit}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{Number(p.cost).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground text-right">
                          {new Date(p.purchase_date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <InventoryDialog open={dialogOpen} onOpenChange={setDialogOpen} material={editingMaterial} />
      <PurchaseDialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen} />
    </AdminLayout>
  );
}
