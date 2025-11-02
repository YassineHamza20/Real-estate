"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"

export function AutoLogout() {
  const { user } = useAuth()

  useEffect(() => {
    // This component just needs to be mounted on protected pages
    // The activity listeners in AuthProvider will handle the rest
  }, [user])

  return null
}