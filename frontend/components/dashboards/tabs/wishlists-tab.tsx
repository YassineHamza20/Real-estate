"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { adminWishlistsApi, UserWishlist, WishlistStats, WishlistItem } from "@/lib/api/adminWishlists"
import { 
  Search, MoreVertical, Heart, User, Home, MapPin, Euro, 
  Calendar, RefreshCw, Trash2, Eye, Users, Package, ImageOff,
  Download,
  FileText,
  Table as TableIcon,
  Image
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { UserWishlistModal } from "../modals/user-wishlist-modal"

export function WishlistsTab() {
  const { isAuthenticated } = useAuth()
  const [wishlists, setWishlists] = useState<UserWishlist[]>([])
  const [loading, setLoading] = useState({
    wishlists: false,
    stats: false,
    export: false
  })
  const [stats, setStats] = useState<WishlistStats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Modal state
  const [selectedUserWishlist, setSelectedUserWishlist] = useState<UserWishlist | null>(null)
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false)

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
        title: `Wishlists Report - ${new Date().toLocaleDateString()}`,
        subject: 'User Wishlists Export',
        author: 'Admin User',
        creator: 'Real Estate Platform',
        keywords: 'wishlists, users, export'
      })

      // Add header
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 297, 20, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('REAL ESTATE PLATFORM - WISHLISTS REPORT', 20, 12)

      // Generation info
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 18)
      doc.text(`By: Admin User`, 200, 18)

      let yPosition = 30

      // Summary section
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('SUMMARY', 20, yPosition)
      
      yPosition += 8
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      const summaryText = `Total Wishlists: ${wishlists.length} | Total Items: ${stats?.total_wishlist_items || 0} | Users with Wishlists: ${stats?.total_users_with_wishlists || 0}`
      doc.text(summaryText, 20, yPosition)

      yPosition += 15

      // Table headers
      const headers = ['User ID', 'Username', 'Email', 'Total Items', 'Most Recent Property', 'Recent Item Added']
      const columnWidths = [20, 40, 60, 25, 70, 30]
      
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
      wishlists.forEach((wishlist, index) => {
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
        const recentItem = wishlist.wishlist_items[0]
        const rowData = [
          wishlist.user.id.toString(),
          wishlist.user.username,
          wishlist.user.email,
          wishlist.total_items.toString(),
          recentItem ? recentItem.property.name : 'No items',
          recentItem ? formatDate(recentItem.added_at) : 'N/A'
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

      doc.save(`wishlists-report-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "PDF Export Complete",
        description: "Wishlists data has been exported to PDF",
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
        ['Wishlists Export', '', '', '', '', ''],
        [`Generated,${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
        [`By,Admin`],
        [''],
        
        // Data headers
        ['User ID', 'Username', 'Email', 'Total Items', 'Most Recent Property', 'Recent Property Price', 'Recent Property Type', 'Recent Property City', 'Recent Item Added'],
        
        // Data rows
        ...wishlists.map(wishlist => {
          const recentItem = wishlist.wishlist_items[0]
          return [
            wishlist.user.id,
            `"${wishlist.user.username}"`,
            `"${wishlist.user.email}"`,
            wishlist.total_items,
            recentItem ? `"${recentItem.property.name}"` : 'No items',
            recentItem ? recentItem.property.price : '',
            recentItem ? recentItem.property.property_type : '',
            recentItem ? recentItem.property.city : '',
            recentItem ? recentItem.added_at : ''
          ]
        }),
        [''],
        ['Summary', '', '', '', '', '', '', '', ''],
        [`Total Wishlists,${wishlists.length}`],
        [`Total Wishlist Items,${stats?.total_wishlist_items || 0}`],
        [`Users with Wishlists,${stats?.total_users_with_wishlists || 0}`],
        [`Most Popular Property,${stats?.most_popular_properties[0]?.property_name || 'N/A'}`],
        [`Most Popular Property Count,${stats?.most_popular_properties[0]?.wishlist_count || 0}`]
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `wishlists-${new Date().toISOString().split('T')[0]}.csv`)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Excel Export Complete",
        description: "Wishlists data exported successfully",
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
      ctx.fillText('Real Estate Platform - Wishlists Report', 20, 35)
      
      // Generation info
      ctx.fillStyle = '#666666'
      ctx.font = '14px Arial'
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} by Admin`, 20, 85)
      
      // Summary
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 16px Arial'
      ctx.fillText(`Total Wishlists: ${wishlists.length} | Total Items: ${stats?.total_wishlist_items || 0} | Users with Wishlists: ${stats?.total_users_with_wishlists || 0}`, 20, 115)
      
      let yPos = 150
      const rowHeight = 30
      const headers = ['Username', 'Items', 'Recent Property', 'Added Date']
      const columnWidths = [200, 100, 400, 150]
      
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
      wishlists.slice(0, 20).forEach((wishlist, index) => { // Limit to 20 rows for PNG
        if (index % 2 === 0) {
          ctx.fillStyle = '#fafafa'
          ctx.fillRect(20, yPos, canvas.width - 40, rowHeight)
        }
        
        ctx.fillStyle = '#333333'
        xPos = 25
        
        const recentItem = wishlist.wishlist_items[0]
        const rowData = [
          wishlist.user.username,
          `${wishlist.total_items} items`,
          recentItem ? (recentItem.property.name.length > 50 ? recentItem.property.name.substring(0, 50) + '...' : recentItem.property.name) : 'No items',
          recentItem ? formatDate(recentItem.added_at) : 'N/A'
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
      link.download = `wishlists-snapshot-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
      
      toast({
        title: "PNG Export Complete",
        description: "Wishlists snapshot has been saved as PNG",
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

  // Add debugging for images
  useEffect(() => {
    if (wishlists.length > 0) {
      console.log("🔍 Wishlists data:", wishlists)
      wishlists.forEach((wishlist, index) => {
        console.log(`👤 User ${index}:`, wishlist.user.username)
        console.log(`🖼️ Profile picture URL:`, wishlist.user.profile_picture_url)
        console.log(`📦 Wishlist items count:`, wishlist.total_items)
      })
    }
  }, [wishlists])

  // Fetch wishlists
  const fetchWishlists = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access wishlists",
        variant: "destructive",
      })
      return
    }
    
    setLoading(prev => ({ ...prev, wishlists: true }))
    try {
      const data = await adminWishlistsApi.getAllWishlists()
      console.log("✅ Fetched wishlists:", data)
      setWishlists(data)
    } catch (error: any) {
      console.error("❌ Failed to fetch wishlists:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load wishlists",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, wishlists: false }))
    }
  }, [isAuthenticated])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return
    
    setLoading(prev => ({ ...prev, stats: true }))
    try {
      const statsData = await adminWishlistsApi.getWishlistStats()
      setStats(statsData)
    } catch (error: any) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }, [isAuthenticated])

  // Handle remove item
  const handleRemoveItem = async (userId: number, wishlistItemId: number, userName: string) => {
    if (!isAuthenticated) return
    
    try {
      await adminWishlistsApi.removeFromWishlist(userId, wishlistItemId)
      toast({
        title: "Success",
        description: `Item removed from ${userName}'s wishlist`,
      })
      fetchWishlists()
      // Refresh the modal if it's open for this user
      if (selectedUserWishlist && selectedUserWishlist.user.id === userId) {
        const updatedWishlist = await adminWishlistsApi.getUserWishlist(userId)
        setSelectedUserWishlist(updatedWishlist)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from wishlist",
        variant: "destructive",
      })
    }
  }

  // Filter wishlists based on search
  const filteredWishlists = wishlists.filter(wishlist =>
    wishlist.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wishlist.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Load data on mount
  useEffect(() => {
    fetchWishlists()
    fetchStats()
  }, [fetchWishlists, fetchStats])

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Wishlists</p>
                  <p className="text-2xl font-bold">{stats.total_wishlists}</p>
                </div>
                <Heart className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Users with Wishlists</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total_users_with_wishlists}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-green-600">{stats.total_wishlist_items}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Popular Properties</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.most_popular_properties.length > 0 ? stats.most_popular_properties[0]?.wishlist_count || 0 : 0}
                  </p>
                </div>
                <Home className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Wishlists Management</h2>
          <p className="text-muted-foreground">
            {filteredWishlists.length} wishlist{filteredWishlists.length !== 1 ? 's' : ''} found
            {searchQuery && ' (filtered)'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Export Button */}
          <div className="relative group">
            <Button 
              
              size="sm"
              disabled={loading.export || wishlists.length === 0}
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
                  disabled={loading.export || wishlists.length === 0}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  {loading.export ? 'Generating...' : 'Export as PDF'}
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={loading.export || wishlists.length === 0}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <TableIcon className="h-4 w-4 text-green-500" />
                  {loading.export ? 'Generating...' : 'Export as Excel'}
                </button>
                <button
                  onClick={exportToPNG}
                  disabled={loading.export || wishlists.length === 0}
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
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full sm:w-64"
            />
          </div>
          
          <Button 
            onClick={() => {
              fetchWishlists()
              fetchStats()
            }}
            variant="outline" 
            size="icon" 
            disabled={loading.wishlists}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading.wishlists ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Wishlists Table */}
      <Card className="border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Wishlist Items</TableHead>
                <TableHead>Most Recent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading.wishlists ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">Loading wishlists...</p>
                  </TableCell>
                </TableRow>
              ) : filteredWishlists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No wishlists found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? 'No users match your search' 
                        : 'No wishlists in the system'
                      }
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWishlists.map((wishlist) => (
                  <TableRow key={wishlist.user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative">
                          {wishlist.user.profile_picture_url ? (
                            <>
                              <img 
                                src={wishlist.user.profile_picture_url} 
                                alt={wishlist.user.username}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  console.error("❌ Failed to load profile picture:", wishlist.user.profile_picture_url)
                                  e.currentTarget.style.display = 'none'
                                  // Show fallback icon
                                  const parent = e.currentTarget.parentElement
                                  if (parent) {
                                    const fallback = parent.querySelector('.profile-fallback')
                                    if (fallback) {
                                      fallback.classList.remove('hidden')
                                    }
                                  }
                                }}
                              />
                              <User className="h-5 w-5 text-primary hidden profile-fallback" />
                            </>
                          ) : (
                            <User className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{wishlist.user.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {wishlist.user.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            User ID: {wishlist.user.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Heart className="h-3 w-3" />
                          {wishlist.total_items} item{wishlist.total_items !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {wishlist.wishlist_items.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-sm font-medium line-clamp-1">
                            {wishlist.wishlist_items[0].property.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(wishlist.wishlist_items[0].added_at)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No items</span>
                      )}
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
                            setSelectedUserWishlist(wishlist)
                            setIsWishlistModalOpen(true)
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Wishlist
                          </DropdownMenuItem>
                          {wishlist.total_items > 0 && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (wishlist.wishlist_items.length > 0) {
                                  handleRemoveItem(
                                    wishlist.user.id, 
                                    wishlist.wishlist_items[0].id,
                                    wishlist.user.username
                                  )
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Recent Item
                            </DropdownMenuItem>
                          )}
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

      {/* User Wishlist Modal */}
      <UserWishlistModal
        wishlist={selectedUserWishlist}
        isOpen={isWishlistModalOpen}
        onClose={() => {
          setIsWishlistModalOpen(false)
          setSelectedUserWishlist(null)
        }}
        onItemRemove={handleRemoveItem}
        onWishlistUpdate={fetchWishlists}
      />
    </div>
  )
}

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return 'Invalid Date'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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