"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Property } from "@/types/property"
import { MapPin, Bed, Bath, Square, Heart } from "lucide-react"

interface PropertyCardProps {
  property: Property
  viewMode?: "grid" | "list"
}

export function PropertyCard({ property, viewMode = "grid" }: PropertyCardProps) {
  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary/50">
        <div className="flex flex-col md:flex-row">
          <Link href={`/properties/${property.id}`} className="md:w-80 flex-shrink-0">
            <div className="relative h-48 md:h-full overflow-hidden">
              <Image
                src={property.images[0]?.url || "/placeholder.svg?height=200&width=400&query=modern house"}
                alt={property.title}
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
          </Link>

          <div className="flex-1 flex flex-col">
            <CardContent className="p-6 flex-1">
              <Link href={`/properties/${property.id}`}>
                <div className="mb-3">
                  <p className="text-3xl font-bold text-primary">${property.price.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    ${Math.round(property.price / property.squareFeet).toLocaleString()} per sq ft
                  </p>
                </div>
                <h3 className="font-semibold text-xl mb-2 line-clamp-1">{property.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {property.address}, {property.city}, {property.state}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-base">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{property.bedrooms} beds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{property.bathrooms} baths</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{property.squareFeet.toLocaleString()} sq ft</span>
                  </div>
                </div>
              </Link>
            </CardContent>

            <CardFooter className="p-6 pt-0 flex items-center justify-between border-t">
              <Badge variant="outline" className="text-sm">
                {property.type}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={(e) => {
                  e.preventDefault()
                  // Handle wishlist toggle
                }}
              >
                <Heart className="h-4 w-4" />
                Save
              </Button>
            </CardFooter>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all border-2 hover:border-primary/50 group">
      <Link href={`/properties/${property.id}`}>
        <div className="relative h-56 overflow-hidden">
          <Image
            src={property.images[0]?.url || "/placeholder.svg?height=200&width=400&query=modern house"}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-3 right-3">
            <Button
              variant="secondary"
              size="icon"
              className="h-9 w-9 rounded-full bg-white/95 hover:bg-white shadow-lg"
              onClick={(e) => {
                e.preventDefault()
                // Handle wishlist toggle
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute top-3 left-3">
            <Badge variant={property.status === "active" ? "default" : "secondary"} className="capitalize shadow-sm">
              {property.status}
            </Badge>
          </div>
        </div>
      </Link>

      <CardContent className="p-5">
        <Link href={`/properties/${property.id}`}>
          <div className="mb-3">
            <p className="text-2xl font-bold text-primary">${property.price.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              ${Math.round(property.price / property.squareFeet).toLocaleString()} per sq ft
            </p>
          </div>
          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {property.city}, {property.state}
            </span>
          </div>
        </Link>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex items-center justify-between text-sm border-t bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{property.bedrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{property.bathrooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Square className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{property.squareFeet.toLocaleString()}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
