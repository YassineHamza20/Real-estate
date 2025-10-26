import type { Property, PropertyFormData, PropertyFilters, PropertySearchResponse } from "@/types/property"

// Mock data
const mockProperties: Property[] = [
  {
    id: "1",
    name: "Modern Downtown Loft",
    description: "Beautiful modern loft in the heart of downtown with stunning city views.",
    address: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    price: 850000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1500,
    type: "apartment",
    status: "active",
    images: [
      { id: "1", url: "/modern-loft-interior.jpg", order: 0 },
      { id: "2", url: "/modern-kitchen.png", order: 1 },
    ],
    features: ["Hardwood Floors", "Updated Kitchen", "Central AC", "Smart Home"],
    yearBuilt: 2020,
    seller: {
      id: "1",
      name: "John Seller",
      email: "seller@example.com",
      phone: "+1234567890",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 245,
    isFeatured: true,
  },
  {
    id: "2",
    name: "Suburban Family Home",
    description: "Spacious family home with large backyard, perfect for growing families.",
    address: "456 Oak Avenue",
    city: "Austin",
    state: "TX",
    zipCode: "78701",
    price: 625000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2800,
    lotSize: 8000,
    type: "house",
    status: "active",
    images: [
      { id: "3", url: "/suburban-house.png", order: 0 },
      { id: "4", url: "/spacious-living-room.png", order: 1 },
    ],
    features: ["Pool", "Garage", "Garden", "Fireplace", "Laundry Room"],
    yearBuilt: 2015,
    seller: {
      id: "2",
      name: "Jane Realtor",
      email: "jane@example.com",
      phone: "+1987654321",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 189,
    isFeatured: true,
  },
]

export const propertiesApi = {
  async getProperties(filters?: PropertyFilters): Promise<PropertySearchResponse> {
    // TODO: Replace with actual API call
    // const queryParams = new URLSearchParams(filters as any).toString();
    // return apiClient.get<PropertySearchResponse>(`/properties/?${queryParams}`);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 800))
    let filtered = [...mockProperties]

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.city.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search),
      )
    }

    if (filters?.city) {
      filtered = filtered.filter((p) => p.city.toLowerCase() === filters.city?.toLowerCase())
    }

    if (filters?.minPrice) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!)
    }

    if (filters?.maxPrice) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!)
    }

    if (filters?.bedrooms) {
      filtered = filtered.filter((p) => p.bedrooms >= filters.bedrooms!)
    }

    if (filters?.type) {
      filtered = filtered.filter((p) => p.type === filters.type)
    }

    return {
      properties: filtered,
      total: filtered.length,
      page: filters?.page || 1,
      totalPages: Math.ceil(filtered.length / (filters?.limit || 10)),
    }
  },

  async getProperty(id: string): Promise<Property> {
    // TODO: Replace with actual API call
    // return apiClient.get<Property>(`/properties/${id}/`);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 500))
    const property = mockProperties.find((p) => p.id === id)
    if (!property) throw new Error("Property not found")
    return property
  },

  async createProperty(data: PropertyFormData): Promise<Property> {
    // TODO: Replace with actual API call
    // const formData = new FormData();
    // Object.entries(data).forEach(([key, value]) => {
    //   if (key === 'images') {
    //     value.forEach((file: File) => formData.append('images', file));
    //   } else {
    //     formData.append(key, String(value));
    //   }
    // });
    // return apiClient.uploadFile<Property>('/properties/', formData);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 1500))
    const newProperty: Property = {
      id: String(Date.now()),
      ...data,
      status: "draft",
      images: data.images.map((_, i) => ({
        id: String(i),
        url: "/modern-house-exterior.png",
        order: i,
      })),
      seller: {
        id: "1",
        name: "Current User",
        email: "user@example.com",
        phone: "+1234567890",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      isFeatured: false,
    }
    return newProperty
  },

  async updateProperty(id: string, data: Partial<PropertyFormData>): Promise<Property> {
    // TODO: Replace with actual API call
    // return apiClient.patch<Property>(`/properties/${id}/`, data, true);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const property = mockProperties.find((p) => p.id === id)
    if (!property) throw new Error("Property not found")
    return { ...property, ...data, updatedAt: new Date().toISOString() }
  },

  async deleteProperty(id: string): Promise<void> {
    // TODO: Replace with actual API call
    // await apiClient.delete(`/properties/${id}/`, true);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 500))
  },

  async getFeaturedProperties(): Promise<Property[]> {
    // TODO: Replace with actual API call
    // return apiClient.get<Property[]>('/properties/featured/');

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 600))
    return mockProperties.filter((p) => p.isFeatured)
  },

  async getMyProperties(): Promise<Property[]> {
    // TODO: Replace with actual API call
    // return apiClient.get<Property[]>('/properties/my-properties/', true);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 600))
    const userStr = localStorage.getItem("user")
    if (!userStr) throw new Error("Not authenticated")
    const user = JSON.parse(userStr)

    // Get properties from localStorage or return empty array
    const propertiesStr = localStorage.getItem(`properties_${user.id}`)
    if (!propertiesStr) return []
    return JSON.parse(propertiesStr)
  },
}
