"use client"

import React, { useEffect, useState, useMemo } from "react"
import { PageHeader } from "../components/PageHeader"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RarityBadge } from "../components/RarityBadge"
import { RewardPopup } from "../components/RewardPopup"
import { usePocketFarm } from "../context"
import { api } from "@/lib/api"
import { Lock, Trophy, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FishLocation {
  id: number
  name: string
  emoji: string
  best: string
  unlocked: boolean
}

interface FishCatalogItem {
  id: string
  name: string
  emoji: string
  rarity: string
  baseValue: number
}

export default function FishingPage() {
  const { profile, inventory, refreshData, showToast } = usePocketFarm()
  const [locations, setLocations] = useState<FishLocation[]>([])
  const [catalog, setCatalog] = useState<FishCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Catch reward states
  const [rewardOpen, setRewardOpen] = useState(false)
  const [rewardDetails, setRewardDetails] = useState({
    emoji: "🐟",
    title: "Fish Caught!",
    description: "",
    rewards: [] as { label: string; color: string }[]
  })

  const loadFishingData = async () => {
    try {
      const res = await api.games.getFishing()
      setLocations(res.locations)
      setCatalog(res.fishCollection)
    } catch (err: any) {
      showToast(err.message || "Failed to load fishing data", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFishingData()
  }, [])

  // Map caught status from player inventory
  const fishCollection = useMemo(() => {
    return catalog.map((f) => {
      const invItem = inventory.find((i) => i.name === f.name && i.category === "Fish")
      return {
        ...f,
        caughtQty: invItem ? invItem.qty : 0,
      }
    })
  }, [catalog, inventory])

  const caughtSpeciesCount = useMemo(() => {
    return fishCollection.filter((f) => f.caughtQty > 0).length
  }, [fishCollection])

  const rareShowcase = useMemo(() => {
    return fishCollection.filter((f) => f.caughtQty > 0 && (f.rarity === "legendary" || f.rarity === "epic"))
  }, [fishCollection])

  const handleCastLine = async (locationId: number, locationName: string) => {
    if (actionLoading) return
    if (profile && profile.energy < 10) {
      showToast("You are too tired! Fishing requires 10 energy.", "error")
      return
    }

    try {
      setActionLoading(true)
      const res = await api.games.catchFish(locationId)
      if (res.success) {
        const caughtFish = res.caught
        setRewardDetails({
          emoji: caughtFish.emoji || "🐟",
          title: `Caught a ${caughtFish.name}!`,
          description: `You reeled in a ${caughtFish.rarity} ${caughtFish.name} from ${locationName}.`,
          rewards: [
            { label: "-10 Energy", color: "text-energy" },
            { label: `Value: ${caughtFish.baseValue} Gold`, color: "text-gold" }
          ]
        })
        setRewardOpen(true)
        showToast(`Caught a ${caughtFish.name}!`, "success")
        refreshData()
      }
    } catch (err: any) {
      showToast(err.message || "Failed to catch fish", "error")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground font-sans">Preparing the baits...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
      <PageHeader
        emoji="🎣"
        title="Fishing Spots"
        subtitle={`${caughtSpeciesCount}/${fishCollection.length} species caught`}
        actions={
          <Button
            className="rounded-full bg-primary"
            onClick={() => handleCastLine(1, "Maple Pond")}
            disabled={actionLoading || (profile && profile.energy < 10)}
          >
            {actionLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Cast a line"
            )}
          </Button>
        }
      />

      <h2 className="mb-3 font-display text-lg font-bold">Locations</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {locations.map((l) => (
          <Card
            key={l.id}
            className={cn(
              "cozy-card overflow-hidden p-5 bg-card/60 backdrop-blur transition hover:shadow-cozy",
              !l.unlocked && "opacity-60"
            )}
          >
            <div className="grid h-20 w-full place-items-center rounded-2xl bg-gradient-to-br from-water/30 to-leaf/20 text-5xl border select-none">
              {l.emoji}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="font-display text-lg font-bold">{l.name}</div>
              {!l.unlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="text-xs text-muted-foreground font-sans">Best: {l.best}</div>
            <Button
              size="sm"
              className="mt-3 w-full rounded-full"
              variant={l.unlocked ? "default" : "outline"}
              disabled={!l.unlocked || actionLoading}
              onClick={() => handleCastLine(l.id, l.name)}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : l.unlocked ? (
                "Fish here"
              ) : (
                "Locked"
              )}
            </Button>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="cozy-card p-5 lg:col-span-2 bg-card/60 backdrop-blur">
          <h2 className="mb-4 font-display text-lg font-bold">Fish collection</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {fishCollection.map((f) => {
              const isCaught = f.caughtQty > 0
              return (
                <div
                  key={f.id}
                  className={cn(
                    "rounded-2xl border bg-gradient-to-br p-3 text-center transition hover:scale-[1.02]",
                    isCaught
                      ? "from-card to-muted/40 border-border"
                      : "from-muted/30 to-muted/10 text-muted-foreground/60 border-dashed"
                  )}
                >
                  <div className={cn("text-4xl select-none", !isCaught && "grayscale opacity-40")}>
                    {f.emoji}
                  </div>
                  <div className="mt-1 text-sm font-bold truncate">{f.name}</div>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <RarityBadge rarity={f.rarity} />
                  </div>
                  <div className="mt-1 text-[11px] font-sans">
                    {isCaught ? `Qty: ×${f.caughtQty}` : "Not caught"}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="cozy-card p-5 bg-card/60 backdrop-blur">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Trophy className="h-5 w-5 text-legendary" /> Rare showcase
          </h2>
          {rareShowcase.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground font-sans">
              <div className="text-3xl mb-1 select-none">🌟</div>
              Catch an epic or legendary fish to display it here.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 p-3 bg-muted/20 rounded-2xl border mb-4">
              {rareShowcase.map((f) => (
                <div
                  key={f.id}
                  className="text-center text-4xl p-2 bg-card rounded-xl border shadow-soft select-none"
                  title={`${f.name} (${f.rarity})`}
                >
                  {f.emoji}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-2 text-sm font-sans border-t pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Largest catch</span>
              <span className="font-bold">14.2 lb</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Best streak</span>
              <span className="font-bold">9 in a row</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time fished</span>
              <span className="font-bold">36h</span>
            </div>
          </div>
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
