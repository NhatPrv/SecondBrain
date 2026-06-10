"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { api, clearAuth, getCachedUser, getToken } from "@/lib/api"
import { getSocket, disconnectSocket } from "@/lib/socket"
import { Loader2 } from "lucide-react"

interface AuthContextType {
  user: any
  loading: boolean
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const logout = () => {
    clearAuth()
    disconnectSocket()
    setUser(null)
    router.push("/login")
  }

  const refreshUser = async () => {
    try {
      const u = await api.auth.me()
      setUser(u)
      // Cache details
      localStorage.setItem('user', JSON.stringify(u))
    } catch (err) {
      logout()
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      const isAuthPage = pathname === "/login" || pathname === "/signup"
      const token = getToken()
      const cached = getCachedUser()

      if (!token) {
        setLoading(false)
        if (!isAuthPage) {
          router.push("/login")
        }
        return
      }

      if (cached) {
        setUser(cached)
      }

      try {
        // Validate token against backend
        const meUser = await api.auth.me()
        setUser(meUser)
        localStorage.setItem('user', JSON.stringify(meUser))
        
        // Initialize Socket.IO connection
        const socket = getSocket()
        if (!socket.connected) {
          socket.connect()
        }
      } catch (err) {
        console.error("Auth validation failed:", err)
        logout()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [pathname])

  // Protect pages that require auth
  useEffect(() => {
    const token = getToken()
    const isAuthPage = pathname === "/login" || pathname === "/signup"

    if (!loading) {
      if (!token && !isAuthPage) {
        router.push("/login")
      } else if (token && isAuthPage) {
        router.push("/")
      }
    }
  }, [pathname, loading])

  const isAuthPage = pathname === "/login" || pathname === "/signup"

  if ((loading || !user) && !isAuthPage) {
    return (
      <div className="flex h-svh w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Syncing workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context;
}
