// lib/api/users.ts
import type { UserProfile } from '@/types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const usersApi = {
  async getProfile(): Promise<UserProfile> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/users/profile/`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Not authenticated');
      }
      throw new Error('Failed to fetch profile');
    }
    
    const data = await response.json();
    return data;
  },

 

// lib/api/users.ts - Fixed updateProfile method
async updateProfile(profileData: any, profilePicture?: File): Promise<UserProfile> {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  console.log('🔄 updateProfile called with:', { profileData, hasProfilePicture: !!profilePicture });

  // ALWAYS use FormData to avoid content-type issues
  const formData = new FormData();
  
  // Append ALL profile data fields
  formData.append('first_name', profileData.first_name || '');
  formData.append('last_name', profileData.last_name || '');
  formData.append('email', profileData.email || '');
  formData.append('phone_number', profileData.phone_number || '');
  
  // Append profile picture if provided
  if (profilePicture) {
    formData.append('profile_picture', profilePicture);
  }

  // Debug FormData contents
  console.log('📦 FormData contents:');
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/profile/`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        // NO Content-Type header - let browser set it automatically
      },
      body: formData,
    });
    
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Not authenticated');
      }
      
      // Get detailed error message
      let errorMessage = `Failed to update profile (${response.status})`;
      try {
        const errorData = await response.json();
        console.log('❌ Backend error details:', errorData);
        errorMessage = errorData.detail || errorData.message || errorMessage;
        
        // Check for field-specific errors
        if (errorData.first_name) errorMessage = `First name: ${errorData.first_name[0]}`;
        else if (errorData.last_name) errorMessage = `Last name: ${errorData.last_name[0]}`;
        else if (errorData.phone_number) errorMessage = `Phone: ${errorData.phone_number[0]}`;
        else if (errorData.email) errorMessage = `Email: ${errorData.email[0]}`;
        else if (errorData.non_field_errors) errorMessage = errorData.non_field_errors[0];
        
      } catch (e) {
        console.log('❌ Could not parse error response:', e);
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    console.log('✅ Profile update successful:', result);
    return result;
    
  } catch (error: any) {
    console.error('🚨 Fetch error:', error);
    throw error;
  }
},



  async getVerificationStatus(): Promise<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/users/verification-status/`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Not authenticated');
      }
      throw new Error('Failed to fetch verification status');
    }
    
    return response.json();
  },

  async submitVerification(file: File): Promise<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('document', file);

    const response = await fetch(`${API_BASE_URL}/api/users/submit-verification/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to submit verification';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        // Ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  },

  async getSellerContact(sellerId: string): Promise<{
    id: string;
    name: string;
    email: string;
    phone: string;
    is_verified: boolean;
  }> {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`${API_BASE_URL}/api/users/seller/${sellerId}/contact/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch seller contact: ${response.statusText}`)
    }
    
    return response.json()
  },

  async deleteVerification(): Promise<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/users/submit-verification/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to delete verification document';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        // Ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    try {
      return await response.json();
    } catch {
      return { message: 'Document deleted' };
    }
  },

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role: 'buyer' | 'seller' | 'admin';
    phone_number: string;
    is_active: boolean;
    is_staff: boolean;
    email_verified: boolean;
  }): Promise<any> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/users/admin/create-user/`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to create user';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || errorMessage;
        
        // Handle field-specific errors
        if (errorData.username) errorMessage = `Username: ${errorData.username[0]}`;
        else if (errorData.email) errorMessage = `Email: ${errorData.email[0]}`;
        else if (errorData.password) errorMessage = `Password: ${errorData.password[0]}`;
        
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  },


async deleteUser(userId: number): Promise<any> {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('access_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/users/admin/users/${userId}/delete/`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      let errorMessage = 'Failed to delete user';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  },


}