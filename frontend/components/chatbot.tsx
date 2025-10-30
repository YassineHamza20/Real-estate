"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  MessageCircle,
  Send,
  Plus,
  X,
  Trash2,
  Loader2,
  Bot,
  User,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Command
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string | number
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface Property {
  id: number
  name: string
  price: number
  city: string
  number_of_rooms: number
  size: number
  property_type: string
  description?: string
}

interface ChatSession {
  id: string
  session_id: string
  created_at: string
  updated_at: string
  messages: Message[]
  properties?: Property[]
}

interface ApiResponse {
  success: boolean
  session_id: string
  response: string
  conversation: ChatSession
  properties?: Property[]
  error?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>("")
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [assistantTyping, setAssistantTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [copiedId, setCopiedId] = useState<string | number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeSession = sessions.find((s) => s.session_id === activeSessionId)

  // === KEYBOARD SHORTCUTS ===
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(o => !o)
        if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
    window.addEventListener("keydown", down)
    return () => window.removeEventListener("keydown", down)
  }, [isOpen])

  // === PERSIST LAST SESSION ===
  useEffect(() => {
    const saved = localStorage.getItem("chatbot_lastSession")
    if (saved && sessions.find(s => s.session_id === saved)) {
      setActiveSessionId(saved)
    }
  }, [sessions])

  useEffect(() => {
    if (activeSessionId) localStorage.setItem("chatbot_lastSession", activeSessionId)
  }, [activeSessionId])

  // === AUTO-SCROLL ===
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150
      if (nearBottom || !activeSession?.messages.length) {
        setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: "smooth" }), 100)
      }
    }
  }, [activeSession?.messages, isLoading, assistantTyping])

  // === LOAD DATA ===
  useEffect(() => {
    if (isOpen) {
      loadSessions()
    }
  }, [isOpen])

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token") || sessionStorage.getItem("access_token")
    const headers: HeadersInit = { "Content-Type": "application/json" }
    if (token) headers["Authorization"] = `Bearer ${token}`
    const csrfToken = getCookie('csrftoken')
    if (csrfToken) headers['X-CSRFToken'] = csrfToken
    return headers
  }

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    return parts.length === 2 ? parts.pop()?.split(';').shift() || null : null
  }

  const loadSessions = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_BASE_URL}/chatbot/sessions/`, {
        headers: getAuthHeaders(),
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        const sessionsData = data.sessions || []
        setSessions(sessionsData)
        if (sessionsData.length > 0 && !activeSessionId) {
          setActiveSessionId(sessionsData[0].session_id)
        }
      } else if (res.status === 401) {
        setError("Please log in to use chatbot")
      }
    } catch (err) {
      setError("Connection failed")
    } finally {
      setIsLoading(false)
    }
  }

  // === CREATE NEW SESSION ===
  const createNewSession = async () => {
    try {
      setIsCreatingSession(true)
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const newSession: ChatSession = {
        id: newSessionId,
        session_id: newSessionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
        properties: []
      }

      setSessions(prev => [newSession, ...prev])
      setActiveSessionId(newSessionId)
      setInputMessage("")
      setError(null)

      try {
        await fetch(`${API_BASE_URL}/chatbot/sessions/create/`, {
          method: "POST",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify({ session_id: newSessionId }),
        })
      } catch (err) {
        console.log("Backend sync failed")
      }
    } catch (err) {
      setError("Failed to create new chat")
    } finally {
      setIsCreatingSession(false)
    }
  }

  // === SEND MESSAGE ===
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage.trim()
    setInputMessage("")
    setIsLoading(true)
    setAssistantTyping(true)
    setError(null)

    let tempId: string | number = `temp-${Date.now()}`
    let currentSessionId = activeSessionId || ""

    try {
      const tempMessage: Message = {
        id: tempId,
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      }

      if (currentSessionId && activeSession) {
        setSessions(prev =>
          prev.map(session =>
            session.session_id === currentSessionId
              ? { ...session, messages: [...session.messages, tempMessage], updated_at: new Date().toISOString() }
              : session
          )
        )
      }

      const response = await fetch(`${API_BASE_URL}/chatbot/send-message/`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ message: userMessage, session_id: currentSessionId || "" }),
      })

      if (!response.ok) throw new Error(`Error: ${response.status}`)

      const data: ApiResponse = await response.json()

      if (data.success) {
        const updatedSession = { ...data.conversation, properties: data.properties || [] }
        setSessions(prev => {
          const otherSessions = prev.filter(s => s.session_id !== data.session_id)
          return [updatedSession, ...otherSessions]
        })
        if (!currentSessionId) setActiveSessionId(data.session_id)
      } else {
        throw new Error(data.error || "Failed to send message")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send")
      if (activeSessionId && activeSession) {
        setSessions(prev => prev.map(session =>
          session.session_id === activeSessionId
            ? { ...session, messages: session.messages.filter(msg => msg.id !== tempId) }
            : session
        ))
      }
    } finally {
      setIsLoading(false)
      setAssistantTyping(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (sessions.length <= 1) {
      setError("Cannot delete the only session")
      return
    }
    try {
      setSessions(prev => prev.filter(s => s.session_id !== sessionId))
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter(s => s.session_id !== sessionId)
        setActiveSessionId(remaining[0]?.session_id || "")
      }
      await fetch(`${API_BASE_URL}/chatbot/sessions/${sessionId}/delete/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      })
    } catch (err) {
      setError("Failed to delete chat")
      loadSessions()
    }
  }

  const formatSessionTitle = (session: ChatSession) => {
    const firstUserMessage = session.messages.find((m) => m.role === "user")
    return firstUserMessage
      ? firstUserMessage.content.length > 12
        ? firstUserMessage.content.substring(0, 12) + "..."
        : firstUserMessage.content
      : "New Chat"
  }

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)

  const copyToClipboard = async (text: string, id: string | number) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const renderProperties = (properties: Property[] = []) => {
    if (!properties || properties.length === 0) return null

    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 bg-primary rounded-full"></div>
          <h4 className="text-sm font-medium text-foreground">
            Found {properties.length} propert{properties.length === 1 ? 'y' : 'ies'}
          </h4>
        </div>
        <div className="space-y-3">
          {properties.map((property) => (
            <Card key={property.id} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-foreground line-clamp-1">{property.name}</h5>
                    <p className="text-lg font-bold text-primary mt-1">{formatPrice(property.price)}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">City:</span> {property.city}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Rooms:</span> {property.number_of_rooms}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Size:</span> {property.size} m²
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          </div>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "fixed z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl",
          "bg-background border-2",
          "w-full max-w-[440px] left-4 right-4 bottom-24 md:left-auto md:right-6 md:bottom-28 md:w-[440px]",
          "max-h-[calc(100vh-8rem)] min-h-[500px]"
        )}
        style={{ maxHeight: 'calc(100vh - 8rem)', height: 'min(680px, calc(100vh - 8rem))' }}>
          
          {/* Header */}
          <CardHeader className="border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    RealEstate AI
                  </CardTitle>
                 <p className="text-xs text-muted-foreground flex items-center gap-1">
  <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
  Online
  <span className="hidden sm:inline ml-2">
    • Press <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-muted rounded border border-border">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-muted rounded border border-border">K</kbd>
  </span>
</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={createNewSession}
                  disabled={isCreatingSession}
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 hover:bg-accent"
                >
                  {isCreatingSession ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  size="sm"
                  variant="ghost"
                  className="h-9 w-9 hover:bg-accent"
                >
                  {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Error */}
          {error && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex justify-between items-center">
              <span className="flex-1 pr-2 text-xs">{error}</span>
              <Button onClick={() => setError(null)} size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-destructive/20">
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Main Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            {/* Sidebar */}
{sidebarOpen && sessions.length > 0 && (
  <div className="w-40 border-r-2 border-border bg-muted/5 flex flex-col">
    <div className="p-2 border-b border-border">
      <p className="text-xs font-medium text-center text-muted-foreground">Chats</p>
    </div>
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-2">
        {sessions.map((session) => (
          <div
            key={session.session_id}
            onClick={() => setActiveSessionId(session.session_id)}
            className={cn(
              "relative rounded-lg p-3 text-xs cursor-pointer transition-all duration-200 group border-2 min-h-[64px] overflow-visible bg-card flex flex-col justify-between pr-10",
              activeSessionId === session.session_id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            )}
          >
            <div>
              <p className="font-medium truncate mb-1 leading-tight">
                {formatSessionTitle(session)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {session.messages.length} msg{session.messages.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* DELETE BUTTON – BOTTOM, FULLY VISIBLE */}
            <Button
              onClick={(e) => {
                e.stopPropagation()
                deleteSession(session.session_id)
              }}
              size="icon"
              variant="ghost"
              className="absolute bottom-1.5 right-1.5 h-8 w-8 p-0 bg-destructive hover:bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg z-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  </div>
)}

            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {/* ALWAYS SHOW MESSAGES – NO WELCOME PAGE */}
                {activeSession ? (
                  <>
                    {activeSession.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn("flex gap-3 group", message.role === "user" ? "justify-end" : "justify-start")}
                      >
                        {message.role === "assistant" && (
                          <Avatar className="h-9 w-9 border-2 border-border">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Bot className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className="flex flex-col gap-1 max-w-[80%]">
                          <div
                            className={cn(
                              "rounded-xl px-4 py-3 shadow-sm border-2 relative group/message",
                              message.role === "user"
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background border-border text-foreground"
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            {message.role === "assistant" && activeSession.properties?.length > 0 && renderProperties(activeSession.properties)}
                            {message.role === "assistant" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/message:opacity-100 transition-opacity"
                                onClick={() => copyToClipboard(message.content, message.id)}
                              >
                                {copiedId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            )}
                          </div>
                          <p className={cn("text-xs text-muted-foreground px-1", message.role === "user" ? "text-right" : "text-left")}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>

                        {message.role === "user" && (
                          <Avatar className="h-9 w-9 border-2 border-border">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}

                    {assistantTyping && (
                      <div className="flex gap-3 justify-start">
                        <Avatar className="h-9 w-9 border-2 border-border">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Bot className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-background border-2 border-border rounded-xl px-4 py-3 shadow-sm flex items-center gap-2">
                          <div className="flex space-x-1">
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  // If no session, show empty state
                  <div className="h-full flex items-center justify-center text-center">
                    <p className="text-muted-foreground text-sm">Start a new chat with the + button</p>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder="Ask about properties..."
                    disabled={isLoading || !activeSessionId}
                    className="flex-1 h-11 border-2 focus-visible:ring-primary"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading || !activeSessionId}
                    size="icon"
                    className="h-11 w-11 bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}