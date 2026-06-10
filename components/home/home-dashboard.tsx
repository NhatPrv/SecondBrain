"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MessageCircle,
  MessageSquare,
  Users,
  FolderClosed,
  StickyNote,
  Pin,
  FileText,
  ImageIcon,
  ArrowUpRight,
  Clock,
  Loader2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { api } from "@/lib/api"

export function HomeDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [family, setFamily] = useState<any[]>([])
  const [notesCount, setNotesCount] = useState({ total: 0, pinned: 0 })
  const [filesCount, setFilesCount] = useState(0)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch family members
        const members = await api.users.list()
        setFamily(members)

        // Fetch notes stats
        const notes = await api.notes.list()
        const pinnedNotes = notes.filter((n: any) => n.pinned).length
        setNotesCount({ total: notes.length, pinned: pinnedNotes })

        // Fetch files count
        const files = await api.files.list("all")
        // Filter folders and count files
        const fileItems = files.filter((f: any) => f.kind !== "folder")
        setFilesCount(files.length)

        // Compile recent activity from files and notes
        const compiledActivity: any[] = []
        
        notes.slice(0, 3).forEach((n: any) => {
          compiledActivity.push({
            title: n.title,
            type: "note",
            icon: StickyNote,
            when: "Modified recently",
            timestamp: new Date(n.updatedAt).getTime()
          })
        })

        files.slice(0, 3).forEach((f: any) => {
          compiledActivity.push({
            title: f.name,
            type: f.kind,
            icon: f.kind === "image" ? ImageIcon : FileText,
            when: f.modified || "Recently",
            timestamp: new Date(f.updatedAt).getTime()
          })
        })

        // Sort by timestamp desc and take 4
        compiledActivity.sort((a, b) => b.timestamp - a.timestamp)
        setRecentActivity(compiledActivity.slice(0, 4))
      } catch (err) {
        console.error("Dashboard load error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const quickLinks = [
    { title: "Self Chat", desc: "Your private notes & ideas", href: "/self-chat", icon: MessageCircle, tint: "text-chart-1" },
    { title: "All Chat", desc: "Realtime messaging", href: "/chat", icon: MessageCircle, tint: "text-chart-3" },
    { title: "Files", desc: `${filesCount} items in drive`, href: "/files", icon: FolderClosed, tint: "text-chart-4" },
    { title: "Notes", desc: `${notesCount.total} notes · ${notesCount.pinned} pinned`, href: "/notes", icon: StickyNote, tint: "text-chart-5" },
  ]

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  async function startChatWithUser(targetUserId: string) {
    try {
      const directChat = await api.chat.getOrCreateDirect(targetUserId)
      router.push(`/chat?activeId=${directChat.id}`)
    } catch (err) {
      console.error("Failed to start direct chat:", err)
    }
  }

  // Filter out the current user so they don't see themselves in the list
  const otherUsers = family.filter((m) => m.id !== user?.id)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8">
      {/* Greeting */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          Good evening, {user?.name?.split(" ")[0] || "User"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening in your family workspace today.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {quickLinks.map((q) => {
          const Icon = q.icon
          return (
            <Link key={q.href} href={q.href}>
              <Card className="group h-full gap-0 p-4 transition-colors hover:border-primary/40 hover:bg-accent/40">
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className={cn("size-5", q.tint)} />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="text-sm font-semibold">{q.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{q.desc}</p>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <Clock className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex flex-col">
            {recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground px-5 py-6 italic text-center">No recent activity</p>
            ) : (
              recentActivity.map((r, i) => {
                const Icon = r.icon
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40"
                  >
                    <span className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-[18px] text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {r.type}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{r.when}</span>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Family + pinned */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold">All users</h3>
            <div className="flex flex-col gap-3">
              {otherUsers.map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar className="size-8">
                        <AvatarFallback className={cn("text-xs text-white", m.color)}>
                          {m.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card",
                          m.online ? "bg-chart-3" : "bg-muted-foreground/40",
                        )}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground leading-none mb-1">{m.name}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {m.online ? "Online" : "Away"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-primary hover:bg-accent rounded-full shrink-0"
                    onClick={() => startChatWithUser(m.id)}
                    aria-label={`Chat with ${m.name}`}
                  >
                    <MessageSquare className="size-4" />
                  </Button>
                </div>
              ))}
              {otherUsers.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-2">No other users</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Pin className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Pinned Notes</h3>
            </div>
            <div className="flex flex-col gap-1">
              {notesCount.pinned === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2 py-2">No pinned notes</p>
              ) : (
                notesCount.pinned > 0 && (
                  <div className="flex items-center justify-between rounded-md px-2 py-2 text-sm">
                    <span className="truncate">{notesCount.pinned} pinned note(s)</span>
                    <Link href="/notes" className="text-xs text-primary hover:underline font-semibold">View</Link>
                  </div>
                )
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
