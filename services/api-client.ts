import { API_BASE_URL } from "@/lib/constants"

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("auth_token")
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = false, headers = {}, ...fetchOptions } = options

    const requestHeaders: HeadersInit = {
      "Content-Type": "application/json",
      ...headers,
    }

    if (requiresAuth) {
      const token = this.getAuthToken()
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers: requestHeaders,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(response.status, errorData.message || "An error occurred", errorData.errors)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(500, "Network error occurred")
    }
  }

  async get<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", requiresAuth })
  }

  async post<T>(endpoint: string, data?: any, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      requiresAuth,
    })
  }

  async put<T>(endpoint: string, data?: any, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      requiresAuth,
    })
  }

  async patch<T>(endpoint: string, data?: any, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      requiresAuth,
    })
  }

  async delete<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", requiresAuth })
  }

  async uploadFile<T>(endpoint: string, formData: FormData, requiresAuth = true): Promise<T> {
    const token = this.getAuthToken()
    const headers: HeadersInit = {}

    if (requiresAuth && token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(response.status, errorData.message || "Upload failed", errorData.errors)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(500, "Upload failed")
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
