"use client"

import { useEffect, useState, useRef } from "react"
import {
  Building2,
  Users,
  Award,
  TrendingUp,
  Shield,
  Heart,
  Target,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

export default function AboutPage() {
  const [counts, setCounts] = useState({ properties: 0, clients: 0, years: 0, rate: 0 })
  const [timelineIndex, setTimelineIndex] = useState(0)
  const statsRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const isStatsInView = useInView(statsRef, { once: true, margin: "-150px" })
  const isTimelineInView = useInView(timelineRef, { once: true, amount: 0.3 })

  // --- DATA (moved to top to avoid initialization errors) ---
  const stats = [
    { label: "Properties Listed", value: 10000, icon: Building2, suffix: "+", glow: "shadow-emerald-500/50" },
    { label: "Happy Clients", value: 5000, icon: Users, suffix: "+", glow: "shadow-pink-500/50" },
    { label: "Years Experience", value: 15, icon: Award, suffix: "+", glow: "shadow-amber-500/50" },
    { label: "Success Rate", value: 98, icon: TrendingUp, suffix: "%", glow: "shadow-cyan-500/50" },
  ]

  const values = [
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "Honest communication and transparent dealings with every client.",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: Heart,
      title: "Client-Focused",
      description: "Your satisfaction is our priority. We go above and beyond.",
      gradient: "from-rose-500 to-pink-600",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Highest standards in service, results, and innovation.",
      gradient: "from-amber-500 to-orange-600",
    },
  ]

  const timeline = [
    { year: "2009", title: "Founded", desc: "Started with 3 people and a dream." },
    { year: "2012", title: "First 1,000 Clients", desc: "Built trust through transparency." },
    { year: "2018", title: "10,000+ Properties", desc: "Expanded nationwide." },
    { year: "2025", title: "Today", desc: "Your trusted partner in real estate." },
  ]

  // --- 3D Tilt: Pure React (no react-use) ---
  const tiltRefs = values.map(() => useRef<HTMLDivElement>(null))
  const [tiltStyles, setTiltStyles] = useState<string[]>(
    new Array(values.length).fill("perspective(1000px)")
  )

  useEffect(() => {
    const handleMouse = (e: MouseEvent, idx: number) => {
      const card = tiltRefs[idx].current
      if (!card) return
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateY = ((x - centerX) / centerX) * 15
      const rotateX = ((centerY - y) / centerY) * 15
      setTiltStyles((prev) => {
        const newStyles = [...prev]
        newStyles[idx] = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
        return newStyles
      })
    }

    const reset = (idx: number) => {
      setTiltStyles((prev) => {
        const newStyles = [...prev]
        newStyles[idx] = `perspective(1000px) rotateX(0deg) rotateY(0deg)`
        return newStyles
      })
    }

    tiltRefs.forEach((ref, i) => {
      const el = ref.current
      if (!el) return
      el.addEventListener("mousemove", (e) => handleMouse(e as MouseEvent, i))
      el.addEventListener("mouseleave", () => reset(i))
    })

    return () => {
      tiltRefs.forEach((ref, i) => {
        const el = ref.current
        if (!el) return
        el.removeEventListener("mousemove", () => {})
        el.removeEventListener("mouseleave", () => {})
      })
    }
  }, [])

  // --- Animated Counter ---
  useEffect(() => {
    if (!isStatsInView) return
    const duration = 2200
    const interval = 30
    stats.forEach((stat, i) => {
      let start = 0
      const end = stat.value
      const inc = end / (duration / interval)
      const timer = setInterval(() => {
        start += inc
        if (start >= end) {
          start = end
          clearInterval(timer)
        }
        setCounts((prev) => ({
          ...prev,
          [i === 0 ? "properties" : i === 1 ? "clients" : i === 2 ? "years" : "rate"]: Math.floor(start),
        }))
      }, interval)
    })
  }, [isStatsInView])

  // --- Timeline Scroll Trigger ---
  useEffect(() => {
    if (!isTimelineInView) return
    const onScroll = () => {
      const el = timelineRef.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      const progress = Math.min(Math.max((window.innerHeight - top) / (window.innerHeight + height - 400), 0), 1)
      setTimelineIndex(Math.floor(progress * timeline.length))
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [isTimelineInView])

  // --- Confetti (safe dynamic import) ---
  const confettiRef = useRef<((opts?: any) => void) | null>(null)
  useEffect(() => {
    if (typeof window === "undefined") return
    import("canvas-confetti").then((mod) => {
      confettiRef.current = mod.default
    })
  }, [])
  const fireConfetti = () => confettiRef.current?.({ particleCount: 60, spread: 70, origin: { y: 0.6 } })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background overflow-x-hidden">
      {/* Floating Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 120, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-40 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl"
        />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/10 py-32 md:py-40">
        <div className="absolute inset-0 bg-grid-primary/5 bg-grid-16 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.7, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
              className="inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-primary/20 backdrop-blur-xl border-2 border-primary/30 mb-10 shadow-3xl"
            >
              <Building2 className="h-16 w-16 text-primary" />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-accent">
              Your Trusted Partner in Real Estate
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              For over <strong className="text-primary">15 years</strong>, we've turned dreams into addresses. <br className="hidden md:block" />
              Excellence isn’t our goal it’s our <span className="text-accent font-bold">DNA</span>.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-24 bg-gradient-to-r from-primary to-primary/90 text-white relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {stats.map((stat, i) => {
              const Icon = stat.icon
              const current = counts[i === 0 ? "properties" : i === 1 ? "clients" : i === 2 ? "years" : "rate"]
              const done = current >= stat.value
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isStatsInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: i * 0.15, duration: 0.7, type: "spring" }}
                  className="text-center group relative"
                >
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md mb-6 shadow-2xl transition-all group-hover:scale-110",
                      done && `animate-pulse ${stat.glow} shadow-2xl`
                    )}
                  >
                    <Icon className="h-12 w-12 text-white" />
                  </div>
                  <div className="text-5xl md:text-6xl font-bold mb-2 tabular-nums">
                    {current}{stat.suffix}
                  </div>
                  <div className="text-base md:text-lg text-white/90 font-medium">{stat.label}</div>
                  {done && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                      className="absolute -top-2 -right-2"
                    >
                      <CheckCircle className="h-6 w-6 text-white drop-shadow-lg" />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission & 3D Tilt Values */}
      <section className="py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-24">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/10 mb-8 shadow-2xl">
                <Target className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Our Mission
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                To <strong className="text-primary">redefine real estate</strong> with innovation, integrity, and{" "}
                <span className="text-accent">unmatched human touch</span>  one home at a time.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {values.map((value, i) => {
                const Icon = value.icon
                return (
                  <motion.div
                    key={value.title}
                    ref={tiltRefs[i]}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2, duration: 0.7 }}
                    style={{ transform: tiltStyles[i] }}
                    className="group"
                  >
                    <Card className="h-full border-2 border-transparent bg-card/95 backdrop-blur-xl hover:border-primary/50 transition-all duration-500 hover:shadow-3xl overflow-hidden">
                      <div
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-700",
                          value.gradient
                        )}
                      />
                      <CardContent className="pt-12 pb-10 text-center relative z-10">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <Icon className="h-12 w-12 text-primary" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                          {value.title}
                        </h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">{value.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Timeline */}
      <section ref={timelineRef} className="py-32 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Our Journey
            </h2>
            <div className="relative">
              <div className="absolute left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-primary/50 via-accent to-primary/50 h-full rounded-full" />
              {timeline.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                  animate={timelineIndex >= i ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6 }}
                  className={cn("flex items-center mb-16", i % 2 === 0 ? "justify-start" : "justify-end")}
                >
                  <div className={cn("w-5/12", i % 2 === 0 ? "text-right pr-12" : "text-left pl-12")}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-card p-6 rounded-2xl shadow-xl border border-primary/10"
                    >
                      <div className="text-3xl font-bold text-primary mb-2">{item.year}</div>
                      <h3 className="text-xl font-semibold mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </motion.div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 w-6 h-6 bg-primary rounded-full border-4 border-white shadow-lg" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA with Confetti */}
      <section className="py-32 bg-gradient-to-br from-primary via-primary/95 to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 bg-grid-24" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="inline-flex items-center gap-2 text-white/90 mb-8"
            >
              <Sparkles className="h-7 w-7" />
              <span className="text-xl font-medium">Join 5,000+ Happy Homeowners</span>
            </motion.div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Ready to Write Your Chapter?
            </h2>
            <p className="text-xl md:text-2xl mb-14 text-white/90 max-w-2xl mx-auto leading-relaxed">
              Your dream home isn’t just a listing  it’s a story waiting to begin.
            </p>
            <div className="flex gap-6 justify-center flex-wrap">
              <Button
                asChild
                size="lg"
                className="h-16 px-12 text-lg font-bold bg-white text-primary hover:bg-white/95 shadow-2xl hover:shadow-3xl transition-all group relative overflow-hidden"
                onMouseEnter={fireConfetti}
              >
                <Link href="/properties">
                  Explore Properties
                  <motion.div
                    className="inline-block ml-3"
                    animate={{ x: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-16 px-12 text-lg font-bold bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 shadow-2xl hover:shadow-3xl transition-all"
              >
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}