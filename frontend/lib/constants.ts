export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export const PROPERTY_TYPES = ["house", "apartment",    ,"villa", "land", "commercial"] as const

 

export const PRICE_RANGES = [
  { label: "Under $100k", min: 0, max: 100000 },
  { label: "$100k - $250k", min: 100000, max: 250000 },
  { label: "$250k - $500k", min: 250000, max: 500000 },
  { label: "$500k - $750k", min: 500000, max: 750000 },
  { label: "$750k - $1M", min: 750000, max: 1000000 },
  { label: "Over $1M", min: 1000000, max: Number.POSITIVE_INFINITY },
] as const

export const BEDROOM_OPTIONS = [1, 2, 3, 4, 5, 6] as const
export const BATHROOM_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const

export const PROPERTY_FEATURES = [
  "Pool",
  "Garage",
  "Garden",
  "Fireplace",
  "Balcony",
  "Basement",
  "Hardwood Floors",
  "Updated Kitchen",
  "Central AC",
  "Walk-in Closet",
  "Laundry Room",
  "Security System",
  "Smart Home",
  "Solar Panels",
  "Gym",
  "Pet Friendly",
] as const
