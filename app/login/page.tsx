"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, AlertCircle, ArrowRight, Eye, EyeOff, User, Lock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Basic validation
    if (!formData.usernameOrEmail.trim() || !formData.password.trim()) {
      setError("Please enter both username/email and password")
      return
    }

    setIsLoading(true)

    try {
      await login(formData.usernameOrEmail, formData.password)
      router.push("/properties")
    } catch (err: any) {
      // Display the actual error message from backend
      setError(err.message || "Failed to login. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Enhanced Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-3xl bg-primary/10 shadow-lg">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-bold">RealEstate Pro</h1>
              <p className="text-muted-foreground text-sm mt-2">Premium Property Platform</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-balance leading-tight">
              Welcome back to your 
              <span className="text-primary"> property journey</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Access your dashboard to manage properties, track offers, and connect with buyers or sellers.
            </p>
          </div>

          {/* Enhanced Features List */}
          <div className="space-y-4 pt-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Manage Your Listings</h3>
                <p className="text-sm text-muted-foreground">Track and update your property listings in real-time</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Connect with Clients</h3>
                <p className="text-sm text-muted-foreground">Communicate directly with interested buyers or sellers</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Market Insights</h3>
                <p className="text-sm text-muted-foreground">Access real-time analytics and market trends</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Enhanced Login Form */}
        <Card className="w-full border-2 shadow-2xl bg-background/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex items-center justify-center gap-3 mb-2 lg:hidden">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">RealEstate Pro</CardTitle>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-4xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-lg">
                Enter your username or email and password to access your account
              </CardDescription>
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-2 bg-destructive/5 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Enhanced Username/Email Field */}
              <div className="space-y-3">
                <Label htmlFor="usernameOrEmail" className="text-base font-medium">
                  Username or Email
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    placeholder="Enter your username or email"
                    value={formData.usernameOrEmail}
                    onChange={(e) => setFormData({ ...formData, usernameOrEmail: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-12 pl-10 pr-4 text-base border-2 focus:border-primary/50 transition-colors"
                    autoComplete="username"
                  />
                </div>
              </div>
              
              {/* Enhanced Password Field */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-base font-medium">
                    Password
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-primary hover:underline font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-12 pl-10 pr-12 text-base border-2 focus:border-primary/50 transition-colors"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 pt-6">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium">New to RealEstate Pro?</span>
                </div>
              </div>
              
              <Button 
                asChild 
                variant="outline" 
                className="w-full h-12 text-base font-medium bg-background border-2 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300"
              >
                <Link href="/register">Create an Account</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}