"use client"

import type React from "react"
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
import {
  Heart,
  User,
  Mail,
  Phone,
  Building2,
  Loader2,
  Camera,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Eye,
  MapPin,
  Bed,
  Square,
  Trash2,
  Home,
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

export function BuyerDashboard() {
  const router = useRouter()
  const { user, refreshUser, isAuthenticated } = useAuth()
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

  // Only include fields that exist in your backend - CORRECTED
  const [personalInfo, setPersonalInfo] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    username: "",
    role: "buyer", 
  })

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile()
      loadWishlist()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Add function to load wishlist
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

  // Add function to remove from wishlist
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

  // Update your loadProfile function
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
      
      // Load verification status for BOTH buyers and sellers
      if (data.role === 'buyer' || data.role === 'seller') {
        try {
          const verificationData = await usersApi.getVerificationStatus()
          setVerificationStatus(verificationData.status || "none")
          
          // Get the document info from backend
          if (verificationData.document_name) {
            setSubmittedFileName(verificationData.document_name)
          }
          if (verificationData.document_url) {
            setSubmittedDocumentUrl(verificationData.document_url)
          }
        } catch (error) {
          console.error("[v0] Failed to load verification status:", error)
          setVerificationStatus("none")
        }
      }
    } catch (error: any) {
      console.error("[v0] Failed to load profile:", error)
      if (error.message === 'Not authenticated') {
        toast({
          title: "Authentication Required",
          description: "Please log in to access your profile",
          variant: "destructive",
        })
        router.push('/login')
      } else {
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDocument = () => {
    if (submittedDocumentUrl) {
      // Open the PDF in a new tab
      window.open(submittedDocumentUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Document unavailable",
        description: "The document is not available for viewing at the moment.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      // Send only the fields that exist in your backend
      await usersApi.updateProfile(personalInfo)
      await refreshUser() // This will refresh the user role if changed to seller
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
        router.push('/login')
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF document",
          variant: "destructive",
        })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        })
        return
      }
      setVerificationFile(file)
    }
  }

  const handleSubmitVerification = async () => {
    if (!verificationFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF document to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmittingVerification(true)
      await usersApi.submitVerification(verificationFile)
      setVerificationStatus("pending")
      setSubmittedFileName(verificationFile.name) // Store the filename here
      setVerificationFile(null)
      toast({
        title: "Verification submitted",
        description: "Your verification request has been submitted for review",
      })
    } catch (error: any) {
      console.error("[v0] Failed to submit verification:", error)
      if (error.message === 'Not authenticated') {
        toast({
          title: "Session Expired",
          description: "Please log in again",
          variant: "destructive",
        })
        router.push('/login')
      } else {
        toast({
          title: "Error",
          description: "Failed to submit verification. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmittingVerification(false)
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

  // Refresh verification status periodically for pending requests
  useEffect(() => {
    if (verificationStatus === "pending" && user?.role === "buyer") {
      const interval = setInterval(() => {
        loadProfile() // This will refresh the verification status and user role
      }, 30000) // Check every 30 seconds

      return () => clearInterval(interval)
    }
  }, [verificationStatus, user?.role])

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-6">Please log in to access your dashboard</p>
        <Button asChild size="lg">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Get user's first name for welcome message
  const displayName = personalInfo.first_name || user?.first_name || user?.username || "User"
  
  // Get initials for avatar
  const firstName = personalInfo.first_name || ""
  const lastName = personalInfo.last_name || ""
  const initials = firstName && lastName ? `${firstName[0]}${lastName[0]}`.toUpperCase() : 
                  user?.username ? user.username[0].toUpperCase() : "U"

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome back, {displayName}!</h1>
        <p className="text-lg text-muted-foreground">Manage your saved properties and profile</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
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
            <CardTitle className="text-sm font-medium">Properties Viewed</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">Recently viewed</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">With sellers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="saved" className="space-y-6">
        <TabsList className="bg-background border-2">
          <TabsTrigger
            value="saved"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Heart className="h-4 w-4 mr-2" />
            Saved Properties
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="seller"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Become a Seller
          </TabsTrigger>
        </TabsList>

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

                {/* Profile Info - Only show existing fields */}
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
                        value={personalInfo.role || user?.role || "buyer"}
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

        {/* Become a Seller Tab */}
        <TabsContent value="seller" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Become a Seller</h2>
            <p className="text-muted-foreground text-lg">Start selling properties by verifying your account</p>
          </div>

          {user?.role === "buyer" && (
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">Become a Verified Seller</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Want to sell properties? Upload your verification document and become a verified seller.
                    </p>

                    {verificationStatus === "none" && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Input
                            id="verification-doc"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                          />
                          {verificationFile && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                              <FileText className="h-4 w-4" />
                              <span className="truncate">{verificationFile.name}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={handleSubmitVerification}
                          disabled={!verificationFile || isSubmittingVerification}
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
                              Submit for Verification
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {verificationStatus === "pending" && (
                      <Alert className="mt-6 border-gray-700 bg-gray-900">
                        <AlertCircle className="h-4 w-4 text-blue-400" />
                        <AlertDescription className="space-y-1">
                          <p className="text-gray-300 text-sm">Your verification request is pending review. We'll notify you via email once it's been processed.</p>
                          
                          {submittedFileName && (
                            <div 
                              className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-600 mt-1 cursor-pointer hover:bg-gray-700 transition-colors"
                              onClick={handleViewDocument}
                            >
                              <FileText className="h-3 w-3 text-blue-400" />
                              
                              <Button variant="ghost" size="sm" className="h-6 text-blue-400 hover:text-blue-300 hover:bg-gray-600 text-xs">
                                View File 
                              </Button>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {verificationStatus === "approved" && (
                      <Alert className="border-gray-700 bg-gray-900 mt-6">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <AlertDescription className="space-y-1">
                          <p className="text-sm text-gray-300">Congratulations! You're now a verified seller. You can start listing properties.</p>
                          {submittedFileName && (
                            <div 
                              className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-600 mt-1 cursor-pointer hover:bg-gray-700 transition-colors"
                              onClick={handleViewDocument}
                            >
                              <FileText className="h-3 w-3 text-green-400" />
                          
                              <Button variant="ghost" size="sm" className="h-6 text-green-400 hover:text-green-300 hover:bg-gray-600 text-xs">
                                View File 
                              </Button>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {verificationStatus === "rejected" && (
                      <Alert className="border-gray-700 bg-gray-900 mt-6">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="space-y-1">
                          <p className="text-sm text-gray-300">Your verification request was rejected. Please contact support for more information.</p>
                          {submittedFileName && (
                            <div 
                              className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-600 mt-1 cursor-pointer hover:bg-gray-700 transition-colors"
                              onClick={handleViewDocument}
                            >
                              <FileText className="h-3 w-3 text-red-400" />
                              
                              <Button variant="ghost" size="sm" className="h-6 text-red-400 hover:text-red-300 hover:bg-gray-600 text-xs">
                                View File 
                              </Button>
                            </div>
                          )}
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

      {/* Chatbot Component */}
      <Chatbot className="mt-6" />
    </div>
  )
}