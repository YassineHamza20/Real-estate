// Admin-specific properties API functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
export const adminPropertiesApi = {
  async getProperties(search?: string, typeFilter?: string, cityFilter?: string, statusFilter?: string): Promise<any[]> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Build query parameters for admin
      const queryParams = new URLSearchParams()
      
      if (search) {
        queryParams.append('search', search)
      }
      if (typeFilter && typeFilter !== 'all') {
        queryParams.append('property_type', typeFilter)
      }
      if (cityFilter && cityFilter !== 'all') {
        queryParams.append('city', cityFilter)
      }
      if (statusFilter && statusFilter !== 'all') {
        queryParams.append('status', statusFilter) // 'active' or 'inactive'
      }

      const response = await fetch(`${API_BASE_URL}/properties/admin/properties/?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch admin properties: ${response.statusText}`)
      }
      
      const properties = await response.json()
      
      // Return raw data for admin dashboard (no transformation needed)
      return properties
    } catch (error) {
      console.error('Error fetching admin properties:', error)
      throw error
    }
  },

  async getPropertyStats(): Promise<any> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/admin/properties/stats/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        // Fallback: calculate stats from properties
        console.log("Admin stats endpoint failed, calculating from properties...")
        const properties = await this.getProperties()
        
        const totalProperties = properties.length
        const activeProperties = properties.filter((p: any) => p.is_available).length
        const recentProperties = properties.filter((p: any) => {
          const oneWeekAgo = new Date()
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
          return new Date(p.created_at) > oneWeekAgo
        }).length
        
        return {
          total_properties: totalProperties,
          active_properties: activeProperties,
          inactive_properties: totalProperties - activeProperties,
          recent_properties: recentProperties
        }
      }
      
      return response.json()
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      // Return default values
      return {
        total_properties: 0,
        active_properties: 0,
        inactive_properties: 0,
        recent_properties: 0
      }
    }
  },

  async getPropertyFilters(): Promise<any> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/admin/properties/filters/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        // Fallback to public filters
        console.log("Admin filters endpoint failed, using public filters...")
        const publicResponse = await fetch(`${API_BASE_URL}/properties/filters/options/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (publicResponse.ok) {
          const publicData = await publicResponse.json()
          return {
            cities: publicData.cities || [],
            property_types: publicData.property_types || [],
            sellers: [],
            price_ranges: { min: 0, max: 0, avg: 0 }
          }
        }
        
        throw new Error(`Failed to fetch filters: ${response.status}`)
      }
      
      return response.json()
    } catch (error) {
      console.error('Error fetching admin filters:', error)
      // Return default values
      return {
        cities: [],
        property_types: ['house', 'apartment', 'villa', 'land', 'commercial'],
        sellers: [],
        price_ranges: { min: 0, max: 0, avg: 0 }
      }
    }
  },

  async updateProperty(propertyId: number, propertyData: any): Promise<any> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/admin/properties/${propertyId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(propertyData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to update property: ${response.status}`)
      }
      
      return response.json()
    } catch (error) {
      console.error('Error updating admin property:', error)
      throw error
    }
  },

  async deleteProperty(propertyId: number): Promise<void> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/admin/properties/${propertyId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete property: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting admin property:', error)
      throw error
    }
  },

  async bulkPropertyAction(propertyIds: number[], action: 'activate' | 'deactivate' | 'delete'): Promise<void> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/properties/admin/properties/bulk-action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          property_ids: propertyIds,
          action: action
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} properties`)
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      throw error
    }
  }
}