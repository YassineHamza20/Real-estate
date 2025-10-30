"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { propertiesApi } from "@/lib/api/properties"
import { usersApi } from "@/lib/api/users"
import type { Property } from "@/types/property"
import {
  MapPin, Bed, Square, Calendar, Heart, Share2, ArrowLeft,
  Phone, Mail, User, Check, ChevronLeft, ChevronRight
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Footer } from "@/components/footer"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { cn } from "@/lib/utils"

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImg, setCurrentImg] = useState(0)
  const [isSaved, setIsSaved] = useState(false)

  const [sellerContact, setSellerContact] = useState<{
    first_name: string
    last_name: string
    email: string
    phone: string
  } | null>(null)
  const [contactLoading, setContactLoading] = useState(false)

  const galleryRef = useRef<HTMLDivElement>(null)

  /* ------------------------------------------------- */
  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      try {
        const data = await propertiesApi.getProperty(params.id as string)
        setProperty(data)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [params.id])

  useEffect(() => {
    if (!user || !property) return
    const fetchContact = async () => {
      setContactLoading(true)
      try {
        const info = await usersApi.getSellerContact(property.seller.id)
        setSellerContact(info)
      } catch (e) {
        console.error(e)
      } finally {
        setContactLoading(false)
      }
    }
    fetchContact()
  }, [user, property])

  /* ------------------------------------------------- */
  const fmtPrice = (p: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p)
  const fmtSqm = (s: number) => new Intl.NumberFormat("de-DE").format(s)

  const totalImages = property?.images.length || 0

  const goToPrev = () => {
    setCurrentImg((prev) => (prev === 0 ? totalImages - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentImg((prev) => (prev === totalImages - 1 ? 0 : prev + 1))
  }

  const handleSave = () => {
    setIsSaved(true)
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.9, y: 0.8 },
      colors: ["#f59e0b", "#10b981", "#3b82f6"]
    })
    if ("vibrate" in navigator) navigator.vibrate?.([50, 30, 50])
    setTimeout(() => setIsSaved(false), 2000)
  }

  /* ------------------------------------------------- */
  // Keyboard Navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!property) return
      if (e.key === "ArrowLeft") goToPrev()
      if (e.key === "ArrowRight") goToNext()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [property, currentImg])

  /* ------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-32 mb-8 rounded-lg" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[500px] w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-background p-12 rounded-2xl border-2 border-border shadow-lg"
        >
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <Button onClick={() => router.push("/properties")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Properties
          </Button>
        </motion.div>
      </div>
    )
  }

  /* ------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6 gap-2 font-medium bg-card/80 backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Gallery + Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image with Arrows */}
            <motion.div
              ref={galleryRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-card rounded-3xl border-2 border-border overflow-hidden shadow-2xl group"
              style={{ perspective: 1000 }}
            >
              {/* Image */}
              <div className="relative h-[520px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImg}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={property.images[currentImg]?.url ?? "/placeholder.svg"}
                      alt={`${property.name} - Image ${currentImg + 1}`}
                      fill
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Image Counter */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {currentImg + 1} / {totalImages}
                </div>

                {/* Left Arrow */}
                {totalImages > 1 && (
                  <button
                    onClick={goToPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}

                {/* Right Arrow */}
                {totalImages > 1 && (
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}

                {/* 3D Tilt Effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)`,
                    opacity: 0.3,
                  }}
                  animate={{
                    x: [0, 10, -10, 0],
                    y: [0, -10, 10, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>

              {/* Thumbnails */}
              {totalImages > 1 && (
                <div className="flex gap-3 p-4 overflow-x-auto bg-card/80 backdrop-blur scrollbar-hide">
                  {property.images.map((img, i) => (
                    <motion.button
                      key={img.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentImg(i)}
                      className={cn(
                        "relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border-3 transition-all",
                        i === currentImg
                          ? "border-primary ring-2 ring-primary/30 shadow-lg"
                          : "border-border/50 hover:border-primary/50"
                      )}
                    >
                      <Image src={img.url ?? "/placeholder.svg"} alt="" fill className="object-cover" />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Description Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card/95 backdrop-blur-xl rounded-3xl border-2 border-border p-8 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    {property.name}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    {property.address}, {property.city}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn("h-12 w-12 rounded-xl shadow-lg", isSaved && "bg-primary text-white")}
                    onClick={handleSave}
                  >
                    <motion.div
                      animate={{ scale: isSaved ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
                    </motion.div>
                  </Button>
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl shadow-lg">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 mb-8">
                <Badge variant="secondary" className="text-base px-4 py-1.5 capitalize font-medium">
                  {property.type}
                </Badge>
                <Badge
                  variant={property.status === "active" ? "default" : "secondary"}
                  className="text-base px-4 py-1.5 capitalize font-medium"
                >
                  {property.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-8 p-6 bg-muted/50 rounded-2xl">
                {[
                  { Icon: Bed, label: "Bedrooms", value: property.bedrooms },
                  { Icon: Square, label: "Size", value: `${fmtSqm(property.squareMeters)} m²` },
                  { Icon: Calendar, label: "Listed", value: new Date(property.createdAt).toLocaleDateString("de-DE") },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 shadow-md">
                      <item.Icon className="h-7 w-7 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                    <p className="text-2xl font-bold">{item.value}</p>
                  </motion.div>
                ))}
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">{property.description}</p>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="sticky top-24"
            >
              <Card className="border-2 shadow-2xl bg-card/95 backdrop-blur-xl">
                <CardContent className="p-8 space-y-6">
                  <div className="pb-6 border-b">
                    <p className="text-5xl font-bold text-primary mb-2">{fmtPrice(property.price)}</p>
                    <p className="text-lg text-muted-foreground font-medium">
                      {Math.round(property.price / property.squareMeters).toLocaleString("de-DE")} €/m²
                    </p>
                  </div>

                  {user ? (
                    <div className="space-y-6">
                      <div className="pt-6 border-t space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shadow-md">
                            <User className="h-7 w-7 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {sellerContact
                                ? `${sellerContact.first_name} ${sellerContact.last_name}`
                                : property.seller.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">Property Owner</p>
                          </div>
                        </div>

                        {contactLoading ? (
                          <div className="space-y-3">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                          </div>
                        ) : sellerContact ? (
                          <div className="space-y-3">
                            {sellerContact.phone && (
                              <motion.a
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                href={`tel:${sellerContact.phone}`}
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <Phone className="h-5 w-5 text-primary" />
                                  <div>
                                    <p className="font-medium">Call Now</p>
                                    <p className="text-sm text-muted-foreground">{sellerContact.phone}</p>
                                  </div>
                                </div>
                              </motion.a>
                            )}
                            {sellerContact.email && (
                              <motion.a
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                href={`mailto:${sellerContact.email}`}
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <Mail className="h-5 w-5 text-primary" />
                                  <div>
                                    <p className="font-medium">Send Email</p>
                                    <p className="text-sm text-muted-foreground">{sellerContact.email}</p>
                                  </div>
                                </div>
                              </motion.a>
                            )}
                          </div>
                        ) : (
                          <div className="text-center p-6 bg-muted/20 rounded-xl">
                            <p className="text-muted-foreground">Contact details available after login</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button
                        className="w-full h-14 text-lg font-semibold shadow-lg"
                        size="lg"
                        onClick={() => router.push("/login")}
                      >
                        Sign In to Contact Seller
                      </Button>
                      <p className="text-center text-sm text-muted-foreground p-4 bg-muted/20 rounded-xl">
                        Unlock contact info, save favorites, and Become a seller to list your own properties.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating Save Orb */}
      {/* <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Button
          size="icon"
          className="w-16 h-16 rounded-full shadow-2xl bg-gradient-to-r from-primary to-accent text-white hover:scale-110 transition-all"
          onClick={handleSave}
        >
          <Heart className={cn("h-8 w-8", isSaved && "fill-current")} />
        </Button>
      </motion.div> */}

      <Footer />
    </div>
  )
}