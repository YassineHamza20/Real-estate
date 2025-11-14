// lib/api/property-images.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Types
export interface PropertyImage {
  id: number
  image_url: string
  is_primary: boolean
  uploaded_at: string
  property: {
    id: number
    name: string
    city: string
    price: string
    property_type: string
    is_available: boolean
  }
  seller: {
    id: number
    username: string
    email: string
  }
}

export interface PropertyImagesStats {
  total_images: number
  properties_with_images: number
  properties_without_images: number
  recent_images: number
  properties_most_images: Array<{
    property_id: number
    property_name: string
    image_count: number
    city: string
  }>
}

export interface PropertyWithoutImages {
  id: number
  name: string
  city: string
  price: string
  property_type: string
  is_available: boolean
  created_at: string
  seller: {
    id: number
    username: string
    email: string
  }
}

export interface ImagesResponse {
  images: PropertyImage[]
  total_count: number
  page: number
  page_size: number
  total_pages: number
}

// API functions
export const propertyImagesApi = {
  // Get images statistics
  async getStats(): Promise<PropertyImagesStats> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/admin/images/stats/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch images stats: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching images stats:', error)
      return {
        total_images: 0,
        properties_with_images: 0,
        properties_without_images: 0,
        recent_images: 0,
        properties_most_images: []
      }
    }
  },

  // Get all images with filtering and pagination
  async getAllImages(params?: {
    page?: number
    page_size?: number
    property_id?: string
    seller_id?: string
    has_primary?: string
    search?: string
  }): Promise<ImagesResponse> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString())
      if (params?.property_id) queryParams.append('property_id', params.property_id)
      if (params?.seller_id) queryParams.append('seller_id', params.seller_id)
      if (params?.has_primary) queryParams.append('has_primary', params.has_primary)
      if (params?.search) queryParams.append('search', params.search)

      const response = await fetch(`${API_BASE_URL}/properties/admin/images/?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching images:', error)
      throw error
    }
  },

  // Set image as primary
  async setPrimaryImage(imageId: number): Promise<void> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/admin/images/${imageId}/primary/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to set primary image: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error setting primary image:', error)
      throw error
    }
  },

  // Delete image
  async deleteImage(imageId: number): Promise<void> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/admin/images/${imageId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete image: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  },

  // Get properties without images
  async getPropertiesWithoutImages(search?: string): Promise<{
    properties: PropertyWithoutImages[]
    total_count: number
  }> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const queryParams = new URLSearchParams()
      if (search) queryParams.append('search', search)

      const response = await fetch(`${API_BASE_URL}/properties/admin/properties/no-images/?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch properties without images: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error fetching properties without images:', error)
      throw error
    }
  },

  // Bulk actions
  async bulkActions(imageIds: number[], action: 'delete' | 'set_primary'): Promise<void> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/admin/images/bulk-actions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_ids: imageIds,
          action: action
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to perform bulk action: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      throw error
    }
  }
}