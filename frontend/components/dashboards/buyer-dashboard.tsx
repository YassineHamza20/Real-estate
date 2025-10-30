"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { usersApi } from "@/lib/api/users"
import type { UserProfile } from "@/types/user"
import {
  Heart, User, Mail, Phone, Building2, Loader2, Camera, Upload,
  FileText, AlertCircle, CheckCircle2, Eye, MapPin, Bed, Square,
  Trash2, Search, RefreshCw, X, ChevronDown, Undo2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Chatbot } from "@/components/chatbot"
import { propertiesApi } from "@/lib/api/properties"
import type { Property } from "@/types/property"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useTheme } from "next-themes"
import { useInView } from "react-intersection-observer"
import confetti from "canvas-confetti"

export function BuyerDashboard() {
  const router = useRouter()
  const { user, refreshUser, isAuthenticated } = useAuth()
  const { setTheme, theme } = useTheme()
  const { toast } = useToast()

  const [savedProperties, setSavedProperties] = useState<Property[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [verificationFile, setVerificationFile] = useState<File | null>(null)
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"none" | "pending" | "approved" | "rejected">("none")
  const [submittedDocumentUrl, setSubmittedDocumentUrl] = useState<string>("")
  const [submittedFileName, setSubmittedFileName] = useState<string>("")
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"price" | "date" | "status">("date")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [quickViewProperty, setQuickViewProperty] = useState<Property | null>(null)
  const [isPulling, setIsPulling] = useState(false)
  const pullRef = useRef<HTMLDivElement>(null)

  const [personalInfo, setPersonalInfo] = useState({
    first_name: "", last_name: "", email: "", phone_number: "", username: "", role: "buyer"
  })

  const { ref: loadMoreRef, inView } = useInView()

  // Pull-to-refresh
  useEffect(() => {
    let startY = 0
    const touchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) startY = e.touches[0].clientY
    }
    const touchMove = (e: TouchEvent) => {
      if (!startY || window.scrollY > 0) return
      const diff = e.touches[0].clientY - startY
      if (diff > 0 && diff < 150) {
        setIsPulling(true)
        if (pullRef.current) pullRef.current.style.transform = `translateY(${diff}px)`
      }
    }
    const touchEnd = () => {
      if (isPulling) {
        setIsPulling(false)
        if (pullRef.current) pullRef.current.style.transform = ''
        if (window.scrollY === 0) handleRefresh()
      }
      startY = 0
    }
    window.addEventListener('touchstart', touchStart)
    window.addEventListener('touchmove', touchMove)
    window.addEventListener('touchend', touchEnd)
    return () => {
      window.removeEventListener('touchstart', touchStart)
      window.removeEventListener('touchmove', touchMove)
      window.removeEventListener('touchend', touchEnd)
    }
  }, [isPulling])

  useEffect(() => {
    if (inView && hasMore && !isLoadingWishlist) {
      loadWishlist(page + 1)
    }
  }, [inView, page, hasMore])

  const handleRefresh = useCallback(() => {
    setPage(1)
    setSavedProperties([])
    loadProfile()
    loadWishlist(1)
    toast({ title: "Refreshing...", description: "Updating your data" })
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile()
      loadWishlist(1)
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        document.querySelector('a[href="/properties"]')?.click()
      }
      if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleRefresh()
      }
      if (e.key === "d" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setTheme(theme === "dark" ? "light" : "dark")
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [handleRefresh, theme, setTheme])

  const loadWishlist = async (pageNum: number = 1) => {
    if (pageNum === 1) setIsLoadingWishlist(true)
    try {
      const wishlist = await propertiesApi.getWishlist(pageNum)
      if (pageNum === 1) {
        setSavedProperties(wishlist)
      } else {
        setSavedProperties(prev => [...prev, ...wishlist])
      }
      setHasMore(wishlist.length === 12)
      setPage(pageNum)
    } catch (error) {
      console.error("[v0] Failed to load wishlist:", error)
      toast({ title: "Error", description: "Failed to load", variant: "destructive" })
    } finally {
      if (pageNum === 1) setIsLoadingWishlist(false)
    }
  }

  const handleRemoveFromWishlist = async (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const property = savedProperties.find(p => p.id === propertyId)
    setSavedProperties(prev => prev.filter(p => p.id !== propertyId))

    const { dismiss } = toast({
      title: "Removed",
      description: "Property removed from wishlist",
      action: (
        <Button size="sm" variant="outline" onClick={() => {
          if (property) setSavedProperties(prev => [...prev, property])
          dismiss()
        }}>
          <Undo2 className="h-3 w-3 mr-1" /> Undo
        </Button>
      ),
    })

    try {
      await propertiesApi.toggleWishlist(propertyId)
    } catch (error) {
      if (property) setSavedProperties(prev => [...prev, property])
      toast({ title: "Error", description: "Failed to remove", variant: "destructive" })
    }
  }

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const data = await usersApi.getProfile()
      setProfile(data)
      setPersonalInfo({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        username: data.username || "",
        role: data.role || "buyer",
      })

      if (data.role === 'buyer' || data.role === 'seller') {
        try {
          const verificationData = await usersApi.getVerificationStatus()
          const newStatus = verificationData.status || "none"
          setVerificationStatus(newStatus)
          if (verificationData.document_name) setSubmittedFileName(verificationData.document_name)
          if (verificationData.document_url) setSubmittedDocumentUrl(verificationData.document_url)

          if (newStatus === "approved" && verificationStatus !== "approved") {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
          }
        } catch (error) {
          console.error("[v0] Failed to load verification status:", error)
          setVerificationStatus("none")
        }
      }
    } catch (error: any) {
      console.error("[v0] Failed to load profile:", error)
      if (error.message === 'Not authenticated') {
        toast({ title: "Login Required", description: "Please log in", variant: "destructive" })
        router.push('/login')
      } else {
        toast({ title: "Error", description: "Failed to load profile", variant: "destructive" })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDocument = () => {
    if (submittedDocumentUrl) {
      window.open(submittedDocumentUrl, '_blank', 'noopener,noreferrer')
    } else {
      toast({ title: "Unavailable", description: "Document not ready", variant: "destructive" })
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      await usersApi.updateProfile(personalInfo)
      await refreshUser()
      toast({ title: "Saved!", description: "Profile updated" })
    } catch (error: any) {
      toast({
        title: error.message === 'Not authenticated' ? "Session Expired" : "Error",
        description: error.message === 'Not authenticated' ? "Please log in" : "Failed to save",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid", description: "PDF only", variant: "destructive" })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max 10MB", variant: "destructive" })
      return
    }
    setVerificationFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const fakeEvent = { target: { files: [file] } } as any
      handleFileChange(fakeEvent)
    }
  }

  const handleSubmitVerification = async () => {
    if (!verificationFile) {
      toast({ title: "No file", description: "Select a PDF", variant: "destructive" })
      return
    }
    try {
      setIsSubmittingVerification(true)
      await usersApi.submitVerification(verificationFile)
      setVerificationStatus("pending")
      setSubmittedFileName(verificationFile.name)
      setVerificationFile(null)
      toast({ title: "Submitted", description: "Under review" })
    } catch (error: any) {
      toast({
        title: error.message === 'Not authenticated' ? "Session Expired" : "Error",
        description: "Failed to submit",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingVerification(false)
    }
  }

  const handleDeleteVerification = async () => {
    if (!window.confirm("Are you sure you want to delete the submitted document? This cannot be undone.")) return

    try {
      await usersApi.deleteVerification()
      setVerificationStatus("none")
      setSubmittedFileName("")
      setSubmittedDocumentUrl("")
      setVerificationFile(null)
      toast({ title: "Deleted", description: "Verification document removed" })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
  const formatSquareMeters = (sqm: number) => new Intl.NumberFormat('de-DE').format(sqm)

  useEffect(() => {
    if (verificationStatus === "pending" && user?.role === "buyer") {
      const interval = setInterval(loadProfile, 30000)
      return () => clearInterval(interval)
    }
  }, [verificationStatus, user?.role])

  const filteredSaved = useMemo(() => {
    let filtered = savedProperties.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return filtered.sort((a, b) => {
      if (sortBy === "price") return b.price - a.price
      if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === "status") return a.status.localeCompare(b.status)
      return 0
    })
  }, [savedProperties, searchQuery, sortBy])

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Login Required</h2>
        <p className="text-muted-foreground mb-6">Sign in to access your dashboard</p>
        <Button asChild size="lg"><Link href="/login">Sign In</Link></Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      </div>
    )
  }

  const displayName = personalInfo.first_name || user?.first_name || user?.username || "User"
  const initials = (personalInfo.first_name?.[0] || "") + (personalInfo.last_name?.[0] || "") || user?.username?.[0] || "U"

  return (
    <>
      <div ref={pullRef} className="fixed top-0 left-0 right-0 h-16 bg-primary/5 flex items-center justify-center pointer-events-none z-50 transition-transform">
        {isPulling && <RefreshCw className="h-5 w-5 animate-spin text-primary" />}
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl pt-16">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Welcome back, {displayName}!</h1>
            <p className="text-muted-foreground mt-1">Your real estate journey starts here</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button asChild size="lg" className="h-12 px-6 font-medium shadow-md">
              <Link href="/properties">
                <Search className="h-5 w-5 mr-2" />
                Browse
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { title: "Saved", value: savedProperties.length, sub: "Wishlist", icon: Heart },
            { title: "Viewed", value: 24, sub: "Recently", icon: Eye },
            { title: "Messages", value: 8, sub: "Active", icon: Mail },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border hover:border-primary/50 transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="saved" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border">
            <TabsTrigger value="saved"><Heart className="h-4 w-4 mr-2" />Saved</TabsTrigger>
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
            <TabsTrigger value="seller"><Building2 className="h-4 w-4 mr-2" />Sell</TabsTrigger>
          </TabsList>

          {/* Saved Properties */}
          <TabsContent value="saved" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Saved Properties</h2>
                <p className="text-muted-foreground">Your curated collection</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 w-full sm:w-64"
                    aria-label="Search saved properties"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Latest</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AnimatePresence>
              {isLoadingWishlist && page === 1 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <Skeleton className="h-48 w-full" />
                      <CardContent className="p-4 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-40" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredSaved.length === 0 ? (
                <Card className="border-dashed text-center py-16">
                  <CardContent>
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No saved properties</h3>
                    <p className="text-muted-foreground mb-6">Start exploring!</p>
                    <Button asChild><Link href="/properties">Browse</Link></Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSaved.map((property) => (
                    <motion.div
                      key={property.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ y: -4 }}
                      className="group"
                    >
                      <Card
                        className="overflow-hidden border hover:border-primary/50 transition-all cursor-pointer"
                        onClick={() => setQuickViewProperty(property)}
                        tabIndex={0}
                        role="button"
                        aria-label={`View ${property.name}`}
                      >
                        <div className="relative h-48 bg-muted">
                          <Image
                            src={property.images[0]?.url || "/placeholder.svg"}
                            alt={property.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                          <Badge className="absolute top-3 left-3 text-xs capitalize">
                            {property.status}
                          </Badge>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleRemoveFromWishlist(property.id, e)}
                            aria-label="Remove from wishlist"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                        <CardContent className="p-4">
                          <p className="font-bold text-primary">{formatPrice(property.price)}</p>
                          <p className="text-xs text-muted-foreground mb-1">
                            {Math.round(property.price / property.squareMeters).toLocaleString()} €/m²
                          </p>
                          <h3 className="font-medium line-clamp-1 mb-2">{property.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3" />{property.city}
                          </p>
                          <div className="flex gap-3 text-sm">
                            <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{property.bedrooms}</span>
                            <span className="flex items-center gap-1"><Square className="h-3 w-3" />{formatSquareMeters(property.squareMeters)} m²</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  {hasMore && (
                    <div ref={loadMoreRef} className="col-span-full flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Profile Settings</h2>
              <p className="text-muted-foreground">Update your personal information</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="relative group">
                      <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                        <AvatarImage src="/placeholder.svg" alt={displayName} />
                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                          {initials.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <button className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="h-6 w-6 text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input value={personalInfo.username} disabled className="pl-9 h-10" />
                        </div>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input value={personalInfo.role || user?.role || "buyer"} disabled className="pl-9 h-10" />
                        </div>
                      </div>
                      <div>
                        <Label>First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={personalInfo.first_name}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, first_name: e.target.value })}
                            className="pl-9 h-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={personalInfo.last_name}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, last_name: e.target.value })}
                            className="pl-9 h-10"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input value={personalInfo.email} disabled className="pl-9 h-10" />
                        </div>
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={personalInfo.phone_number}
                            onChange={(e) => setPersonalInfo({ ...personalInfo, phone_number: e.target.value })}
                            className="pl-9 h-10"
                          />
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full sm:w-auto">
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Become Seller Tab */}
          <TabsContent value="seller" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Become a Seller</h2>
              <p className="text-muted-foreground">Verify your account to start listing properties</p>
            </div>

            {user?.role === "buyer" && (
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">Get Verified</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload a PDF document to become a verified seller.
                      </p>

                      {verificationStatus === "none" && (
                        <div
                          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <Input
                            id="verification-doc"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label htmlFor="verification-doc" className="cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm font-medium">Click to upload or drag & drop</p>
                            <p className="text-xs text-muted-foreground">PDF up to 10MB</p>
                          </label>
                          {verificationFile && (
                            <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4" />
                                <span className="truncate max-w-48">{verificationFile.name}</span>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setVerificationFile(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <Button
                            onClick={handleSubmitVerification}
                            disabled={!verificationFile || isSubmittingVerification}
                            className="mt-4 w-full"
                            size="lg"
                          >
                            {isSubmittingVerification ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Submit for Review
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {verificationStatus === "pending" && (
                        <Alert className="bg-blue-50 border-blue-200">
                          <AlertCircle className="h-4 w-4 text-blue-600" />
                          <AlertDescription>
                            <p className="font-medium text-blue-900">Under Review</p>
                            <p className="text-sm text-blue-700">We'll email you once processed.</p>
                            {submittedFileName && (
                              <div className="mt-2 flex items-center gap-3 text-sm">
                                <button
                                  onClick={handleViewDocument}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  <FileText className="h-3 w-3" />
                                  View Document
                                </button>
                                <button
                                  onClick={handleDeleteVerification}
                                  className="inline-flex items-center gap-1 text-red-600 hover:underline"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {verificationStatus === "approved" && (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription>
                            <p className="font-medium text-green-900">Verified Seller!</p>
                            <p className="text-sm text-green-700">You can now list properties.</p>
                            {submittedFileName && (
                              <div className="mt-2 flex items-center gap-3 text-sm">
                                <button
                                  onClick={handleViewDocument}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  <FileText className="h-3 w-3" />
                                  View Document
                                </button>
                                <button
                                  onClick={handleDeleteVerification}
                                  className="inline-flex items-center gap-1 text-red-600 hover:underline"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              </div>
                            )}
                            <Button asChild className="mt-3">
                              <Link href="/dashboard/properties/new">List Property</Link>
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}

                      {verificationStatus === "rejected" && (
                        <Alert className="bg-red-50 border-red-200">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription>
                            <p className="font-medium text-red-900">Verification Rejected</p>
                            <p className="text-sm text-red-700">Contact support for details.</p>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick View Modal */}
        <Dialog open={!!quickViewProperty} onOpenChange={() => setQuickViewProperty(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{quickViewProperty?.name}</DialogTitle>
            </DialogHeader>
            {quickViewProperty && (
              <div className="space-y-4">
                <div className="relative h-64 rounded-lg overflow-hidden">
                  <Image
                    src={quickViewProperty.images[0]?.url || "/placeholder.svg"}
                    alt={quickViewProperty.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Price:</strong> {formatPrice(quickViewProperty.price)}</div>
                  <div><strong>Size:</strong> {formatSquareMeters(quickViewProperty.squareMeters)} m²</div>
                  <div><strong>Rooms:</strong> {quickViewProperty.bedrooms}</div>
                  <div><strong>Location:</strong> {quickViewProperty.city}</div>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/properties/${quickViewProperty.id}`}>View Details</Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => handleRemoveFromWishlist(quickViewProperty.id, e)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Chatbot className="mt-8" />
      </div>
    </>
  )
}