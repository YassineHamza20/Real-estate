"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { authApi } from "@/lib/api/auth"
import { 
  Building2, AlertCircle, CheckCircle2, ArrowLeft, Mail, Shield, 
  Loader2, MailCheck, Timer, RefreshCw
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [mounted, setMounted] = useState(false)

  const {
    register,
    handleSubmit,
    watch, // ← ADDED HERE
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const emailValue = watch("email") // ← Now safe to use

  // Mount
  useEffect(() => setMounted(true), [])

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    try {
      await authApi.requestPasswordReset({ email: data.email })
      setSuccess(true)
      setResendTimer(60)
    } catch (err: any) {
      // Let form error show via Zod or API
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0 || !emailValue) return
    setIsLoading(true)
    try {
      await authApi.requestPasswordReset({ email: emailValue })
      setResendTimer(60)
    } catch {
      // Silent
    } finally {
      setIsLoading(false)
    }
  }

  const handleTryDifferentEmail = () => {
    setSuccess(false)
    reset()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 relative overflow-hidden">
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
              <h1 className="text-5xl font-bold">RealEstate Pro</h1>
              <p className="text-muted-foreground text-sm mt-1">Premium Property Platform</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight">
              Reset your password 
              <span className="text-primary"> securely</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Enter your email and we'll send you a secure link to reset your password in under 60 seconds.
            </p>
          </div>

          {/* Security Badges */}
          <div className="grid grid-cols-3 gap-4 pt-6">
            {[
              { icon: Shield, label: "Encrypted" },
              { icon: Timer, label: "24h Expiry" },
              { icon: MailCheck, label: "Instant" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-primary/5"
              >
                <item.icon className="h-8 w-8 text-primary mb-2" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3 pt-6">
            {["No account lockout", "Spam folder check", "One-click reset"].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 text-sm"
              >
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{f}</span>
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
                <CardTitle className="text-3xl font-bold">RealEstate Pro</CardTitle>
              </div>
              <div className="space-y-3">
                <CardTitle className="text-4xl font-bold">
                  {success ? "Check Your Email" : "Forgot Password?"}
                </CardTitle>
                <CardDescription className="text-lg">
                  {success
                    ? "We've sent you a secure reset link"
                    : "Enter your email to receive reset instructions"}
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
                    {/* Success Animation */}
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
                        <h3 className="text-2xl font-bold">Email Sent!</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          Password reset link sent to:
                        </p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-lg font-semibold text-primary break-all"
                        >
                          {emailValue || "your email"}
                        </motion.p>
                      </div>

                      <div className="w-full max-w-xs space-y-3 text-sm text-muted-foreground">
                        <p>• Link expires in <strong>24 hours</strong></p>
                        <p>• Check spam if not in inbox</p>
                        <p>• You can request again in <strong>{resendTimer}s</strong></p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button asChild size="lg" className="h-12 text-base font-medium">
                        <Link href="/login">
                          Back to Login
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleTryDifferentEmail}
                        className="h-12 text-base font-medium border-2"
                      >
                        Try Different Email
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={handleResend}
                        disabled={resendTimer > 0 || isLoading || !emailValue}
                        className="h-12 text-sm"
                      >
                        {resendTimer > 0 ? (
                          <>
                            Resend in {resendTimer}s
                          </>
                        ) : (
                          <>
                            Resend Email
                          </>
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
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <CardContent className="space-y-6">
                    <AnimatePresence>
                      {errors.email && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <Alert variant="destructive" className="border-2 bg-destructive/5">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{errors.email.message}</AlertDescription>
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-base font-medium">
                        Email Address
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          {...register("email")}
                          disabled={isLoading}
                          className={cn(
                            "h-12 pl-10 pr-4 text-base border-2 transition-all",
                            errors.email ? "border-destructive focus:border-destructive" : "focus:border-primary/50"
                          )}
                          autoComplete="email"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We'll send a secure reset link to this email
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3 pt-6">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl"
                      disabled={isLoading || isSubmitting}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Link...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>
                    <Button asChild variant="ghost" size="lg" className="w-full h-12">
                      <Link href="/login">
                        Back to Login
                      </Link>
                    </Button>
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