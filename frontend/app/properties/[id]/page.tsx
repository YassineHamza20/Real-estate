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
  Phone, Mail, User, Check, ChevronLeft, ChevronRight, Star,
  X, ZoomIn
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Footer } from "@/components/footer"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { cn } from "@/lib/utils"
import { RealMap } from "@/components/RealMap"
import { SimilarProperties } from "@/components/similar-properties"

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()

  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImg, setCurrentImg] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [isSharing, setIsSharing] = useState(false)

  const [sellerContact, setSellerContact] = useState<{
    first_name: string
    last_name: string
    email: string
    phone: string
    is_verified: boolean
    profile_picture_url?: string
  } | null>(null)
  const [contactLoading, setContactLoading] = useState(false)
  const [sellerProfilePicture, setSellerProfilePicture] = useState<string | null>(null)

  const galleryRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  /* ------------------------------------------------- */
  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true)
      try {
        const data = await propertiesApi.getProperty(params.id as string)
        setProperty(data)
        // Check if property is in wishlist
        if (user) {
          checkWishlistStatus(data.id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [params.id, user])

  useEffect(() => {
    if (!user || !property) return
    const fetchContact = async () => {
      setContactLoading(true)
      try {
        const info = await usersApi.getSellerContact(property.seller.id)
        setSellerContact(info)
        
        // Fetch seller profile picture
        try {
          const pictureData = await usersApi.getUserProfilePicture(property.seller.id)
          setSellerProfilePicture(pictureData.profile_picture_url)
        } catch (pictureError) {
          console.error("Error fetching seller profile picture:", pictureError)
          setSellerProfilePicture(null)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setContactLoading(false)
      }
    }
    fetchContact()
  }, [user, property])

  /* ------------------------------------------------- */
  // Share functionality
  const handleShare = async () => {
    setIsSharing(true)
    try {
      const url = window.location.href
      await navigator.clipboard.writeText(url)
      
      // Show success feedback
      setIsSaved(true)
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { x: 0.1, y: 0.1 },
        colors: ["#3b82f6", "#60a5fa", "#93c5fd"]
      })
      
      setTimeout(() => {
        setIsSaved(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy URL: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } finally {
      setIsSharing(false)
    }
  }

  // Wishlist functionality
  const checkWishlistStatus = async (propertyId: string) => {
    try {
      const status = await propertiesApi.checkWishlistStatus(propertyId)
      setIsWishlisted(status.in_wishlist)
    } catch (error) {
      console.error("Error checking wishlist status:", error)
    }
  }

  const toggleWishlist = async () => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!property) return

    setWishlistLoading(true)
    try {
      const response = await propertiesApi.toggleWishlist(property.id)
      setIsWishlisted(response.in_wishlist)
      
      // Show confetti when adding to wishlist
      if (response.in_wishlist) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 0.9, y: 0.1 },
          colors: ["#ff6b6b", "#ffa726", "#66bb6a"]
        })
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    } finally {
      setWishlistLoading(false)
    }
  }

  // Sort images to show primary first
  const sortedImages = property?.images ? [...property.images].sort((a, b) => {
    // Primary images come first
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return 0
  }) : []

  const fmtPrice = (p: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p)
  const fmtSqm = (s: number) => new Intl.NumberFormat("de-DE").format(s)

  const totalImages = sortedImages.length

  const goToPrev = () => {
    setCurrentImg((prev) => (prev === 0 ? totalImages - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentImg((prev) => (prev === totalImages - 1 ? 0 : prev + 1))
  }

  const goToPrevModal = () => {
    setModalImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1))
  }

  const goToNextModal = () => {
    setModalImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1))
  }

  const openImageModal = (index: number) => {
    setModalImageIndex(index)
    setIsImageModalOpen(true)
  }

  const closeImageModal = () => {
    setIsImageModalOpen(false)
  }

  /* ------------------------------------------------- */
  // Keyboard Navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!property) return
      
      if (isImageModalOpen) {
        // Handle keyboard navigation in modal
        if (e.key === "ArrowLeft") goToPrevModal()
        if (e.key === "ArrowRight") goToNextModal()
        if (e.key === "Escape") closeImageModal()
      } else {
        // Handle keyboard navigation in main gallery
        if (e.key === "ArrowLeft") goToPrev()
        if (e.key === "ArrowRight") goToNext()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [property, currentImg, isImageModalOpen])

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeImageModal()
      }
    }

    if (isImageModalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isImageModalOpen])

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
              <Skeleton className="h-80 w-full rounded-2xl" /> {/* Map skeleton */}
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
              {/* Image Container - Make this clickable */}
              <div 
                className="relative h-[520px] cursor-zoom-in"
                onClick={() => openImageModal(currentImg)}
              >
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
                      src={sortedImages[currentImg]?.url ?? "/placeholder.svg"}
                      alt={`${property.name} - Image ${currentImg + 1}`}
                      fill
                      className="object-cover"
                    />
                    
                    {/* Primary Image Badge */}
                    {sortedImages[currentImg]?.is_primary && (
                      <div className="absolute top-4 left-4 bg-black-800 text-black px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 backdrop-blur-md">
                        <Star className="h-4 w-4 fill-current" />
                        Primary
                      </div>
                    )}

                    {/* Zoom In Button */}
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="h-4 w-4" />
                      Click to enlarge
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Image Counter */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {currentImg + 1} / {totalImages}
                </div>

                {/* Action Buttons - Top Right */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {/* Share Button */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-xl shadow-lg backdrop-blur-md border-white/20",
                        isSharing && "opacity-50 cursor-not-allowed",
                        isSaved && "bg-green-500 text-white border-green-500"
                      )}
                      onClick={(e) => {
                        e.stopPropagation() // Prevent triggering the image modal
                        handleShare()
                      }}
                      disabled={isSharing}
                    >
                      <motion.div
                        animate={{ 
                          scale: isSaved ? [1, 1.3, 1] : 1,
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {isSaved ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                      </motion.div>
                    </Button>
                  </motion.div>

                  {/* Wishlist Button */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-12 w-12 rounded-xl shadow-lg backdrop-blur-md border-white/20",
                        isWishlisted && "bg-yellow-500 text-white border-yellow-500",
                        wishlistLoading && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        e.stopPropagation() // Prevent triggering the image modal
                        toggleWishlist()
                      }}
                      disabled={wishlistLoading}
                    >
                      <motion.div
                        animate={{ 
                          scale: isWishlisted ? [1, 1.3, 1] : 1,
                          rotate: isWishlisted ? [0, 10, -10, 0] : 0
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                      </motion.div>
                    </Button>
                  </motion.div>
                </div>

                {/* Left Arrow */}
                {totalImages > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation() // Prevent triggering the image modal
                      goToPrev()
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/30 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}

                {/* Right Arrow */}
                {totalImages > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation() // Prevent triggering the image modal
                      goToNext()
                    }}
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
                  {sortedImages.map((img, i) => (
                    <motion.button
                      key={img.id}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setCurrentImg(i)
                        openImageModal(i) // Open modal when clicking thumbnails too
                      }}
                      className={cn(
                        "relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border-3 transition-all cursor-pointer",
                        i === currentImg
                          ? "border-primary ring-2 ring-primary/30 shadow-lg"
                          : "border-border/50 hover:border-primary/50"
                      )}
                    >
                      <Image 
                        src={img.url ?? "/placeholder.svg"} 
                        alt="" 
                        fill 
                        className="object-cover"
                      />
                      
                      {/* Primary Badge on Thumbnail */}
                      {img.is_primary && (
                        <div className="absolute top-1 right-1 bg-black-800 text-black p-1 rounded-full">
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      )}
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
                  {/* Additional share button in header if needed */}
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "gap-2",
                      isSharing && "opacity-50 cursor-not-allowed",
                      isSaved && "bg-green-500 text-white border-green-500"
                    )}
                    onClick={handleShare}
                    disabled={isSharing}
                  >
                    {isSaved ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    {isSaved ? "Copied!" : "Share"}
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
                {isWishlisted && (
                  <Badge variant="default" className="text-base px-4 py-1.5 bg-yellow-700 text-white font-medium">
                    <Heart className="h-3 w-3 fill-current mr-1" />
                    In Wishlist
                  </Badge>
                )}
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

            {/* Map Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card/95 backdrop-blur-xl rounded-3xl border-2 border-border p-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Map</h2>
                  <p className="text-muted-foreground">
                    {property.address}, {property.city}
                  </p>
                </div>
              </div>
              
              <RealMap 
                address={property.address} 
                city={property.city} 
                className="w-full"
              />
            </motion.div>

            <SimilarProperties currentProperty={property} />
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
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shadow-md overflow-hidden">
                            {sellerProfilePicture ? (
                              <Image
                                src={sellerProfilePicture}
                                alt={`${sellerContact?.first_name || property.seller.name}'s profile`}
                                width={56}
                                height={56}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-7 w-7 text-primary" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {sellerContact
                                ? `${sellerContact.first_name} ${sellerContact.last_name}`
                                : property.seller.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">Property Owner</p>
                            {sellerContact?.is_verified && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 mt-1">
                                <Check className="h-3 w-3 mr-1" />
                                Verified Seller
                              </Badge>
                            )}
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
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl shadow-sm hover:bg-muted/50 transition-colors"
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
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl shadow-sm hover:bg-muted/50 transition-colors"
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

      {/* Image Modal */}
      <AnimatePresence>
        {isImageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          >
            <div 
              ref={modalRef}
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            >
              {/* Close Button */}
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-md transition-all hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Navigation Arrows - Outside the image */}
              {totalImages > 1 && (
                <>
                  <button
                    onClick={goToPrevModal}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full backdrop-blur-md transition-all hover:scale-110"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button
                    onClick={goToNextModal}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full backdrop-blur-md transition-all hover:scale-110"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium z-10">
                {modalImageIndex + 1} / {totalImages}
              </div>

              {/* Main Image */}
              <motion.div
                key={modalImageIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <Image
                  src={sortedImages[modalImageIndex]?.url ?? "/placeholder.svg"}
                  alt={`${property.name} - Image ${modalImageIndex + 1}`}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  quality={100}
                />
              </motion.div>

              {/* Thumbnails */}
              {totalImages > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 py-2 bg-black/50 backdrop-blur-md rounded-xl">
                  {sortedImages.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setModalImageIndex(i)}
                      className={cn(
                        "relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                        i === modalImageIndex
                          ? "border-primary ring-2 ring-primary/30 shadow-lg"
                          : "border-white/30 hover:border-white/50"
                      )}
                    >
                      <Image
                        src={img.url ?? "/placeholder.svg"}
                        alt=""
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}