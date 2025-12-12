// app/page.tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, Search, Shield, TrendingUp, Award, ChevronRight, Star, ArrowUp, Quote } from "lucide-react"
import { Footer } from "@/components/footer"
import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const [showBackToTop, setShowBackToTop] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  const [stats, setStats] = useState({ listings: 0, clients: 0, agents: 0, satisfaction: 0 })

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => setMounted(true), [])

  // Animated stats counter
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const targets = { listings: 10000, clients: 5000, agents: 500, satisfaction: 98 }
    const increments = {
      listings: targets.listings / steps,
      clients: targets.clients / steps,
      agents: targets.agents / steps,
      satisfaction: targets.satisfaction / steps,
    }

    let current = { listings: 0, clients: 0, agents: 0, satisfaction: 0 }
    const timer = setInterval(() => {
      let done = true
      Object.keys(current).forEach((key) => {
        if (current[key as keyof typeof current] < targets[key as keyof typeof targets]) {
          current[key as keyof typeof current] += increments[key as keyof typeof increments]
          done = false
        } else {
          current[key as keyof typeof current] = targets[key as keyof typeof targets]
        }
      })
      setStats({
        listings: Math.floor(current.listings),
        clients: Math.floor(current.clients),
        agents: Math.floor(current.agents),
        satisfaction: Math.floor(current.satisfaction),
      })
      if (done) clearInterval(timer)
    }, duration / steps)

    return () => clearInterval(timer)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  return (
    <>
      {/* Preload Hero */}
      <link
        rel="preload"
        href="/placeholder.svg?height=1080&width=1920&query=modern luxury home exterior with blue sky"
        as="image"
      />

      {/* Hero */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url(/placeholder.svg?height=1080&width=1920&query=modern luxury home exterior with blue sky)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/60" />
          </div>
        </motion.div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20"
            >
              <Building2 className="h-10 w-10" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl sm:text-6xl font-bold tracking-tight"
            >
              WohnTräume
            </motion.h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl sm:text-2xl mb-4 text-balance max-w-3xl mx-auto font-light leading-relaxed"
          >
           Whether you’re looking for a home or offering one, WohnTräume helps you buy, rent, or sell with confidence
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed"
          >
            trusted by thousands 
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Button asChild size="lg" className="text-lg h-14 px-8 bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all">
              <Link href="/properties">
                <Search className="h-5 w-5 mr-2" />
                Browse Properties
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg h-14 px-8 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 shadow-xl hover:shadow-2xl transition-all">
              <Link href="/register">
                Get Started Free
                <ChevronRight className="h-5 w-5 ml-1" />
              </Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
          >
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: stats.listings, label: "Active Listings", suffix: "+" },
              { value: stats.clients, label: "Happy Clients", suffix: "+" },
              { value: stats.agents, label: "Verified Agents", suffix: "+" },
              { value: stats.satisfaction, label: "Satisfaction Rate", suffix: "%" },
            ].map((stat, i) => (
              <StatItem key={i} {...stat} delay={i * 0.2} />
            ))}
          </div>
        </div>
      </section>

      <FeatureSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />

      {/* Back to Top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-white shadow-xl hover:shadow-2xl transition-all"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <Footer />
    </>
  )
}

// Reusable Components (unchanged)
function StatItem({ value, label, suffix, delay }: { value: number; label: string; suffix: string; delay: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className="text-4xl sm:text-5xl font-bold mb-2"
      >
        {value.toLocaleString()}{suffix}
      </motion.div>
      <div className="text-white/80 text-sm sm:text-base">{label}</div>
    </motion.div>
  )
}

function FeatureSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const features = [
    { icon: Search, title: "Advanced Search", desc: "AI-powered filters & Search" },
    { icon: Shield, title: "Verified Listings", desc: "Every property is inspected and authenticated" },
    { icon: TrendingUp, title: "Recommendation System ", desc: "Real-time data recommendations" },
  ]

  return (
    <section id="features" ref={ref} className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">Why Choose WohnTräume</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience the future of real estate with our comprehensive platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              whileHover={{ y: -8 }}
              className="group p-8 rounded-2xl border-2 border-border hover:border-primary transition-all hover:shadow-xl bg-card"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-primary" />
              </motion.div>
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const steps = [
    { number: 1, title: "Create Your Account", desc: "Sign up for free and set your preferences" },
    { number: 2, title: "Search & Explore", desc: "Browse verified listings with smart filters" },
    { number: 3, title: "Connect & Close", desc: "Work with agents and close securely" },
  ]

  return (
    <section id="how-it-works" ref={ref} className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Get started in three simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-white text-3xl font-bold mb-6 shadow-lg"
              >
                {step.number}
              </motion.div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const testimonials = [
    { name: "Sarah Johnson", role: "Home Buyer", text: "Found my dream home in just 2 weeks. The AI search is incredible!", rating: 5 },
    { name: "Michael Chen", role: "Property Seller", text: "Sold my apartment above asking price. Professional and transparent process.", rating: 5 },
    { name: "Emma Davis", role: "Investor", text: "The market insights helped me make 28% ROI on my last flip. Game changer.", rating: 5 },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  return (
    <section id="testimonials" ref={ref} className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">What Our Users Say</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join thousands of satisfied buyers and sellers
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="bg-card p-8 rounded-2xl shadow-xl border"
            >
              <Quote className="h-10 w-10 text-primary/20 mb-6" />
              <p className="text-lg mb-6 italic">"{testimonials[current].text}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{testimonials[current].name}</p>
                  <p className="text-sm text-muted-foreground">{testimonials[current].role}</p>
                </div>
                <div className="ml-auto flex gap-1">
                  {[...Array(testimonials[current].rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === current ? "w-8 bg-primary" : "bg-muted"
                )}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section id="contact" ref={ref} className="py-24 bg-gradient-to-br from-primary to-accent text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/10 bg-grid" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="inline-block"
          >
            <Award className="h-16 w-16 mx-auto mb-6 opacity-90" />
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">Ready to Get Started?</h2>
          <p className="text-xl mb-10 leading-relaxed text-white/90">
            Join thousands of buyers and sellers who trust WohnTräume for their property needs. Start your journey today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg" className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all">
                <Link href="/login">
                  <Star className="h-5 w-5 mr-2" />
                  Sign In
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 shadow-xl hover:shadow-2xl transition-all">
                <Link href="/register">
                  Create Free Account
                  <ChevronRight className="h-5 w-5 ml-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}