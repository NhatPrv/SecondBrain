"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Brain, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mainNav, libraryNav, worldNav } from "@/lib/nav"
import { useAuth } from "@/components/auth-provider"

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Brain className="size-5" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold text-sidebar-accent-foreground">
            Second Brain
          </span>
          <span className="text-xs text-muted-foreground">Family workspace</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="flex flex-col gap-1 py-2">
          <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}

          <p className="px-3 pb-1 pt-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            World
          </p>
          {worldNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}

          <p className="px-3 pb-1 pt-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Library
          </p>
          {libraryNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="flex items-center justify-between border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {user?.initials || "US"}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-sidebar-accent-foreground">
              {user?.name || "User"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email || "user@family.app"}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="p-1.5 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          aria-label="Log out"
        >
          <LogOut className="size-4.5" />
        </button>
      </div>
    </div>
  )
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: (typeof mainNav)[number]
  active: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span className="flex-1">{item.title}</span>
      {item.badge ? (
        <Badge
          className={cn(
            "h-5 min-w-5 justify-center rounded-full px-1.5 text-xs",
            active
              ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
              : "bg-primary text-primary-foreground",
          )}
        >
          {item.badge}
        </Badge>
      ) : null}
    </Link>
  )
}
