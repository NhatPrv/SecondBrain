import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function RewardPopup({
  open,
  onOpenChange,
  emoji = "🥕",
  title = "Golden Carrot!",
  description = "You harvested a legendary crop.",
  rewards = [
    { label: "+250 XP", color: "text-xp" },
    { label: "+120 Gold", color: "text-gold" },
  ],
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  emoji?: string;
  title?: string;
  description?: string;
  rewards?: { label: string; color: string }[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm overflow-hidden rounded-3xl border-0 p-0 shadow-pop">
        <div className="relative bg-gradient-to-br from-accent/50 via-background to-leaf/30 p-6 text-center">
          <Sparkles className="absolute left-4 top-4 h-5 w-5 text-legendary animate-pulse" />
          <Sparkles className="absolute right-6 top-8 h-4 w-4 text-rare animate-pulse" />
          <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-legendary/40 to-accent/40 text-6xl shadow-pop animate-bounce">
            {emoji}
          </div>
          <DialogTitle className="mt-4 font-display text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {description}
          </DialogDescription>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {rewards.map((r) => (
              <span
                key={r.label}
                className={`rounded-full border bg-card px-3 py-1 text-sm font-bold ${r.color}`}
              >
                {r.label}
              </span>
            ))}
          </div>
          <Button
            className="mt-5 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => onOpenChange(false)}
          >
            Claim reward
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
