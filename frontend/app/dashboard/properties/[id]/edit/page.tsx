"use client"
import { AutoLogout } from "@/components/auto-logout"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { propertiesApi } from "@/lib/api/properties"
import type { Property } from "@/types/property"
import { PROPERTY_TYPES } from "@/lib/constants"
import { ArrowLeft, Loader2, Upload, X, Star } from "lucide-react"
import Link from "next/link"

interface PropertyImage {
  id: string;
  url: string;
  order: number;
  is_primary: boolean;
}

export default function EditPropertyPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newImages, setNewImages] = useState<{file: File, is_primary: boolean}[]>([])
  const [existingImages, setExistingImages] = useState<PropertyImage[]>([]) 
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    city: "",
    price: 0,
    number_of_rooms: 1,
    size: 0,
    property_type: "house",
    is_available: true,
  })

  useEffect(() => {
    if (params.id) {
      loadProperty()
    }
  }, [params.id])

  const loadProperty = async () => {
    try {
      setIsLoading(true)
      const property = await propertiesApi.getProperty(params.id as string)
      
      setFormData({
        name: property.name,
        description: property.description,
        address: property.address,
        city: property.city,
        price: property.price,
        number_of_rooms: property.bedrooms,
        size: property.squareMeters,
        property_type: property.type,
        is_available: property.status === "active",
      })
      
      setExistingImages(property.images || [])
    } catch (error) {
      console.error("[v0] Failed to load property:", error)
      toast({
        title: "Error",
        description: "Failed to load property data",
        variant: "destructive",
      })
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const setPrimaryImage = async (imageId: string) => {
    try {
      await propertiesApi.setPrimaryImage(params.id as string, imageId)
      toast({
        title: "Success",
        description: "Primary image updated successfully",
      })
      // Refresh the images to show the new primary status
      await loadProperty()
    } catch (error) {
      console.error("Failed to set primary image:", error)
      toast({
        title: "Error",
        description: "Failed to set primary image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index))
  }

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (existingImages.length + newImages.length + files.length > 10) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 10 images",
        variant: "destructive",
      })
      return
    }

    const newImageFiles = files.map(file => ({
      file,
      is_primary: existingImages.length === 0 && newImages.length === 0
    }))

    setNewImages([...newImages, ...newImageFiles])
  }

  const removeExistingImage = async (imageId: string) => {
    try {
      await propertiesApi.deletePropertyImage(imageId)
      setExistingImages(existingImages.filter(img => img.id !== imageId))
      toast({
        title: "Success",
        description: "Image removed successfully",
      })
    } catch (error) {
      console.error("[v0] Failed to delete image:", error)
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.address || !formData.city || !formData.price) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)
      
      // Update the property
      await propertiesApi.updateProperty(params.id as string, {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        price: formData.price,
        bedrooms: formData.number_of_rooms,
        squareMeters: formData.size,
        type: formData.property_type,
        status: formData.is_available ? "active" : "inactive",
      })

      // Upload new images if any
      for (const imageData of newImages) {
        await propertiesApi.uploadPropertyImage(params.id as string, imageData.file, imageData.is_primary)
      }

      toast({
        title: "Success",
        description: "Property updated successfully",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Failed to update property:", error)
      toast({
        title: "Error",
        description: "Failed to update property. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-2">Edit Property</h1>
        <p className="text-lg text-muted-foreground">Update your property listing details</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Modern Apartment in City Center"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your property..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="property_type">Property Type *</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value: string) => setFormData({ ...formData, property_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                 <SelectContent>
  {PROPERTY_TYPES.map((type) => (
    <SelectItem key={type} value={type}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </SelectItem>
  ))}
</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="150000.00"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Friedrichstraße 123"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Berlin"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number_of_rooms">Number of Rooms *</Label>
                  <Input
                    id="number_of_rooms"
                    type="number"
                    min="1"
                    value={formData.number_of_rooms}
                    onChange={(e) => setFormData({ ...formData, number_of_rooms: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size (m²) *</Label>
                  <Input
                    id="size"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.size || ""}
                    onChange={(e) => setFormData({ ...formData, size: Number(e.target.value) })}
                    placeholder="85.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_available">Availability</Label>
                <Select
                  value={formData.is_available.toString()}
                  onValueChange={(value: string) => setFormData({ ...formData, is_available: value === "true" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Available</SelectItem>
                    <SelectItem value="false">Not Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Images Section */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="images">Upload New Images (Max 10)</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewImageChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  {existingImages.length + newImages.length}/10 images uploaded
                </p>
              </div>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="space-y-3">
                  <Label>Current Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2"
                        />
                        
                        {/* Primary Image Badge */}
                        {image.is_primary && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Primary
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Set as Primary Button - Only show if not already primary */}
                          {!image.is_primary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(image.id)}
                              className="bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700 transition-colors"
                              title="Set as primary image"
                            >
                              <Star className="h-3 w-3" />
                            </button>
                          )}
                          
                          {/* Remove Image Button */}
                          <button
                            type="button"
                            onClick={() => removeExistingImage(image.id)}
                            className="bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                            title="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {/* Image Info */}
                        <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs p-1 rounded text-center">
                          {image.is_primary ? "Primary Image" : `Image ${index + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Primary Image Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Star className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Primary Image</h4>
                        <p className="text-blue-700 text-sm">
                          The primary image will be featured as the main photo in property listings and search results. 
                          Click the star icon on any image to set it as primary.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* New Images to Upload */}
              {newImages.length > 0 && (
                <div className="space-y-3">
                  <Label>New Images to Upload</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {newImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image.file) || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs p-1 rounded text-center">
                          New Image
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Property...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Update Property
                </>
              )}
            </Button>
            <Button type="button" variant="outline" size="lg" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </div>
        </div>
        <AutoLogout />
      </form>
    </div>
  )
}