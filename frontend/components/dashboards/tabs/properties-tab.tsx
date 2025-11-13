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
import { adminPropertiesApi } from "@/lib/api/Adminproperties"
import { 
  Search, MoreVertical, CheckCircle, XCircle, Loader2, Edit, Eye, 
  Building, MapPin, Euro, Home, User, Calendar, RefreshCw, Filter
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { PropertyDetailModal } from "../modals/property-detail-modal"

// Types based on your backend
interface Property {
  id: number
  name: string
  description: string
  address: string
  city: string
  price: string
  number_of_rooms: number
  size: string
  property_type: string
  is_available: boolean
  seller: number
  seller_name: string
  images: PropertyImage[]
  created_at: string
  updated_at: string
}

interface PropertyImage {
  id: number
  image: string
  is_primary: boolean
  uploaded_at: string
}

export function PropertiesTab() {
  const { user, isAuthenticated } = useAuth()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState({
    properties: false,
    filters: false,
    stats: false
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState<any>(null)
  const [filters, setFilters] = useState<{ 
    cities: string[], 
    property_types: string[],
    sellers: { id: number, username: string }[],
    price_ranges: { min: number, max: number, avg: number }
  }>({
    cities: [],
    property_types: [],
    sellers: [],
    price_ranges: { min: 0, max: 0, avg: 0 }
  })

  // Property detail modal state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [isPropertyDetailOpen, setIsPropertyDetailOpen] = useState(false)

  // Selected properties for bulk actions
  const [selectedProperties, setSelectedProperties] = useState<number[]>([])

  // Fetch properties using adminPropertiesApi
  const fetchProperties = useCallback(async () => {
    console.log("🔄 fetchProperties called")
    console.log("🔑 Is Authenticated:", isAuthenticated)
    
    if (!isAuthenticated) {
      console.log("❌ Not authenticated, skipping fetch")
      toast({
        title: "Authentication Required",
        description: "Please log in to access properties",
        variant: "destructive",
      })
      return
    }
    
    setLoading(prev => ({ ...prev, properties: true }))
    try {
      const data = await adminPropertiesApi.getProperties(searchQuery, typeFilter, cityFilter, statusFilter)
      setProperties(data)
    } catch (error: any) {
      console.error("❌ Failed to fetch properties:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load properties",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, properties: false }))
    }
  }, [isAuthenticated, searchQuery, typeFilter, cityFilter, statusFilter])

  // Fetch filters and stats using adminPropertiesApi
  const fetchFiltersAndStats = useCallback(async () => {
    if (!isAuthenticated) return
    
    setLoading(prev => ({ ...prev, filters: true, stats: true }))
    try {
      const [filterData, statsData] = await Promise.all([
        adminPropertiesApi.getPropertyFilters(),
        adminPropertiesApi.getPropertyStats()
      ])
      setFilters(filterData)
      setStats(statsData)
    } catch (error: any) {
      console.error("Failed to fetch filters or stats:", error)
    } finally {
      setLoading(prev => ({ ...prev, filters: false, stats: false }))
    }
  }, [isAuthenticated])

  // Handle property actions using adminPropertiesApi
  const handlePropertyAction = async (propertyId: number, action: 'activate' | 'deactivate' | 'delete') => {
    if (!isAuthenticated) return
    
    try {
      if (action === 'delete') {
        await adminPropertiesApi.deleteProperty(propertyId)
        toast({
          title: "Success",
          description: "Property deleted successfully",
        })
      } else {
        await adminPropertiesApi.updateProperty(propertyId, { 
          is_available: action === 'activate' 
        })
        toast({
          title: "Success",
          description: `Property ${action === 'activate' ? 'activated' : 'deactivated'} successfully`,
        })
      }
      fetchProperties()
      if (action === 'delete') {
        setIsPropertyDetailOpen(false)
        setSelectedProperties(prev => prev.filter(id => id !== propertyId))
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} property`,
        variant: "destructive",
      })
    }
  }

  // Handle bulk actions using adminPropertiesApi
  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (!isAuthenticated || selectedProperties.length === 0) return
    
    try {
      await adminPropertiesApi.bulkPropertyAction(selectedProperties, action)
      toast({
        title: "Success",
        description: `Bulk ${action} completed for ${selectedProperties.length} properties`,
      })
      setSelectedProperties([])
      fetchProperties()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} properties`,
        variant: "destructive",
      })
    }
  }

  // Toggle property selection
  const togglePropertySelection = (propertyId: number) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  // Select all properties
  const selectAllProperties = () => {
    if (selectedProperties.length === properties.length) {
      setSelectedProperties([])
    } else {
      setSelectedProperties(properties.map(p => p.id))
    }
  }

  // Load data on mount
  useEffect(() => {
    console.log("🏁 Component mounted, fetching data...")
    fetchProperties()
    fetchFiltersAndStats()
  }, [fetchProperties, fetchFiltersAndStats])

  // Refresh properties when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProperties()
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, typeFilter, cityFilter, statusFilter, fetchProperties])

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Properties</p>
                  <p className="text-2xl font-bold">{stats.total_properties}</p>
                </div>
                <Building className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_properties}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                  <p className="text-2xl font-bold text-red-600">{stats.inactive_properties}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent (7d)</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.recent_properties}</p>
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
          <h2 className="text-2xl font-bold">Properties Management</h2>
          <p className="text-muted-foreground">
            {properties.length} propert{properties.length !== 1 ? 'ies' : 'y'} found
            {(typeFilter !== 'all' || cityFilter !== 'all' || statusFilter !== 'all') && ' (filtered)'}
            {selectedProperties.length > 0 && ` • ${selectedProperties.length} selected`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties, addresses, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full sm:w-64"
            />
          </div>
          
          {/* Filter Row */}
          <div className="flex gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
  <SelectTrigger className="w-36">
    <SelectValue placeholder="Property Type" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Types</SelectItem>
    {/* Remove duplicates using Set and filter out null/undefined values */}
    {Array.from(new Set(filters.property_types))
      .filter(type => type && type.trim() !== '')
      .map((type) => (
        <SelectItem key={type} value={type}>
          <div className="flex items-center gap-2">
            <Home className="h-3 w-3" />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        </SelectItem>
      ))}
  </SelectContent>
</Select>
            
            <Select value={cityFilter} onValueChange={setCityFilter}>
  <SelectTrigger className="w-36">
    <SelectValue placeholder="City" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Cities</SelectItem>
    {Array.from(new Set(filters.cities))
      .slice(0, 10)
      .map((city) => (
        <SelectItem key={city} value={city}>
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            {city}
          </div>
        </SelectItem>
      ))}
    {filters.cities.length > 10 && (
      <div className="px-2 py-1 text-xs text-muted-foreground">
        +{filters.cities.length - 10} more cities
      </div>
    )}
  </SelectContent>
</Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-red-600" />
                    Inactive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={fetchProperties} 
              variant="outline" 
              size="icon" 
              disabled={loading.properties}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading.properties ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Badges */}
      {(typeFilter !== 'all' || cityFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchQuery}"
                  <XCircle 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {typeFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Type: {typeFilter}
                  <XCircle 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setTypeFilter('all')}
                  />
                </Badge>
              )}
              {cityFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  City: {cityFilter}
                  <XCircle 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setCityFilter('all')}
                  />
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <XCircle 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setStatusFilter('all')}
                  />
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery('')
                  setTypeFilter('all')
                  setCityFilter('all')
                  setStatusFilter('all')
                }}
                className="h-6 text-xs"
              >
                Clear all
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedProperties.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium text-blue-800">
                  {selectedProperties.length} propert{selectedProperties.length !== 1 ? 'ies' : 'y'} selected
                </span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('activate')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('deactivate')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedProperties([])}
              >
                Clear selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Table */}
      <Card className="border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedProperties.length === properties.length && properties.length > 0}
                    onChange={selectAllProperties}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading.properties ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">Loading properties...</p>
                  </TableCell>
                </TableRow>
              ) : properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No properties found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || typeFilter !== 'all' || cityFilter !== 'all' || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filters' 
                        : 'No properties in the system'
                      }
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((property) => (
                  <TableRow key={property.id} className={selectedProperties.includes(property.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProperties.includes(property.id)}
                        onChange={() => togglePropertySelection(property.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Home className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium line-clamp-1">{property.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {property.number_of_rooms} rooms • {property.size}m²
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{property.city}</span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[150px]">
                        {property.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-semibold">
                        <Euro className="h-3 w-3 text-green-600" />
                        {formatPrice(property.price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPropertyTypeBadge(property.property_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{property.seller_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(property)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(property.created_at)}
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
                            setSelectedProperty(property)
                            setIsPropertyDetailOpen(true)
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedProperty(property)
                            setIsPropertyDetailOpen(true)
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Property
                          </DropdownMenuItem>
                          {property.is_available ? (
                            <DropdownMenuItem onClick={() => handlePropertyAction(property.id, 'deactivate')}>
                              <XCircle className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handlePropertyAction(property.id, 'activate')}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handlePropertyAction(property.id, 'delete')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Delete Property
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

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        isOpen={isPropertyDetailOpen}
        onClose={() => {
          setIsPropertyDetailOpen(false)
          setSelectedProperty(null)
        }}
        onPropertyUpdate={fetchProperties}
      />
    </div>
  )
}

// Helper functions
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

const getPropertyTypeBadge = (type: string) => {
  const typeConfig: { [key: string]: { label: string, variant: "default" | "secondary" | "outline" | "destructive" } } = {
    house: { label: "House", variant: "default" },
    apartment: { label: "Apartment", variant: "secondary" },
    villa: { label: "Villa", variant: "outline" },
    land: { label: "Land", variant: "outline" },
    commercial: { label: "Commercial", variant: "destructive" }
  }
  
  const config = typeConfig[type] || { label: type, variant: "outline" }
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  )
}

const getStatusBadge = (property: Property) => {
  if (!property.is_available) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Inactive
      </Badge>
    )
  }
  return (
    <Badge variant="default" className="gap-1">
      <CheckCircle className="h-3 w-3" />
      Active
    </Badge>
  )
}