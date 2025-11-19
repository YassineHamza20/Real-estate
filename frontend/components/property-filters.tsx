// components/property-filters.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Search, X, History, Trash2 } from "lucide-react"
import type { PropertyFilters as Filters, PropertyType } from "@/types/property"
import { PROPERTY_TYPES, BEDROOM_OPTIONS } from "@/lib/constants"
import { useState, useEffect, useRef } from "react"

interface PropertyFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

// German cities
const cities = [
  "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", 
  "Stuttgart", "Düsseldorf", "Dortmund", "Essen", "Leipzig"
]

export function PropertyFilters({ filters, onFiltersChange, searchQuery, onSearchChange }: PropertyFiltersProps) {
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('propertySearchHistory')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('propertySearchHistory', JSON.stringify(searchHistory))
  }, [searchHistory])

  const updateFilter = (key: keyof Filters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    onFiltersChange(newFilters)
  }

  const handlePriceRangeChange = (min: number, max: number) => {
    onFiltersChange({
      ...filters,
      priceRange: { min, max }
    })
  }

  const handleSearch = (query: string) => {
    onSearchChange(query)
    
    // Add to search history if not empty and not already in history
    if (query.trim() && !searchHistory.includes(query.trim())) {
      const newHistory = [query.trim(), ...searchHistory.slice(0, 4)] // Keep only last 5 searches
      setSearchHistory(newHistory)
    }
    
    setShowHistory(false)
  }

  const clearSearch = () => {
    onSearchChange("")
    setShowHistory(false)
  }

  const clearFilters = () => {
    onFiltersChange({})
    onSearchChange("")
    setShowHistory(false)
  }

  const clearSearchHistory = () => {
    setSearchHistory([])
    setShowHistory(false)
  }

  const removeFromHistory = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSearchHistory(prev => prev.filter(query => query !== queryToRemove))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar with History */}
        <div className="space-y-2 relative">
          <Label htmlFor="search">Search Properties</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={inputRef}
              id="search"
              type="text"
              placeholder="Search by name, location, description..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery)
                }
              }}
              className="pl-10 pr-20"
            />
            
            {/* Search History Button */}
            {searchHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="absolute right-10 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <History className="h-4 w-4" />
              </Button>
            )}
            
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Search History Dropdown */}
          {showHistory && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-background border border-border rounded-md shadow-lg z-10 mt-1 max-h-60 overflow-y-auto">
              <div className="p-2 border-b border-border flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Recent Searches
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearchHistory}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              {searchHistory.map((query, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => handleSearch(query)}
                >
                  <span className="text-sm flex items-center gap-2">
                    <Search className="h-3 w-3 text-muted-foreground" />
                    {query}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => removeFromHistory(query, e)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* City Filter - German cities */}
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Select
            value={filters.city || "all"}
            onValueChange={(value) => updateFilter("city", value === "all" ? undefined : value)}
          >
            <SelectTrigger id="city">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="property_type">Property Type</Label>
          <Select
            value={filters.property_type || "all"}
            onValueChange={(value) => updateFilter("property_type", value === "all" ? undefined : value)}
          >
            <SelectTrigger id="property_type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="capitalize">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-4">
          <Label>Price Range (€)</Label>
          <div className="space-y-4">
            <Slider
              value={[
                filters.priceRange?.min || 0,
                filters.priceRange?.max || 2000000
              ]}
              onValueChange={([min, max]) => handlePriceRangeChange(min, max)}
              max={2000000}
              step={10000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>€{(filters.priceRange?.min || 0).toLocaleString()}</span>
              <span>€{(filters.priceRange?.max || 2000000).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Min/Max price inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minPrice">Min Price (€)</Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="€0"
              value={filters.minPrice || ""}
              onChange={(e) => updateFilter("minPrice", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPrice">Max Price (€)</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="Any"
              value={filters.maxPrice || ""}
              onChange={(e) => updateFilter("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Select
            value={filters.bedrooms?.toString() || "all"}
            onValueChange={(value) => updateFilter("bedrooms", value === "all" ? undefined : Number(value))}
          >
            <SelectTrigger id="bedrooms">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              {BEDROOM_OPTIONS.map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num}+ Beds
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
          Clear All Filters
        </Button>
      </CardContent>
    </Card>
  )
}