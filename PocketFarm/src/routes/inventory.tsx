import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RarityBadge } from "@/components/RarityBadge";
import { inventoryItems } from "@/lib/mock-data";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — PocketFarm" },
      { name: "description", content: "Browse, filter, and organize everything you own." },
    ],
  }),
  component: Inventory,
});

const categories = ["All", "Crops", "Produce", "Fish", "Materials", "Tools"];

function Inventory() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(inventoryItems[0]);

  const items = useMemo(
    () =>
      inventoryItems.filter(
        (i) =>
          (cat === "All" || i.category === cat) &&
          i.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [cat, q],
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader emoji="🎒" title="Inventory" subtitle={`${inventoryItems.length} unique items`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="cozy-card p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items"
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
                  onClick={() => setCat(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-10 text-center">
              <div className="text-4xl">📭</div>
              <div className="mt-2 font-bold">Nothing here yet</div>
              <p className="text-sm text-muted-foreground">Try another category or harvest something!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setSelected(it)}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-muted/40 p-2 transition hover:shadow-cozy",
                    selected?.id === it.id && "ring-2 ring-primary",
                  )}
                  title={it.name}
                >
                  <div className="grid h-full place-items-center text-3xl transition group-hover:scale-110">
                    {it.emoji}
                  </div>
                  <div className="absolute bottom-1 right-1 rounded-full bg-card/90 px-1.5 py-0.5 text-[10px] font-bold shadow-soft">
                    ×{it.qty}
                  </div>
                  {it.rarity !== "common" && (
                    <div className="absolute left-1 top-1">
                      <RarityBadge rarity={it.rarity} className="px-1 py-0 text-[8px]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="cozy-card sticky top-20 h-fit p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Item details</h2>
          {selected ? (
            <div className="text-center">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-accent/30 to-leaf/20 text-6xl shadow-cozy">
                {selected.emoji}
              </div>
              <div className="mt-3 font-display text-xl font-bold">{selected.name}</div>
              <RarityBadge rarity={selected.rarity} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-left text-sm">
                <div className="rounded-xl bg-muted/40 p-2">
                  <div className="text-[10px] text-muted-foreground">Quantity</div>
                  <div className="font-bold">×{selected.qty}</div>
                </div>
                <div className="rounded-xl bg-muted/40 p-2">
                  <div className="text-[10px] text-muted-foreground">Category</div>
                  <div className="font-bold">{selected.category}</div>
                </div>
              </div>
              <p className="mt-3 text-left text-xs text-muted-foreground">
                A trusty {selected.name.toLowerCase()} from your adventures. Use it, sell it, or
                gift it to a friend.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 rounded-full">Use</Button>
                <Button size="sm" className="flex-1 rounded-full">Sell</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Pick an item to see details.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
