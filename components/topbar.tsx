"use client"

import { useState } from "react"
import { Menu, Search, Bell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Sidebar } from "@/components/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

export function Topbar({ title }: { title: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-sm lg:px-6">
      {/* Mobile menu */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-9 lg:hidden"
              aria-label="Open navigation"
            />
          }
        >
          <Menu className="size-5" />
        </DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="left-0 top-0 h-svh max-w-64 translate-x-0 translate-y-0 gap-0 rounded-none border-0 border-r border-sidebar-border p-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:rounded-none"
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      <h1 className="hidden text-base font-semibold sm:block">{title}</h1>

      <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search everything..."
          className="h-9 bg-muted/60 pl-9"
          aria-label="Search"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button size="sm" className="hidden gap-1.5 sm:flex">
          <Plus className="size-4" />
          New
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
