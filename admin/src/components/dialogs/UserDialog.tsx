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
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface User {
  id?: number;
  name: string;
  email: string;
  role: string;
  password?: string;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any | null;
}

const defaultValues: User = {
  name: "", email: "", role: "waiter", password: "",
};

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState<User>(defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setForm({
        ...user,
        password: "", // Don't show password
      });
    } else {
      setForm(defaultValues);
    }
  }, [user, open]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || (!isEdit && !form.password)) {
      toast.error("Name, email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${user.id}`, payload);
        toast.success("User updated successfully");
      } else {
        await api.post("/users", form);
        toast.success("User created successfully");
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const update = (field: keyof User, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update user details." : "Create a new staff account."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs">Full Name *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Ram Sharma" className="h-9 bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Email *</Label>
            <Input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="ram@resto.com" className="h-9 bg-secondary/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={(v) => update("role", v)}>
                <SelectTrigger className="h-9 bg-secondary/50 capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{isEdit ? "Change Password" : "Password *"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder={isEdit ? "Leave blank to keep" : "••••••••"}
                className="h-9 bg-secondary/50"
              />
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
