"use client"

import React, { useMemo, useState, useEffect } from "react"
import { PageHeader } from "../components/PageHeader"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RarityBadge } from "../components/RarityBadge"
import { usePocketFarm } from "../context"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const categories = ["All", "Crops", "Produce", "Fish", "Materials", "Tools", "Seeds"]

export default function InventoryPage() {
  const { inventory, showToast } = usePocketFarm()
  const [cat, setCat] = useState("All")
  const [q, setQ] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const router = useRouter()

  const items = useMemo(() => {
    return inventory.filter(
      (i) =>
        (cat === "All" || i.category === cat) &&
        i.name.toLowerCase().includes(q.toLowerCase())
    )
  }, [inventory, cat, q])

  // Select the first item by default if available
  useEffect(() => {
    if (items.length > 0 && !selectedId) {
      setSelectedId(items[0].id)
    }
  }, [items, selectedId])

  const selectedItem = useMemo(() => {
    return inventory.find((i) => i.id === selectedId) || null
  }, [inventory, selectedId])

  const handleUseItem = (item: any) => {
    if (item.category === "Seeds" || item.name.toLowerCase().includes("seeds")) {
      showToast(`Redirecting to your plots grid to plant ${item.name}!`, "info")
      router.push("/pocket-farm/farm")
    } else if (item.category === "Tools") {
      showToast(`Equipped ${item.name}! Ready to use.`, "success")
    } else {
      showToast(`You ate the ${item.name}! Re-energized slightly. 😋`, "success")
    }
  }

  const handleSellRedirect = (item: any) => {
    showToast(`Opening the Marketplace list tab for ${item.name}!`, "info")
    router.push("/pocket-farm/marketplace?sell=" + encodeURIComponent(item.name))
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
      <PageHeader
        emoji="🎒"
        title="Inventory"
        subtitle={`${inventory.length} unique items in your backpack`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left side items grid */}
        <Card className="cozy-card p-5 bg-card/60 backdrop-blur">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search backpack items..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-10 rounded-full pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={cat === c ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => {
                    setCat(c)
                    setSelectedId(null) // reset selection on category change
                  }}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center font-sans">
              <div className="text-4xl select-none mb-2">📭</div>
              <div className="font-bold">Nothing here yet</div>
              <p className="text-sm text-muted-foreground">Try another category or go harvest some plots!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setSelectedId(it.id)}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-muted/40 p-2 transition hover:shadow-cozy focus:outline-none cursor-pointer",
                    selectedId === it.id ? "ring-2 ring-primary border-primary bg-primary/5" : "border-border"
                  )}
                  title={it.name}
                >
                  <div className="grid h-full place-items-center text-3xl transition group-hover:scale-110 select-none">
                    {it.emoji}
                  </div>
                  <div className="absolute bottom-1 right-1 rounded-full bg-card/90 px-1.5 py-0.5 text-[10px] font-bold shadow-soft select-none font-sans">
                    ×{it.qty}
                  </div>
                  {it.rarity !== "common" && (
                    <div className="absolute left-1 top-1 select-none">
                      <RarityBadge rarity={it.rarity} className="px-1 py-0 text-[8px]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Right side item details */}
        <Card className="cozy-card sticky top-20 h-fit p-5 bg-card/60 backdrop-blur">
          <h2 className="mb-3 font-display text-lg font-bold">Item details</h2>
          {selectedItem ? (
            <div className="text-center animate-in fade-in duration-200">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-accent/30 to-leaf/20 text-6xl shadow-cozy border select-none">
                {selectedItem.emoji}
              </div>
              <div className="mt-3 font-display text-xl font-bold">{selectedItem.name}</div>
              <RarityBadge rarity={selectedItem.rarity} className="mt-1" />
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-left text-sm font-sans">
                <div className="rounded-xl bg-muted/40 p-2 border">
                  <div className="text-[10px] text-muted-foreground">Quantity</div>
                  <div className="font-bold">×{selectedItem.qty}</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-2 border">
                  <div className="text-[10px] text-muted-foreground">Category</div>
                  <div className="font-bold">{selectedItem.category}</div>
                </div>
              </div>
              
              <p className="mt-4 text-left text-xs text-muted-foreground font-sans leading-relaxed">
                A cozy {selectedItem.name.toLowerCase()} retrieved from your farming, fishing, or cave combat adventures. Use it, list it for trade, or gift it to friends.
              </p>
              
              <div className="mt-5 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-full border-border font-display"
                  onClick={() => handleUseItem(selectedItem)}
                >
                  Use
                </Button>
                <Button
                  size="sm"
                  className="flex-1 rounded-full bg-primary font-display"
                  onClick={() => handleSellRedirect(selectedItem)}
                >
                  Sell
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground font-sans">Pick an item to see details.</div>
          )}
        </Card>
      </div>
    </div>
  )
}
