import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, MoreHorizontal, Shield, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { UserDialog } from "@/components/dialogs/UserDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  admin: "text-primary border-primary/30",
  waiter: "text-info border-info/30",
  kitchen: "text-warning border-warning/30",
  cashier: "text-success border-success/30",
};

export default function UsersRoles() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then((res) => res.data),
  });

  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: () => api.get("/role-permissions").then((res) => res.data),
  });

  const mutation = useMutation({
    mutationFn: (updatedPermission: any) =>
      api.put(`/role-permissions/${updatedPermission.id}`, updatedPermission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success("Permission updated");
    },
    onError: () => {
      toast.error("Failed to update permission");
    }
  });

  const handleToggle = (permission: any, role: string, checked: boolean) => {
    mutation.mutate({
      ...permission,
      [role]: checked
    });
  };

  const handleAdd = () => { setEditingUser(null); setDialogOpen(true); };
  const handleEdit = (u: any) => { setEditingUser(u); setDialogOpen(true); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Users & Roles</h1>
            <p className="text-sm text-muted-foreground">Manage staff accounts and permissions</p>
          </div>
          <Button size="sm" className="gap-2 gradient-primary text-primary-foreground border-0" onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Add User
          </Button>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="bg-secondary">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Role Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <div className="glass-card">
              <div className="p-4 border-b border-border">
                <div className="relative max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-8 h-8 text-sm bg-secondary/50" />
                </div>
              </div>
              {usersLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: any) => (
                      <TableRow key={u.id} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-secondary text-xs">{u.name?.split(" ").map((n: any) => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs capitalize ${roleColors[u.role] || ""}`}>{u.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="text-xs bg-success/10 text-success border-success/20" variant="outline">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(u)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
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

          <TabsContent value="roles" className="mt-4">
            <div className="glass-card">
              <div className="p-4 border-b border-border flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">RBAC Permissions Matrix</h3>
              </div>
              {permissionsLoading ? (
                <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-xs">Module</TableHead>
                      <TableHead className="text-xs text-center">Admin</TableHead>
                      <TableHead className="text-xs text-center">Waiter</TableHead>
                      <TableHead className="text-xs text-center">Kitchen</TableHead>
                      <TableHead className="text-xs text-center">Cashier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((p: any) => (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="text-sm font-medium">{p.module}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={p.admin}
                            onCheckedChange={(checked) => handleToggle(p, 'admin', checked)}
                            className="mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={p.waiter}
                            onCheckedChange={(checked) => handleToggle(p, 'waiter', checked)}
                            className="mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={p.kitchen}
                            onCheckedChange={(checked) => handleToggle(p, 'kitchen', checked)}
                            className="mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={p.cashier}
                            onCheckedChange={(checked) => handleToggle(p, 'cashier', checked)}
                            className="mx-auto"
                          />
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

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editingUser} />
    </AdminLayout>
  );
}
