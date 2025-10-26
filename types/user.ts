// types/user.ts
import type { User } from "./auth"

export interface VerificationRequest {
  id: string
  userId: string
  documentUrl: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  notes?: string
}

// Only extend with fields that actually exist in your backend
export interface UserProfile extends User {
 
  propertiesCount?: number;
  wishlistCount?: number;
}

export interface WishlistItem {
  id: string
  propertyId: string
  userId: string
  addedAt: string
  property: {
    id: string
    name: string
    price: number
    address: string
    city: string
    state: string
    images: string[]
    bedrooms: number
    bathrooms: number
    squareFeet: number
  }
}

export interface SavedSearch {
  id: string
  userId: string
  name: string
  filters: Record<string, any>
  createdAt: string
  notificationsEnabled: boolean
}