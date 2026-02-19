"use client"

import { useEffect, useState } from "react"

type AuthUser = {
  id: string
  email?: string
  user_metadata?: Record<string, any>
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        })
        const payload = await response.json()
        if (!mounted) {
          return
        }
        setUser(payload?.authenticated ? payload.user : null)
      } catch {
        if (!mounted) {
          return
        }
        setUser(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void getUser()

    const onFocus = () => {
      void getUser()
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void getUser()
      }
    }

    window.addEventListener("focus", onFocus)
    window.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      mounted = false
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])

  return { user, loading }
}

