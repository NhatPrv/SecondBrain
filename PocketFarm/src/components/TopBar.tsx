import { Bell, Coins, Heart, Search, Sparkles, Zap, Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { player } from "@/lib/mock-data";
import { useEffect, useState } from "react";

function Stat({
  icon,
  value,
  label,
  className,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`hidden items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 shadow-soft backdrop-blur sm:flex ${className ?? ""}`}
      title={label}
    >
      {icon}
      <span className="font-display text-sm font-bold">{value}</span>
    </div>
  );
}

export function TopBar() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/70 px-3 backdrop-blur md:px-6">
      <SidebarTrigger className="rounded-xl" />

      <div className="relative ml-1 hidden max-w-sm flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search crops, fish, friends…" className="h-10 rounded-full pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Stat icon={<Coins className="h-4 w-4 text-gold" />} value={player.gold.toLocaleString()} label="Gold" />
        <Stat icon={<Sparkles className="h-4 w-4 text-rare" />} value={player.gems} label="Gems" />
        <Stat icon={<Zap className="h-4 w-4 text-energy" />} value={`${player.energy}/${player.maxEnergy}`} label="Energy" />
        <Stat icon={<Heart className="h-4 w-4 text-destructive" />} value={`Lv ${player.level}`} label="Level" />

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <Avatar className="h-9 w-9 ring-2 ring-primary/30">
          <AvatarFallback className="bg-gradient-to-br from-leaf to-primary text-lg">
            {player.avatar}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
