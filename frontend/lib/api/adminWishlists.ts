const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Types
export interface WishlistItem {
  id: number
  property: {
    id: number
    name: string
    price: string
    city: string
    property_type: string
    images: Array<{
      id: number
      image: string
      is_primary: boolean
    }>
  }
  added_at: string
}

export interface UserWishlist {
  user: {
    id: number
    username: string
    email: string
    profile_picture_url: string | null
  }
  wishlist_items: WishlistItem[]
  total_items: number
}

export interface WishlistStats {
  total_wishlists: number
  total_users_with_wishlists: number
  total_wishlist_items: number
  most_popular_properties: Array<{
    property_id: number
    property_name: string
    wishlist_count: number
  }>
}

// API functions
export const adminWishlistsApi = {

async getWishlistStats(): Promise<WishlistStats> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Updated URL - using properties admin stats
      const response = await fetch(`${API_BASE_URL}/properties/admin/wishlists/stats/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch wishlist stats: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching wishlist stats:', error)
      return {
        total_wishlists: 0,
        total_users_with_wishlists: 0,
        total_wishlist_items: 0,
        most_popular_properties: []
      }
    }
  },

  async getAllWishlists(): Promise<UserWishlist[]> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Updated URL - using properties admin wishlists
      const response = await fetch(`${API_BASE_URL}/properties/admin/wishlists/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch wishlists: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching wishlists:', error)
      throw error
    }
  },

  async getUserWishlist(userId: number): Promise<UserWishlist> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Updated URL - using properties admin user wishlist
      const response = await fetch(`${API_BASE_URL}/properties/admin/users/${userId}/wishlist/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user wishlist: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching user wishlist:', error)
      throw error
    }
  },

  async removeFromWishlist(userId: number, wishlistItemId: number): Promise<void> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Updated URL - using properties admin remove wishlist item
      const response = await fetch(`${API_BASE_URL}/properties/admin/users/${userId}/wishlist/${wishlistItemId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to remove item from wishlist: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      throw error
    }
  }
}