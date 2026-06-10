"use client"

import React, { useEffect, useState } from "react"
import { PageHeader } from "../components/PageHeader"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { usePocketFarm } from "../context"
import { api } from "@/lib/api"
import { MessageCircle, Sprout, Loader2, X, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface FriendItem {
  id: string
  name: string
  emoji: string
  level: number
  online: boolean
  status: string
}

interface VisitedFarm {
  farmName: string
  ownerName: string
  plots: any[]
  animals: any[]
}

export default function FriendsPage() {
  const { showToast } = usePocketFarm()
  const [friendsList, setFriendsList] = useState<FriendItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Farm visit dialog state
  const [visitDialogOpen, setVisitDialogOpen] = useState(false)
  const [visitedFarm, setVisitedFarm] = useState<VisitedFarm | null>(null)
  
  const router = useRouter()

  const loadFriendsData = async () => {
    try {
      const data = await api.games.getFriends()
      setFriendsList(data)
    } catch (err: any) {
      showToast(err.message || "Failed to load friends", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFriendsData()
  }, [])

  const handleChat = async (friendId: string) => {
    try {
      const conv = await api.chat.getOrCreateDirect(friendId)
      router.push(`/chat?id=${conv.id}`)
      showToast("Redirecting to chat...", "info")
    } catch (err: any) {
      router.push("/chat")
    }
  }

  const handleVisitFarm = async (friendId: string, friendName: string) => {
    if (actionLoading) return
    try {
      setActionLoading(true)
      const res = await api.games.visitFriend(friendId)
      setVisitedFarm(res)
      setVisitDialogOpen(true)
      showToast(`Visiting ${friendName}'s farm!`, "success")
    } catch (err: any) {
      showToast(err.message || "Failed to visit farm", "error")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground font-sans">Locating neighbors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
      <PageHeader
        emoji="💖"
        title="Friends"
        subtitle={`${friendsList.filter((f) => f.online).length} online • ${friendsList.length} total`}
        actions={
          <Button
            className="rounded-full bg-primary"
            onClick={() => showToast("Add friends directly through the Second Brain family settings!", "info")}
          >
            Add friend
          </Button>
        }
      />

      {friendsList.length === 0 ? (
        <Card className="cozy-card p-10 text-center max-w-md mx-auto">
          <div className="text-5xl mb-4 select-none">🦊</div>
          <h3 className="font-display text-lg font-bold mb-2">No neighbors found</h3>
          <p className="text-sm text-muted-foreground font-sans">
            Add members to your Second Brain household workspace to see them here in the valley!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {friendsList.map((f) => (
            <Card key={f.id} className="cozy-card overflow-hidden bg-card/60 backdrop-blur">
              <div className="flex items-center gap-3 p-4">
                <div className="relative shrink-0">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent/40 to-leaf/30 text-3xl border select-none">
                    {f.emoji}
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card",
                      f.online ? "bg-primary" : "bg-muted-foreground/40"
                    )}
                  />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-display text-base font-bold truncate">{f.name}</div>
                    <span className="chip text-[10px] py-0.5 px-2 font-sans font-bold">Lv {f.level}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground font-sans mt-0.5">{f.status}</div>
                </div>
              </div>
              
              <div className="flex gap-2 border-t border-border bg-muted/30 p-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-full border-border hover:bg-muted font-display"
                  onClick={() => handleChat(f.id)}
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" /> Chat
                </Button>
                <Button
                  size="sm"
                  className="flex-1 rounded-full bg-primary hover:opacity-90 font-display"
                  disabled={actionLoading}
                  onClick={() => handleVisitFarm(f.id, f.name)}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sprout className="mr-1.5 h-4 w-4" /> Visit farm
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Visited Farm Dialog */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl font-sans">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Visiting: {visitedFarm?.farmName || "Friend's Farm"}
            </DialogTitle>
            <DialogDescription className="font-sans">
              Owned by {visitedFarm?.ownerName || "Farmer"}. Crops and livestock are shown in real time.
            </DialogDescription>
          </DialogHeader>

          {visitedFarm && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 pt-2">
              {/* Plots Grid */}
              <div>
                <h4 className="font-display font-bold text-sm mb-3">Crop Plots</h4>
                <div className="grid grid-cols-6 gap-2 p-3 bg-muted/20 border rounded-2xl">
                  {visitedFarm.plots.map((p) => {
                    const cropEmoji = p.crop?.emoji || null
                    const tone =
                      p.state === "ready"
                        ? "from-legendary/20 to-accent/10 border-legendary/20"
                        : p.state === "growing"
                          ? "from-leaf/20 to-primary/10 border-primary/20"
                          : p.state === "seeded"
                            ? "from-soil/10 to-muted/20 border-border"
                            : "from-muted/30 to-muted/10 border-border border-dashed"

                    return (
                      <div
                        key={p.id}
                        className={cn(
                          "aspect-square rounded-xl border bg-gradient-to-br grid place-items-center text-2xl relative select-none",
                          tone
                        )}
                        title={`Plot #${p.index + 1} is ${p.state}`}
                      >
                        {cropEmoji ?? "🟫"}
                        {p.state === "ready" && (
                          <span className="absolute top-0.5 right-0.5 bg-legendary text-gold-foreground text-[7px] font-bold px-1 rounded">
                            Rdy
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Livestock list */}
              <div>
                <h4 className="font-display font-bold text-sm mb-3">Livestock Barn</h4>
                {visitedFarm.animals.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-sans bg-muted/20 border p-4 rounded-xl text-center">
                    No animals in the barn currently.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {visitedFarm.animals.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 p-2.5 bg-muted/20 border rounded-2xl"
                      >
                        <span className="text-3xl select-none">{a.emoji}</span>
                        <div>
                          <div className="font-bold text-xs">{a.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {a.species} • Happy: {a.happy}%
                          </div>
                          <div className="mt-1 flex gap-1">
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border bg-card", a.fed ? "text-primary border-primary/20" : "text-destructive border-destructive/20")}>
                              {a.fed ? "Fed" : "Hungry"}
                            </span>
                            {a.ready && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-legendary/10 text-legendary border-legendary/20">
                                Ready
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button className="rounded-full bg-primary" onClick={() => setVisitDialogOpen(false)}>
              Close Farm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
