"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { propertiesApi } from "@/lib/api/properties"
import { PROPERTY_TYPES } from "@/lib/constants"
import { ArrowLeft, Loader2, Upload, X, Star } from "lucide-react"
import Link from "next/link"

interface ImageWithMetadata {
  file: File
  is_primary: boolean
}

export default function NewPropertyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<ImageWithMetadata[]>([])
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 10) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 10 images",
        variant: "destructive",
      })
      return
    }

    const newImages: ImageWithMetadata[] = files.map(file => ({
      file,
      is_primary: images.length === 0 && files.indexOf(file) === 0 // First image becomes primary by default
    }))

    setImages([...images, ...newImages])
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    
    // If we removed the primary image and there are other images, set the first one as primary
    if (images[index].is_primary && newImages.length > 0) {
      newImages[0].is_primary = true
    }
    
    setImages(newImages)
  }

  const setPrimaryImage = (index: number) => {
    const newImages = images.map((image, i) => ({
      ...image,
      is_primary: i === index
    }))
    setImages(newImages)
  }

// In your NewPropertyPage component
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
    
    // Transform images to include primary information
    const imagesWithMetadata = images.map((image, index) => ({
      file: image.file,
      is_primary: image.is_primary
    }))
    
    // Create the property with images
    await propertiesApi.createProperty(formData, imagesWithMetadata)

    toast({
      title: "Success",
      description: "Property created successfully",
    })
    router.push("/dashboard")
  } catch (error: any) {
    console.error("[v0] Failed to create property:", error)
    toast({
      title: "Error",
      description: error.message || "Failed to create property. Please try again.",
      variant: "destructive",
    })
  } finally {
    setIsSubmitting(false)
  }
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
        <h1 className="text-4xl font-bold mb-2">List New Property</h1>
        <p className="text-lg text-muted-foreground">Create a new property listing to attract potential buyers</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
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
                  placeholder="Modern Downtown Loft"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your property..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                        <SelectItem key={type} value={type} className="capitalize">
                          {type}
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
                    placeholder="450000.00"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="images">Upload Images (Max 10)</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground">
                  Upload up to 10 images of your property. The first image will be set as primary by default.
                </p>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="space-y-3">
                  <Label>Image Previews</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image.file) || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
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
                          {/* Set as Primary Button */}
                          {!image.is_primary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index)}
                              className="bg-blue-600 text-white rounded-full p-1 hover:bg-blue-700 transition-colors"
                              title="Set as primary image"
                            >
                              <Star className="h-3 w-3" />
                            </button>
                          )}
                          
                          {/* Remove Image Button */}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
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
                          Choose your best photo that represents the property well.
                        </p>
                      </div>
                    </div>
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
                  Creating Property...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Create Property
                </>
              )}
            </Button>
            <Button type="button" variant="outline" size="lg" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}