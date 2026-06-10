"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Brain,
  ChevronLeft
} from "lucide-react"
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
} from "./ui/sidebar"

const items = [
  { title: "Dashboard", url: "/pocket-farm", icon: LayoutDashboard },
  { title: "Farm", url: "/pocket-farm/farm", icon: Sprout },
  { title: "Animals", url: "/pocket-farm/animals", icon: Beef },
  { title: "Fishing", url: "/pocket-farm/fishing", icon: Fish },
  { title: "Cave Adventure", url: "/pocket-farm/cave", icon: Mountain },
  { title: "Inventory", url: "/pocket-farm/inventory", icon: Backpack },
  { title: "Marketplace", url: "/pocket-farm/marketplace", icon: Store },
  { title: "Friends", url: "/pocket-farm/friends", icon: Users },
  { title: "Profile", url: "/pocket-farm/profile", icon: UserCircle },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="px-3 pt-4 pb-2">
        <Link href="/pocket-farm" className="flex items-center gap-2.5 hover:scale-[1.01] transition-transform">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-leaf to-primary text-2xl shadow-cozy select-none">
            🌿
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-lg font-bold">PocketFarm</div>
              <div className="text-[11px] text-muted-foreground font-sans">by Second Brain</div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-display font-bold text-xs">Adventure</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.url === "/pocket-farm"
                    ? pathname === "/pocket-farm"
                    : pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="h-10 rounded-xl data-[active=true]:bg-primary/15 data-[active=true]:text-foreground data-[active=true]:font-semibold transition-all"
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-[18px] w-[18px]" />
                        {!collapsed && <span className="font-display font-medium">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 gap-2 border-t">
        {/* Return to Second Brain */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-10 rounded-xl hover:bg-accent/40 text-muted-foreground hover:text-foreground font-sans border border-border bg-card/40 transition-all active:scale-[0.98]"
            >
              <Link href="/" className="flex items-center gap-3">
                <Brain className="h-[18px] w-[18px] text-primary animate-pulse" />
                {!collapsed && (
                  <span className="font-display font-bold text-xs flex items-center justify-between w-full">
                    Return to Workspace <ChevronLeft className="h-3.5 w-3.5 ml-1" />
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {!collapsed && (
          <div className="rounded-2xl bg-gradient-to-br from-accent/20 to-leaf/10 p-3 text-xs border border-border/30">
            <div className="font-display font-bold">Daily streak 🔥</div>
            <div className="text-muted-foreground font-sans mt-0.5">Keep growing, stay productive!</div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
