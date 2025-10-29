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
  property_type?: PropertyType // Changed from type
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
 
}

export interface PropertySearchResponse {
  properties: Property[]
  total: number
  page: number
  totalPages: number
}
