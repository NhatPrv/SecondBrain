import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Sprout,
  Beef,
  Fish,
  Mountain,
  Backpack,
  Store,
  Users,
  UserCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Farm", url: "/farm", icon: Sprout },
  { title: "Animals", url: "/animals", icon: Beef },
  { title: "Fishing", url: "/fishing", icon: Fish },
  { title: "Cave Adventure", url: "/cave", icon: Mountain },
  { title: "Inventory", url: "/inventory", icon: Backpack },
  { title: "Marketplace", url: "/marketplace", icon: Store },
  { title: "Friends", url: "/friends", icon: Users },
  { title: "Profile", url: "/profile", icon: UserCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="px-3 pt-4 pb-2">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-leaf to-primary text-2xl shadow-cozy">
            🌿
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-lg font-bold">PocketFarm</div>
              <div className="text-[11px] text-muted-foreground">by Second Brain</div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Adventure</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="h-10 rounded-xl data-[active=true]:bg-primary/15 data-[active=true]:text-foreground data-[active=true]:font-semibold"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-[18px] w-[18px]" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="rounded-2xl bg-gradient-to-br from-accent/40 to-leaf/30 p-3 text-xs">
            <div className="font-display font-bold">Daily streak 🔥</div>
            <div className="text-muted-foreground">12 days in a row — keep growing!</div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
