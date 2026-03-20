import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Store } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RestaurantDialog } from "@/components/dialogs/RestaurantDialog";
import { restaurantApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Restaurants() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: restaurantApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: restaurantApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      toast({ title: "Restaurant Deleted" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete.",
        variant: "destructive"
      });
    }
  });

  const handleAdd = () => {
    setEditingRestaurant(null);
    setDialogOpen(true);
  };

  const handleEdit = (r: any) => {
    setEditingRestaurant(r);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this restaurant?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Restaurants</h1>
            <p className="text-sm text-muted-foreground">Manage all registered restaurants</p>
          </div>
          <Button size="sm" className="gap-2 gradient-primary text-primary-foreground border-0" onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Add Restaurant
          </Button>
        </div>

        <div className="glass-card">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search restaurants..." className="pl-8 h-8 text-sm bg-secondary/50" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-xs">Restaurant</TableHead>
                <TableHead className="text-xs">Address</TableHead>
                <TableHead className="text-xs">Plan</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Users</TableHead>
                <TableHead className="text-xs text-right">Orders</TableHead>
                <TableHead className="text-xs w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Loading restaurants...
                  </TableCell>
                </TableRow>
              ) : restaurants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No restaurants found.
                  </TableCell>
                </TableRow>
              ) : (
                restaurants.map((r: any) => (
                  <TableRow key={r.id} className="border-border">
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                          <Store className="h-4 w-4 text-primary" />
                        </div>
                        {r.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.address}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.plan}</Badge></TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs ${r.status === "Active" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}
                        variant="outline"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-right">{r.users_count || 0}</TableCell>
                    <TableCell className="text-sm text-right">{(r.orders_count || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(r)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/restaurants/${r.id}`)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(r.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <RestaurantDialog open={dialogOpen} onOpenChange={setDialogOpen} restaurant={editingRestaurant} />
    </AdminLayout>
  );
}
