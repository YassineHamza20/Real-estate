const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'



export interface SellerVerification {
  id: number
  user: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    role: string
    phone_number: string
    email_verified: boolean
    profile_picture: string | null
    profile_picture_url: string | null
    is_active: boolean
    is_staff: boolean
    is_superuser: boolean
    date_joined: string
    last_login: string | null
    created_at: string
    updated_at: string
    verification_status: string
  }
  document: string | null
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  admin_notes: string
}

// Keep your existing VerificationStats interface
export interface VerificationStats {
  total_verifications: number
  pending_verifications: number
  approved_verifications: number
  rejected_verifications: number
}

export interface VerificationStats {
  total_verifications: number
  pending_verifications: number
  approved_verifications: number
  rejected_verifications: number
}

// API functions
export const adminVerificationsApi = {
  


 
// In lib/api/adminVerifications.ts, update the getVerifications function:
async getVerifications(status?: string): Promise<SellerVerification[]> {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Not authenticated')
    }

    const params = new URLSearchParams()
    if (status && status !== 'all') {
      params.append('status', status)
    }

    const response = await fetch(`${API_BASE_URL}/users/admin/verifications/?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch verifications: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log("✅ Raw API data received:", data)
    
    // Transform the data to match our frontend structure
    return data.map((item: any) => {
      // Use user_details if available, otherwise use user object
      const userData = item.user_details || item.user || {}
      
      return {
        id: item.id,
        user: {
          id: userData.id || 0,
          username: userData.username || 'Unknown User',
          email: userData.email || 'No email',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          role: userData.role || 'buyer',
          profile_picture: userData.profile_picture || null,
          profile_picture_url: userData.profile_picture_url || userData.profile_picture || null,
          phone_number: userData.phone_number || 'Not provided',
          email_verified: userData.email_verified || false,
          is_active: userData.is_active !== undefined ? userData.is_active : true,
          date_joined: userData.date_joined || userData.created_at || new Date().toISOString(),
          created_at: userData.created_at || userData.date_joined || new Date().toISOString(),
          updated_at: userData.updated_at || new Date().toISOString(),
          verification_status: userData.verification_status || 'not_submitted'
        },
        document: item.document || null,
        status: item.status || 'pending',
        submitted_at: item.submitted_at || new Date().toISOString(),
        reviewed_at: item.reviewed_at || null,
        admin_notes: item.admin_notes || '',
      }
    })
  } catch (error) {
    console.error('Error fetching verifications:', error)
    throw error
  }
},


  async getVerificationStats(): Promise<VerificationStats> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/users/admin/verifications/stats/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        // Fallback: calculate stats from verifications
        console.log("Stats endpoint failed, calculating from verifications...")
        const verifications = await this.getVerifications()
        
        return {
          total_verifications: verifications.length,
          pending_verifications: verifications.filter(v => v.status === 'pending').length,
          approved_verifications: verifications.filter(v => v.status === 'approved').length,
          rejected_verifications: verifications.filter(v => v.status === 'rejected').length,
        }
      }
      
      const data = await response.json()
      console.log("📊 Stats data received:", data)
      
      return {
        total_verifications: data.total_verifications || 0,
        pending_verifications: data.pending_verifications || 0,
        approved_verifications: data.approved_verifications || 0,
        rejected_verifications: data.rejected_verifications || 0,
      }
    } catch (error) {
      console.error('Error fetching verification stats:', error)
      return {
        total_verifications: 0,
        pending_verifications: 0,
        approved_verifications: 0,
        rejected_verifications: 0
      }
    }
  },

  async updateVerification(verificationId: number, verificationData: { status: string; admin_notes?: string }): Promise<SellerVerification> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/users/admin/verifications/${verificationId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(verificationData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to update verification: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating verification:', error)
      throw error
    }
  },

  async bulkVerificationAction(verificationIds: number[], action: 'approve' | 'reject'): Promise<void> {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`${API_BASE_URL}/users/admin/verifications/bulk-action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          verification_ids: verificationIds,
          action: action
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} verifications`)
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      throw error
    }
  }
}