// lib/api/auth.ts
import type {
  AuthResponse,
  LoginData,
  RegisterData,
  PasswordResetRequest,
  PasswordResetConfirm,
  User,
} from '@/types/auth';
import type { UserProfile } from '@/types/user';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const authApi = {
  async register(userData: RegisterData): Promise<AuthResponse> {
    // Match exactly what your Django serializer expects
    const requestData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      password2: userData.confirmPassword, // Use confirmPassword as password2
      first_name: userData.firstName,
      last_name: userData.lastName,
      phone_number: userData.phone,
      role: userData.role,
    };

    console.log('Sending registration data:', requestData);

    const response = await fetch(`${API_BASE_URL}/api/users/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('Backend validation errors:', errorData);
      
      // Handle specific field errors from Django
      if (errorData.username) {
        throw new Error(errorData.username.join(', '));
      }
      if (errorData.email) {
        throw new Error(errorData.email.join(', '));
      }
      if (errorData.password) {
        throw new Error(errorData.password.join(', '));
      }
      if (errorData.password2) {
        throw new Error(errorData.password2.join(', '));
      }
      if (errorData.non_field_errors) {
        throw new Error(errorData.non_field_errors.join(', '));
      }
      
      // If no specific field errors, use detail or generic message
      throw new Error(errorData.detail || 'Registration failed');
    }
    
    return response.json();
  },


async confirmEmail(uid: string, token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/confirm-email/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.token || errorData.uid || errorData.detail || 'Email confirmation failed');
    }
    
    const responseData = await response.json();
    
    // Store tokens for automatic login
    if (responseData.access) {
      localStorage.setItem('auth_token', responseData.access);
      if (responseData.refresh) {
        localStorage.setItem('refresh_token', responseData.refresh);
      }
      // Store user data
      localStorage.setItem('user', JSON.stringify(responseData.user));
    }
    
    return responseData;
  },

// lib/api/auth.ts
async resendConfirmationEmail(email: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/resend-confirmation/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      // Try to parse error as JSON first
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Failed to resend confirmation email');
      } catch (jsonError) {
        // If not JSON, use status text
        throw new Error(`Failed to resend email: ${response.status} ${response.statusText}`);
      }
    }
    
    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error while resending confirmation email');
  }
},


  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/users/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: data.email,
        password: data.password 
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }
    
    const responseData = await response.json();
    if (responseData.access) {
      localStorage.setItem('auth_token', responseData.access);
      if (responseData.refresh) {
        localStorage.setItem('refresh_token', responseData.refresh);
      }
    }
    return responseData;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  async requestPasswordReset(data: PasswordResetRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/users/password-reset/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.error || 'Password reset request failed');
    }
    return response.json();
  },

  async confirmPasswordReset(data: PasswordResetConfirm): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/users/password-reset-confirm/${data.uid}/${data.token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        new_password: data.newPassword,
        confirm_password: data.confirmPassword,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.error || 'Password reset confirmation failed');
    }
    return response.json();
  },

  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch(`${API_BASE_URL}/api/users/profile/`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.error || 'Failed to fetch user');
    }
    return response.json();
  },
};

 

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
    
    // Return data as-is from Django, add frontend-specific fields
    return {
      ...data,
      propertiesCount: data.propertiesCount || 0,
      wishlistCount: data.wishlistCount || 0,
    };
  },

  async updateProfile(profileData: any): Promise<UserProfile> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Map to Django field names
    const backendData = {
      first_name: profileData.firstName || profileData.first_name,
      last_name: profileData.lastName || profileData.last_name,
      email: profileData.email,
      phone_number: profileData.phone || profileData.phone_number,
      bio: profileData.bio,
      location: profileData.location,
      website: profileData.website,
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
    
    const data = await response.json();
    return {
      ...data,
      propertiesCount: data.propertiesCount || 0,
      wishlistCount: data.wishlistCount || 0,
    };
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
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Not authenticated');
      }
      throw new Error('Failed to submit verification');
    }
    
    return response.json();
  },



  // lib/api/auth.ts
  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/users/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
    
    if (!response.ok) {
      throw new Error('Login failed')
    }
    
    return response.json()
  },

  async logout() {
    // Optional: Call backend logout if you have it
    // Otherwise just clear frontend tokens
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
  },

  async getCurrentUser() {
    const token = localStorage.getItem("access_token")
    if (!token) {
      throw new Error('No token found')
    }

    const response = await fetch(`${API_BASE_URL}/users/profile/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to get user data')
    }
    
    return response.json()
  },
}
