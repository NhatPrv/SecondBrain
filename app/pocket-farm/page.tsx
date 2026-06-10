"use client"

import { useState } from "react"
import { PageHeader } from "./components/PageHeader"
import { Card } from "@/components/ui/card"
import { Progress } from "./components/Progress"
import { Button } from "@/components/ui/button"
import { RarityBadge } from "./components/RarityBadge"
import { RewardPopup } from "./components/RewardPopup"
import { usePocketFarm } from "./context"
import { api } from "@/lib/api"
import { Coins, Sparkles, Zap, Trophy, CheckCircle2, Flame, Gift } from "lucide-react"

export default function Dashboard() {
  const {
    profile,
    quests,
    recentRewards,
    stats,
    setProfile,
    showToast,
    refreshData
  } = usePocketFarm()

  const [rewardOpen, setRewardOpen] = useState(false)
  const [rewardDetails, setRewardDetails] = useState({
    emoji: "🎁",
    title: "Daily Gift",
    description: "Claim your daily gift to receive bonus items.",
    rewards: [] as { label: string; color: string }[]
  })

  if (!profile) return null

  const xpPct = (profile.xp / profile.xpToNext) * 100
  const enPct = (profile.energy / profile.maxEnergy) * 100

  // Hardcoded mock notifications for display consistency
  const notifications = [
    { id: 1, text: "Bella the cow is ready to milk!", emoji: "🐮", time: "5m" },
    { id: 2, text: "Tomatoes are fully grown", emoji: "🍅", time: "22m" },
    { id: 3, text: "Pip sent you 200 gold", emoji: "💌", time: "1h" },
  ]

  const handleClaimDaily = async () => {
    try {
      const res = await api.games.claimDaily()
      if (res.success) {
        setProfile(res.player)
        setRewardDetails({
          emoji: "🎁",
          title: "Daily Gift Claimed!",
          description: "Your daily farm supplies have arrived.",
          rewards: [
            { label: `+${res.goldAdded} Gold`, color: "text-gold" },
            { label: `+${res.energyAdded} Energy`, color: "text-energy" }
          ]
        })
        setRewardOpen(true)
        showToast("Daily gift claimed successfully!", "success")
        refreshData()
      }
    } catch (err: any) {
      showToast(err.message || "Failed to claim daily gift", "error")
    }
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
      <PageHeader
        emoji="👋"
        title={`Welcome back, ${profile.user?.name || "Farmer"}!`}
        subtitle={`${profile.title} • ${profile.streak} day streak`}
        actions={
          <Button
            onClick={handleClaimDaily}
            className="rounded-full bg-gradient-to-r from-accent to-legendary text-accent-foreground shadow-cozy hover:opacity-90 transition-transform duration-300 active:scale-95"
          >
            <Gift className="mr-2 h-4 w-4" />
            Claim daily gift
          </Button>
        }
      />

      {/* Hero stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="cozy-card overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-muted-foreground">Level</div>
              <div className="font-display text-3xl font-bold">{profile.level}</div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-xp/15 text-xp">
              <Trophy />
            </div>
          </div>
          <div className="mt-3">
            <Progress value={xpPct} className="h-2 [&>div]:bg-xp" />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground font-sans">
              <span>{profile.xp.toLocaleString()} XP</span>
              <span>{profile.xpToNext.toLocaleString()} XP</span>
            </div>
          </div>
        </Card>

        <Card className="cozy-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-muted-foreground">Gold</div>
              <div className="font-display text-3xl font-bold">{profile.gold.toLocaleString()}</div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/20 text-gold-foreground">
              <Coins />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground font-sans">+340 today</div>
        </Card>

        <Card className="cozy-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-muted-foreground">Energy</div>
              <div className="font-display text-3xl font-bold">
                {profile.energy}
                <span className="text-base text-muted-foreground">/{profile.maxEnergy}</span>
              </div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-energy/20 text-energy">
              <Zap />
            </div>
          </div>
          <Progress value={enPct} className="mt-3 h-2 [&>div]:bg-energy" />
        </Card>

        <Card className="cozy-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-muted-foreground">Streak</div>
              <div className="font-display text-3xl font-bold">{profile.streak}d</div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sunset/20 text-sunset">
              <Flame />
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground font-sans">Keep it growing!</div>
        </Card>
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Daily quests */}
        <Card className="cozy-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Daily Quests</h2>
            <span className="chip">Resets daily</span>
          </div>
          <div className="space-y-3">
            {quests.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground font-sans">
                No quests active at the moment.
              </div>
            ) : (
              quests.map((q) => {
                const pct = (q.progress / q.goal) * 100
                const done = q.done || q.progress >= q.goal
                return (
                  <div
                    key={q.id}
                    className="flex items-center gap-3 rounded-2xl border bg-muted/30 p-3"
                  >
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-xl ${done ? "bg-primary/20 text-primary" : "bg-accent/30"}`}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-bold text-sm">{q.title}</div>
                        <span className="text-xs font-bold text-muted-foreground font-sans">
                          {q.progress}/{q.goal}
                        </span>
                      </div>
                      <Progress value={pct} className="mt-1.5 h-1.5 [&>div]:bg-primary" />
                    </div>
                    <div
                      className={`chip ${q.type === "gold" ? "text-gold-foreground" : q.type === "xp" ? "text-xp" : "text-rare"}`}
                    >
                      +{q.reward} {q.type}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="cozy-card p-5">
          <h2 className="mb-4 font-display text-lg font-bold">Notifications</h2>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-2xl bg-muted/30 p-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-card text-lg">
                  {n.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-snug">{n.text}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-sans">{n.time} ago</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent rewards */}
        <Card className="cozy-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold">Recent Rewards</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recentRewards.map((r) => (
              <div
                key={r.id}
                className="group flex flex-col items-center gap-2 rounded-2xl border bg-gradient-to-br from-card to-muted/40 p-4 text-center transition hover:shadow-cozy"
              >
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-card text-3xl shadow-soft transition group-hover:scale-110">
                  {r.emoji}
                </div>
                <div className="text-sm font-bold truncate max-w-full">{r.label}</div>
                <RarityBadge rarity={r.rarity} />
                <div className="text-[11px] text-muted-foreground font-sans">{r.time}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Statistics */}
        <Card className="cozy-card p-5">
          <h2 className="mb-4 font-display text-lg font-bold">Statistics</h2>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-muted/30 p-3">
                <div className="text-2xl">{s.emoji}</div>
                <div className="mt-1 font-display text-xl font-bold">{s.value.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground font-sans">{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <RewardPopup
        open={rewardOpen}
        onOpenChange={setRewardOpen}
        emoji={rewardDetails.emoji}
        title={rewardDetails.title}
        description={rewardDetails.description}
        rewards={rewardDetails.rewards}
      />
    </div>
  )
}
