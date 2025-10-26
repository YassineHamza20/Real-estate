export interface DashboardStats {
  totalUsers: number
  totalProperties: number
  totalSales: number
  activeListings: number
  pendingVerifications: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: "user_registered" | "property_listed" | "property_sold" | "verification_requested"
  description: string
  timestamp: string
  userId?: string
  propertyId?: string
}

export interface AnalyticsData {
  userGrowth: ChartDataPoint[]
  propertyUploads: ChartDataPoint[]
  popularLocations: LocationData[]
  revenueData: ChartDataPoint[]
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface LocationData {
  city: string
  state: string
  count: number
  averagePrice: number
}

export interface AdminUser {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  isVerified: boolean
  createdAt: string
  propertiesCount: number
  status: "active" | "suspended" | "banned"
}
