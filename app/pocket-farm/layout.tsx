"use client"

import React from "react"
import { Fredoka, Nunito } from "next/font/google"
import { PocketFarmProvider, usePocketFarm } from "./context"
import { SidebarProvider } from "./components/ui/sidebar"
import { AppSidebar } from "./components/AppSidebar"
import { TopBar } from "./components/TopBar"
import "./pocket-farm.css"
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
})

function GameLayoutContent({ children }: { children: React.ReactNode }) {
  const { loading, notifications } = usePocketFarm()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground font-sans">Watering the crops...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Isolated Game Navigation Sidebar */}
        <AppSidebar />
        
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Isolated Stats Header TopBar */}
          <TopBar />
          
          {/* Dynamic page content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background/20 relative">
            <div className="mx-auto max-w-7xl w-full">
              {children}
            </div>
          </main>
        </div>

        {/* Global Floating Stacked Notifications */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="pointer-events-auto w-80 rounded-2xl border border-border bg-card/90 p-4 shadow-pop backdrop-blur flex items-start gap-3 animate-toast-lifetime"
            >
              <div className="mt-0.5 shrink-0">
                {notif.emoji ? (
                  <span className="text-xl select-none leading-none inline-block mt-[-2px]">{notif.emoji}</span>
                ) : (
                  <>
                    {notif.type === "success" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    {notif.type === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
                    {notif.type === "info" && <Info className="h-5 w-5 text-rare" />}
                  </>
                )}
              </div>
              <div className="flex-1 text-sm font-sans">
                <div className="font-semibold text-foreground leading-snug">{notif.message}</div>
                {notif.rewards && notif.rewards.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {notif.rewards.map((r, idx) => (
                      <span
                        key={idx}
                        className={cn("chip text-[10px] py-0.5 px-2 font-bold leading-none border-border/40", r.color)}
                      >
                        {r.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SidebarProvider>
  )
}

export default function PocketFarmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(fredoka.variable, nunito.variable, "pocket-farm-theme min-h-screen text-foreground")}>
      <PocketFarmProvider>
        <GameLayoutContent>{children}</GameLayoutContent>
      </PocketFarmProvider>
    </div>
  )
}
