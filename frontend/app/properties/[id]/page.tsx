"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { propertiesApi } from "@/lib/api/properties"
import { usersApi } from "@/lib/api/users"
import type { Property } from "@/types/property"
import { MapPin, Bed, Square, Calendar, Heart, Share2, ArrowLeft, Check, Phone, Mail, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Footer } from "@/components/footer"

export default function PropertyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
const [sellerContact, setSellerContact] = useState<{
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
} | null>(null)
  const [isLoadingContact, setIsLoadingContact] = useState(false)

  useEffect(() => {
    loadProperty()
  }, [params.id])

  // Load seller contact info when property loads and user is authenticated
  useEffect(() => {
    if (user && property) {
      loadSellerContact()
    }
  }, [user, property])

  const loadProperty = async () => {
    setIsLoading(true)
    try {
      const data = await propertiesApi.getProperty(params.id as string)
      setProperty(data)
    } catch (error) {
      console.error("[v0] Failed to load property:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSellerContact = async () => {
    if (!property) return
    
    setIsLoadingContact(true)
    try {
      const contactInfo = await usersApi.getSellerContact(property.seller.id)
      setSellerContact({
         first_name: contactInfo.first_name,
      last_name: contactInfo.last_name,
        email: contactInfo.email,
        phone: contactInfo.phone
      })
    } catch (error) {
      console.error("Failed to load seller contact:", error)
      // Keep sellerContact as null to show generic buttons
    } finally {
      setIsLoadingContact(false)
    }
  }

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
        <div className="text-center bg-background p-12 rounded-2xl border-2 border-border shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist</p>
          <Button onClick={() => router.push("/properties")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-6 gap-2 font-medium bg-background">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative bg-background rounded-2xl border-2 border-border overflow-hidden shadow-sm">
              <div className="relative h-[500px]">
                <Image
                  src={property.images[currentImageIndex]?.url || "/placeholder.svg"}
                  alt={`${property.name} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              {property.images.length > 1 && (
                <div className="flex gap-3 p-4 overflow-x-auto bg-muted/50">
                  {property.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden border-3 transition-all ${
                        index === currentImageIndex
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      <Image
                        src={image.url || "/placeholder.svg"}
                        alt={`View ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-background rounded-2xl border-2 border-border p-8 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3 text-balance">{property.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>
                      {property.address}, {property.city}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-11 w-11 bg-background">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-11 w-11 bg-background">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <Badge variant="secondary" className="text-base px-4 py-1.5 capitalize">
                  {property.type}
                </Badge>
                <Badge
                  variant={property.status === "active" ? "default" : "secondary"}
                  className="text-base px-4 py-1.5 capitalize"
                >
                  {property.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8 p-6 bg-muted/50 rounded-xl">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Bed className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Bedrooms</p>
                  <p className="text-xl font-bold">{property.bedrooms}</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Square className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Size</p>
                  <p className="text-xl font-bold">{formatSquareMeters(property.squareMeters)} m²</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">Listed</p>
                  <p className="text-xl font-bold">{new Date(property.createdAt).toLocaleDateString('de-DE')}</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Description</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">{property.description}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2 shadow-lg">
              <CardContent className="p-8 space-y-6">
                <div className="pb-6 border-b">
                  <p className="text-4xl font-bold text-primary mb-2">{formatPrice(property.price)}</p>
                  <p className="text-base text-muted-foreground">
                    {Math.round(property.price / property.squareMeters).toLocaleString('de-DE')} €/m²
                  </p>
                </div>
 


{user ? (
  <div className="space-y-6">
    <div className="pt-6 border-t space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-base">
            {sellerContact ? 
              `${sellerContact.first_name} ${sellerContact.last_name}` : 
              property.seller.name
            }
          </h3>
          <p className="text-sm text-muted-foreground">Property Owner</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {isLoadingContact ? (
          <div className="space-y-2">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : sellerContact ? (
          <div className="space-y-3">
            {sellerContact.phone && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Phone className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{sellerContact.phone}</p>
                </div>
              </div>
            )}
            {sellerContact.email && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{sellerContact.email}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Phone className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">Contact for phone number</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Mail className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">Contact via email</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
) : (
  <div className="space-y-3">
    <Button 
      className="w-full h-12 text-base font-medium shadow-sm" 
      size="lg"
      onClick={() => router.push("/login")}
    >
      Sign In to Contact Seller
    </Button>
    <div className="text-center text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
      <p>Create an account to view contact information and save properties to your wishlist</p>
    </div>
  </div>
)}



              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}