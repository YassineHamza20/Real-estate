export type PropertyType = "house" | "apartment"   | "land" | "commercial"
export type PropertyStatus = "active" | "inactive" | "draft" // Make sure this includes "inactive"

export interface Property {
  id: string
  name: string
  description: string
  address: string
  city: string
  price: number
  bedrooms: number
  priceRange?: {
    min?: number
    max?: number
  }
  squareMeters: number
  type: PropertyType
  status: PropertyStatus
  images: PropertyImage[]
  seller: {
    id: string
    name: string
    email?: string  // Add optional email
    phone?: string  // Add optional phone
  }
  createdAt: string
  updatedAt: string
  inWishlist: boolean
}

 
export interface PropertyImage {
  id: string
  url: string
  caption?: string
  order: number
   is_primary: boolean
}

export interface PropertyFormData {
  name: string
  description: string
  address: string
  city: string
  price: number
  bedrooms: number
  squareMeters: number // Changed from squareFeet
  type: PropertyType
  images: File[]
  status?: PropertyStatus // Added status for updates
 is_available: boolean;
}

export interface PropertyFilters {
  search?: string
  city?: string
  property_type?: PropertyType // This is what your backend expects
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  // Add these missing properties that your component uses:
  priceRange?: {
    min?: number
    max?: number
  }
  type?: PropertyType // Your component uses this, but it should map to property_type
}

export interface PropertySearchResponse {
  properties: Property[]
  total: number
  page: number
  totalPages: number
}
