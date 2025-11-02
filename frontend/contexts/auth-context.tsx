"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useRef } from "react"
import type { User } from "@/types/auth"
import { authApi } from "@/lib/api/auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (usernameOrEmail: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  checkTokenExpiration: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto logout after 3 minutes of inactivity
  const INACTIVITY_TIMEOUT = 3 * 60 * 1000 // 30 minutes

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }

    // Set new timer only if user is authenticated
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        console.log('Auto logout due to inactivity')
        logout()
      }, INACTIVITY_TIMEOUT)
    }
  }

  const checkTokenExpiration = () => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      logout()
      return false
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const isExpired = payload.exp * 1000 < Date.now()
      if (isExpired) {
        logout()
        return false
      }
      return true
    } catch {
      logout()
      return false
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error("[v0] Error during logout:", error)
    } finally {
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
      
      // Clear storage
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("user")
      setUser(null)
    }
  }

  // Setup activity listeners
  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
      
      const handleActivity = () => {
        resetInactivityTimer()
      }

      events.forEach(event => {
        document.addEventListener(event, handleActivity)
      })

      // Initial timer setup
      resetInactivityTimer()

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity)
        })
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current)
        }
      }
    }
  }, [user]) // Only depend on user

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("access_token")
        if (token && checkTokenExpiration()) {
          const currentUser = await authApi.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.error("[v0] Failed to restore session:", error)
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (usernameOrEmail: string, password: string) => {
    const response = await authApi.login({ 
      email: usernameOrEmail,
      password: password 
    })
    
    localStorage.setItem('access_token', response.access)
    localStorage.setItem('refresh_token', response.refresh)
    
    setUser(response.user)
    resetInactivityTimer() // Start timer after login
  }

  const refreshUser = async () => {
    try {
      if (!checkTokenExpiration()) {
        throw new Error("Token expired")
      }
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
      resetInactivityTimer() // Reset timer on user refresh
    } catch (error) {
      console.error("[v0] Failed to refresh user:", error)
      await logout()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        checkTokenExpiration,
      }}
    >
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