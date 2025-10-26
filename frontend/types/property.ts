export type PropertyType = "house" | "apartment" | "condo" | "townhouse" | "land" | "commercial"
export type PropertyStatus = "active" | "pending" | "sold" | "draft"

export interface Property {
  id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  price: number
  bedrooms: number
  bathrooms: number
  squareFeet: number
  lotSize?: number
  type: PropertyType
  status: PropertyStatus
  images: PropertyImage[]
  features: string[]
  yearBuilt?: number
  seller: {
    id: string
    name: string
    email: string
    phone: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
  views: number
  isFeatured: boolean
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
  state: string
  zipCode: string
  price: number
  bedrooms: number
  bathrooms: number
  squareFeet: number
  lotSize?: number
  type: PropertyType
  features: string[]
  yearBuilt?: number
  images: File[]
}

export interface PropertyFilters {
  search?: string
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  minSquareFeet?: number
  maxSquareFeet?: number
  type?: PropertyType
  status?: PropertyStatus
  page?: number
  limit?: number
}

export interface PropertySearchResponse {
  properties: Property[]
  total: number
  page: number
  totalPages: number
}
