// lib/api/analytics.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export interface AnalyticsData {
  period: string
  userGrowth: {
    total: number
    newUsers: number
    growthRate: number
    trend: 'up' | 'down' | 'stable'
  }
  propertyMetrics: {
    total: number
    active: number
    views: number
    conversionRate: number
  }
  revenue: {
    total: number
    projected: number
    growthRate: number
    trend: 'up' | 'down' | 'stable'
  }
  engagement: {
    avgSessionDuration: number
    bounceRate: number
    wishlistAdds: number
    pageViews: number
  }
  topProperties: Array<{
    id: string
    name: string
    views: number
    wishlists: number
    inquiries: number
    conversionRate: number
  }>
  userDemographics: {
    buyers: number
    sellers: number
    verifiedSellers: number
    topLocations: Array<{
      city: string
      users: number
      percentage: number
    }>
  }
}

export const analyticsApi = {
  async getAnalytics(timeRange: string): Promise<AnalyticsData> {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`${API_BASE_URL}/users/admin/analytics/?period=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`)
    }
    
    return response.json()
  },

  async getPropertyAnalytics(): Promise<any> {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`${API_BASE_URL}/users/admin/analytics/properties/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch property analytics: ${response.statusText}`)
    }
    
    return response.json()
  },

  async getUserAnalytics(): Promise<any> {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`${API_BASE_URL}/users/admin/analytics/users/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user analytics: ${response.statusText}`)
    }
    
    return response.json()
  }
}