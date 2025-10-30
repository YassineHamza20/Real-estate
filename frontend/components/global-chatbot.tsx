"use client"

import { useAuth } from "@/contexts/auth-context"
import { Chatbot } from "@/components/chatbot"

interface GlobalChatbotProps {
  className?: string
}

export function GlobalChatbot({ className }: GlobalChatbotProps) {
  const { user } = useAuth()

  // Only show chatbot when user is logged in
  if (!user) {
    return null
  }

  return <Chatbot className={className} />
}