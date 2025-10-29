"use client"

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
import { ArrowLeft, Loader2, Upload, X } from "lucide-react"
import Link from "next/link"

export default function EditPropertyPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<any[]>([])
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
    loadProperty()
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (existingImages.length + images.length + files.length > 10) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 10 images",
        variant: "destructive",
      })
      return
    }
    setImages([...images, ...files])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imageId: string, index: number) => {
    try {
      await propertiesApi.deletePropertyImage(imageId)
      setExistingImages(existingImages.filter((_, i) => i !== index))
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
      
      // Update the property using your new method
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
      if (images.length > 0) {
        for (const image of images) {
          await propertiesApi.uploadPropertyImage(params.id as string, image)
        }
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
                <Label htmlFor="images">Upload New Images (Max 10)</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
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
                          alt={`Current image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image.id, index)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {images.length > 0 && (
                <div className="space-y-3">
                  <Label>New Images to Upload</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image) || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
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
      </form>
    </div>
  )
}