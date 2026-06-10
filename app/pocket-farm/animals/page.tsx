"use client"

import React, { useEffect, useState } from "react"
import { PageHeader } from "../components/PageHeader"
import { Card } from "@/components/ui/card"
import { Progress } from "../components/Progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePocketFarm } from "../context"
import { api } from "@/lib/api"
import { Heart, Utensils, Sparkles, Plus, Loader2, Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnimalCatalogItem {
  id: string
  name: string
  species: string
  emoji: string
  produces: string
  productionTimeSeconds: number
  buyPrice: number
  feedCost: number
}

interface AnimalInstance {
  id: string
  name: string
  species: string
  emoji: string
  happy: number
  fed: boolean
  ready: boolean
  produces: string
}

export default function AnimalsPage() {
  const { profile, refreshData, showToast } = usePocketFarm()
  const [instances, setInstances] = useState<AnimalInstance[]>([])
  const [catalog, setCatalog] = useState<AnimalCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Buy Dialog State
  const [buyDialogOpen, setBuyDialogOpen] = useState(false)
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalCatalogItem | null>(null)
  const [customName, setCustomName] = useState("")

  const loadAnimalsData = async () => {
    try {
      const res = await api.games.getAnimals()
      setInstances(res.instances)
      setCatalog(res.catalog)
    } catch (err: any) {
      showToast(err.message || "Failed to load animals", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnimalsData()
  }, [])

  const handleFeed = async (instanceId: string) => {
    if (actionLoading) return
    try {
      setActionLoading(true)
      const res = await api.games.feedAnimal(instanceId)
      if (res.success) {
        showToast(`${res.animal.name} has been fed!`, "success")
        loadAnimalsData()
        refreshData()
      }
    } catch (err: any) {
      showToast(err.message || "Failed to feed animal", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCollect = async (instanceId: string) => {
    if (actionLoading) return
    try {
      setActionLoading(true)
      const res = await api.games.collectAnimal(instanceId)
      if (res.success) {
        showToast(`Collected ${res.resource} from ${res.animal.name}!`, "success")
        loadAnimalsData()
        refreshData()
      }
    } catch (err: any) {
      showToast(err.message || "Failed to collect resource", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleFeedAll = async () => {
    if (actionLoading) return
    const hungryAnimals = instances.filter((ins) => !ins.fed)
    if (hungryAnimals.length === 0) {
      showToast("All your animals are already fed!", "info")
      return
    }

    try {
      setActionLoading(true)
      let fedCount = 0
      for (const ins of hungryAnimals) {
        const res = await api.games.feedAnimal(ins.id)
        if (res.success) {
          fedCount++
        }
      }
      if (fedCount > 0) {
        showToast(`Fed ${fedCount} animals!`, "success")
        loadAnimalsData()
        refreshData()
      }
    } catch (err: any) {
      showToast("Error feeding some animals", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleBuyAnimal = async () => {
    if (!selectedAnimal || actionLoading) return
    try {
      setActionLoading(true)
      const res = await api.games.buyAnimal(selectedAnimal.name, customName.trim())
      if (res.success) {
        showToast(`Bought ${res.animal.name}!`, "success")
        setBuyDialogOpen(false)
        setSelectedAnimal(null)
        setCustomName("")
        loadAnimalsData()
        refreshData()
      }
    } catch (err: any) {
      showToast(err.message || "Failed to buy animal", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handlePet = (name: string) => {
    showToast(`You petted ${name}. Heart levels increased! ❤️`, "success")
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground font-sans">Opening the barn doors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
      <PageHeader
        emoji="🐮"
        title="Animal Friends"
        subtitle={`${instances.length} animals in your barn`}
        actions={
          <>
            <Button
              variant="outline"
              className="rounded-full border-border bg-card/60"
              onClick={handleFeedAll}
              disabled={actionLoading}
            >
              <Utensils className="mr-2 h-4 w-4 text-primary" />
              Feed all
            </Button>
            <Button
              className="rounded-full bg-primary hover:opacity-90"
              onClick={() => {
                setSelectedAnimal(catalog[0] || null)
                setBuyDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Buy animal
            </Button>
          </>
        }
      />

      {instances.length === 0 ? (
        <Card className="cozy-card p-10 text-center max-w-lg mx-auto">
          <div className="text-6xl mb-4">🏚️</div>
          <h3 className="font-display text-lg font-bold mb-2">Barn is empty</h3>
          <p className="text-sm text-muted-foreground mb-6 font-sans">
            You don't have any livestock yet. Open the shop to buy cows, chickens, and other farming friends.
          </p>
          <Button
            className="rounded-full bg-primary"
            onClick={() => {
              setSelectedAnimal(catalog[0] || null)
              setBuyDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Buy starter animal
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {instances.map((a) => (
            <Card key={a.id} className="cozy-card overflow-hidden bg-card/60 backdrop-blur">
              <div className="relative flex items-center gap-4 bg-gradient-to-br from-accent/30 to-leaf/20 p-5">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-card text-5xl shadow-cozy border select-none">
                  {a.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-bold">{a.name}</div>
                  <div className="text-xs text-muted-foreground font-sans">
                    {a.species} • produces {a.produces}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 font-sans">
                    <span className={`chip ${a.fed ? "text-primary border-primary/20" : "text-destructive border-destructive/20 bg-destructive/5"}`}>
                      <Utensils className="h-3 w-3" />
                      {a.fed ? "Fed" : "Hungry"}
                    </span>
                    {a.ready && (
                      <span className="chip text-legendary border-legendary/20 bg-legendary/5">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        Ready
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 p-5">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-sans">
                    <span className="font-bold text-muted-foreground flex items-center gap-1">
                      <Heart className="h-3 w-3 text-destructive" /> Happiness
                    </span>
                    <span className="font-bold">{a.happy}%</span>
                  </div>
                  <Progress value={a.happy} className="h-2 [&>div]:bg-destructive" />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-full border-border hover:bg-muted font-display"
                    onClick={() => handlePet(a.name)}
                  >
                    Pet
                  </Button>
                  
                  {!a.fed ? (
                    <Button
                      size="sm"
                      className="flex-1 rounded-full bg-primary hover:opacity-90 font-display"
                      onClick={() => handleFeed(a.id)}
                      disabled={actionLoading}
                    >
                      Feed
                    </Button>
                  ) : a.ready ? (
                    <Button
                      size="sm"
                      className="flex-1 rounded-full bg-legendary text-gold-foreground hover:opacity-90 font-display font-bold shadow-soft"
                      onClick={() => handleCollect(a.id)}
                      disabled={actionLoading}
                    >
                      Collect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-full font-display border-border"
                      disabled
                    >
                      Growing...
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Buying Animal Modal */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Buy Livestock</DialogTitle>
            <DialogDescription className="font-sans">
              Choose an animal species to raise. You need enough gold to pay their buying fee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Catalog Selector */}
            <div className="grid grid-cols-3 gap-2">
              {catalog.map((catItem) => (
                <button
                  key={catItem.id}
                  onClick={() => setSelectedAnimal(catItem)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-2xl border bg-card text-center transition cursor-pointer hover:bg-muted",
                    selectedAnimal?.id === catItem.id ? "border-primary ring-2 ring-primary bg-primary/5" : "border-border"
                  )}
                >
                  <span className="text-3xl mb-1 select-none">{catItem.emoji}</span>
                  <span className="text-xs font-bold font-display">{catItem.name}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-sans flex items-center justify-center gap-0.5">
                    <Coins className="h-2.5 w-2.5 text-gold" /> {catItem.buyPrice}
                  </span>
                </button>
              ))}
            </div>

            {selectedAnimal && (
              <div className="rounded-2xl bg-muted/40 p-4 border space-y-3 font-sans">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-muted-foreground">Produces:</span>
                  <span className="font-bold">{selectedAnimal.produces}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-muted-foreground">Feeding Cost:</span>
                  <span className="font-bold flex items-center gap-0.5 text-gold-foreground">
                    <Coins className="h-3 w-3 text-gold" /> {selectedAnimal.feedCost} gold
                  </span>
                </div>
                
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="animal-name" className="text-xs">Give them a name</Label>
                  <Input
                    id="animal-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={`e.g., Daisy the ${selectedAnimal.name}`}
                    className="bg-card rounded-xl h-10"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setBuyDialogOpen(false)
                setSelectedAnimal(null)
                setCustomName("")
              }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-primary"
              disabled={!selectedAnimal || actionLoading || (profile && profile.gold < (selectedAnimal?.buyPrice || 0))}
              onClick={handleBuyAnimal}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Buy for ${selectedAnimal?.buyPrice || 0}g`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
