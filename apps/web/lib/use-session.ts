"use client"

import { useEffect, useState } from "react"
import type { SessionUser } from "@workspace/types"

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_API_URL
    if (!api) {
      setLoading(false)
      return
    }

    let cancelled = false

    fetch(`${api.replace(/\/$/, "")}/auth/me`, {
      credentials: "include",
    })
      .then(async (response) => {
        if (cancelled) return
        if (!response.ok) {
          setUser(null)
          return
        }
        setUser((await response.json()) as SessionUser)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { user, loading }
}
