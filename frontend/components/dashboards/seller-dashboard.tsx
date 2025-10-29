"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { usersApi } from "@/lib/api/users"
import type { UserProfile } from "@/types/user"
import { Home, Eye, DollarSign, MessageSquare, Plus, Pencil, Trash2, Loader2, User, Mail, Phone, Camera, Heart, MapPin, Bed, Square, Building2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { propertiesApi } from "@/lib/api/properties"
import type { Property } from "@/types/property"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from "next/image"

export function SellerDashboard() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [myListings, setMyListings] = useState<Property[]>([])
  const [savedProperties, setSavedProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false)
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Profile states
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [personalInfo, setPersonalInfo] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    username: "",
    role: "seller",
  })

  useEffect(() => {
    loadMyProperties()
    loadProfile()
    loadWishlist()
  }, [])

  // Add wishlist functionality
  const loadWishlist = async () => {
    try {
      setIsLoadingWishlist(true)
      const wishlist = await propertiesApi.getWishlist()
      setSavedProperties(wishlist)
    } catch (error) {
      console.error("[v0] Failed to load wishlist:", error)
      toast({
        title: "Error",
        description: "Failed to load saved properties",
        variant: "destructive",
      })
    } finally {
      setIsLoadingWishlist(false)
    }
  }

  const handleRemoveFromWishlist = async (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await propertiesApi.toggleWishlist(propertyId)
      toast({
        title: "Removed from favorites",
        description: "Property removed from your wishlist",
      })
      // Refresh the wishlist
      await loadWishlist()
    } catch (error) {
      console.error("[v0] Failed to remove from wishlist:", error)
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      })
    }
  }

  // Helper functions for formatting
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatSquareMeters = (sqm: number) => {
    return new Intl.NumberFormat('de-DE').format(sqm)
  }

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
      if (error.message === 'Not authenticated') {
        toast({
          title: "Authentication Required",
          description: "Please log in to access your profile",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      }
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      await usersApi.updateProfile(personalInfo)
      await refreshUser()
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error: any) {
      console.error("[v0] Failed to update profile:", error)
      if (error.message === 'Not authenticated') {
        toast({
          title: "Session Expired",
          description: "Please log in again",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const loadMyProperties = async () => {
    try {
      setIsLoading(true)
      const properties = await propertiesApi.getMyProperties()
      setMyListings(properties)
    } catch (error) {
      console.error("[v0] Failed to load properties:", error)
      toast({
        title: "Error",
        description: "Failed to load your properties",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProperty = async () => {
    if (!deletePropertyId) return

    try {
      setIsDeleting(true)
      await propertiesApi.deleteProperty(deletePropertyId)
      setMyListings(myListings.filter((p) => p.id !== deletePropertyId))
      toast({
        title: "Success",
        description: "Property deleted successfully",
      })
    } catch (error) {
      console.error("[v0] Failed to delete property:", error)
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeletePropertyId(null)
    }
  }

  const activeListings = myListings.filter((p) => p.status === "active").length

  // Get user's first name for welcome message
  const displayName = personalInfo.first_name || user?.first_name || user?.username || "Seller"
  
  // Get initials for avatar
  const firstName = personalInfo.first_name || ""
  const lastName = personalInfo.last_name || ""
  const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : 
                  user?.username ? user.username[0].toUpperCase() : "S"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back, {displayName}!</h1>
          <p className="text-lg text-muted-foreground">Manage your property listings and track performance</p>
        </div>
        <Button asChild size="lg" className="gap-2 font-medium shadow-sm h-12 px-6">
          <Link href="/dashboard/properties/new">
            <Plus className="h-5 w-5" />
            List New Property
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Home className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeListings}</div>
            <p className="text-xs text-muted-foreground mt-1">{myListings.length} total listings</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saved Properties</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{savedProperties.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In your wishlist</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">3 pending review</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">15</div>
            <p className="text-xs text-muted-foreground mt-1">5 unread</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="listings" className="space-y-6">
        <TabsList className="bg-background border-2">
          <TabsTrigger value="listings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Home className="h-4 w-4 mr-2" />
            My Listings
          </TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Heart className="h-4 w-4 mr-2" />
            Saved Properties
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* My Listings Tab */}
        <TabsContent value="listings" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">My Property Listings</h2>
              <p className="text-muted-foreground text-lg">Manage and track your listed properties</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : myListings.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Home className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No listings yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md leading-relaxed">
                  Start by creating your first property listing
                </p>
                <Button asChild size="lg" className="font-medium">
                  <Link href="/dashboard/properties/new">Create Listing</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myListings.map((property) => (
                <Card key={property.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        <div className="w-32 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {property.images[0] && (
                            <img
                              src={property.images[0].url || "/placeholder.svg"}
                              alt={property.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{property.name}</h3>
                            <Badge
                              variant={property.status === "active" ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {property.status}
                            </Badge>
                          </div>
                          
                          <p className="text-lg font-bold text-primary">{formatPrice(property.price)}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              <span>{property.bedrooms} rooms</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Square className="h-3 w-3" />
                              <span>{formatSquareMeters(property.squareMeters)} m²</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{property.city}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/properties/${property.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/properties/${property.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletePropertyId(property.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Saved Properties Tab */}
        <TabsContent value="saved" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Saved Properties</h2>
              <p className="text-muted-foreground text-lg">Properties you've marked as favorites</p>
            </div>
            <Button asChild size="lg" className="font-medium">
              <Link href="/properties">Browse More</Link>
            </Button>
          </div>

          {isLoadingWishlist ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : savedProperties.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Heart className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No saved properties yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md leading-relaxed">
                  Start browsing properties and save your favorites to see them here
                </p>
                <Button asChild size="lg" className="font-medium">
                  <Link href="/properties">Browse Properties</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map((property) => (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary/50 cursor-pointer">
                  <Link href={`/properties/${property.id}`} className="block">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={property.images[0]?.url || "/placeholder.svg"}
                        alt={property.name}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant={property.status === "active" ? "default" : "secondary"} className="capitalize">
                          {property.status}
                        </Badge>
                      </div>
                      <div className="absolute top-3 right-3">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-white/95 hover:bg-white shadow-lg"
                          onClick={(e) => handleRemoveFromWishlist(property.id, e)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <p className="text-xl font-bold text-primary">{formatPrice(property.price)}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(property.price / property.squareMeters).toLocaleString('de-DE')} €/m²
                        </p>
                      </div>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="line-clamp-1">{property.city}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Bed className="h-3 w-3 text-muted-foreground" />
                          <span>{property.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Square className="h-3 w-3 text-muted-foreground" />
                          <span>{formatSquareMeters(property.squareMeters)} m²</span>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Profile Settings</h2>
            <p className="text-muted-foreground text-lg">Manage your personal information and account settings</p>
          </div>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                {/* Avatar Section */}
                <div className="flex-shrink-0">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                      <AvatarImage src="/placeholder.svg" alt={displayName} />
                      <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm">
                      Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        disabled
                        value={personalInfo.username}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm">
                      Role
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="role"
                        value="seller"
                        disabled
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="first_name"
                        value={personalInfo.first_name}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, first_name: e.target.value })}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="last_name"
                        value={personalInfo.last_name}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, last_name: e.target.value })}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        disabled
                        value={personalInfo.email}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-sm">
                      Phone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone_number"
                        type="tel"
                        value={personalInfo.phone_number}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone_number: e.target.value })}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  <div className="flex items-end md:col-span-2">
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deletePropertyId} onOpenChange={() => setDeletePropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}