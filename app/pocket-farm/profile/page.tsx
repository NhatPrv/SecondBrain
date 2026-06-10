"use client"

import React, { useEffect, useState, useMemo } from "react"
import { PageHeader } from "../components/PageHeader"
import { Card } from "@/components/ui/card"
import { Progress } from "../components/Progress"
import { Button } from "@/components/ui/button"
import { RarityBadge } from "../components/RarityBadge"
import { usePocketFarm } from "../context"
import { api } from "@/lib/api"
import { CheckCircle2, Edit3, Lock, Trophy, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const { profile, achievements, stats, inventory, showToast } = usePocketFarm()
  const [animalCount, setAnimalCount] = useState(0)
  const [loadingAnimals, setLoadingAnimals] = useState(true)

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await api.games.getAnimals()
        setAnimalCount(res.instances?.length || 0)
      } catch (err) {
        console.error("Failed to load animals count for profile:", err)
      } finally {
        setLoadingAnimals(false)
      }
    }
    fetchAnimals()
  }, [])

  const xpPct = useMemo(() => {
    if (!profile) return 0
    return (profile.xp / profile.xpToNext) * 100
  }, [profile])

  // Calculate collections progress dynamically based on current inventory items
  const collections = useMemo(() => {
    const uniqueCrops = new Set(inventory.filter((i) => i.category === "Crops").map((i) => i.name)).size
    const uniqueFish = new Set(inventory.filter((i) => i.category === "Fish").map((i) => i.name)).size
    const uniqueMaterials = new Set(
      inventory.filter((i) => i.category === "Materials" || ["💎", "⛏️", "🪨", "🟩", "🟪", "🪙"].includes(i.name)).map((i) => i.name)
    ).size

    return [
      { name: "Crops Catalog", owned: uniqueCrops, total: 9 },
      { name: "Fish Species", owned: uniqueFish, total: 8 },
      { name: "Animals Raised", owned: animalCount, total: 6 },
      { name: "Materials Discovered", owned: uniqueMaterials, total: 6 },
    ]
  }, [inventory, animalCount])

  if (!profile) return null

  const handleEditProfile = () => {
    showToast("Profile avatar and details are synced with your Second Brain family workspace account!", "info")
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
      <PageHeader emoji="👤" title="Player Profile" />

      <Card className="cozy-card overflow-hidden bg-card/60 backdrop-blur">
        <div className="relative h-32 bg-gradient-to-br from-leaf/40 via-accent/40 to-water/40 border-b" />
        <div className="-mt-12 flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl border-4 border-card bg-gradient-to-br from-leaf to-primary text-5xl shadow-cozy select-none">
            {profile.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-2xl font-bold">{profile.user?.name || "Farmer"}</div>
            <div className="text-sm text-muted-foreground font-sans">
              {profile.title} • Level {profile.level}
            </div>
            <div className="mt-3 max-w-md">
              <Progress value={xpPct} className="h-2 [&>div]:bg-xp" />
              <div className="mt-1 text-[11px] text-muted-foreground font-sans">
                {profile.xp.toLocaleString()} / {profile.xpToNext.toLocaleString()} XP to Level {profile.level + 1}
              </div>
            </div>
          </div>
          <Button variant="outline" className="rounded-full border-border hover:bg-muted shrink-0" onClick={handleEditProfile}>
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Achievements list */}
        <Card className="cozy-card p-5 lg:col-span-2 bg-card/60 backdrop-blur">
          <h2 className="mb-4 font-display text-lg font-bold">Achievements</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 bg-card transition hover:shadow-soft",
                  a.done ? "bg-primary/10 border-primary/20" : "bg-muted/30 border-border"
                )}
              >
                <div
                  className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl border bg-card",
                    a.done ? "shadow-soft" : "grayscale opacity-50"
                  )}
                >
                  {a.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate text-sm">{a.name}</span>
                    {a.done ? (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-sans mt-0.5 leading-snug">{a.desc}</div>
                  {!a.done && a.goal && (
                    <div className="mt-1.5 font-sans">
                      <Progress
                        value={((a.progress ?? 0) / a.goal) * 100}
                        className="h-1.5"
                      />
                      <div className="mt-1 text-[9px] text-muted-foreground">
                        {a.progress} / {a.goal}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Collections and lifetime stats */}
        <div className="space-y-6">
          <Card className="cozy-card p-5 bg-card/60 backdrop-blur">
            <h2 className="mb-4 font-display text-lg font-bold">Collections</h2>
            <div className="space-y-4">
              {loadingAnimals ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                collections.map((c) => {
                  const pct = c.total > 0 ? (c.owned / c.total) * 100 : 0
                  return (
                    <div key={c.name} className="font-sans">
                      <div className="mb-1 flex justify-between text-xs font-semibold">
                        <span>{c.name}</span>
                        <span className="text-muted-foreground">
                          {c.owned} / {c.total}
                        </span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          <Card className="cozy-card p-5 bg-card/60 backdrop-blur">
            <h2 className="mb-3 font-display text-lg font-bold">Lifetime Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-muted/30 p-3 border">
                  <div className="text-2xl select-none">{s.emoji}</div>
                  <div className="mt-1 font-display text-lg font-bold">
                    {s.value.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-sans">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
