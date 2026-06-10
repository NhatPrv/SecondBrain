import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cropPlots, buildings, decor } from "@/lib/mock-data";
import { Droplets, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/farm")({
  head: () => ({
    meta: [
      { title: "Farm — PocketFarm" },
      { name: "description", content: "Tend your crops, build structures, and decorate your farm." },
    ],
  }),
  component: Farm,
});

function Plot({ p }: { p: (typeof cropPlots)[number] }) {
  const tone =
    p.state === "ready"
      ? "from-legendary/40 to-accent/30 ring-legendary/40"
      : p.state === "growing"
        ? "from-leaf/30 to-primary/20 ring-primary/30"
        : p.state === "seeded"
          ? "from-soil/20 to-muted/30 ring-border"
          : "from-muted/40 to-muted/20 ring-border";
  return (
    <button
      className={cn(
        "group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br p-2 ring-1 transition hover:scale-[1.03] hover:shadow-cozy",
        tone,
      )}
    >
      <div className="absolute inset-0 grid place-items-center text-3xl sm:text-4xl">
        {p.crop ?? "🟫"}
      </div>
      {p.state === "growing" && (
        <div className="absolute inset-x-1 bottom-1 h-1.5 overflow-hidden rounded-full bg-card/60">
          <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
        </div>
      )}
      {p.state === "ready" && (
        <div className="absolute right-1 top-1 rounded-full bg-legendary px-1.5 py-0.5 text-[9px] font-bold text-gold-foreground shadow-soft">
          READY
        </div>
      )}
    </button>
  );
}

function Farm() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        emoji="🌱"
        title="Your Farm"
        subtitle="24 plots • 4 buildings • Spring season"
        actions={
          <>
            <Button variant="outline" className="rounded-full">
              <Droplets className="mr-2 h-4 w-4" /> Water all
            </Button>
            <Button className="rounded-full">
              <Sprout className="mr-2 h-4 w-4" /> Plant seeds
            </Button>
          </>
        }
      />

      <Tabs defaultValue="plots">
        <TabsList className="rounded-full">
          <TabsTrigger value="plots" className="rounded-full">Crop plots</TabsTrigger>
          <TabsTrigger value="buildings" className="rounded-full">Buildings</TabsTrigger>
          <TabsTrigger value="decor" className="rounded-full">Decorations</TabsTrigger>
        </TabsList>

        <TabsContent value="plots">
          <Card className="cozy-card overflow-hidden p-4 md:p-6">
            <div className="rounded-3xl bg-gradient-to-br from-leaf/15 via-card to-accent/15 p-4 md:p-6">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3 md:grid-cols-8">
                {cropPlots.map((p) => (
                  <Plot key={p.id} p={p} />
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="chip"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Empty</span>
              <span className="chip"><span className="h-2 w-2 rounded-full bg-soil" /> Seeded</span>
              <span className="chip"><span className="h-2 w-2 rounded-full bg-primary" /> Growing</span>
              <span className="chip"><span className="h-2 w-2 rounded-full bg-legendary" /> Ready</span>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="buildings">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {buildings.map((b) => (
              <Card key={b.id} className="cozy-card p-5 text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-accent/40 to-leaf/30 text-4xl shadow-soft">
                  {b.emoji}
                </div>
                <div className="mt-3 font-display text-lg font-bold">{b.name}</div>
                <div className="text-xs text-muted-foreground">Level {b.level}</div>
                <Button size="sm" variant="outline" className="mt-3 rounded-full">
                  Upgrade
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="decor">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-8">
            {decor.map((d) => (
              <Card key={d.id} className="cozy-card grid aspect-square place-items-center text-4xl">
                {d.emoji}
              </Card>
            ))}
            <Card className="cozy-card grid aspect-square place-items-center text-3xl text-muted-foreground">
              +
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
