// components/property-images-tab.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { propertyImagesApi } from "@/lib/api/Adminproperty-images"
import { 
  Search, MoreVertical, Star, Trash2, Loader2, Eye, 
  Image as ImageIcon, User, MapPin, Euro, Home, Calendar, RefreshCw, CheckCircle, XCircle
} from "lucide-react"
import { toast } from "sonner"
import { PropertyImageModal } from "../modals/property-image-modal" // Changed to relative import
import type { PropertyImage, PropertyImagesStats } from "@/lib/api/Adminproperty-images"

export function PropertyImagesTab() {
  const { user, isAuthenticated } = useAuth()
  const [images, setImages] = useState<PropertyImage[]>([])
  const [stats, setStats] = useState<PropertyImagesStats | null>(null)
  const [loading, setLoading] = useState({
    images: false,
    stats: false
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal state
  const [selectedImage, setSelectedImage] = useState<PropertyImage | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // Selected images for bulk actions
  const [selectedImages, setSelectedImages] = useState<number[]>([])

  // Fetch images and stats
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return

    setLoading(prev => ({ ...prev, images: true, stats: true }))
    try {
      const [imagesData, statsData] = await Promise.all([
        propertyImagesApi.getAllImages({
          search: searchQuery,
          has_primary: statusFilter !== 'all' ? statusFilter : undefined,
          page: 1,
          page_size: 50
        }),
        propertyImagesApi.getStats()
      ])
      setImages(imagesData.images)
      setStats(statsData)
    } catch (error: any) {
      console.error("Failed to fetch data:", error)
      toast.error(error.message || "Failed to load data")
    } finally {
      setLoading(prev => ({ ...prev, images: false, stats: false }))
    }
  }, [isAuthenticated, searchQuery, statusFilter])

  // Handle image actions
  const handleSetPrimary = async (imageId: number) => {
    try {
      await propertyImagesApi.setPrimaryImage(imageId)
      toast.success('Image set as primary successfully')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to set primary image')
    }
  }

  const handleDeleteImage = async (imageId: number) => {
    try {
      await propertyImagesApi.deleteImage(imageId)
      toast.success('Image deleted successfully')
      fetchData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete image')
    }
  }

  // Handle bulk actions
  const handleBulkAction = async (action: 'delete' | 'set_primary') => {
    if (!isAuthenticated || selectedImages.length === 0) return
    
    try {
      await propertyImagesApi.bulkActions(selectedImages, action)
      toast.success(`Bulk ${action} completed for ${selectedImages.length} images`)
      setSelectedImages([])
      fetchData()
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} images`)
    }
  }

  // Toggle image selection
  const toggleImageSelection = (imageId: number) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  // Select all images
  const selectAllImages = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([])
    } else {
      setSelectedImages(images.map(img => img.id))
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refresh images when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, statusFilter, fetchData])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(price))
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Images</p>
                  <p className="text-2xl font-bold">{stats.total_images}</p>
                </div>
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Properties with Images</p>
                  <p className="text-2xl font-bold text-green-600">{stats.properties_with_images}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Properties without Images</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.properties_without_images}</p>
                </div>
                <XCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent Images (7d)</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.recent_images}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Property Images Management</h2>
          <p className="text-muted-foreground">
            {images.length} image{images.length !== 1 ? 's' : ''} found
            {selectedImages.length > 0 && ` • ${selectedImages.length} selected`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties, sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full sm:w-64"
            />
          </div>
          
          {/* Filter Row */}
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Image Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Images</SelectItem>
                <SelectItem value="true">
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-yellow-600" />
                    Primary Only
                  </div>
                </SelectItem>
                <SelectItem value="false">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-3 w-3 text-gray-600" />
                    Non-Primary
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={fetchData} 
              variant="outline" 
              size="icon" 
              disabled={loading.images}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading.images ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedImages.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium text-blue-800">
                  {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('set_primary')}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Set Primary
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedImages([])}
              >
                Clear selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images Table */}
      <Card className="border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedImages.length === images.length && images.length > 0}
                    onChange={selectAllImages}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading.images ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">Loading images...</p>
                  </TableCell>
                </TableRow>
              ) : images.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No images found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filters' 
                        : 'No property images in the system'
                      }
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                images.map((image) => (
                  <TableRow key={image.id} className={selectedImages.includes(image.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.id)}
                        onChange={() => toggleImageSelection(image.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                        <img
                          src={image.image_url}
                          alt={`Property image for ${image.property.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Home className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium line-clamp-1">{image.property.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {image.property.property_type}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{image.property.city}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{image.seller.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-semibold">
                        <Euro className="h-3 w-3 text-green-600" />
                        {formatPrice(image.property.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {image.is_primary ? (
                        <Badge className="bg-blue-600 gap-1">
                          <Star className="h-3 w-3" />
                          Primary
                        </Badge>
                      ) : (
                        <Badge variant="outline">Secondary</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(image.uploaded_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedImage(image)
                            setIsImageModalOpen(true)
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {!image.is_primary && (
                            <DropdownMenuItem onClick={() => handleSetPrimary(image.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              Set as Primary
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteImage(image.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Image
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Property Image Modal */}
      <PropertyImageModal
        image={selectedImage}
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false)
          setSelectedImage(null)
        }}
        onImageUpdate={fetchData}
        onSetPrimary={handleSetPrimary}
        onDeleteImage={handleDeleteImage}
      />
    </div>
  )
}