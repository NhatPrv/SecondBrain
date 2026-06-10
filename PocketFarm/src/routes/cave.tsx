import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { caveFloors, monsters } from "@/lib/mock-data";
import { Lock, Skull, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cave")({
  head: () => ({
    meta: [
      { title: "Cave Adventure — PocketFarm" },
      { name: "description", content: "Descend the dungeon, defeat monsters, collect loot." },
    ],
  }),
  component: Cave,
});

function Cave() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        emoji="🗝️"
        title="Cave Adventure"
        subtitle="Explore 5 dungeon floors, defeat monsters, and gather rare resources."
        actions={<Button className="rounded-full"><Swords className="mr-2 h-4 w-4" /> Enter cave</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="cozy-card overflow-hidden lg:col-span-2">
          <div className="relative flex h-56 items-end justify-between overflow-hidden bg-gradient-to-br from-soil/70 via-foreground/40 to-foreground/80 p-6 text-primary-foreground">
            <div className="absolute inset-0 bg-[radial-gradient(800px_300px_at_50%_120%,_oklch(0.75_0.18_60/_0.5),_transparent_60%)]" />
            <div className="relative">
              <div className="text-xs font-bold uppercase opacity-80">Current run</div>
              <div className="font-display text-3xl font-bold">Crystal Hollow • Floor 8</div>
              <div className="mt-1 text-sm opacity-80">Boss in 2 floors</div>
            </div>
            <div className="relative text-7xl">🕯️</div>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-bold text-muted-foreground">HP</span>
                <span className="font-bold">82 / 120</span>
              </div>
              <Progress value={68} className="h-2 [&>div]:bg-destructive" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-bold text-muted-foreground">Stamina</span>
                <span className="font-bold">45 / 60</span>
              </div>
              <Progress value={75} className="h-2 [&>div]:bg-energy" />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 rounded-full">Continue</Button>
              <Button variant="outline" className="flex-1 rounded-full">Retreat</Button>
            </div>
          </div>
        </Card>

        <Card className="cozy-card p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Floors</h2>
          <div className="space-y-2">
            {caveFloors.map((f) => (
              <div
                key={f.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3",
                  f.cleared ? "bg-primary/10" : "bg-muted/30",
                )}
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-card text-lg">
                  {f.cleared ? "✅" : <Lock className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold">{f.name}</div>
                  <div className="text-[11px] text-muted-foreground">Floors {f.floor}</div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: f.danger }).map((_, i) => (
                    <Skull key={i} className="h-3.5 w-3.5 text-destructive" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="cozy-card p-5 lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-bold">Monsters nearby</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {monsters.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3",
                  m.boss
                    ? "bg-gradient-to-br from-destructive/15 to-epic/15"
                    : "bg-muted/30",
                )}
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-card text-3xl">
                  {m.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{m.name}</span>
                    {m.boss && (
                      <span className="chip border-destructive/40 bg-destructive/10 text-destructive">
                        BOSS
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">HP {m.hp}</div>
                  <div className="mt-1 flex gap-1 text-base">
                    {m.loot.map((x, i) => (
                      <span key={i}>{x}</span>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant={m.boss ? "default" : "outline"} className="rounded-full">
                  Fight
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="cozy-card p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Resources gathered</h2>
          <div className="grid grid-cols-3 gap-2">
            {["💎", "⛏️", "🪨", "🟩", "🟪", "🪙"].map((e, i) => (
              <div key={i} className="rounded-2xl bg-muted/40 p-3 text-center">
                <div className="text-2xl">{e}</div>
                <div className="text-[11px] font-bold">×{(i + 1) * 3}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
