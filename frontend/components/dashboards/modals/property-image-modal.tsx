// components/modals/property-image-modal.tsx
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PropertyImage } from "@/lib/api/Adminproperty-images"
import { 
  Star, 
  Trash2, 
  Download, 
  Eye, 
  MapPin, 
  Euro, 
  Home, 
  User, 
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react"
import { toast } from "sonner"

interface PropertyImageModalProps {
  image: PropertyImage | null
  isOpen: boolean
  onClose: () => void
  onImageUpdate: () => void
  onSetPrimary: (imageId: number) => Promise<void>
  onDeleteImage: (imageId: number) => Promise<void>
}

export function PropertyImageModal({ 
  image, 
  isOpen, 
  onClose, 
  onImageUpdate,
  onSetPrimary,
  onDeleteImage
}: PropertyImageModalProps) {
  const [deleting, setDeleting] = useState(false)
  const [settingPrimary, setSettingPrimary] = useState(false)

  const handleSetPrimary = async () => {
    if (!image) return
    
    setSettingPrimary(true)
    try {
      await onSetPrimary(image.id)
      toast.success('Image set as primary successfully')
      onImageUpdate()
    } catch (error) {
      toast.error('Failed to set primary image')
    } finally {
      setSettingPrimary(false)
    }
  }

  const handleDelete = async () => {
    if (!image) return
    
    setDeleting(true)
    try {
      await onDeleteImage(image.id)
      toast.success('Image deleted successfully')
      onClose()
      onImageUpdate()
    } catch (error) {
      toast.error('Failed to delete image')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(price))
  }

  if (!image) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Property Image Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Preview */}
          <Card>
            <CardContent className="p-6">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={image.image_url}
                  alt={`Property image for ${image.property.name}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => window.open(image.image_url, '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {!image.is_primary && (
                  <Button
                    onClick={handleSetPrimary}
                    disabled={settingPrimary}
                    variant="outline"
                    size="sm"
                  >
                    {settingPrimary ? (
                      <div className="flex items-center">
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Setting...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-2" />
                        Set as Primary
                      </div>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  variant="destructive"
                  size="sm"
                >
                  {deleting ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Deleting...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Image
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Property Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Property Name</span>
                    <span className="font-semibold">{image.property.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Property Type</span>
                    <Badge variant="outline">{image.property.property_type}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Price</span>
                    <div className="flex items-center gap-1 font-semibold">
                      <Euro className="h-4 w-4 text-green-600" />
                      {formatPrice(image.property.price)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status</span>
                    {image.property.is_available ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location & Seller */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Seller
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">City</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{image.property.city}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Seller</span>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{image.seller.username}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Seller Email</span>
                    <span className="text-sm">{image.seller.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Image Status</span>
                    {image.is_primary ? (
                      <Badge className="bg-blue-600 gap-1">
                        <Star className="h-3 w-3" />
                        Primary Image
                      </Badge>
                    ) : (
                      <Badge variant="outline">Secondary</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timestamps */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timestamps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Uploaded At</label>
                  <p className="font-medium">{formatDate(image.uploaded_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}