"use client"

import React, { useEffect, useState } from "react"
import { Bell, Coins, Heart, Search, Sparkles, Zap, Moon, Sun } from "lucide-react"
import { SidebarTrigger } from "./ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { usePocketFarm } from "../context"

function Stat({
  icon,
  value,
  label,
  className,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
  className?: string
}) {
  return (
    <div
      className={`hidden items-center gap-2 rounded-full border bg-card/70 px-3.5 py-1.5 shadow-soft backdrop-blur sm:flex hover:bg-card transition ${className ?? ""}`}
      title={label}
    >
      {icon}
      <span className="font-display text-sm font-bold">{value}</span>
    </div>
  )
}

export function TopBar() {
  const { profile, showToast } = usePocketFarm()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Sync HTML class lists with user toggled dark modes
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  if (!profile) return null

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/60 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="rounded-xl border border-border hover:bg-muted" />

      <div className="relative ml-1 hidden max-w-sm flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search crops, fish, friends…"
          className="h-10 rounded-full pl-9 bg-card/40 focus:bg-card"
          onChange={(e) => {
            if (e.target.value.trim() !== "") {
              // Search helper trigger
            }
          }}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Stat
          icon={<Coins className="h-4 w-4 text-gold" />}
          value={profile.gold.toLocaleString()}
          label="Gold"
          className="text-gold-foreground"
        />
        <Stat
          icon={<Sparkles className="h-4 w-4 text-rare" />}
          value={profile.gems}
          label="Gems"
          className="text-rare"
        />
        <Stat
          icon={<Zap className="h-4 w-4 text-energy" />}
          value={`${profile.energy}/${profile.maxEnergy}`}
          label="Energy"
          className="text-energy"
        />
        <Stat
          icon={<Heart className="h-4 w-4 text-destructive" />}
          value={`Lv ${profile.level}`}
          label="Level"
          className="text-destructive-foreground"
        />

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-muted border border-transparent hover:border-border"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-4.5 w-4.5 text-gold" /> : <Moon className="h-4.5 w-4.5 text-muted-foreground" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-muted border border-transparent hover:border-border"
          onClick={() => showToast("Daily updates: Crops ready to harvest!", "info")}
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
        </Button>

        <Avatar className="h-9 w-9 ring-2 ring-primary/30 ml-1 shadow-soft">
          <AvatarFallback className="bg-gradient-to-br from-leaf to-primary text-lg select-none">
            {profile.avatar}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
