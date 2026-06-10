"use client"

import React, { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "../components/PageHeader"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePocketFarm } from "../context"
import { api } from "@/lib/api"
import { Coins, Search, Loader2, Plus, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const cats = ["All", "Seeds", "Produce", "Decor", "Tools", "Crops", "Fish", "Materials"]

interface MarketplaceListing {
  id: string
  sellerId: string
  itemName: string
  itemEmoji: string
  itemCategory: string
  itemRarity: string
  price: number
  qty: number
  status: string
  createdAt: string
  seller: {
    name: string
    initials: string
    color: string
  }
}

export default function MarketplacePage() {
  const { profile, inventory, refreshData, showToast } = usePocketFarm()
  const searchParams = useSearchParams()

  const [tab, setTab] = useState<"buy" | "sell">("buy")
  const [category, setCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Sell Listing Modal State
  const [sellDialogOpen, setSellDialogOpen] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any | null>(null)
  const [listPrice, setListPrice] = useState<number>(10)
  const [listQty, setListQty] = useState<number>(1)

  const loadMarketListings = async () => {
    try {
      const data = await api.games.getMarket()
      setListings(data)
    } catch (err: any) {
      showToast(err.message || "Failed to load marketplace listings", "error")
    } finally {
      setLoadingListings(false)
    }
  }

  useEffect(() => {
    loadMarketListings()
  }, [])

  // Listen to searchParams to auto-open listing dialog from Inventory
  useEffect(() => {
    const prefillItem = searchParams.get("sell")
    if (prefillItem) {
      setTab("sell")
      const foundItem = inventory.find(
        (i) => i.name.toLowerCase() === prefillItem.toLowerCase()
      )
      if (foundItem) {
        setSelectedInventoryItem(foundItem)
        setListQty(1)
        setListPrice(Math.max(10, (foundItem.qty > 0 ? 10 : 10)))
        setSellDialogOpen(true)
      }
    }
  }, [searchParams, inventory])

  // Filter listings based on categories & search queries
  const filteredListings = useMemo(() => {
    return listings.filter(
      (item) =>
        (category === "All" || item.itemCategory === category) &&
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [listings, category, searchQuery])

  // Separate listings owned by player
  const myActiveListings = useMemo(() => {
    if (!profile) return []
    return listings.filter((l) => l.sellerId === profile.userId)
  }, [listings, profile])

  const handleBuy = async (listingId: string, itemName: string, price: number) => {
    if (actionLoading) return
    if (profile && profile.gold < price) {
      showToast("You don't have enough Gold!", "error")
      return
    }

    try {
      setActionLoading(true)
      const res = await api.games.buyMarket(listingId)
      if (res.success) {
        showToast(`Bought ${itemName} successfully!`, "success")
        loadMarketListings()
        refreshData()
      }
    } catch (err: any) {
      showToast(err.message || "Failed to complete purchase", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelListing = async (listingId: string, itemName: string) => {
    if (actionLoading) return
    try {
      setActionLoading(true)
      const res = await api.games.cancelListing(listingId)
      if (res.success) {
        showToast(`Cancelled listing for ${itemName}. Returned to backpack.`, "success")
        loadMarketListings()
        refreshData()
      }
    } catch (err: any) {
      showToast(err.message || "Failed to cancel listing", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateListing = async () => {
    if (!selectedInventoryItem || actionLoading) return
    if (listPrice <= 0 || listQty <= 0 || listQty > selectedInventoryItem.qty) {
      showToast("Invalid price or quantity selection", "error")
      return
    }

    try {
      setActionLoading(true)
      const res = await api.games.listMarket(
        selectedInventoryItem.name,
        listPrice,
        listQty
      )
      if (res.success) {
        showToast(`Listed ${listQty}x ${selectedInventoryItem.name} on the market!`, "success")
        setSellDialogOpen(false)
        setSelectedInventoryItem(null)
        loadMarketListings()
        refreshData()
      }
    } catch (err: any) {
      showToast(err.message || "Failed to list item", "error")
    } finally {
      setActionLoading(false)
    }
  }

  if (loadingListings || !profile) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground font-sans">Checking market board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
      <PageHeader
        emoji="🛒"
        title="Marketplace"
        subtitle="Trade seeds, fresh harvests, materials, and decorations with neighbors."
        actions={
          <div className="flex rounded-full border bg-card p-1 shadow-soft">
            {(["buy", "sell"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-5 py-1.5 text-xs font-bold capitalize transition-all font-display ${
                  tab === t ? "bg-primary text-primary-foreground shadow-cozy" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "buy" ? "Market Board" : "Sell Goods"}
              </button>
            ))}
          </div>
        }
      />

      {tab === "buy" ? (
        <Card className="cozy-card p-5 bg-card/60 backdrop-blur">
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search market listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-full pl-9 bg-card"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={category === c ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setCategory(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="py-12 text-center border border-dashed rounded-3xl bg-muted/20 font-sans">
              <div className="text-5xl select-none mb-2">🛒</div>
              <h3 className="font-display font-bold text-base mb-1">No listings active</h3>
              <p className="text-sm text-muted-foreground">Be the first to list items or refine your search query.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((m) => {
                const isMyListing = m.sellerId === profile.userId
                return (
                  <Card
                    key={m.id}
                    className="cozy-card group overflow-hidden bg-card transition hover:-translate-y-1 hover:shadow-cozy"
                  >
                    <div className="grid h-32 place-items-center bg-gradient-to-br from-accent/30 to-leaf/20 text-6xl transition group-hover:scale-105 select-none relative">
                      {m.itemEmoji}
                      {m.qty > 1 && (
                        <span className="absolute bottom-2 right-2 bg-card/90 px-2 py-0.5 rounded-full text-xs font-bold font-sans">
                          Qty: ×{m.qty}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-display text-base font-bold truncate">{m.itemName}</div>
                          <div className="text-[11px] text-muted-foreground font-sans truncate">
                            Listed by {isMyListing ? "You" : m.seller?.name || "Neighbor"}
                          </div>
                        </div>
                        <span className="chip text-gold-foreground flex items-center shrink-0">
                          <Coins className="h-3.5 w-3.5 text-gold" />
                          {m.price}
                        </span>
                      </div>

                      {isMyListing ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="mt-3.5 w-full rounded-full font-display"
                          onClick={() => handleCancelListing(m.id, m.itemName)}
                          disabled={actionLoading}
                        >
                          Cancel Listing
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="mt-3.5 w-full rounded-full bg-primary hover:opacity-90 font-display"
                          onClick={() => handleBuy(m.id, m.itemName, m.price)}
                          disabled={actionLoading}
                        >
                          Buy Item
                        </Button>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Sell tab: My Inventory lists */}
          <Card className="cozy-card p-5 bg-card/60 backdrop-blur">
            <h2 className="mb-4 font-display text-lg font-bold">Your Backpack Goods</h2>
            {inventory.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground font-sans border border-dashed rounded-3xl bg-muted/20">
                You have nothing in your inventory to sell!
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card shadow-soft hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl select-none">{item.emoji}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground font-sans">Qty: ×{item.qty}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full shrink-0 border-border"
                      onClick={() => {
                        setSelectedInventoryItem(item)
                        setListQty(1)
                        setListPrice(10)
                        setSellDialogOpen(true)
                      }}
                    >
                      List item
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Player's active listings */}
          <Card className="cozy-card p-5 bg-card/60 backdrop-blur">
            <h2 className="mb-4 font-display text-lg font-bold">Your Active Market Listings</h2>
            {myActiveListings.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground font-sans border border-dashed rounded-3xl bg-muted/20">
                You don't have any items listed on the market currently.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myActiveListings.map((m) => (
                  <Card key={m.id} className="cozy-card overflow-hidden bg-card">
                    <div className="grid h-24 place-items-center bg-gradient-to-br from-accent/10 to-leaf/10 text-4xl select-none relative">
                      {m.itemEmoji}
                      <span className="absolute bottom-1 right-2 bg-card/90 px-1.5 py-0.5 rounded-full text-[10px] font-bold font-sans">
                        Qty: ×{m.qty}
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-bold text-sm truncate">{m.itemName}</div>
                        <span className="text-xs font-bold text-gold-foreground flex items-center shrink-0 gap-0.5">
                          <Coins className="h-3 w-3 text-gold" /> {m.price}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="mt-2.5 w-full rounded-full font-display py-1 text-xs h-8"
                        onClick={() => handleCancelListing(m.id, m.itemName)}
                        disabled={actionLoading}
                      >
                        Cancel Trade
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Sell listing setup dialog */}
      <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Create Market Listing</DialogTitle>
            <DialogDescription className="font-sans">
              Enter the quantity and price in Gold at which you want to sell your items on the market board.
            </DialogDescription>
          </DialogHeader>

          {selectedInventoryItem && (
            <div className="space-y-4 py-2 font-sans">
              <div className="flex items-center gap-3 bg-muted/40 p-3.5 border rounded-2xl">
                <span className="text-4xl select-none">{selectedInventoryItem.emoji}</span>
                <div>
                  <div className="font-bold text-sm">{selectedInventoryItem.name}</div>
                  <div className="text-xs text-muted-foreground">Category: {selectedInventoryItem.category}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="qty-input">Quantity (Max: {selectedInventoryItem.qty})</Label>
                  <Input
                    id="qty-input"
                    type="number"
                    min={1}
                    max={selectedInventoryItem.qty}
                    value={listQty}
                    onChange={(e) => setListQty(Math.min(selectedInventoryItem.qty, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="bg-card rounded-xl h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="price-input">Total Price (Gold)</Label>
                  <Input
                    id="price-input"
                    type="number"
                    min={1}
                    value={listPrice}
                    onChange={(e) => setListPrice(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-card rounded-xl h-10"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setSellDialogOpen(false)
                setSelectedInventoryItem(null)
              }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-primary"
              onClick={handleCreateListing}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "List for sale"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
