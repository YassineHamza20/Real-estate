"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  MailCheck, 
  Shield, 
  Rocket, 
  Users,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Building2,
  Sparkles
} from 'lucide-react'
import { authApi } from '@/lib/api/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function ConfirmEmailPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [countdown, setCountdown] = useState(7)
  const [showConfetti, setShowConfetti] = useState(false)

  // Countdown → /dashboard
  useEffect(() => {
    if (status !== 'success') return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setTimeout(() => router.push('/dashboard'), 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [status, router])

  // Progress animation
  useEffect(() => {
    if (status !== 'loading') return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    return () => clearInterval(interval)
  }, [status])

  // Main confirmation logic
  useEffect(() => {
    let mounted = true

    const confirmEmail = async () => {
      try {
        const uid = params.uid as string
        const token = params.token as string

        if (!uid || !token) {
          throw new Error('Invalid confirmation link')
        }

        await authApi.confirmEmail(uid, token)

        if (!mounted) return

        setProgress(100)
        setTimeout(() => {
          if (!mounted) return
          setStatus('success')
          setMessage('Your email has been successfully verified! Welcome to RealEstate Pro.')
          setShowConfetti(true)
        }, 500)

      } catch (error) {
        if (!mounted) return
        setStatus('error')
        setMessage(
          error instanceof Error 
            ? error.message 
            : 'Email confirmation failed. The link may be invalid or expired.'
        )
        setProgress(0)
      }
    }

    confirmEmail()

    return () => { mounted = false }
  }, [params.uid, params.token])

  const handleNavigation = (path: string) => {
    setTimeout(() => router.push(path), 0)
  }

  const features = [
    { icon: Shield, text: 'Secure Account Protection' },
    { icon: Users, text: 'Explore Properties' },
    { icon: Rocket, text: 'Save Your Favorites' }
  ]

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

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="p-3 rounded-2xl bg-primary/10 shadow-lg mb-4"
          >
            <Building2 className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold">RealEstate Pro</h1>
          <Badge variant="secondary" className="mt-2 px-4 py-1 bg-primary/10">
            <MailCheck className="w-3 h-3 mr-1" />
            Email Verification
          </Badge>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-2 shadow-2xl bg-background/95 backdrop-blur-sm">
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="flex justify-center">
                <motion.div
                  animate={{ rotate: status === 'loading' ? 360 : 0 }}
                  transition={{ duration: 2, repeat: status === 'loading' ? Infinity : 0, ease: "linear" }}
                  className="p-4 rounded-3xl bg-primary/10 shadow-lg"
                >
                  <MailCheck className="h-12 w-12 text-primary" />
                </motion.div>
              </div>
              <div className="space-y-3">
                <CardTitle className="text-4xl font-bold">
                  {status === 'loading' && 'Verifying Your Account'}
                  {status === 'success' && 'Welcome Aboard!'}
                  {status === 'error' && 'Verification Issue'}
                </CardTitle>
                <CardDescription className="text-lg">
                  {status === 'loading' && 'Securing your RealEstate Pro account...'}
                  {status === 'success' && 'Your journey begins now'}
                  {status === 'error' && 'Let us help you get back on track'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              <AnimatePresence mode="wait">
                {/* LOADING */}
                {status === 'loading' && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Verification Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-3 bg-primary/10">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </Progress>
                    </div>

                    <div className="flex flex-col items-center space-y-6">
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Shield className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold">Securing Your Account</h3>
                        <p className="text-muted-foreground">
                          We're verifying your email and setting up your secure profile.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SUCCESS */}
                {status === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    {showConfetti && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 pointer-events-none overflow-hidden"
                      >
                        {[...Array(30)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 4],
                              left: `${Math.random() * 100}%`,
                              top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                              y: [0, -300],
                              opacity: [1, 0],
                              rotate: [0, 360],
                            }}
                            transition={{
                              duration: 2,
                              delay: i * 0.05,
                              ease: "easeOut",
                            }}
                          />
                        ))}
                      </motion.div>
                    )}

                    <div className="flex flex-col items-center space-y-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="relative"
                      >
                        <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center shadow-xl border-4 border-green-200">
                          <CheckCircle2 className="h-14 w-14 text-green-600" />
                        </div>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute -top-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg"
                        >
                          <Sparkles className="h-5 w-5 text-white" />
                        </motion.div>
                      </motion.div>

                      <div className="text-center space-y-3">
                        <h3 className="text-2xl font-bold">Email Verified!</h3>
                        <p className="text-lg text-muted-foreground max-w-md mx-auto">
                          {message}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-4">
                        {features.map((f, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all"
                          >
                            <f.icon className="h-6 w-6 text-primary" />
                            <span className="text-sm font-medium">{f.text}</span>
                          </motion.div>
                        ))}
                      </div>

                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="flex items-center gap-3 px-5 py-3 bg-primary/10 rounded-full border border-primary/20"
                      >
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="font-medium">Redirecting in {countdown}s</span>
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* ERROR */}
                {status === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col items-center space-y-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="w-28 h-28 rounded-full bg-red-100 flex items-center justify-center shadow-xl border-4 border-red-200"
                      >
                        <XCircle className="h-14 w-14 text-red-600" />
                      </motion.div>

                      <div className="text-center space-y-3">
                        <h3 className="text-2xl font-bold">Verification Failed</h3>
                        <Alert variant="destructive" className="max-w-md mx-auto bg-red-50 border-red-200">
                          <AlertDescription className="text-red-700">{message}</AlertDescription>
                        </Alert>
                      </div>

                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Don't worry — we're here to help you access your account.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full pt-4">
                        <Button
                          onClick={() => handleNavigation('/login')}
                          size="lg"
                          className="h-12 shadow-lg hover:shadow-xl"
                        >
                          Go to Login
                        </Button>
                        <Button
                          onClick={() => handleNavigation('/register')}
                          variant="outline"
                          size="lg"
                          className="h-12 border-2 hover:border-primary/50"
                        >
                          Create New Account
                        </Button>
                        <Button
                          onClick={() => window.location.reload()}
                          variant="secondary"
                          size="lg"
                          className="h-12 col-span-full"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Try Again
                        </Button>
                        <Button
                          onClick={() => handleNavigation('/contact')}
                          variant="ghost"
                          size="lg"
                          className="h-12 col-span-full text-primary hover:bg-primary/5"
                        >
                          <HelpCircle className="w-4 h-4 mr-2" />
                          Contact Support
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center space-y-3"
        >
          <p className="text-sm text-muted-foreground">
            Need help? <a href="mailto:yassinehamza.pro@gmail.com" className="text-primary hover:underline">Contact Support</a>
          </p>
          <p className="text-xs text-muted-foreground">
            © 2024 RealEstate Pro. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  )
}