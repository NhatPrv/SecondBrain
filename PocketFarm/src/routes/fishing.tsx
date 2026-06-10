import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RarityBadge } from "@/components/RarityBadge";
import { fishLocations, fishCollection } from "@/lib/mock-data";
import { Lock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fishing")({
  head: () => ({
    meta: [
      { title: "Fishing — PocketFarm" },
      { name: "description", content: "Cast lines at cozy ponds and discover rare fish." },
    ],
  }),
  component: Fishing,
});

function Fishing() {
  const caught = fishCollection.filter((f) => f.caught > 0).length;
  const rare = fishCollection.filter((f) => f.rarity === "legendary" && f.caught > 0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        emoji="🎣"
        title="Fishing Spots"
        subtitle={`${caught}/${fishCollection.length} species caught`}
        actions={<Button className="rounded-full">Cast a line</Button>}
      />

      <h2 className="mb-3 font-display text-lg font-bold">Locations</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {fishLocations.map((l) => (
          <Card
            key={l.id}
            className={cn(
              "cozy-card overflow-hidden p-5 transition hover:shadow-cozy",
              !l.unlocked && "opacity-60",
            )}
          >
            <div className="grid h-20 w-full place-items-center rounded-2xl bg-gradient-to-br from-water/30 to-leaf/20 text-5xl">
              {l.emoji}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="font-display text-lg font-bold">{l.name}</div>
              {!l.unlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>
            <div className="text-xs text-muted-foreground">Best: {l.best}</div>
            <Button
              size="sm"
              className="mt-3 w-full rounded-full"
              variant={l.unlocked ? "default" : "outline"}
              disabled={!l.unlocked}
            >
              {l.unlocked ? "Fish here" : "Locked"}
            </Button>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="cozy-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold">Fish collection</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {fishCollection.map((f) => {
              const caught = f.caught > 0;
              return (
                <div
                  key={f.id}
                  className={cn(
                    "rounded-2xl border bg-gradient-to-br p-3 text-center",
                    caught
                      ? "from-card to-muted/40"
                      : "from-muted/30 to-muted/10 text-muted-foreground",
                  )}
                >
                  <div className={cn("text-4xl", !caught && "grayscale opacity-40")}>
                    {f.emoji}
                  </div>
                  <div className="mt-1 text-sm font-bold">{f.name}</div>
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <RarityBadge rarity={f.rarity} />
                  </div>
                  <div className="mt-1 text-[11px]">
                    {caught ? `×${f.caught}` : "Not caught"}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="cozy-card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Trophy className="h-5 w-5 text-legendary" /> Rare showcase
          </h2>
          {rare.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              <div className="text-3xl">🌟</div>
              Catch a legendary fish to display it here.
            </div>
          ) : (
            rare.map((f) => (
              <div key={f.id} className="text-center text-5xl">{f.emoji}</div>
            ))
          )}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Largest catch</span><span className="font-bold">14.2 lb</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Best streak</span><span className="font-bold">9 in a row</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time fished</span><span className="font-bold">36h</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
