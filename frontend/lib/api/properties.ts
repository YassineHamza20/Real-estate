// lib/api/properties.ts
import type { Property, PropertyFormData, PropertyFilters, PropertySearchResponse } from "@/types/property"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

// Helper function to safely parse numbers from backend
const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined) return 0
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  return isNaN(num) ? 0 : num
}

interface WishlistResponse {
  message: string;
  in_wishlist: boolean;
  action: string;
}

 // Helper function for image transformation
function transformImages(images: any[]): { id: string; url: string; order: number; is_primary: boolean }[] {
  if (!images || images.length === 0) {
    return [{ id: '1', url: '/placeholder-property.jpg', order: 0, is_primary: false }]
  }

  return images.map((img: any, index: number) => {
    let imageUrl = '/placeholder-property.jpg'
    
    if (typeof img === 'string') {
      imageUrl = img
    } else if (img.url) {
      imageUrl = img.url
    } else if (img.image) {
      imageUrl = img.image
    } else if (img.image_url) {
      imageUrl = img.image_url
    }

    // Make sure the URL is absolute if it's a relative path
    if (imageUrl.startsWith('/')) {
      imageUrl = `${API_BASE_URL}${imageUrl}`
    }

    return {
      id: img.id?.toString() || index.toString(),
      url: imageUrl,
      order: img.order || index,
      is_primary: img.is_primary || false // Add this line
    }
  })
}

export const propertiesApi = {
  async getProperties(filters?: PropertyFilters): Promise<Property[]> {
    try {
      // Build query parameters from filters
      const queryParams = new URLSearchParams()
      
      if (filters?.search) {
        queryParams.append('search', filters.search)
      }
      if (filters?.city) {
        queryParams.append('city', filters.city)
      }
      if (filters?.property_type) {
        queryParams.append('property_type', filters.property_type)
      }
      if (filters?.minPrice) {
        queryParams.append('price_min', filters.minPrice.toString())
      }
      if (filters?.maxPrice) {
        queryParams.append('price_max', filters.maxPrice.toString())
      }
      if (filters?.bedrooms) {
        queryParams.append('number_of_rooms', filters.bedrooms.toString())
      }

      // Get auth token
      const token = localStorage.getItem('access_token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/properties/?${queryParams.toString()}`, {
        method: 'GET',
        headers: headers,
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.statusText}`)
      }
      
      const properties = await response.json()
      
      // Transform the backend response to match your frontend Property type
      return properties.map((property: any) => ({
        id: property.id.toString(),
        name: property.name,
        description: property.description,
        address: property.address,
        city: property.city,
        price: safeParseFloat(property.price),
        bedrooms: property.number_of_rooms,
        squareMeters: safeParseFloat(property.size),
        type: property.property_type,
        status: property.is_available ? 'active' : 'inactive',
        images: transformImages(property.images || []),
        seller: {
          id: property.seller.toString(),
          name: property.seller_name,
          email: property.seller_email,
          phone: property.seller_phone,
        },
        createdAt: property.created_at,
        updatedAt: property.updated_at,
        inWishlist: property.in_wishlist,
      }))
    } catch (error) {
      console.error('Error fetching properties:', error)
      throw error
    }
  },

  async getProperty(id: string): Promise<Property> {
    try {
      const token = localStorage.getItem('access_token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/properties/${id}/`, {
        method: 'GET',
        headers: headers,
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch property: ${response.statusText}`)
      }
      
      const property = await response.json()
      console.log('Property API Response:', property)
      
      // Transform the backend response to match your frontend Property type
      return {
        id: property.id?.toString() || 'unknown',
        name: property.name || '',
        description: property.description || '',
        address: property.address || '',
        city: property.city || '',
        price: safeParseFloat(property.price),
        bedrooms: property.number_of_rooms || 0,
        squareMeters: safeParseFloat(property.size),
        type: property.property_type || 'house',
        status: property.is_available ? 'active' : 'inactive',
        images: transformImages(property.images || property.property_images || []),
        seller: {
          id: property.seller?.toString() || property.seller_id?.toString() || 'unknown',
          name: property.seller_name || '',
          email: property.seller_email || '',
          phone: property.seller_phone || '',
        },
        createdAt: property.created_at || new Date().toISOString(),
        updatedAt: property.updated_at || new Date().toISOString(),
        inWishlist: property.in_wishlist || false,
      }
    } catch (error) {
      console.error('Error fetching property:', error)
      throw error
    }
  },

 // lib/api/properties.ts - Update the uploadPropertyImage method
async uploadPropertyImage(propertyId: string, image: File, isPrimary: boolean = false): Promise<any> {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Not authenticated')
    }

    const formData = new FormData()
    formData.append('image', image)
    formData.append('is_primary', isPrimary.toString()) // Add this line

    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/images/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`)
    }
    
    return response.json()
  } catch (error) {
    console.error('Error uploading property image:', error)
    throw error
  }
},


