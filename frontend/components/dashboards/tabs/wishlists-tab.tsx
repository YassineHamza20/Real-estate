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
  Calendar, RefreshCw, Trash2, Eye, Users, Package, ImageOff
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { UserWishlistModal } from "../modals/user-wishlist-modal"

export function WishlistsTab() {
  const { isAuthenticated } = useAuth()
  const [wishlists, setWishlists] = useState<UserWishlist[]>([])
  const [loading, setLoading] = useState({
    wishlists: false,
    stats: false
  })
  const [stats, setStats] = useState<WishlistStats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Modal state
  const [selectedUserWishlist, setSelectedUserWishlist] = useState<UserWishlist | null>(null)
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false)

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