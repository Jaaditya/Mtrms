import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, ChevronDown, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { restaurantApi } from "@/lib/api";
import { useNavigate, Link } from "react-router-dom";
import { useNotifications } from "@/contexts/NotificationContext";
import { formatDistanceToNow } from "date-fns";

export function TopBar() {
  const { tenant, switchTenant, logout, user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const navigate = useNavigate();

  const { data: restaurants = [] } = useQuery({
    queryKey: ["restaurants"],
    queryFn: restaurantApi.getAll,
  });

  const activeTenant = tenant || restaurants.find(r => r.slug === localStorage.getItem("tenant_slug")) || restaurants[0];

  return (
    <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card/50 backdrop-blur-sm">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      {/* Restaurant Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 border-border bg-secondary/50 max-w-[200px] truncate">
            <div className={`w-2 h-2 rounded-full ${activeTenant?.status === 'Active' ? 'bg-success' : 'bg-muted'}`} />
            <span className="text-sm font-medium truncate">{activeTenant?.name || "Select Restaurant"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {restaurants.map((r: any) => (
            <DropdownMenuItem
              key={r.id}
              className="gap-2 cursor-pointer"
              onClick={() => switchTenant(r)}
            >
              <div className={`w-2 h-2 rounded-full ${r.status === 'Active' ? 'bg-success' : 'bg-muted'}`} />
              <span className={r.id === activeTenant?.id ? "font-bold text-primary" : ""}>
                {r.name}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/restaurants" className="text-primary flex items-center gap-2 cursor-pointer">
              <Plus className="h-3.5 w-3.5" />
              Manage Restaurants
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search */}
      <div className="flex-1 max-w-md ml-auto">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search anything..."
            className="pl-8 h-8 text-sm bg-secondary/50 border-border"
          />
        </div>
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] gradient-primary border-0">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs h-auto p-0 hover:bg-transparent text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
              >
                Mark all as read
              </Button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={`flex flex-col items-start p-3 gap-1 cursor-pointer border-b border-border last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}
                  onClick={() => {
                    markAsRead(n.id);
                    if (n.data?.type === 'new_order' || n.data?.type === 'bill_requested') {
                      navigate('/orders');
                    }
                  }}
                >
                  <div className="flex w-full justify-between items-start gap-2">
                    <span className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(n.time, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                </DropdownMenuItem>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-2 border-t border-border bg-secondary/20">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-muted-foreground h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  clearNotifications();
                }}
              >
                Clear all
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden md:block">
              <p className="text-xs font-medium">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Preferences</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => logout()}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
