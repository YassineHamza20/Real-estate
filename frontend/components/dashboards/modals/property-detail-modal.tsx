"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { adminPropertiesApi } from "@/lib/api/Adminproperties"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { 
  Building, MapPin, Euro, Home, User, Calendar, 
  Ruler, Bed, Edit, Save, X, CheckCircle, XCircle,
  Image as ImageIcon
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Property, PropertyImage } from "../tabs/properties-tab"

interface PropertyDetailModalProps {
  property: Property | null
  isOpen: boolean
  onClose: () => void
  onPropertyUpdate: () => void
}

export function PropertyDetailModal({ property, isOpen, onClose, onPropertyUpdate }: PropertyDetailModalProps) {
  const { isAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Property>>({})
  const [saving, setSaving] = useState(false)
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null)

  // Update current property when prop changes
  useEffect(() => {
    if (property) {
      setCurrentProperty(property)
      setEditForm({
        name: property.name || '',
        description: property.description || '',
        address: property.address || '',
        city: property.city || '',
        price: property.price || '',
        number_of_rooms: property.number_of_rooms || 1,
        size: property.size || '',
        property_type: property.property_type || 'house',
        is_available: property.is_available ?? true,
      })
    }
  }, [property])

  const handleSave = async () => {
    if (!isAuthenticated || !currentProperty) return
    
    setSaving(true)
    try {
      // Convert string values to proper types for backend
      const updateData = {
        ...editForm,
        price: editForm.price ? parseFloat(editForm.price as string).toString() : '0',
        number_of_rooms: parseInt(editForm.number_of_rooms as any) || 1,
        size: editForm.size ? parseFloat(editForm.size as string).toString() : '0',
      }
      
      // Use adminPropertiesApi instead of local propertiesApi
      const updatedProperty = await adminPropertiesApi.updateProperty(currentProperty.id, updateData)
      
      // Update the current property with the response data
      setCurrentProperty(updatedProperty)
      
      toast({
        title: "Success",
        description: "Property updated successfully",
      })
      setIsEditing(false)
      
      // Call the update callback to refresh the parent component
      onPropertyUpdate()
    } catch (error: any) {
      console.error("Failed to update property:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update property",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleClose = () => {
    setIsEditing(false)
    setEditForm({})
    onClose()
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseFloat(price))
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

  // Use currentProperty instead of property for display
  const displayProperty = currentProperty || property
  if (!displayProperty) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Property Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Property Name"
                    className="text-2xl font-bold h-12 text-lg"
                  />
                  <div className="flex gap-2">
                    <Select 
                      value={editForm.property_type} 
                      onValueChange={(value) => handleInputChange('property_type', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 p-2 border rounded-lg">
                      <Label htmlFor="available" className="text-sm">Available</Label>
                      <Switch
                        id="available"
                        checked={editForm.is_available}
                        onCheckedChange={(checked) => handleInputChange('is_available', checked)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold">{displayProperty.name}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={displayProperty.is_available ? "default" : "destructive"}>
                      {displayProperty.is_available ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{displayProperty.property_type}</Badge>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              )}
            </div>
          </div>

          {/* Images */}
          {displayProperty.images && displayProperty.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Property Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {displayProperty.images.map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.image}
                        alt={`Property image ${image.id}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {image.is_primary && (
                        <Badge className="absolute top-2 left-2 text-xs">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (€)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={editForm.price || ''}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rooms">Number of Rooms</Label>
                      <Input
                        id="rooms"
                        type="number"
                        value={editForm.number_of_rooms || ''}
                        onChange={(e) => handleInputChange('number_of_rooms', parseInt(e.target.value) || 1)}
                        min="1"
                        max="20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size">Size (m²)</Label>
                      <Input
                        id="size"
                        type="number"
                        step="0.01"
                        value={editForm.size || ''}
                        onChange={(e) => handleInputChange('size', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Property Type</Label>
                      <Select 
                        value={editForm.property_type} 
                        onValueChange={(value) => handleInputChange('property_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Price</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Euro className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">{formatPrice(displayProperty.price)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Rooms</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Bed className="h-4 w-4 text-blue-600" />
                        <span>{displayProperty.number_of_rooms}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Size</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Ruler className="h-4 w-4 text-orange-600" />
                        <span>{displayProperty.size} m²</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <div className="mt-1">
                        <Badge variant="outline">{displayProperty.property_type}</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location & Seller */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Seller
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={editForm.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Full address"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={editForm.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Seller</label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{displayProperty.seller_name}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <p className="mt-1 text-sm">{displayProperty.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">City</label>
                      <p className="mt-1 text-sm">{displayProperty.city}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Seller</label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{displayProperty.seller_name}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editForm.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Property description"
                  rows={4}
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {displayProperty.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Created</label>
                  <p>{formatDate(displayProperty.created_at)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Last Updated</label>
                  <p>{formatDate(displayProperty.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}