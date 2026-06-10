import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  common: "bg-muted text-muted-foreground border-border",
  rare: "bg-rare/15 text-rare border-rare/30",
  epic: "bg-epic/15 text-epic border-epic/30",
  legendary: "bg-legendary/20 text-legendary border-legendary/40",
};

export function RarityBadge({ rarity, className }: { rarity: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        map[rarity] ?? map.common,
        className,
      )}
    >
      {rarity}
    </span>
  );
}
