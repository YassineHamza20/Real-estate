"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { UserWishlist, WishlistItem } from "@/lib/api/adminWishlists"
import { 
  User, Home, MapPin, Euro, Calendar, Trash2, X,
  Heart, ExternalLink, ImageOff
} from "lucide-react"
import { useState, useEffect } from "react"

interface UserWishlistModalProps {
  wishlist: UserWishlist | null
  isOpen: boolean
  onClose: () => void
  onItemRemove: (userId: number, wishlistItemId: number, userName: string) => void
  onWishlistUpdate: () => void
}

export function UserWishlistModal({ 
  wishlist, 
  isOpen, 
  onClose, 
  onItemRemove,
  onWishlistUpdate 
}: UserWishlistModalProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  // Reset image errors when modal opens with new wishlist
  useEffect(() => {
    if (isOpen && wishlist) {
      console.log("🔍 UserWishlistModal - wishlist data:", wishlist)
      console.log("👤 User profile picture:", wishlist.user.profile_picture_url)
      console.log("📦 Wishlist items:", wishlist.wishlist_items)
      
      wishlist.wishlist_items.forEach((item, index) => {
        console.log(`🏠 Property ${index} images:`, item.property.images)
      })
      
      setImageErrors(new Set())
    }
  }, [isOpen, wishlist])

  const handleClose = () => {
    onClose()
  }

  const handleImageError = (url: string) => {
    console.error(`❌ Failed to load image: ${url}`)
    setImageErrors(prev => new Set(prev).add(url))
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error("Error formatting date:", dateString, error)
      return 'Invalid Date'
    }
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(price))
  }

  const getPropertyImage = (item: WishlistItem) => {
    if (item.property.images.length === 0) return null
    
    const primaryImage = item.property.images.find(img => img.is_primary)
    const firstImage = item.property.images[0]
    return primaryImage || firstImage
  }

  if (!wishlist) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            {wishlist.user.username}'s Wishlist
            <Badge variant="secondary" className="ml-2">
              {wishlist.total_items} item{wishlist.total_items !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center relative">
                  {wishlist.user.profile_picture_url && !imageErrors.has(wishlist.user.profile_picture_url) ? (
                    <img 
                      src={wishlist.user.profile_picture_url} 
                      alt={wishlist.user.username}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={() => handleImageError(wishlist.user.profile_picture_url!)}
                      onLoad={() => console.log("✅ Profile picture loaded:", wishlist.user.profile_picture_url)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                      <ImageOff className="h-3 w-3 text-muted-foreground mt-1" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{wishlist.user.username}</h3>
                  <p className="text-sm text-muted-foreground">{wishlist.user.email}</p>
                  <p className="text-xs text-muted-foreground">User ID: {wishlist.user.id}</p>
                  {wishlist.user.profile_picture_url && imageErrors.has(wishlist.user.profile_picture_url) && (
                    <p className="text-xs text-destructive mt-1">
                      Failed to load profile picture
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wishlist Items */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Wishlist Items</h3>
            
            {wishlist.wishlist_items.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Empty Wishlist</h4>
                  <p className="text-muted-foreground">
                    {wishlist.user.username} hasn't added any properties to their wishlist yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {wishlist.wishlist_items.map((item: WishlistItem) => {
                  const propertyImage = getPropertyImage(item)
                  const imageUrl = propertyImage?.image
                  const hasImageError = imageUrl && imageErrors.has(imageUrl)
                  
                  return (
                    <Card key={item.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Property Image */}
                          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 relative">
                            {imageUrl && !hasImageError ? (
                              <>
                                <img
                                  src={imageUrl}
                                  alt={item.property.name}
                                  className="w-24 h-24 rounded-lg object-cover"
                                  onError={() => handleImageError(imageUrl)}
                                  onLoad={() => console.log("✅ Property image loaded:", imageUrl)}
                                />
                                {propertyImage?.is_primary && (
                                  <Badge className="absolute top-1 left-1 text-xs">Primary</Badge>
                                )}
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center">
                                <Home className="h-8 w-8 text-muted-foreground mb-1" />
                                <ImageOff className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground mt-1">No Image</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Property Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-lg line-clamp-1">
                                  {item.property.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline">
                                    {item.property.property_type}
                                  </Badge>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Euro className="h-3 w-3" />
                                    <span className="font-semibold">{formatPrice(item.property.price)}</span>
                                  </div>
                                </div>
                                {hasImageError && (
                                  <p className="text-xs text-destructive mt-1">
                                    Image failed to load
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onItemRemove(
                                  wishlist.user.id, 
                                  item.id, 
                                  wishlist.user.username
                                )}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{item.property.city}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Added {formatDate(item.added_at)}</span>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                              >
                                <a 
                                  href={`/properties/${item.property.id}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Property
                                </a>
                              </Button>
                              {imageUrl && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  asChild
                                >
                                  <a 
                                    href={imageUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2"
                                  >
                                    <ImageOff className="h-3 w-3" />
                                    View Image
                                  </a>
                                </Button>
                              )}
                            </div>

                            {/* Debug Information */}
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <div><strong>Property ID:</strong> {item.property.id}</div>
                              <div><strong>Images:</strong> {item.property.images.length}</div>
                             
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}