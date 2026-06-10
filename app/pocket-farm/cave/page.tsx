"use client"

import React, { useState, useMemo } from "react"
import { PageHeader } from "../components/PageHeader"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "../components/Progress"
import { usePocketFarm } from "../context"
import { api } from "@/lib/api"
import { Lock, Skull, Swords, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { RewardPopup } from "../components/RewardPopup"

const caveFloors = [
  { id: 1, name: "Mossy Tunnels", floor: "1-5", danger: 1, cleared: true },
  { id: 2, name: "Crystal Hollow", floor: "6-10", danger: 2, cleared: true },
  { id: 3, name: "Lava Pits", floor: "11-20", danger: 3, cleared: false },
  { id: 4, name: "Skyward Peak", floor: "21+", danger: 4, cleared: false },
]

const monsters = [
  { id: 1, name: "Slime", emoji: "🟢", hp: 20, loot: ["💎", "🟩"] },
  { id: 2, name: "Bat", emoji: "🦇", hp: 15, loot: ["🪶"] },
  { id: 3, name: "Goblin", emoji: "👺", hp: 45, loot: ["💰", "🗡️"] },
  { id: 4, name: "Cave Troll", emoji: "👹", hp: 220, loot: ["🪙", "💎", "🛡️"], boss: true },
]

interface ActiveRun {
  floorName: string
  floorNumber: number
  monster: {
    name: string
    emoji: string
    hp: number
    loot: string[]
  }
}

export default function CavePage() {
  const { profile, inventory, refreshData, setProfile, showToast } = usePocketFarm()
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Fight Reward states
  const [rewardOpen, setRewardOpen] = useState(false)
  const [rewardDetails, setRewardDetails] = useState({
    emoji: "⚔️",
    title: "Monster Defeated!",
    description: "",
    rewards: [] as { label: string; color: string }[]
  })

  // Filter materials from user inventory
  const gatheredMaterials = useMemo(() => {
    return inventory.filter(
      (item) => item.category === "Materials" || ["💎", "⛏️", "🪨", "🟩", "🟪", "🪙", "Iron Ore", "Cave Crystal"].includes(item.name)
    )
  }, [inventory])

  if (!profile) return null

  const handleEnterCave = async () => {
    if (actionLoading) return
    if (profile.energy < 20) {
      showToast("You are too tired! Entering caves costs 20 energy.", "error")
      return
    }

    try {
      setActionLoading(true)
      const res = await api.games.enterCave()
      if (res.success) {
        setProfile(res.player)
        setActiveRun({
          floorName: res.floorName,
          floorNumber: res.floorNumber,
          monster: res.monster,
        })
        showToast("Entered the cave! Keep your guard up.", "success")
        refreshData()
      }
    } catch (err: any) {
      showToast(err.message || "Failed to enter cave", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleFightMonster = async (monsterId: number, monsterName: string) => {
    if (actionLoading) return
    if (profile.energy < 15) {
      showToast("Not enough energy! Fighting costs 15 energy.", "error")
      return
    }

    try {
      setActionLoading(true)
      const res = await api.games.fightMonster(monsterId)
      if (res.success) {
        setProfile(res.player)
        setRewardDetails({
          emoji: res.lootGained || "💎",
          title: `${monsterName} Defeated!`,
          description: `You slayed the ${res.monsterKilled} and recovered rare items.`,
          rewards: [
            { label: "-15 Energy", color: "text-energy" },
            { label: `+${res.qty} ${res.lootGained}`, color: "text-primary font-bold" }
          ]
        })
        setRewardOpen(true)
        showToast(`Defeated ${res.monsterKilled}!`, "success")
        refreshData()
      }
    } catch (err: any) {
      showToast(err.message || "Failed to fight monster", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleRetreat = () => {
    setActiveRun(null)
    showToast("Retreated safely back to the farm.", "info")
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
      <PageHeader
        emoji="🗝️"
        title="Cave Adventure"
        subtitle="Explore dark dungeon floors, defeat monsters, and gather rare resources."
        actions={
          !activeRun && (
            <Button
              className="rounded-full bg-primary"
              onClick={handleEnterCave}
              disabled={actionLoading || profile.energy < 20}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Swords className="mr-2 h-4 w-4" />
              )}
              Enter cave
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Adventure Screen */}
        <Card className="cozy-card overflow-hidden lg:col-span-2 bg-card/60 backdrop-blur">
          {activeRun ? (
            <div>
              <div className="relative flex h-56 items-end justify-between overflow-hidden bg-gradient-to-br from-soil/70 via-foreground/40 to-foreground/80 p-6 text-primary-foreground">
                <div className="absolute inset-0 bg-[radial-gradient(800px_300px_at_50%_120%,_oklch(0.75_0.18_60/_0.5),_transparent_60%)] animate-pulse" />
                <div className="relative z-10">
                  <div className="text-xs font-bold uppercase opacity-80">Current run</div>
                  <div className="font-display text-3xl font-bold">
                    {activeRun.floorName} • Floor {activeRun.floorNumber}
                  </div>
                  <div className="mt-1 text-sm opacity-80 font-sans">
                    A wild {activeRun.monster.name} {activeRun.monster.emoji} blocks the way!
                  </div>
                </div>
                <div className="relative text-7xl select-none animate-bounce">🕯️</div>
              </div>
              
              <div className="space-y-4 p-5">
                <div>
                  <div className="mb-1 flex justify-between text-xs font-sans">
                    <span className="font-bold text-muted-foreground">Monster HP ({activeRun.monster.name})</span>
                    <span className="font-bold">{activeRun.monster.hp} / {activeRun.monster.hp}</span>
                  </div>
                  <Progress value={100} className="h-2 [&>div]:bg-destructive" />
                </div>
                
                <div>
                  <div className="mb-1 flex justify-between text-xs font-sans">
                    <span className="font-bold text-muted-foreground">Your Stamina</span>
                    <span className="font-bold">{profile.energy} / {profile.maxEnergy}</span>
                  </div>
                  <Progress value={(profile.energy / profile.maxEnergy) * 100} className="h-2 [&>div]:bg-energy" />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    className="flex-1 rounded-full bg-primary font-display"
                    disabled={actionLoading}
                    onClick={() => handleFightMonster(1, activeRun.monster.name)}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Attack Monster (-15 Energy)"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full border-border hover:bg-muted font-display"
                    onClick={handleRetreat}
                  >
                    Retreat
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
              <div className="text-6xl mb-4 select-none">🏚️</div>
              <h3 className="font-display text-xl font-bold mb-2">Ready to explore?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm font-sans">
                The mines contain dark corridors populated by trolls and bats, but offer valuable ores and gems. Costs 20 energy to enter.
              </p>
              <Button
                className="rounded-full bg-primary px-8"
                onClick={handleEnterCave}
                disabled={actionLoading || profile.energy < 20}
              >
                {actionLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Swords className="mr-2 h-4 w-4" />
                )}
                Enter Caves
              </Button>
            </div>
          )}
        </Card>

        {/* Floors card */}
        <Card className="cozy-card p-5 bg-card/60 backdrop-blur">
          <h2 className="mb-3 font-display text-lg font-bold">Floors</h2>
          <div className="space-y-2">
            {caveFloors.map((f) => (
              <div
                key={f.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 transition hover:bg-muted/30",
                  f.cleared ? "bg-primary/10 border-primary/20" : "bg-muted/30 border-border"
                )}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-card border text-lg select-none">
                  {f.cleared ? "✅" : <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{f.name}</div>
                  <div className="text-[11px] text-muted-foreground font-sans">Floors {f.floor}</div>
                </div>
                <div className="flex gap-0.5 select-none">
                  {Array.from({ length: f.danger }).map((_, i) => (
                    <Skull key={i} className="h-3.5 w-3.5 text-destructive" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Monsters card */}
        <Card className="cozy-card p-5 lg:col-span-2 bg-card/60 backdrop-blur">
          <h2 className="mb-3 font-display text-lg font-bold">Monsters nearby</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {monsters.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 transition hover:shadow-soft",
                  m.boss
                    ? "bg-gradient-to-br from-destructive/15 to-epic/15 border-destructive/20"
                    : "bg-muted/30 border-border"
                )}
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-card border text-3xl shadow-soft select-none">
                  {m.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{m.name}</span>
                    {m.boss && (
                      <span className="chip border-destructive/40 bg-destructive/10 text-destructive text-[9px] py-0.5 font-bold uppercase select-none">
                        BOSS
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-sans">HP {m.hp}</div>
                  <div className="mt-1 flex gap-1 text-base select-none">
                    {m.loot.map((x, i) => (
                      <span key={i} title="Loot drop">{x}</span>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={m.boss ? "default" : "outline"}
                  className="rounded-full border-border"
                  disabled={actionLoading || profile.energy < 15}
                  onClick={() => handleFightMonster(m.id, m.name)}
                >
                  Fight
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Resources card */}
        <Card className="cozy-card p-5 bg-card/60 backdrop-blur">
          <h2 className="mb-3 font-display text-lg font-bold">Resources gathered</h2>
          {gatheredMaterials.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground font-sans">
              No mineral resources in your backpack yet. Explore the caves to find ores and gems!
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {gatheredMaterials.map((item) => (
                <div key={item.id} className="rounded-2xl bg-muted/40 p-3 text-center border">
                  <div className="text-2xl select-none">{item.emoji}</div>
                  <div className="text-xs font-bold font-display truncate mt-1">{item.name}</div>
                  <div className="text-[11px] font-sans text-muted-foreground mt-0.5">×{item.qty}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <RewardPopup
        open={rewardOpen}
        onOpenChange={setRewardOpen}
        emoji={rewardDetails.emoji}
        title={rewardDetails.title}
        description={rewardDetails.description}
        rewards={rewardDetails.rewards}
      />
    </div>
  )
}
