"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { authApi } from "@/lib/api/auth"
import { 
  Building2, AlertCircle, CheckCircle2, Eye, EyeOff, User, Mail, Phone, Lock,
  Loader2, Shield, Users, TrendingUp, RefreshCw, Timer
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [resendTimer, setResendTimer] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Mount + localStorage check
  useEffect(() => {
    setMounted(true)
    const savedEmail = localStorage.getItem('pending_confirmation_email')
    if (savedEmail) {
      setSuccess(true)
      setUserEmail(savedEmail)
    }
  }, [])

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
    setPasswordStrength(calculateStrength(formData.password))
  }, [formData.password])

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsLoading(true)

    try {
      await authApi.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: 'buyer', // FORCED BUYER
      })

      setSuccess(true)
      setUserEmail(formData.email)
      localStorage.setItem('pending_confirmation_email', formData.email)
      setResendTimer(60)
      setFormData({
        username: '', email: '', password: '', confirmPassword: '',
        firstName: '', lastName: '', phone: ''
      })
    } catch (err: any) {
      setError(err.message || 'Failed to register')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (resendTimer > 0) return
    setResendLoading(true)
    try {
      await authApi.resendConfirmationEmail(userEmail)
      setResendTimer(60)
    } catch (error) {
      // Silent
    } finally {
      setResendLoading(false)
    }
  }

  const clearPendingConfirmation = () => {
    localStorage.removeItem('pending_confirmation_email')
    setSuccess(false)
    setUserEmail('')
    setFormData({ ...formData, email: '' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 py-12 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-40 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], rotate: [0, -5, 0] }}
          transition={{ duration: 18, repeat: Infinity }}
          className="absolute -bottom-40 -left-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 22, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
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
              <h1 className="text-5xl font-bold">WohnTraume</h1>
              <p className="text-muted-foreground text-sm mt-1">Premium Property Platform</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight">
              Start your <span className="text-primary">real estate journey</span> today
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Join thousands of buyers who trust WohnTraume.
            </p>
          </div>

          {/* Social Proof */}
          <div className="grid grid-cols-3 gap-6 pt-6">
            {[
              { icon: Users, value: "10K+", label: "Active Buyers" },
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
              "Free to join — no credit card",
              "Access verified listings",
              "24/7 expert support",
              "Enterprise-grade security",
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all"
              >
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{f}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Form */}
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
                <CardTitle className="text-3xl font-bold">WohnTraume</CardTitle>
              </div>
              <div className="space-y-3">
                <CardTitle className="text-4xl font-bold">
                  {success ? "Check Your Email" : "Create Account"}
                </CardTitle>
                <CardDescription className="text-lg">
                  {success 
                    ? "Almost there! Confirm your email to get started" 
                    : "Join as a buyer to start exploring properties"}
                </CardDescription>
              </div>
            </CardHeader>

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                >
                  <CardContent className="space-y-8 py-8">
                    <div className="flex flex-col items-center text-center space-y-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-green-200"
                      >
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                      </motion.div>

                      <div className="space-y-3">
                        <h3 className="text-2xl font-bold">Registration Successful!</h3>
                        <p className="text-muted-foreground">
                          Confirmation email sent to:
                        </p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-lg font-semibold text-primary break-all"
                        >
                          {userEmail}
                        </motion.p>
                      </div>

                      <div className="w-full max-w-xs space-y-3 text-sm text-muted-foreground">
                        <p>• Link expires in <strong>24 hours</strong></p>
                        <p>• Check spam if not in inbox</p>
                        <p>• Resend in <strong>{resendTimer}s</strong></p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button asChild size="lg" className="h-12 text-base font-medium">
                        <Link href="/login">Back to Login</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={clearPendingConfirmation}
                        className="h-12 text-base font-medium border-2"
                      >
                        Try Different Email
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={handleResendEmail}
                        disabled={resendTimer > 0 || resendLoading}
                        className="h-12 text-sm"
                      >
                        {resendTimer > 0 ? (
                          <>Resend in {resendTimer}s</>
                        ) : (
                          <>Resend Email</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={handleSubmit}
                >
                  <CardContent className="space-y-6">
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

                    {/* Name Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="font-medium">First Name</Label>
                        <div className="relative group">
                          <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            id="firstName"
                            type="text"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            required
                            disabled={isLoading}
                            className="h-12 pl-10 pr-4 text-base border-2 focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="font-medium">Last Name</Label>
                        <div className="relative group">
                          <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            required
                            disabled={isLoading}
                            className="h-12 pl-10 pr-4 text-base border-2 focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Username & Email */}
                    <div className="space-y-2">
                      <Label htmlFor="username" className="font-medium">Username</Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="johndoe"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          required
                          disabled={isLoading}
                          className="h-12 pl-10 pr-4 text-base border-2 focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-medium">Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          disabled={isLoading}
                          className="h-12 pl-10 pr-4 text-base border-2 focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-medium">Phone Number (optional)</Label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+49 (555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          disabled={isLoading}
                          className="h-12 pl-10 pr-4 text-base border-2 focus:border-primary/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Password Fields */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password" className="font-medium">Password</Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 8 characters"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            disabled={isLoading}
                            className="h-12 pl-10 pr-12 text-base border-2 focus:border-primary/50 transition-colors"
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
                        {formData.password && (
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

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="font-medium">Confirm Password</Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Re-enter password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                            disabled={isLoading}
                            className="h-12 pl-10 pr-12 text-base border-2 focus:border-primary/50 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3.5 text-muted-foreground hover:text-primary transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-4 pt-6">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>

                    <div className="relative w-full">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs uppercase text-muted-foreground font-medium">
                        Or continue with
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => alert("Google login coming soon!")}
                      disabled={isLoading}
                      className="w-full h-11 border-2 hover:border-primary/50"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Continue with Google
                    </Button>

                    <div className="text-center text-sm">
                      <span className="text-muted-foreground">Already have an account? </span>
                      <Link href="/login" className="font-medium text-primary hover:underline">
                        Sign In
                      </Link>
                    </div>
                  </CardFooter>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}