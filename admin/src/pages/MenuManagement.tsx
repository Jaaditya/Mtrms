import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MoreHorizontal, Upload, Download, Flame, Leaf, Loader2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { MenuItemDialog } from "@/components/dialogs/MenuItemDialog";
import { CategoryDialog } from "@/components/dialogs/CategoryDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export default function MenuManagement() {
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get("/categories").then((res) => res.data),
  });

  const { data: menuItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: () => api.get("/menu-items").then((res) => res.data),
  });

  const handleAddItem = () => { setEditingItem(null); setItemDialogOpen(true); };
  const handleEditItem = (i: any) => { setEditingItem(i); setItemDialogOpen(true); };
  const handleAddCat = () => { setEditingCat(null); setCatDialogOpen(true); };
  const handleEditCat = (c: any) => { setEditingCat(c); setCatDialogOpen(true); };

  const handleToggleItem = async (item: any) => {
    try {
      await api.put(`/menu-items/${item.id}`, { is_available: !item.is_available });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success(`${item.name} is now ${!item.is_available ? "available" : "unavailable"}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/menu-items/${id}`);
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success("Item deleted");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleDuplicateItem = async (item: any) => {
    try {
      const { id, created_at, updated_at, category, variants, addons, ...rest } = item;
      const duplicatedItem = {
        ...rest,
        name: `${item.name} (Copy)`,
      };
      await api.post("/menu-items", duplicatedItem);
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      toast.success(`Duplicated ${item.name}`);
    } catch (error) {
      toast.error("Duplication failed");
    }
  };

  const handleToggleCategory = async (cat: any) => {
    try {
      await api.put(`/categories/${cat.id}`, { is_active: !cat.is_active });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(`${cat.name} updated`);
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category? This might affect items under it.")) return;
    try {
      await api.delete(`/categories/${id}`);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const filteredItems = menuItems.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nepali_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category_id.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const { data: settings } = useQuery({
    queryKey: ["financial-settings"],
    queryFn: () => api.get("/financial-settings").then((res) => res.data),
  });

  const getFinalPrice = (item: any) => {
    const base = parseFloat(item.price) || 0;
    if (!settings) return base;

    let sc = 0;
    let tax = 0;

    if (item.is_service_chargeable && settings.is_service_charge_enabled) {
      sc = (base * settings.service_charge_rate) / 100;
    }

    const taxableBase = base + sc;

    if (item.is_taxable) {
      if (settings.tax_type === 'exclusive') {
        tax = (taxableBase * settings.vat_rate) / 100;
        return taxableBase + tax;
      }
    }
    return taxableBase;
  };

  const isLoading = catsLoading || itemsLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Menu Management</h1>
            <p className="text-sm text-muted-foreground">Manage categories and menu items</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2 text-sm"><Upload className="h-3.5 w-3.5" /> Import</Button>
            <Button size="sm" variant="outline" className="gap-2 text-sm"><Download className="h-3.5 w-3.5" /> Export</Button>
            <Button size="sm" className="gap-2 gradient-primary text-primary-foreground border-0" onClick={handleAddItem}>
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>
        </div>

        <Tabs defaultValue="items">
          <TabsList className="bg-secondary">
            <TabsTrigger value="items">Menu Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-4">
            <div className="glass-card">
              <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-1 max-w-sm w-full">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search menu items..."
                    className="pl-8 h-8 text-sm bg-secondary/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Category:</span>
                  <select
                    className="h-8 text-xs bg-secondary/50 border border-border rounded-md px-2 outline-none"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id.toString()}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {itemsLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-xs">Item</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Price (Base)</TableHead>
                      <TableHead className="text-xs">Final Price</TableHead>
                      <TableHead className="text-xs text-center">Tax/SC</TableHead>
                      <TableHead className="text-xs text-center">Available</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item: any) => (
                      <TableRow key={item.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.dietary_tags?.includes("veg") ? (
                              <Leaf className="h-3.5 w-3.5 text-success shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 border border-destructive rounded-sm flex items-center justify-center shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{item.name}</span>
                              {item.nepali_name && <span className="text-[10px] text-muted-foreground font-light">{item.nepali_name}</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.category?.name || "Uncategorized"}</TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">Rs {item.price}</TableCell>
                        <TableCell className="text-sm font-bold font-mono">
                          Rs {getFinalPrice(item).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {item.is_taxable ? (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-success/10 text-success border-success/20">VAT</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 opacity-50">VAT</Badge>
                            )}
                            {item.is_service_chargeable ? (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-info/10 text-info border-info/20">SC</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 opacity-50">SC</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={item.is_available}
                            onCheckedChange={() => handleToggleItem(item)}
                            className="mx-auto scale-75"
                          />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditItem(item)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateItem(item)}>Duplicate</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <div className="glass-card">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{categories.length} categories</span>
                <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={handleAddCat}><Plus className="h-3.5 w-3.5" /> Add Category</Button>
              </div>
              {catsLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Nepali Name</TableHead>
                      <TableHead className="text-xs text-right">Items</TableHead>
                      <TableHead className="text-xs text-center">Active</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((c: any) => (
                      <TableRow key={c.id} className="border-border">
                        <TableCell className="text-sm font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.nepali_name}</TableCell>
                        <TableCell className="text-sm text-right">{c.menu_items_count || 0}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={c.is_active}
                            onCheckedChange={() => handleToggleCategory(c)}
                            className="mx-auto scale-75"
                          />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCat(c)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(c.id)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      <MenuItemDialog open={itemDialogOpen} onOpenChange={setItemDialogOpen} item={editingItem} />
      <CategoryDialog open={catDialogOpen} onOpenChange={setCatDialogOpen} category={editingCat} />
    </AdminLayout>
  );
}
