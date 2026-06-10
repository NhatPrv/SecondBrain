import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { animals } from "@/lib/mock-data";
import { Heart, Utensils, Sparkles } from "lucide-react";

export const Route = createFileRoute("/animals")({
  head: () => ({
    meta: [
      { title: "Animals — PocketFarm" },
      { name: "description", content: "Care for your barnyard friends and collect their goods." },
    ],
  }),
  component: Animals,
});

function Animals() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        emoji="🐮"
        title="Animal Friends"
        subtitle={`${animals.length} animals in your barn`}
        actions={
          <Button className="rounded-full">
            <Utensils className="mr-2 h-4 w-4" />
            Feed all
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {animals.map((a) => (
          <Card key={a.id} className="cozy-card overflow-hidden">
            <div className="relative flex items-center gap-4 bg-gradient-to-br from-accent/30 to-leaf/20 p-5">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-card text-5xl shadow-cozy">
                {a.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-xl font-bold">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.species} • produces {a.produces}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={`chip ${a.fed ? "text-primary" : "text-destructive"}`}>
                    <Utensils className="h-3 w-3" />
                    {a.fed ? "Fed" : "Hungry"}
                  </span>
                  {a.ready && (
                    <span className="chip text-legendary">
                      <Sparkles className="h-3 w-3" />
                      Ready
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-bold text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3 w-3 text-destructive" /> Happiness
                  </span>
                  <span className="font-bold">{a.happy}%</span>
                </div>
                <Progress value={a.happy} className="h-2 [&>div]:bg-destructive" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 rounded-full">
                  Pet
                </Button>
                <Button size="sm" className="flex-1 rounded-full" disabled={!a.ready}>
                  Collect
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
