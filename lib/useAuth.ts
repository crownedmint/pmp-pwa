"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"

export interface UserSession {
  id: string
  name: string
  email: string
  role?: string
  image?: string
  phone?: string
  shippingAddress?: string
  billingAddress?: string
  subscriptionTier?: string
  alerts?: {
    price: boolean
    drops: boolean
    escrow: boolean
    chat: boolean
  }
}

interface AuthContextType {
  user: UserSession | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

// Global cache to avoid duplicate session requests
let globalUser: UserSession | null = null
let globalLoading = true
const listeners = new Set<() => void>()

export function useAuth() {
  const [user, setUser] = useState<UserSession | null>(globalUser)
  const [loading, setLoading] = useState(globalLoading)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session")
      const data = await res.json()
      globalUser = data.user
    } catch (err) {
      console.error("Auth session check failed:", err)
      globalUser = null
    } finally {
      globalLoading = false
      setLoading(false)
      setUser(globalUser)
      // Notify all other instances of this hook
      listeners.forEach(l => l())
    }
  }, [])

  useEffect(() => {
    const handleUpdate = () => {
      setUser(globalUser)
      setLoading(globalLoading)
    }
    listeners.add(handleUpdate)

    if (globalLoading) {
      refresh()
    } else {
      setLoading(false)
      setUser(globalUser)
    }

    return () => {
      listeners.delete(handleUpdate)
    }
  }, [refresh])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (err) {
      console.error("Logout failed:", err)
    } finally {
      globalUser = null
      setUser(null)
      listeners.forEach(l => l())
    }
  }, [])

  return { user, loading, refresh, logout }
}