// lib/api/properties.ts - Update the createProperty method
async createProperty(data: any, images: {file: File, is_primary: boolean}[] = []): Promise<Property> {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Not authenticated')
    }

    console.log('Creating property with data:', data)
    console.log('Images to upload:', images.length)

    // Step 1: Create the property first
    const propertyResponse = await fetch(`${API_BASE_URL}/properties/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        price: data.price.toString(),
        number_of_rooms: data.number_of_rooms,
        size: data.size.toString(),
        property_type: data.property_type,
        is_available: data.is_available,
      }),
    })
    
    const responseText = await propertyResponse.text()
    console.log('Property creation response:', responseText)
    
    if (!propertyResponse.ok) {
      console.error('API Error Response:', responseText)
      throw new Error(`Failed to create property: ${propertyResponse.status} - ${responseText}`)
    }
    
    // Parse the created property
    const propertyData = JSON.parse(responseText)
    console.log('Parsed property data:', propertyData)
    
    if (!propertyData.id) {
      throw new Error('Property created but no ID returned from server')
    }

    const propertyId = propertyData.id.toString()
    console.log('Created property ID:', propertyId)

    // Step 2: Upload images if there are any
    if (images.length > 0) {
      console.log('Uploading images for property:', propertyId)
      for (const imageData of images) {
        await this.uploadPropertyImage(propertyId, imageData.file, imageData.is_primary)
      }
    } else {
      console.log('No images to upload')
    }

    // Step 3: Return the transformed property data immediately
    return {
      id: propertyId,
      name: propertyData.name || data.name,
      description: propertyData.description || data.description,
      address: propertyData.address || data.address,
      city: propertyData.city || data.city,
      price: safeParseFloat(propertyData.price) || data.price,
      bedrooms: propertyData.number_of_rooms || data.number_of_rooms,
      squareMeters: safeParseFloat(propertyData.size) || data.size,
      type: propertyData.property_type || data.property_type,
      status: 'active',
      images: transformImages(propertyData.images || []),
      seller: {
        id: propertyData.seller?.toString() || 'unknown',
        name: propertyData.seller_name || 'Current User',
        email: propertyData.seller_email || '',
        phone: propertyData.seller_phone || '',
      },
      createdAt: propertyData.created_at || new Date().toISOString(),
      updatedAt: propertyData.updated_at || new Date().toISOString(),
      inWishlist: propertyData.in_wishlist || false,
    }
  } catch (error) {
    console.error('Error creating property:', error)
    throw error
  }
}


,




 // Add this to your lib/api/properties.ts
async updateProperty(id: string, data: any): Promise<Property> {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE_URL}/properties/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        price: data.price.toString(),
        number_of_rooms: data.bedrooms, // Map bedrooms to number_of_rooms
        size: data.squareMeters.toString(), // Map squareMeters to size
        property_type: data.type,
        is_available: data.status === 'active',
      }),
    })
    
    const responseText = await response.text()
    
    if (!response.ok) {
      console.error('API Error Response:', responseText)
      throw new Error(`Failed to update property: ${response.status} - ${responseText}`)
    }
    
    const property = JSON.parse(responseText)
    console.log('Property updated:', property)
    
    // Transform the response
    return {
      id: property.id.toString(),
      name: property.name,
      description: property.description,
      address: property.address,
      city: property.city,
      price: safeParseFloat(property.price),
      bedrooms: property.number_of_rooms,
      squareMeters: safeParseFloat(property.size),
      type: property.property_type,
      status: property.is_available ? 'active' : 'inactive',
      images: transformImages(property.images || []),
      seller: {
        id: property.seller?.toString() || 'unknown',
        name: property.seller_name || 'Current User',
        email: property.seller_email || '',
        phone: property.seller_phone || '',
      },
      createdAt: property.created_at,
      updatedAt: property.updated_at,
      inWishlist: property.in_wishlist || false,
    }
  } catch (error) {
    console.error('Error updating property:', error)
    throw error
  }
},

  async deleteProperty(id: string): Promise<void> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete property: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error deleting property:', error)
      throw error
    }
  },




  async getFeaturedProperties(): Promise<Property[]> {
    // For now, just get all properties and return first few as featured
    const properties = await this.getProperties()
    return properties.slice(0, 3)
  },

  async getMyProperties(): Promise<Property[]> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/my-properties/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user properties: ${response.statusText}`)
      }
      
      const properties = await response.json()
      
      // Transform the backend response
      return properties.map((property: any) => ({
        id: property.id.toString(),
        name: property.name,
        description: property.description,
        address: property.address,
        city: property.city,
        price: safeParseFloat(property.price),
        bedrooms: property.number_of_rooms,
        squareMeters: safeParseFloat(property.size),
        type: property.property_type,
        status: property.is_available ? 'active' : 'inactive',
        images: transformImages(property.images || []),
        seller: {
          id: property.seller.toString(),
          name: property.seller_name || 'Current User',
          email: property.seller_email,
          phone: property.seller_phone,
        },
        createdAt: property.created_at,
        updatedAt: property.updated_at,
        inWishlist: property.in_wishlist || false,
      }))
    } catch (error) {
      console.error('Error fetching user properties:', error)
      throw error
    }
  },

  async toggleWishlist(propertyId: string): Promise<WishlistResponse> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/wishlist/toggle/${propertyId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.status === 401) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        throw new Error('Authentication expired')
      }
      
      if (!response.ok) {
        throw new Error(`Failed to toggle wishlist: ${response.statusText}`)
      }
      
      return response.json()
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      throw error
    }
  },

  async checkWishlistStatus(propertyId: string): Promise<{ in_wishlist: boolean }> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        return { in_wishlist: false }
      }

      const response = await fetch(`${API_BASE_URL}/properties/wishlist/check/${propertyId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        return { in_wishlist: false }
      }
      
      return response.json()
    } catch (error) {
      console.error('Error checking wishlist status:', error)
      return { in_wishlist: false }
    }
  },
 
async getWishlist(): Promise<Property[]> {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE_URL}/properties/wishlist/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch wishlist: ${response.statusText}`)
    }
    
    const wishlistItems = await response.json()
    
    // Transform the wishlist response to match your Property type
    return wishlistItems.map((item: any) => {
      const property = item.property_details || item.property
      return {
        id: property.id.toString(),
        name: property.name,
        description: property.description,
        address: property.address,
        city: property.city,
        price: safeParseFloat(property.price),
        bedrooms: property.number_of_rooms,
        squareMeters: safeParseFloat(property.size),
        type: property.property_type,
        status: property.is_available ? 'active' : 'inactive',
        images: transformImages(property.images || []),
        seller: {
          id: property.seller?.toString() || 'unknown',
          name: property.seller_name || '',
          email: property.seller_email || '',
          phone: property.seller_phone || '',
        },
        createdAt: property.created_at,
        updatedAt: property.updated_at,
        inWishlist: true, // Always true since these are from wishlist
      }
    })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    throw error
  }
}


, 
 

async deletePropertyImage(imageId: string): Promise<void> {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE_URL}/properties/images/${imageId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      // Log more details for debugging
      console.error(`Delete image failed with status: ${response.status}`)
      const errorText = await response.text()
      throw new Error(`Failed to delete image: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.error('Error deleting property image:', error)
    throw error
  }
} 

,
 // lib/api/properties.ts - Update the setPrimaryImage method
async setPrimaryImage(propertyId: string, imageId: string): Promise<void> {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Not authenticated')
    }

    // Use the correct endpoint that matches your backend
    const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/images/${imageId}/set_primary/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Set primary image failed:', errorText)
      throw new Error(`Failed to set primary image: ${response.status} - ${response.statusText}`)
    }
    
    return response.json()
  } catch (error) {
    console.error('Error setting primary image:', error)
    throw error
  }
},
}