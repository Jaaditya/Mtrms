import {
  LayoutDashboard,
  Store,
  Users,
  Grid3X3,
  UtensilsCrossed,
  Package,
  BarChart3,
  Settings,
  Receipt,
  Percent,
  Shield,
  ChefHat,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Restaurants", url: "/restaurants", icon: Store },
  { title: "Users & Roles", url: "/users", icon: Users },
];

const operationsNav = [
  { title: "Floors & Tables", url: "/floors", icon: Grid3X3 },
  { title: "Menu", url: "/menu", icon: UtensilsCrossed },
  { title: "Orders", url: "/orders", icon: Receipt },
  { title: "Kitchen", url: "/kitchen", icon: ChefHat },
  { title: "Inventory", url: "/inventory", icon: Package },
];

const configNav = [
  { title: "Tax & Discounts", url: "/tax", icon: Percent },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderNavGroup = (label: string, items: typeof mainNav) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  activeClassName="bg-sidebar-accent text-primary font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <ChefHat className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">RestoAdmin</h1>
              <p className="text-[10px] text-muted-foreground">Management System</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 space-y-1">
        {renderNavGroup("Main", mainNav)}
        {renderNavGroup("Operations", operationsNav)}
        {renderNavGroup("Configuration", configNav)}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground">Super Admin Access</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
