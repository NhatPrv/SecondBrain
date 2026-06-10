"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"

interface Stat {
  label: string
  value: number
  emoji: string
}

interface Crop {
  id: string
  name: string
  emoji: string
  category: string
  rarity: string
  growthTimeSeconds: number
  buyPrice: number
  sellPrice: number
  xpReward: number
}

interface Plot {
  id: string
  farmId: string
  index: number
  state: "empty" | "seeded" | "growing" | "ready"
  cropId: string | null
  plantedAt: string | null
  lastWateredAt: string | null
  watered: boolean
  crop: Crop | null
}

interface Animal {
  id: string
  name: string
  species: string
  emoji: string
  produces: string
  productionTimeSeconds: number
  buyPrice: number
  feedCost: number
}

interface AnimalInstance {
  id: string
  name: string
  species: string
  emoji: string
  happy: number
  fed: boolean
  ready: boolean
  produces: string
}

interface Fish {
  id: string
  name: string
  emoji: string
  rarity: string
  baseValue: number
  unlocked: boolean
}

interface InventoryItem {
  id: string
  userId: string
  name: string
  emoji: string
  qty: number
  category: string
  rarity: string
}

interface Quest {
  id: string
  title: string
  progress: number
  goal: number
  reward: number
  type: "gold" | "xp" | "gem"
  done: boolean
}

interface Achievement {
  id: string
  name: string
  desc: string
  emoji: string
  progress: number
  goal: number
  done: boolean
}

interface PlayerProfile {
  id: string
  userId: string
  title: string
  level: number
  xp: number
  xpToNext: number
  gold: number
  gems: number
  energy: number
  maxEnergy: number
  streak: number
  avatar: string
}

interface Farm {
  id: string
  userId: string
  name: string
  level: number
  plots: Plot[]
}

export interface PocketNotification {
  id: string
  message: string
  type: "success" | "error" | "info" | "harvest"
  emoji?: string
  rewards?: { label: string; color: string }[]
}

interface PocketFarmContextType {
  loading: boolean
  profile: PlayerProfile | null
  farm: Farm | null
  inventory: InventoryItem[]
  quests: Quest[]
  achievements: Achievement[]
  recentRewards: any[]
  stats: Stat[]
  notifications: PocketNotification[]
  refreshData: () => Promise<void>
  showToast: (
    message: string,
    type?: "success" | "error" | "info" | "harvest",
    emoji?: string,
    rewards?: { label: string; color: string }[]
  ) => void
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile | null>>
  setFarm: React.Dispatch<React.SetStateAction<Farm | null>>
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>
  setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>
}

const PocketFarmContext = createContext<PocketFarmContextType | undefined>(undefined)

export function PocketFarmProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [farm, setFarm] = useState<Farm | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [recentRewards, setRecentRewards] = useState<any[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [notifications, setNotifications] = useState<PocketNotification[]>([])

  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" | "harvest" = "info",
      emoji?: string,
      rewards?: { label: string; color: string }[]
    ) => {
      const id = Math.random().toString(36).substring(2, 9)
      setNotifications((prev) => {
        const nextList = [...prev, { id, message, type, emoji, rewards }]
        if (nextList.length > 5) {
          return nextList.slice(nextList.length - 5)
        }
        return nextList
      })

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, 5000)
    },
    []
  )

  const refreshData = useCallback(async () => {
    try {
      const data = await api.games.getProfile()
      setProfile(data.player)
      setFarm(data.farm)
      setInventory(data.inventory)
      setQuests(data.quests)
      setAchievements(data.achievements)
      setRecentRewards(data.recentRewards)
      setStats(data.stats)
    } catch (err: any) {
      console.error("Failed to load Pocket Farm profile:", err)
      showToast(err.message || "Failed to sync farm data", "error")
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  return (
    <PocketFarmContext.Provider
      value={{
        loading,
        profile,
        farm,
        inventory,
        quests,
        achievements,
        recentRewards,
        stats,
        notifications,
        refreshData,
        showToast,
        setProfile,
        setFarm,
        setInventory,
        setQuests,
        setAchievements,
      }}
    >
      {children}
    </PocketFarmContext.Provider>
  )
}

export function usePocketFarm() {
  const context = useContext(PocketFarmContext)
  if (context === undefined) {
    throw new Error("usePocketFarm must be used within a PocketFarmProvider")
  }
  return context
}
