"use client"

import { useAuth } from "@/contexts/auth-context"
import { Chatbot } from "@/components/chatbot"

export function GlobalChatbot() {
  const { user } = useAuth()

  // Only show chatbot when user is logged in
  if (!user) {
    return null
  }

  return <Chatbot />
}
