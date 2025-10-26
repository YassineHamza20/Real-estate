"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, Send, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
    },
  ])
  const [activeSessionId, setActiveSessionId] = useState("1")
  const [inputMessage, setInputMessage] = useState("")

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `Chat ${sessions.length + 1}`,
      messages: [],
      createdAt: new Date(),
    }
    setSessions([...sessions, newSession])
    setActiveSessionId(newSession.id)
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !activeSession) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    // Simulate bot response
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "Thank you for your message. This is a placeholder response. The backend will be integrated later.",
      sender: "bot",
      timestamp: new Date(),
    }

    setSessions(
      sessions.map((session) =>
        session.id === activeSessionId
          ? { ...session, messages: [...session.messages, userMessage, botMessage] }
          : session,
      ),
    )

    setInputMessage("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 p-0"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-2">
          <CardHeader className="border-b bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Chat Assistant
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={createNewSession}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Sessions Sidebar */}
            <div className="w-24 border-r bg-muted/30 overflow-y-auto">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={cn(
                    "w-full p-3 text-xs border-b hover:bg-muted/50 transition-colors text-left",
                    activeSessionId === session.id && "bg-muted/70 border-l-2 border-l-primary",
                  )}
                >
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-muted-foreground mt-1">{session.messages.length} msgs</div>
                </button>
              ))}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                {activeSession?.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <MessageCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Start a conversation</h3>
                    <p className="text-sm text-muted-foreground">
                      Ask me anything about properties, listings, or how to use the platform
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeSession?.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn("flex gap-3", message.sender === "user" ? "justify-end" : "justify-start")}
                      >
                        {message.sender === "bot" && (
                          <Avatar className="h-8 w-8 border-2">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">AI</AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2",
                            message.sender === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground border",
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {message.sender === "user" && (
                          <Avatar className="h-8 w-8 border-2">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">You</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <CardContent className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="icon" disabled={!inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
