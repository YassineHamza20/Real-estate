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
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, AlertCircle, ArrowRight, Eye, EyeOff, User, Lock, 
  Mail, Github, Loader2, CheckCircle2, XCircle, Shield, TrendingUp, Users
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

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [mounted, setMounted] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  })

  const password = watch("password")

  // Mount effect
  useEffect(() => setMounted(true), [])

  // Password strength
  useEffect(() => {
    const calculateStrength = (pass: string) => {
      let strength = 0
      if (pass.length >= 8) strength += 25
      if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength += 25
      if (/\d/.test(pass)) strength += 25
      if (/[^a-zA-Z0-9]/.test(pass)) strength += 25
      return strength
    }
    setPasswordStrength(calculateStrength(password || ""))
  }, [password])

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

  const socialLogin = (provider: string) => {
    // Mock OAuth
    alert(`Login with ${provider} coming soon!`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1.1, 1, 1.1],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 18, repeat: Infinity }}
          className="absolute -bottom-40 -left-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 22, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Enhanced Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col justify-center space-y-10 p-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-4 rounded-3xl bg-primary/10 shadow-lg"
            >
              <Building2 className="h-12 w-12 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-5xl font-bold">RealEstate Pro</h1>
              <p className="text-muted-foreground text-sm mt-1">Premium Property Platform</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight">
              Welcome back to your 
              <span className="text-primary"> property journey</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Access your dashboard to manage properties, track offers, and connect with buyers or sellers.
            </p>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-3 gap-6 pt-6">
            {[
              { icon: Users, value: "10K+", label: "Active Users" },
              { icon: Shield, value: "100%", label: "Verified" },
              { icon: TrendingUp, value: "4.9", label: "Rating" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-4 pt-8">
            {[
              "Manage listings in real-time",
              "Direct client communication",
              "AI-powered market insights",
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all"
              >
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="w-full border-2 shadow-2xl bg-background/95 backdrop-blur-sm">
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="flex items-center justify-center gap-3 mb-2 lg:hidden">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="p-3 rounded-2xl bg-primary/10"
                >
                  <Building2 className="h-8 w-8 text-primary" />
                </motion.div>
                <CardTitle className="text-3xl font-bold">RealEstate Pro</CardTitle>
              </div>
              <div className="space-y-3">
                <CardTitle className="text-4xl font-bold">Welcome Back</CardTitle>
                <CardDescription className="text-lg">
                  Enter your credentials to access your account
                </CardDescription>
              </div>
            </CardHeader>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert variant="destructive" className="border-2 bg-destructive/5">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Username/Email */}
                <div className="space-y-2">
                  <Label htmlFor="usernameOrEmail" className="text-base font-medium">
                    Username or Email
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="usernameOrEmail"
                      type="text"
                      placeholder="Enter username or email"
                      {...register("usernameOrEmail")}
                      disabled={isLoading}
                      className={cn(
                        "h-12 pl-10 pr-4 text-base border-2 transition-all",
                        errors.usernameOrEmail ? "border-destructive focus:border-destructive" : "focus:border-primary/50"
                      )}
                      autoComplete="username"
                    />
                    {errors.usernameOrEmail && (
                      <XCircle className="absolute right-3 top-3.5 h-5 w-5 text-destructive" />
                    )}
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
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
                      {...register("password")}
                      disabled={isLoading}
                      className={cn(
                        "h-12 pl-10 pr-12 text-base border-2 transition-all",
                        errors.password ? "border-destructive focus:border-destructive" : "focus:border-primary/50"
                      )}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password Strength */}
                  {password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-1"
                    >
                      <Progress value={passwordStrength} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {passwordStrength < 50 && "Weak"}
                        {passwordStrength >= 50 && passwordStrength < 75 && "Fair"}
                        {passwordStrength >= 75 && passwordStrength < 100 && "Good"}
                        {passwordStrength === 100 && "Strong"}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Remember Me */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="rememberMe" 
                    {...register("rememberMe")}
                    disabled={isLoading}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-medium cursor-pointer">
                    Remember me for 30 days
                  </Label>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4 pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading || isSubmitting}
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

                <div className="relative w-full">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs uppercase text-muted-foreground font-medium">
                    Or continue with
                  </span>
                </div>

                {/* OAuth Buttons */}
                <div className="grid  gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => socialLogin("Google")}
                    disabled={isLoading}
                    className="h-11 border-2 hover:border-primary/50"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Continue with Google
                  </Button>
                   
                </div>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">New to RealEstate Pro? </span>
                  <Link href="/register" className="font-medium text-primary hover:underline">
                    Create an account
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}