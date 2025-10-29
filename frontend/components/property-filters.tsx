"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { PropertyFilters as Filters } from "@/types/property"
import { PROPERTY_TYPES, BEDROOM_OPTIONS, BATHROOM_OPTIONS } from "@/lib/constants"

interface PropertyFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function PropertyFilters({ filters, onFiltersChange }: PropertyFiltersProps) {
  const updateFilter = (key: keyof Filters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by location or keyword..."
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="property_type ">Property Type</Label>
          <Select
            value={filters.property_type  || "all"}
            onValueChange={(value) => updateFilter("property_type", value === "all" ? undefined : value)}
          >
            <SelectTrigger id="property_type ">
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

        

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minPrice">Min Price</Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="$0"
              value={filters.minPrice || ""}
              onChange={(e) => updateFilter("minPrice", e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPrice">Max Price</Label>
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
