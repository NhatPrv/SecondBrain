import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { player, achievements, collections, stats } from "@/lib/mock-data";
import { CheckCircle2, Edit3, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — PocketFarm" },
      { name: "description", content: "Your achievements, statistics, and collection progress." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const xpPct = (player.xp / player.xpToNext) * 100;
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader emoji="👤" title="Profile" />

      <Card className="cozy-card overflow-hidden">
        <div className="relative h-32 bg-gradient-to-br from-leaf/40 via-accent/40 to-water/40" />
        <div className="-mt-12 flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl border-4 border-card bg-gradient-to-br from-leaf to-primary text-5xl shadow-cozy">
            {player.avatar}
          </div>
          <div className="flex-1">
            <div className="font-display text-2xl font-bold">{player.name}</div>
            <div className="text-sm text-muted-foreground">{player.title} • Level {player.level}</div>
            <div className="mt-2 max-w-md">
              <Progress value={xpPct} className="h-2 [&>div]:bg-xp" />
              <div className="mt-1 text-[11px] text-muted-foreground">
                {player.xp.toLocaleString()} / {player.xpToNext.toLocaleString()} XP to Lv {player.level + 1}
              </div>
            </div>
          </div>
          <Button variant="outline" className="rounded-full">
            <Edit3 className="mr-2 h-4 w-4" /> Edit profile
          </Button>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="cozy-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold">Achievements</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3",
                  a.done ? "bg-primary/10" : "bg-muted/30",
                )}
              >
                <div
                  className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl",
                    a.done ? "bg-card shadow-soft" : "bg-card/60 grayscale opacity-60",
                  )}
                >
                  {a.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{a.name}</span>
                    {a.done ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{a.desc}</div>
                  {!a.done && a.goal && (
                    <>
                      <Progress
                        value={((a.progress ?? 0) / a.goal) * 100}
                        className="mt-1.5 h-1.5"
                      />
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {a.progress}/{a.goal}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="cozy-card p-5">
            <h2 className="mb-4 font-display text-lg font-bold">Collections</h2>
            <div className="space-y-4">
              {collections.map((c) => {
                const pct = (c.owned / c.total) * 100;
                return (
                  <div key={c.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-bold">{c.name}</span>
                      <span className="text-muted-foreground">{c.owned}/{c.total}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="cozy-card p-5">
            <h2 className="mb-3 font-display text-lg font-bold">Lifetime stats</h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-muted/30 p-3">
                  <div className="text-2xl">{s.emoji}</div>
                  <div className="mt-1 font-display text-lg font-bold">
                    {s.value.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
