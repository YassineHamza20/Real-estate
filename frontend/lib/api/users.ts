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
    
    // Return data as-is from Django - no mapping needed
    return data;
  },

  async updateProfile(profileData: any): Promise<UserProfile> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Only send fields that exist in your Django backend
    const backendData = {
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      email: profileData.email,
      phone_number: profileData.phone_number,
      // Remove bio, location, website since they don't exist
    };

    const response = await fetch(`${API_BASE_URL}/api/users/profile/`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Not authenticated');
      }
      throw new Error('Failed to update profile');
    }
    
    return response.json();
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

// lib/api/users.ts
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
}