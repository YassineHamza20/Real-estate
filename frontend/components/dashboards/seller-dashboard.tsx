"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  Home, Eye, DollarSign, MessageSquare, Plus, Pencil, Trash2,
  Loader2, User, Mail, Phone, Camera, Heart, MapPin, Bed, Square,
  Search, ArrowUpDown, RefreshCw
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { propertiesApi } from "@/lib/api/properties"
import type { Property } from "@/types/property"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from "next/image"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"

export function SellerDashboard() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [myListings, setMyListings] = useState<Property[]>([])
  const [savedProperties, setSavedProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false)
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"price" | "date" | "status">("date")

  // Profile
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [personalInfo, setPersonalInfo] = useState({
    first_name: "", last_name: "", email: "", phone_number: "", username: "", role: "seller"
  })

  // Refresh
  const handleRefresh = useCallback(() => {
    loadMyProperties()
    loadWishlist()
    toast({ title: "Refreshing...", description: "Updating your data" })
  }, [])

  useEffect(() => {
    loadMyProperties()
    loadProfile()
    loadWishlist()
  }, [handleRefresh])

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        document.querySelector('a[href="/dashboard/properties/new"]')?.click()
      }
      if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleRefresh()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [handleRefresh])

  // Wishlist
  const loadWishlist = async () => {
    try {
      setIsLoadingWishlist(true)
      const wishlist = await propertiesApi.getWishlist()
      setSavedProperties(wishlist)
    } catch (error) {
      console.error("[v0] Failed to load wishlist:", error)
      toast({ title: "Error", description: "Failed to load saved properties", variant: "destructive" })
    } finally {
      setIsLoadingWishlist(false)
    }
  }

  const handleRemoveFromWishlist = async (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await propertiesApi.toggleWishlist(propertyId)
      toast({ title: "Removed", description: "Property removed from wishlist" })
      await loadWishlist()
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove", variant: "destructive" })
    }
  }

  // Formatters
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
  const formatSquareMeters = (sqm: number) => new Intl.NumberFormat('de-DE').format(sqm)

  // Profile
  const loadProfile = async () => {
    try {
      setIsProfileLoading(true)
      const data = await usersApi.getProfile()
      setProfile(data)
      setPersonalInfo({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        username: data.username || "",
        role: data.role || "seller",
      })
    } catch (error: any) {
      console.error("[v0] Failed to load profile:", error)
      toast({
        title: error.message === 'Not authenticated' ? "Login Required" : "Error",
        description: error.message === 'Not authenticated'
          ? "Please log in to view your profile"
          : "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      await usersApi.updateProfile(personalInfo)
      await refreshUser()
      toast({ title: "Saved!", description: "Profile updated successfully" })
    } catch (error: any) {
      toast({
        title: error.message === 'Not authenticated' ? "Session Expired" : "Error",
        description: error.message === 'Not authenticated'
          ? "Please log in again"
          : "Failed to save profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Listings
  const loadMyProperties = async () => {
    try {
      setIsLoading(true)
      const properties = await propertiesApi.getMyProperties()
      setMyListings(properties)
    } catch (error) {
      console.error("[v0] Failed to load properties:", error)
      toast({ title: "Error", description: "Failed to load your listings", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProperty = async () => {
    if (!deletePropertyId) return
    try {
      setIsDeleting(true)
      await propertiesApi.deleteProperty(deletePropertyId)
      setMyListings(prev => prev.filter(p => p.id !== deletePropertyId))
      toast({ title: "Deleted", description: "Property removed" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" })
    } finally {
      setIsDeleting(false)
      setDeletePropertyId(null)
    }
  }

  // Computed
  const activeListings = myListings.filter(p => p.status === "active").length
  const displayName = personalInfo.first_name || user?.first_name || user?.username || "Seller"
  const initials = (personalInfo.first_name?.[0] || "") + (personalInfo.last_name?.[0] || "") || user?.username?.[0] || "S"

  // Filtered & Sorted Listings
  const filteredListings = useMemo(() => {
    let filtered = myListings.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return filtered.sort((a, b) => {
      if (sortBy === "price") return b.price - a.price
      if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === "status") return a.status.localeCompare(b.status)
      return 0
    })
  }, [myListings, searchQuery, sortBy])

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Welcome back, {displayName}!</h1>
          <p className="text-muted-foreground mt-1">Manage your listings and track performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button asChild size="lg" className="h-12 px-6 font-medium shadow-md">
            <Link href="/dashboard/properties/new">
              <Plus className="h-5 w-5 mr-2" />
              New Listing
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { title: "Active", value: activeListings, sub: `${myListings.length} total`, icon: Home },
          { title: "Saved", value: savedProperties.length, sub: "Wishlist", icon: Heart },
          { title: "Offers", value: 8, sub: "3 pending", icon: DollarSign },
          { title: "Messages", value: 15, sub: "5 unread", icon: MessageSquare },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border hover:border-primary/50 transition-all hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
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

      {/* Tabs */}
      <Tabs defaultValue="listings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card border">
          <TabsTrigger value="listings"><Home className="h-4 w-4 mr-2" />Listings</TabsTrigger>
          <TabsTrigger value="saved"><Heart className="h-4 w-4 mr-2" />Saved</TabsTrigger>
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profile</TabsTrigger>
        </TabsList>

        {/* My Listings */}
        <TabsContent value="listings" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">My Listings</h2>
              <p className="text-muted-foreground">Edit, view, or delete your properties</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-full sm:w-64"
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

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="flex gap-4">
                      <Skeleton className="w-28 h-20 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <Card className="border-dashed text-center py-16">
              <CardContent>
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No listings found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search</p>
                <Button asChild>
                  <Link href="/dashboard/properties/new">Create Listing</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredListings.map((property) => (
                <motion.div
                  key={property.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-28 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {property.images[0] ? (
                            <Image
                              src={property.images[0].url}
                              alt={property.name}
                              width={112}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted-foreground/20 flex items-center justify-center">
                              <Home className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{property.name}</h3>
                            <Badge variant={property.status === "active" ? "default" : "secondary"} className="text-xs">
                              {property.status}
                            </Badge>
                          </div>
                          <p className="text-lg font-bold text-primary">{formatPrice(property.price)}</p>
                          <div className="flex gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{property.bedrooms}</span>
                            <span className="flex items-center gap-1"><Square className="h-3 w-3" />{formatSquareMeters(property.squareMeters)} m²</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{property.city}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/properties/${property.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-1" />Edit
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/properties/${property.id}`}>
                              <Eye className="h-4 w-4 mr-1" />View
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletePropertyId(property.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Saved Properties */}
        <TabsContent value="saved" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">Saved Properties</h2>
              <p className="text-muted-foreground">Your favorite listings</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/properties">Browse All</Link>
            </Button>
          </div>

          {isLoadingWishlist ? (
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
          ) : savedProperties.length === 0 ? (
            <Card className="border-dashed text-center py-16">
              <CardContent>
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No saved properties</h3>
                <p className="text-muted-foreground mb-6">Save properties you like</p>
                <Button asChild>
                  <Link href="/properties">Explore</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedProperties.map((property) => (
                <motion.div
                  key={property.id}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card className="overflow-hidden border hover:border-primary/50 transition-colors">
                    <Link href={`/properties/${property.id}`} className="block">
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
                    </Link>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Profile */}
        <TabsContent value="profile" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Profile Settings</h2>
            <p className="text-muted-foreground">Update your personal information</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              {isProfileLoading ? (
                <div className="flex flex-col sm:flex-row gap-6">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <div className="flex-1 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
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
                          <Input value="seller" disabled className="pl-9 h-10" />
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <AlertDialog open={!!deletePropertyId} onOpenChange={() => setDeletePropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProperty} disabled={isDeleting} className="bg-destructive">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}