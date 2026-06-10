import type { ReactNode } from "react"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"

export function AppShell({
  title,
  children,
  /** When true, the main area does not scroll itself (for chat-style fixed layouts). */
  noScroll = false,
}: {
  title: string
  children: ReactNode
  noScroll?: boolean
}) {
  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <aside className="hidden shrink-0 border-r border-sidebar-border lg:block">
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main
          className={
            noScroll
              ? "min-h-0 flex-1 overflow-hidden"
              : "min-h-0 flex-1 overflow-y-auto"
          }
        >
          {children}
        </main>
      </div>
    </div>
  )
}
