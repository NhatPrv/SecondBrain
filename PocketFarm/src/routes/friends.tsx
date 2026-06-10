import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { friends } from "@/lib/mock-data";
import { MessageCircle, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Friends — PocketFarm" },
      { name: "description", content: "Visit your friends' farms and stay in touch." },
    ],
  }),
  component: Friends,
});

function Friends() {
  const online = friends.filter((f) => f.online).length;
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        emoji="💖"
        title="Friends"
        subtitle={`${online} online • ${friends.length} total`}
        actions={<Button className="rounded-full">Add friend</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {friends.map((f) => (
          <Card key={f.id} className="cozy-card overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <div className="relative">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent/40 to-leaf/30 text-3xl shadow-soft">
                  {f.emoji}
                </div>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card",
                    f.online ? "bg-primary" : "bg-muted-foreground/40",
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-display text-base font-bold truncate">{f.name}</div>
                  <span className="chip text-xs">Lv {f.level}</span>
                </div>
                <div className="truncate text-xs text-muted-foreground">{f.status}</div>
              </div>
            </div>
            <div className="flex gap-2 border-t bg-muted/30 p-3">
              <Button size="sm" variant="outline" className="flex-1 rounded-full">
                <MessageCircle className="mr-1.5 h-4 w-4" /> Chat
              </Button>
              <Button size="sm" className="flex-1 rounded-full" disabled={!f.online}>
                <Sprout className="mr-1.5 h-4 w-4" /> Visit farm
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
