import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { marketItems } from "@/lib/mock-data";
import { Coins, Search } from "lucide-react";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — PocketFarm" },
      { name: "description", content: "Trade goods with farmers across the valley." },
    ],
  }),
  component: Market,
});

const cats = ["All", "Seeds", "Produce", "Decor", "Tools"];

function Market() {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const items = useMemo(
    () =>
      marketItems.filter(
        (i) =>
          (cat === "All" || i.category === cat) &&
          i.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [cat, q],
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        emoji="🛒"
        title="Marketplace"
        subtitle="Buy and sell with neighbors in the valley"
        actions={
          <div className="flex rounded-full border bg-card p-1">
            {(["buy", "sell"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />

      <Card className="cozy-card p-5">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search marketplace"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 rounded-full pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <Card
              key={m.id}
              className="cozy-card group overflow-hidden transition hover:-translate-y-1 hover:shadow-cozy"
            >
              <div className="grid h-32 place-items-center bg-gradient-to-br from-accent/30 to-leaf/20 text-6xl transition group-hover:scale-105">
                {m.emoji}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-base font-bold">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">by {m.seller}</div>
                  </div>
                  <span className="chip text-gold-foreground">
                    <Coins className="h-3.5 w-3.5 text-gold" />
                    {m.price}
                  </span>
                </div>
                <Button size="sm" className="mt-3 w-full rounded-full">
                  {tab === "buy" ? "Buy" : "List similar"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
