"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { type User, getCurrentUser, signOut } from "@/lib/auth-client"
import { createClient } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error refreshing user:", error)
      setUser(null)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
  }

  useEffect(() => {
    const supabase = createClient()

    // Get initial user
    refreshUser().finally(() => setLoading(false))

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await refreshUser()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
