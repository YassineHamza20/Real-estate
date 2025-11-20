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
  Image as ImageIcon, User, MapPin, Euro, Home, Calendar, RefreshCw, CheckCircle, XCircle,
  Download,
  FileText,
  Table as TableIcon,
  Image
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
    stats: false,
    export: false
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal state
  const [selectedImage, setSelectedImage] = useState<PropertyImage | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // Selected images for bulk actions
  const [selectedImages, setSelectedImages] = useState<number[]>([])

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
        title: `Property Images Report - ${new Date().toLocaleDateString()}`,
        subject: 'Property Images Export',
        author: user?.username || 'Admin User',
        creator: 'Real Estate Platform',
        keywords: 'property images, real estate, export'
      })

      // Add header
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 297, 20, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('REAL ESTATE PLATFORM - PROPERTY IMAGES REPORT', 20, 12)

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
      const summaryText = `Total Images: ${images.length} | Primary: ${images.filter(img => img.is_primary).length} | Secondary: ${images.filter(img => !img.is_primary).length}`
      doc.text(summaryText, 20, yPosition)

      yPosition += 15

      // Table headers
      const headers = ['ID', 'Property', 'City', 'Price', 'Seller', 'Status', 'Uploaded' ]
      const columnWidths = [15, 40, 30, 30, 35, 25, 30, 52]
      
      let xPosition = 20
      doc.setFillColor(240, 240, 240)
      doc.rect(xPosition, yPosition, 200, 8, 'F')
      
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
      images.forEach((image, index) => {
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
          image.id.toString(),
          image.property.name,
          image.property.city,
          formatPrice(image.property.price),
          image.seller.username,
          image.is_primary ? 'Primary' : 'Secondary',
          formatDate(image.uploaded_at),
         
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

      doc.save(`property-images-report-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast.success("Property images data has been exported to PDF")
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      toast.error("Could not generate PDF export")
    } finally {
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

  const exportToExcel = async () => {
    setLoading(prev => ({ ...prev, export: true }))
    try {
      const csvContent = [
        // Header
        ['Property Images Export', '', '', '', '', '', '', ''],
        [`Generated,${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
        [`By,${user?.username || 'Admin'}`],
        [''],
        
        // Data headers
        ['Image ID', 'Property ID', 'Property Name', 'Property Type', 'City', 'Address', 'Price', 'Rooms', 'Size', 'Seller ID', 'Seller Username', 'Seller Email', 'Image URL', 'Is Primary', 'Uploaded At'],
        
        // Data rows
        ...images.map(image => [
          image.id,
          image.property.id,
          `"${image.property.name}"`,
          image.property.property_type,
          `"${image.property.city}"`,
          `"${image.property.address}"`,
          image.property.price,
          image.property.number_of_rooms,
          image.property.size,
          image.seller.id,
          `"${image.seller.username}"`,
          `"${image.seller.email}"`,
          `"${image.image_url}"`,
          image.is_primary ? 'Yes' : 'No',
          image.uploaded_at
        ]),
        [''],
        ['Summary', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        [`Total Images,${images.length}`],
        [`Primary Images,${images.filter(img => img.is_primary).length}`],
        [`Secondary Images,${images.filter(img => !img.is_primary).length}`],
        [`Properties with Images,${stats?.properties_with_images || 0}`],
        [`Properties without Images,${stats?.properties_without_images || 0}`],
        [`Recent Images (7d),${stats?.recent_images || 0}`]
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `property-images-${new Date().toISOString().split('T')[0]}.csv`)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success("Property images data exported successfully")
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error("Could not generate Excel export")
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
      canvas.width = 1400
      canvas.height = 1000
      
      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Header
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(0, 0, canvas.width, 60)
      
      // Title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.fillText('Real Estate Platform - Property Images Report', 20, 35)
      
      // Generation info
      ctx.fillStyle = '#666666'
      ctx.font = '14px Arial'
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} by ${user?.username || 'Admin'}`, 20, 85)
      
      // Summary
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 16px Arial'
      ctx.fillText(`Total Images: ${images.length} | Primary: ${images.filter(img => img.is_primary).length} | Secondary: ${images.filter(img => !img.is_primary).length}`, 20, 115)
      
      let yPos = 150
      const rowHeight = 30
      const headers = ['Property', 'City', 'Price', 'Seller', 'Status', 'Uploaded']
      const columnWidths = [300, 150, 150, 200, 150, 150]
      
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
      images.slice(0, 25).forEach((image, index) => { // Limit to 25 rows for PNG
        if (index % 2 === 0) {
          ctx.fillStyle = '#fafafa'
          ctx.fillRect(20, yPos, canvas.width - 40, rowHeight)
        }
        
        ctx.fillStyle = '#333333'
        xPos = 25
        
        const rowData = [
          image.property.name.length > 35 ? image.property.name.substring(0, 35) + '...' : image.property.name,
          image.property.city,
          formatPrice(image.property.price),
          image.seller.username,
          image.is_primary ? 'Primary' : 'Secondary',
          formatDate(image.uploaded_at)
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
      ctx.fillText(`Real Estate Platform - ${new Date().getFullYear()} | Page 1 of 1`, 20, 950)
      
      // Convert to PNG and download
      const link = document.createElement('a')
      link.download = `property-images-snapshot-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
      
      toast.success("Property images snapshot has been saved as PNG")
    } catch (error) {
      console.error('Error exporting to PNG:', error)
      toast.error("Could not generate PNG export")
    } finally {
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

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
          {/* Export Button */}
          <div className="relative group">
            <Button 
             
              size="sm"
              disabled={loading.export || images.length === 0}
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
                  disabled={loading.export || images.length === 0}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  {loading.export ? 'Generating...' : 'Export as PDF'}
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={loading.export || images.length === 0}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <TableIcon className="h-4 w-4 text-green-500" />
                  {loading.export ? 'Generating...' : 'Export as Excel'}
                </button>
                <button
                  onClick={exportToPNG}
                  disabled={loading.export || images.length === 0}
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