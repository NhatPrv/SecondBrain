"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { PageHeader } from "../components/PageHeader"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { usePocketFarm } from "../context"
import { api } from "@/lib/api"
import { Droplets, Sprout, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { RewardPopup } from "../components/RewardPopup"

// Static buildings & decor from mock-data to preserve exact UI layouts
const staticBuildings = [
  { id: 1, name: "Barn", emoji: "🏚️", level: 3 },
  { id: 2, name: "Greenhouse", emoji: "🏡", level: 2 },
  { id: 3, name: "Mill", emoji: "🌬️", level: 1 },
  { id: 4, name: "Well", emoji: "⛲", level: 4 },
]

const staticDecor = [
  { id: 1, emoji: "🌸" },
  { id: 2, emoji: "🪵" },
  { id: 3, emoji: "🍄" },
  { id: 4, emoji: "🪴" },
  { id: 5, emoji: "🦋" },
]

export default function FarmPage() {
  const {
    farm,
    inventory,
    profile,
    refreshData,
    showToast,
    setFarm,
    setProfile
  } = usePocketFarm()

  const [activePlotIndex, setActivePlotIndex] = useState<number | null>(null)
  const [plantingDialogOpen, setPlantingDialogOpen] = useState(false)
  const [harvestRewardOpen, setHarvestRewardOpen] = useState(false)
  const [harvestDetails, setHarvestDetails] = useState({
    emoji: "🌾",
    title: "Harvest Successful!",
    description: "",
    rewards: [] as { label: string; color: string }[]
  })
  
  const [actionLoading, setActionLoading] = useState(false)

  // Filter seeds from user inventory (name contains "Seeds" or category is "Seeds")
  const seeds = useMemo(() => {
    return inventory.filter(
      (item) => item.category === "Seeds" || item.name.toLowerCase().includes("seeds")
    )
  }, [inventory])

  if (!farm) return null

  // Calculate crop plot growth percentage
  const getPlotProgress = (plot: any) => {
    if (plot.state === "ready") return 100
    if (plot.state === "empty" || !plot.crop || !plot.plantedAt) return 0

    const plantedTime = new Date(plot.plantedAt).getTime()
    const now = new Date().getTime()
    const elapsedSeconds = Math.floor((now - plantedTime) / 1000)
    const growthTime = plot.crop.growthTimeSeconds

    return Math.min(100, Math.floor((elapsedSeconds / growthTime) * 100))
  }

  const handlePlotClick = async (plotIndex: number, plotState: string, isWatered: boolean) => {
    if (actionLoading) return

    if (plotState === "empty") {
      setActivePlotIndex(plotIndex)
      setPlantingDialogOpen(true)
    } else if (plotState === "seeded" || plotState === "growing") {
      if (isWatered) {
        showToast("This plot is already watered and growing!", "info")
        return
      }
      // Water plot
      try {
        setActionLoading(true)
        const res = await api.games.waterCrop(plotIndex)
        if (res.success) {
          showToast("Plot watered! The crop is now growing.", "success")
          refreshData()
        }
      } catch (err: any) {
        showToast(err.message || "Failed to water crop", "error")
      } finally {
        setActionLoading(false)
      }
    } else if (plotState === "ready") {
      // Harvest crop
      try {
        setActionLoading(true)
        const res = await api.games.harvestCrop(plotIndex)
        if (res.success) {
          showToast(
            `${res.harvestedItem} Harvested!`,
            "harvest",
            res.emoji || "🌾",
            [
              { label: `+${res.xpGained} XP`, color: "text-xp" },
              { label: `+1 ${res.harvestedItem}`, color: "text-primary" }
            ]
          )
          refreshData()
        }
      } catch (err: any) {
        showToast(err.message || "Failed to harvest crop", "error")
      } finally {
        setActionLoading(false)
      }
    }
  }

  const handlePlantSeed = async (seedName: string) => {
    if (activePlotIndex === null) return
    setPlantingDialogOpen(false)

    // Remove " Seeds" suffix to match the DB crop catalog mapping
    const cropName = seedName.replace(/ seeds$/i, "")

    try {
      setActionLoading(true)
      const res = await api.games.plantCrop(activePlotIndex, cropName)
      if (res.success) {
        showToast(`Planted ${cropName}! Remember to water it.`, "success")
        refreshData()
      }
    } catch (err: any) {
      showToast(err.message || "Failed to plant seed", "error")
    } finally {
      setActionLoading(false)
      setActivePlotIndex(null)
    }
  }

  const handleWaterAll = async () => {
    if (actionLoading) return
    const unwateredPlots = farm.plots.filter(
      (p) => (p.state === "seeded" || p.state === "growing") && !p.watered
    )

    if (unwateredPlots.length === 0) {
      showToast("All your crops are already watered!", "info")
      return
    }

    try {
      setActionLoading(true)
      let wateredCount = 0
      for (const p of unwateredPlots) {
        const res = await api.games.waterCrop(p.index)
        if (res.success) {
          wateredCount++
        }
      }
      if (wateredCount > 0) {
        showToast(`Watered ${wateredCount} crops!`, "success")
        refreshData()
      }
    } catch (err: any) {
      showToast("Error watering some crops", "error")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
      <PageHeader
        emoji="🌱"
        title="Your Farm"
        subtitle={`${farm.plots.length} plots • ${staticBuildings.length} buildings • Spring season`}
        actions={
          <>
            <Button
              variant="outline"
              className="rounded-full border-border bg-card/60"
              onClick={handleWaterAll}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Droplets className="mr-2 h-4 w-4 text-water" />
              )}
              Water all
            </Button>
            <Button
              className="rounded-full bg-primary hover:opacity-90"
              onClick={() => showToast("Click on an empty plot grid below to plant seeds!", "info")}
            >
              <Sprout className="mr-2 h-4 w-4" /> Plant seeds
            </Button>
          </>
        }
      />

      <Tabs defaultValue="plots">
        <TabsList className="rounded-full bg-card/60 p-1 border">
          <TabsTrigger value="plots" className="rounded-full">Crop plots</TabsTrigger>
          <TabsTrigger value="buildings" className="rounded-full">Buildings</TabsTrigger>
          <TabsTrigger value="decor" className="rounded-full">Decorations</TabsTrigger>
        </TabsList>

        <TabsContent value="plots" className="mt-6">
          <Card className="cozy-card overflow-hidden p-4 md:p-6">
            <div className="rounded-3xl bg-gradient-to-br from-leaf/15 via-card/50 to-accent/15 p-4 md:p-6 border">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3 md:grid-cols-8">
                {farm.plots.map((p) => {
                  const progress = getPlotProgress(p)
                  const cropEmoji = p.crop?.emoji || null
                  
                  // Visual theme states
                  const tone =
                    p.state === "ready"
                      ? "from-legendary/40 to-accent/30 ring-legendary/40"
                      : p.state === "growing"
                        ? "from-leaf/30 to-primary/20 ring-primary/30"
                        : p.state === "seeded"
                          ? "from-soil/20 to-muted/30 ring-border"
                          : "from-muted/40 to-muted/20 ring-border"

                  return (
                    <button
                      key={p.id}
                      onClick={() => handlePlotClick(p.index, p.state, p.watered)}
                      disabled={actionLoading}
                      className={cn(
                        "group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br p-2 ring-1 transition hover:scale-[1.03] hover:shadow-cozy focus:outline-none cursor-pointer active:scale-95",
                        p.watered && p.state !== "ready" ? "border-water border-2 ring-water" : "",
                        tone
                      )}
                    >
                      <div className="absolute inset-0 grid place-items-center text-3xl sm:text-4xl select-none">
                        {cropEmoji ?? "🟫"}
                      </div>
                      
                      {p.state === "growing" && (
                        <div className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-card/60">
                          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                      )}

                      {p.state === "ready" && (
                        <div className="absolute right-1 top-1 rounded-full bg-legendary px-1.5 py-0.5 text-[9px] font-bold text-gold-foreground shadow-soft select-none">
                          READY
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground font-sans">
              <span className="chip"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30 border border-border" /> Empty</span>
              <span className="chip"><span className="h-2.5 w-2.5 rounded-full bg-soil" /> Seeded (Dry)</span>
              <span className="chip"><span className="h-2.5 w-2.5 rounded-full bg-water" /> Watered</span>
              <span className="chip"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Growing</span>
              <span className="chip"><span className="h-2.5 w-2.5 rounded-full bg-legendary" /> Ready</span>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="buildings" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {staticBuildings.map((b) => (
              <Card key={b.id} className="cozy-card p-5 text-center bg-card/60 backdrop-blur">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-accent/40 to-leaf/30 text-4xl shadow-soft">
                  {b.emoji}
                </div>
                <div className="mt-3 font-display text-lg font-bold">{b.name}</div>
                <div className="text-xs text-muted-foreground font-sans">Level {b.level}</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 rounded-full border-border hover:bg-muted"
                  onClick={() => showToast("Buildings can be upgraded when resources unlock at Level 15!", "info")}
                >
                  Upgrade
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="decor" className="mt-6">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-8">
            {staticDecor.map((d) => (
              <Card key={d.id} className="cozy-card grid aspect-square place-items-center text-4xl bg-card/60 backdrop-blur">
                {d.emoji}
              </Card>
            ))}
            <Card
              onClick={() => showToast("Go to the Marketplace to buy more decorations!", "info")}
              className="cozy-card grid aspect-square place-items-center text-3xl text-muted-foreground bg-card/30 hover:bg-card/60 cursor-pointer transition border-dashed"
            >
              +
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Planting dialog */}
      <Dialog open={plantingDialogOpen} onOpenChange={setPlantingDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Select Seed to Plant</DialogTitle>
            <DialogDescription className="font-sans">
              Choose one of your seeds from the backpack to plant on Plot #{activePlotIndex !== null ? activePlotIndex + 1 : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-60 overflow-y-auto py-2">
            {seeds.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground font-sans">
                You do not have any seeds! Go buy some at the <Link href="/pocket-farm/marketplace" className="text-primary font-bold hover:underline" onClick={() => setPlantingDialogOpen(false)}>Marketplace</Link>.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {seeds.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handlePlantSeed(s.name)}
                    className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 hover:bg-muted text-left transition focus:outline-none cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{s.emoji}</span>
                      <div>
                        <div className="font-bold text-sm">{s.name}</div>
                        <div className="text-xs text-muted-foreground font-sans">Qty: {s.qty}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary font-display">Plant seed</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" className="rounded-full" onClick={() => setPlantingDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Harvest Reward popup */}
      <RewardPopup
        open={harvestRewardOpen}
        onOpenChange={setHarvestRewardOpen}
        emoji={harvestDetails.emoji}
        title={harvestDetails.title}
        description={harvestDetails.description}
        rewards={harvestDetails.rewards}
      />
    </div>
  )
}
