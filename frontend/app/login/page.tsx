"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, AlertCircle, Eye, EyeOff, User, Lock, 
  CheckCircle2, XCircle, Shield, TrendingUp, Users, Loader2
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Form Schema
const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
  rememberMe: z.boolean().default(false),
})

type LoginFormData = z.infer<typeof loginSchema>

// Declare google on window
declare global {
  interface Window {
    google: any;
  }
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false)
// Add this state
const [googleStatus, setGoogleStatus] = useState<'checking' | 'ready' | 'configuring'>('checking')

// Add this useEffect to check Google status
useEffect(() => {
  const checkGoogleStatus = () => {
    if (window.google) {
      setGoogleStatus('ready')
    } else {
      setGoogleStatus('configuring')
    }
  }

  if (googleScriptLoaded) {
    checkGoogleStatus()
  }
}, [googleScriptLoaded])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  })

  // Load Google Script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) {
        setGoogleScriptLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
       // console.log('Google Identity Services loaded successfully')
        setGoogleScriptLoaded(true)
      }
      script.onerror = () => {
        console.error('Failed to load Google Identity Services')
        setError('Failed to load Google authentication. Please refresh the page.')
      }
      document.head.appendChild(script)
    }

    setMounted(true)
    loadGoogleScript()
  }, [])

  const onSubmit = async (data: LoginFormData) => {
    setError("")
    setIsLoading(true)

    try {
      await login(data.usernameOrEmail, data.password)
      router.push("/properties")
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }



  // Add this temporary function to test backend while waiting for Google
const testBackendWhileWaiting = async () => {
  setError("")
  setGoogleLoading(true)
  
  try {
    // Get CSRF token
    const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/csrf/`)
    const csrfData = await csrfResponse.json()
    
    // Test backend connection
    const testResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/test/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfData.csrfToken,
      },
      body: JSON.stringify({
        test_data: "Testing backend while waiting for Google"
      }),
    })
    
    const testData = await testResponse.json()
    console.log('Backend test:', testData)
    
    if (testData.success) {
      setError('✅ Backend is working! Waiting for Google OAuth configuration...')
    } else {
      setError('Backend test failed: ' + testData.error)
    }
    
  } catch (error: any) {
    setError('Connection failed: ' + error.message)
  } finally {
    setGoogleLoading(false)
  }
}
const handleGoogleLogin = async () => {
  setError("")
  setGoogleLoading(true)

  try {
    // Get CSRF token first
    const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/csrf/`)
    const csrfData = await csrfResponse.json()

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (response: any) => {
        try {
          if (response.error) {
            throw new Error(`Google auth error: ${response.error}`)
          }

          if (!response.access_token) {
            throw new Error('No access token received from Google')
          }

          console.log('🔐 Google access token received, sending to backend...')

          // Send to your backend
          const authResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfData.csrfToken,
            },
            credentials: 'include',
            body: JSON.stringify({
              access_token: response.access_token
            }),
          })

          const data = await authResponse.json()
          console.log('🔐 Backend authentication response:', data)
          
          if (data.success) {
            // Store tokens properly - for both old and new systems
            if (data.tokens) {
              localStorage.setItem('access_token', data.tokens.access)
              localStorage.setItem('refresh_token', data.tokens.refresh)
              localStorage.setItem('auth_token', data.tokens.access) // For compatibility
              
              // console.log('✅ Tokens stored:')
              // console.log('   - access_token:', data.tokens.access ? '✓' : '✗')
              // console.log('   - auth_token:', data.tokens.access ? '✓' : '✗')
              // console.log('   - refresh_token:', data.tokens.refresh ? '✓' : '✗')
            }
            
            // Update auth context state
            if (data.user) {
              // If you have an auth context, update it
              // This depends on your auth context implementation
              console.log('✅ User authenticated:', data.user.email)
            }
            
            // Redirect to properties
            window.location.href = data.redirect_url || '/properties'
          } else {
            throw new Error(data.error || 'Authentication failed')
          }
        } catch (error: any) {
          console.error('Google auth error:', error)
          setError(error.message)
        } finally {
          setGoogleLoading(false)
        }
      }
    })

    client.requestAccessToken()

  } catch (error: any) {
    console.error('Google login error:', error)
    setError(error.message)
    setGoogleLoading(false)
  }
}





  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 relative overflow-hidden">
      {/* Simplified Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-8">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">WohnTräume</h1>
              <p className="text-muted-foreground text-sm">Premium Property Platform</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Welcome back to your{" "}
              <span className="text-primary">property journey</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Access your dashboard to manage properties, track offers, and connect with buyers or sellers.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { icon: Users, value: "10K+", label: "Users" },
              { icon: Shield, value: "100%", label: "Verified" },
              { icon: TrendingUp, value: "4.9", label: "Rating" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3 pt-6">
            {[
              "Manage listings in real-time",
              "Direct client communication",
              "AI-powered market insights",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="w-full border shadow-xl bg-background/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex items-center justify-center gap-3 mb-2 lg:hidden">
              <div className="p-2 rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">WohnTräume</CardTitle>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Enter your credentials to access your account
              </CardDescription>
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert variant="destructive" className="bg-destructive/5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username/Email */}
              <div className="space-y-2">
                <Label htmlFor="usernameOrEmail" className="font-medium">
                  Username or Email
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    placeholder="Enter username or email"
                    {...register("usernameOrEmail")}
                    disabled={isLoading || googleLoading}
                    className={cn(
                      "h-11 pl-10 pr-4",
                      errors.usernameOrEmail && "border-destructive"
                    )}
                    autoComplete="username"
                  />
                  {errors.usernameOrEmail && (
                    <XCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
                  )}
                </div>
                {errors.usernameOrEmail && (
                  <p className="text-sm text-destructive">{errors.usernameOrEmail.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-medium">
                    Password
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    disabled={isLoading || googleLoading}
                    className={cn(
                      "h-11 pl-10 pr-12",
                      errors.password && "border-destructive"
                    )}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary"
                    tabIndex={-1}
                    disabled={isLoading || googleLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me */}
              
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 pt-4">
              <Button 
                type="submit" 
                className="w-full h-11 font-medium"
                disabled={isLoading || isSubmitting || googleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

  

 
              {/* Google OAuth Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isLoading || googleLoading || !googleScriptLoaded}
                className="w-full h-11 flex items-center justify-center gap-3"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {googleLoading ? "Connecting..." : !googleScriptLoaded ? "Loading..." : "Continue with Google"}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">New to WohnTräume? </span>
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Create an account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}