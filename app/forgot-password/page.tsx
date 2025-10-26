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
import { authApi } from "@/lib/api/auth"
import { Building2, AlertCircle, CheckCircle2, ArrowLeft, Mail, Shield, Eye, EyeOff, Lock } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)

    try {
      await authApi.requestPasswordReset({ email })
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTryDifferentEmail = () => {
    setSuccess(false)
    setEmail("")
    setError("")
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
              Reset your password 
              <span className="text-primary"> securely</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Enter your email address and we'll send you instructions to reset your password and regain access to your account.
            </p>
          </div>

          {/* Enhanced Features List */}
          <div className="space-y-4 pt-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">We'll send you a secure link to reset your password</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Secure Process</h3>
                <p className="text-sm text-muted-foreground">Your account security is our top priority</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all duration-300">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Quick & Easy</h3>
                <p className="text-sm text-muted-foreground">Reset your password in just a few clicks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Enhanced Reset Form */}
        <Card className="w-full border-2 shadow-2xl bg-background/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex items-center justify-center gap-3 mb-2 lg:hidden">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">RealEstate Pro</CardTitle>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-4xl font-bold">Forgot Password?</CardTitle>
              <CardDescription className="text-lg">
                {success
                  ? "Check your email for reset instructions"
                  : "Enter your email to receive a password reset link"}
              </CardDescription>
            </div>
          </CardHeader>

          {success ? (
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-6 py-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-200">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">Email Sent Successfully!</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-md">
                    We've sent password reset instructions to{" "}
                    <span className="font-semibold text-foreground">{email}</span>
                  </p>
                  <div className="space-y-2 pt-2">
                    <p className="text-sm text-muted-foreground">
                      The link will expire in 24 hours for security reasons.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the email? Check your spam folder or try again.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  asChild 
                  className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTryDifferentEmail}
                  className="w-full h-12 text-base font-medium border-2 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300"
                >
                  Try Different Email
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-2 bg-destructive/5 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-medium">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 pl-10 text-base border-2 focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Enter the email address associated with your account</p>
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
                      Sending Reset Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
                <Button 
                  asChild 
                  variant="ghost" 
                  className="w-full h-12 text-base font-medium hover:bg-primary/5 transition-all duration-300"
                >
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Link>
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}