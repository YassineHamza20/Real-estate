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
  Building, MapPin, Euro, Home, User, Calendar, RefreshCw, Filter,
  Download,
  FileText,
  Table as TableIcon,
  Image
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
    stats: false,
    export: false
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

  // Export functionality
  const exportToPDF = async () => {
    setLoading(prev => ({ ...prev, export: true }))
    try {
      const { jsPDF } = await import('jspdf')
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      // Set document properties
      doc.setProperties({
        title: `Properties Report - ${new Date().toLocaleDateString()}`,
        subject: 'Real Estate Properties Export',
        author: user?.username || 'Admin User',
        creator: 'Real Estate Platform',
        keywords: 'properties, real estate, export'
      })

      // Add header
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 297, 20, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('REAL ESTATE PLATFORM - PROPERTIES REPORT', 20, 12)

      // Generation info
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 18)
      doc.text(`By: ${user?.username || 'Admin User'}`, 200, 18)

      let yPosition = 30

      // Summary section
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('SUMMARY', 20, yPosition)
      
      yPosition += 8
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      const summaryText = `Total Properties: ${properties.length} | Active: ${properties.filter(p => p.is_available).length} | Inactive: ${properties.filter(p => !p.is_available).length}`
      doc.text(summaryText, 20, yPosition)

      yPosition += 15

      // Table headers
      const headers = ['ID', 'Name', 'Location', 'Price', 'Type', 'Rooms', 'Size', 'Status', 'Seller', 'Created']
      const columnWidths = [15, 40, 40, 30, 25, 20, 25, 25, 35, 30]
      
      let xPosition = 20
      doc.setFillColor(240, 240, 240)
      doc.rect(xPosition, yPosition, 257, 8, 'F')
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      doc.setFont(undefined, 'bold')
      
      headers.forEach((header, index) => {
        doc.text(header, xPosition + 2, yPosition + 6)
        xPosition += columnWidths[index]
      })

      yPosition += 8

      // Table rows
      doc.setFont(undefined, 'normal')
      properties.forEach((property, index) => {
        if (yPosition > 180) {
          doc.addPage()
          yPosition = 30
          
          // Add headers to new page
          xPosition = 20
          doc.setFillColor(240, 240, 240)
          doc.rect(xPosition, yPosition, 257, 8, 'F')
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(8)
          doc.setFont(undefined, 'bold')
          
          headers.forEach((header, index) => {
            doc.text(header, xPosition + 2, yPosition + 6)
            xPosition += columnWidths[index]
          })
          yPosition += 8
        }

        xPosition = 20
        const rowData = [
          property.id.toString(),
          property.name,
          `${property.city}, ${property.address.substring(0, 20)}...`,
          formatPrice(property.price),
          property.property_type,
          property.number_of_rooms.toString(),
          `${property.size}m²`,
          property.is_available ? 'Active' : 'Inactive',
          property.seller_name,
          formatDate(property.created_at)
        ]

        doc.setFontSize(7)
        rowData.forEach((data, dataIndex) => {
          const lines = doc.splitTextToSize(data, columnWidths[dataIndex] - 2)
          lines.forEach((line: string, lineIndex: number) => {
            doc.text(line, xPosition + 1, yPosition + 4 + (lineIndex * 3))
          })
          xPosition += columnWidths[dataIndex]
        })

        yPosition += 15
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(8)
        doc.text(`Page ${i} of ${pageCount}`, 150, 200, { align: 'center' })
        doc.text(`Real Estate Platform - ${new Date().getFullYear()}`, 20, 290)
      }

      doc.save(`properties-report-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "PDF Export Complete",
        description: "Properties data has been exported to PDF",
        variant: "default",
      })
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      toast({
        title: "Export Failed",
        description: "Could not generate PDF export",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

  const exportToExcel = async () => {
    setLoading(prev => ({ ...prev, export: true }))
    try {
      const csvContent = [
        // Header
        ['Properties Export', '', '', '', '', '', '', '', '', ''],
        [`Generated,${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
        [`By,${user?.username || 'Admin'}`],
        [''],
        
        // Data headers
        ['ID', 'Name', 'Description', 'Address', 'City', 'Price', 'Rooms', 'Size', 'Type', 'Status', 'Seller', 'Seller Name', 'Created At', 'Updated At'],
        
        // Data rows
        ...properties.map(property => [
          property.id,
          `"${property.name}"`,
          `"${property.description.replace(/"/g, '""')}"`,
          `"${property.address.replace(/"/g, '""')}"`,
          property.city,
          property.price,
          property.number_of_rooms,
          property.size,
          property.property_type,
          property.is_available ? 'Active' : 'Inactive',
          property.seller,
          `"${property.seller_name}"`,
          property.created_at,
          property.updated_at
        ]),
        [''],
        ['Summary', '', '', '', '', '', '', '', '', ''],
        [`Total Properties,${properties.length}`],
        [`Active Properties,${properties.filter(p => p.is_available).length}`],
        [`Inactive Properties,${properties.filter(p => !p.is_available).length}`]
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `properties-${new Date().toISOString().split('T')[0]}.csv`)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Excel Export Complete",
        description: "Properties data exported successfully",
        variant: "default",
      })
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast({
        title: "Export Failed",
        description: "Could not generate Excel export",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

  const exportToPNG = async () => {
    setLoading(prev => ({ ...prev, export: true }))
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // Set canvas size
      canvas.width = 1200
      canvas.height = 800
      
      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Header
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(0, 0, canvas.width, 60)
      
      // Title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.fillText('Real Estate Platform - Properties Report', 20, 35)
      
      // Generation info
      ctx.fillStyle = '#666666'
      ctx.font = '14px Arial'
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} by ${user?.username || 'Admin'}`, 20, 85)
      
      // Summary
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 16px Arial'
      ctx.fillText(`Total Properties: ${properties.length} | Active: ${properties.filter(p => p.is_available).length} | Inactive: ${properties.filter(p => !p.is_available).length}`, 20, 115)
      
      let yPos = 150
      const rowHeight = 30
      const headers = ['ID', 'Name', 'City', 'Price', 'Type', 'Status']
      const columnWidths = [50, 300, 150, 150, 150, 100]
      
      // Table headers
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(20, yPos, canvas.width - 40, rowHeight)
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 12px Arial'
      
      let xPos = 25
      headers.forEach((header, index) => {
        ctx.fillText(header, xPos, yPos + 20)
        xPos += columnWidths[index]
      })
      
      yPos += rowHeight
      
      // Table rows
      ctx.font = '11px Arial'
      properties.slice(0, 20).forEach((property, index) => { // Limit to 20 rows for PNG
        if (index % 2 === 0) {
          ctx.fillStyle = '#fafafa'
          ctx.fillRect(20, yPos, canvas.width - 40, rowHeight)
        }
        
        ctx.fillStyle = '#333333'
        xPos = 25
        
        const rowData = [
          property.id.toString(),
          property.name.length > 35 ? property.name.substring(0, 35) + '...' : property.name,
          property.city,
          formatPrice(property.price),
          property.property_type,
          property.is_available ? 'Active' : 'Inactive'
        ]
        
        rowData.forEach((data, dataIndex) => {
          ctx.fillText(data, xPos, yPos + 20)
          xPos += columnWidths[dataIndex]
        })
        
        yPos += rowHeight
      })
      
      // Footer
      ctx.fillStyle = '#666666'
      ctx.font = '10px Arial'
      ctx.fillText(`Real Estate Platform - ${new Date().getFullYear()} | Page 1 of 1`, 20, 780)
      
      // Convert to PNG and download
      const link = document.createElement('a')
      link.download = `properties-snapshot-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
      
      toast({
        title: "PNG Export Complete",
        description: "Properties snapshot has been saved as PNG",
        variant: "default",
      })
    } catch (error) {
      console.error('Error exporting to PNG:', error)
      toast({
        title: "Export Failed",
        description: "Could not generate PNG export",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

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
          {/* Export Button */}
          <div className="relative group">
            <Button 
              
              size="sm"
              disabled={loading.export || properties.length === 0}
              className="rounded-lg border-2 hover:border-primary/50 transition-all duration-300"
            >
              <Download className={`h-4 w-4 mr-2 ${loading.export ? 'animate-spin' : ''}`} />
              Export Data
            </Button>
            
            {/* Export Options Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-background border-2 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="p-2 space-y-1">
                <button
                  onClick={exportToPDF}
                  disabled={loading.export || properties.length === 0}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  {loading.export ? 'Generating...' : 'Export as PDF'}
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={loading.export || properties.length === 0}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <TableIcon className="h-4 w-4 text-green-500" />
                  {loading.export ? 'Generating...' : 'Export as Excel'}
                </button>
                <button
                  onClick={exportToPNG}
                  disabled={loading.export || properties.length === 0}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <Image className="h-4 w-4 text-blue-500" />
                  {loading.export ? 'Generating...' : 'Export as PNG'}
                </button>
              </div>
            </div>
          </div>

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

      {/* Rest of the component remains the same */}
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