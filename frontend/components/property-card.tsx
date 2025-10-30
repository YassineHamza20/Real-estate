"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Property } from "@/types/property"
import { MapPin, Bed, Square, Heart, Eye } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { propertiesApi } from "@/lib/api/properties"
import { useToast } from "@/hooks/use-toast"

interface PropertyCardProps {
  property: Property
  viewMode?: "grid" | "list"
  onWishlistUpdate?: () => void
}

export function PropertyCard({ property, viewMode = "grid", onWishlistUpdate }: PropertyCardProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const { toast } = useToast()
  const [isInWishlist, setIsInWishlist] = useState(property.inWishlist)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    console.log(`PropertyCard ${property.id}: Syncing state with prop - inWishlist = ${property.inWishlist}`)
    setIsInWishlist(property.inWishlist)
  }, [property.inWishlist, property.id])

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save properties",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await propertiesApi.toggleWishlist(property.id)
      console.log('Wishlist toggle response:', response)
      
      // Update the state based on backend response
      setIsInWishlist(response.in_wishlist)
      
      toast({
        title: response.in_wishlist ? "Added to favorites" : "Removed from favorites",
        description: response.in_wishlist ? "Property added to your wishlist" : "Property removed from your wishlist",
      })
      
      // Refresh the wishlist status to ensure it's in sync
      if (onWishlistUpdate) {
        onWishlistUpdate()
      } else {
        // If no callback provided, manually refresh the status
        try {
          const updatedStatus = await propertiesApi.checkWishlistStatus(property.id)
          setIsInWishlist(updatedStatus.in_wishlist)
        } catch (error) {
          console.error('Failed to refresh wishlist status:', error)
        }
      }
    } catch (error: any) {
      console.error("Failed to toggle wishlist:", error)
      if (error.message === 'Not authenticated' || error.message === 'Authentication expired') {
        toast({
          title: "Session expired",
          description: "Please sign in again",
          variant: "destructive",
        })
        logout()
      } else {
        toast({
          title: "Error",
          description: "Failed to update favorites",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
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

  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary/50 cursor-pointer">
        <Link href={`/properties/${property.id}`} className="block">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-80 flex-shrink-0">
              <div className="relative h-48 md:h-full overflow-hidden">
                <Image
                  src={property.images[0]?.url || "/placeholder.svg"}
                  alt={`${property.name} in ${property.city}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <Badge
                    variant={property.status === "active" ? "default" : "secondary"}
                    className="capitalize shadow-sm"
                  >
                    {property.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <CardContent className="p-6 flex-1">
                <div className="mb-3">
                  <p className="text-3xl font-bold text-primary">{formatPrice(property.price)}</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(property.price / property.squareMeters).toLocaleString('de-DE')} €/m²
                  </p>
                </div>
                <h3 className="font-semibold text-xl mb-2 line-clamp-1">{property.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {property.address}, {property.city}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-base">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{property.bedrooms} bedrooms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{formatSquareMeters(property.squareMeters)} m²</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0 flex items-center justify-between border-t">
                <Badge variant="outline" className="text-sm capitalize">
                  {property.type}
                </Badge>
                {/* Only show wishlist button if user is authenticated */}
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={handleWishlistToggle}
                    disabled={isLoading}
                  >
                    <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current text-red-500" : ""}`} />
                    {isInWishlist ? "Saved" : "Save"}
                  </Button>
                )}
              </CardFooter>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all border-2 hover:border-primary/50 group cursor-pointer">
      <Link href={`/properties/${property.id}`} className="block">
        <div className="relative h-56 overflow-hidden">
          <Image
            src={property.images[0]?.url || "/placeholder.svg"}
            alt={`${property.name} in ${property.city}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {/* Only show wishlist button if user is authenticated */}
          {isAuthenticated && (
            <div className="absolute top-3 right-3">
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full bg-white/95 hover:bg-white shadow-lg"
                onClick={handleWishlistToggle}
                disabled={isLoading}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current text-red-500" : ""}`} />
              </Button>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge variant={property.status === "active" ? "default" : "secondary"} className="capitalize shadow-sm">
              {property.status}
            </Badge>
          </div>
        </div>

        <CardContent className="p-5">
          <div className="mb-3">
            <p className="text-2xl font-bold text-primary">{formatPrice(property.price)}</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(property.price / property.squareMeters).toLocaleString('de-DE')} €/m²
            </p>
          </div>
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {property.name}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {property.city}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {property.description}
          </p>
        </CardContent>

        <CardFooter className="p-5 pt-0 flex items-center justify-between text-sm border-t bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Square className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatSquareMeters(property.squareMeters)} m²</span>
            </div>
          </div>
          {/* <Button variant="outline" size="sm" className="gap-1">
            <Eye className="h-3 w-3" />
            View
          </Button> */}
        </CardFooter>
      </Link>
    </Card>
  )
}