"use client"

import { useState, useEffect, useRef } from "react"
import { PropertyCard } from "@/components/property-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { propertiesApi } from "@/lib/api/properties"
import type { Property } from "@/types/property"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, MapPin, Euro, Ruler, Home, Search, RefreshCw, Zap, Filter, Target, Building, Bed } from "lucide-react"

// ─────────────────────────────────────
// CONFIG
// ─────────────────────────────────────
type FilterType = "comprehensive" | "location" | "price" | "size" | "type"

const FILTERS = [
  { key: "comprehensive" as const, label: "Smart Match", icon: Sparkles },
  { key: "location" as const,      label: "Same Area",  icon: MapPin },
  { key: "price" as const,         label: "Similar Price", icon: Euro },
  { key: "size" as const,          label: "Similar Size",  icon: Ruler },
  { key: "type" as const,          label: "Same Type",     icon: Home },
] as const

const THRESHOLDS = [
  { value: 30, label: "Relaxed", color: "from-gray-500 to-gray-600" },
  { value: 40, label: "Balanced", color: "from-blue-500 to-blue-600" },
  { value: 50, label: "Strict", color: "from-orange-500 to-orange-600" },
  { value: 60, label: "Elite", color: "from-primary to-primary/90" },
] as const

// ─────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────
export function SimilarProperties({ currentProperty, className = "" }: { currentProperty: Property; className?: string }) {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [noResults, setNoResults] = useState(false)
  const [filter, setFilter] = useState<FilterType>("comprehensive")
  const [threshold, setThreshold] = useState(40)
  const [isMounted, setIsMounted] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const calculateSimilarity = (p: Property) => {
    let score = 0
    const breakdown = {
      location: 0,
      price: 0,
      size: 0,
      type: 0,
      bedrooms: 0
    }

    if (p.city === currentProperty.city) {
      score += 30
      breakdown.location = 30
    }

    const priceDiff = Math.abs(p.price - currentProperty.price) / currentProperty.price
    if (priceDiff <= 0.1) {
      score += 25
      breakdown.price = 25
    } else if (priceDiff <= 0.2) {
      score += 20
      breakdown.price = 20
    } else if (priceDiff <= 0.3) {
      score += 15
      breakdown.price = 15
    } else if (priceDiff <= 0.5) {
      score += 10
      breakdown.price = 10
    }

    const sizeDiff = Math.abs(p.squareMeters - currentProperty.squareMeters) / currentProperty.squareMeters
    if (sizeDiff <= 0.1) {
      score += 20
      breakdown.size = 20
    } else if (sizeDiff <= 0.2) {
      score += 15
      breakdown.size = 15
    } else if (sizeDiff <= 0.3) {
      score += 10
      breakdown.size = 10
    }

    if (p.type === currentProperty.type) {
      score += 15
      breakdown.type = 15
    }

    if (p.bedrooms === currentProperty.bedrooms) {
      score += 10
      breakdown.bedrooms = 10
    } else if (Math.abs(p.bedrooms - currentProperty.bedrooms) === 1) {
      score += 5
      breakdown.bedrooms = 5
    }

    return {
      total: Math.min(100, score),
      breakdown
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-primary text-primary-foreground"
    if (score >= 60) return "bg-primary/90 text-primary-foreground"
    if (score >= 40) return "bg-orange-500 text-white"
    return "bg-muted text-muted-foreground"
  }

  const fetchSimilarProperties = async (type: FilterType = filter) => {
    if (!isMounted) return
    
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    try {
      setIsLoading(true)
      setNoResults(false)

      const filters: any = { exclude: currentProperty.id }
      
      switch (type) {
        case "location":
          filters.city = currentProperty.city
          break
        case "price":
          const priceRange = currentProperty.price * 0.3
          filters.price_min = Math.round(Math.max(0, currentProperty.price - priceRange))
          filters.price_max = Math.round(currentProperty.price + priceRange)
          break
        case "size":
          const sizeRange = currentProperty.squareMeters * 0.3
          filters.size_min = Math.round(Math.max(0, currentProperty.squareMeters - sizeRange))
          filters.size_max = Math.round(currentProperty.squareMeters + sizeRange)
          break
        case "type":
          filters.property_type = currentProperty.type
          break
        case "comprehensive":
          filters.city = currentProperty.city
          const comprehensivePriceRange = currentProperty.price * 0.5
          filters.price_min = Math.round(Math.max(0, currentProperty.price - comprehensivePriceRange))
          filters.price_max = Math.round(currentProperty.price + comprehensivePriceRange)
          break
      }

      const data = await propertiesApi.getProperties(filters, { signal: ctrl.signal })

      if (!isMounted) return

      const ranked = data
        .filter(p => p.id !== currentProperty.id)
        .map(p => ({ property: p, similarity: calculateSimilarity(p) }))
        .sort((a, b) => b.similarity.total - a.similarity.total)

      const aboveThreshold = ranked.filter(x => x.similarity.total >= threshold)
      const final = (aboveThreshold.length > 0 ? aboveThreshold : ranked)
        .slice(0, 3)
        .map(x => x.property)

      setProperties(final)
      setNoResults(final.length === 0)
    } catch (err: any) {
      if (isMounted && err.name !== "AbortError") {
        console.error("Error fetching similar properties:", err)
        setNoResults(true)
      }
    } finally {
      if (isMounted) {
        setIsLoading(false)
      }
    }
  }

  // Initialize component
  useEffect(() => {
    setIsMounted(true)
    return () => {
      setIsMounted(false)
      abortRef.current?.abort()
    }
  }, [])

  // Fetch when current property or threshold changes
  useEffect(() => {
    if (isMounted) {
      fetchSimilarProperties()
    }
  }, [currentProperty.id, threshold, isMounted])

  // Fetch when filter changes (only if not currently loading)
  useEffect(() => {
    if (isMounted && !isLoading) {
      fetchSimilarProperties(filter)
    }
  }, [filter])

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter)
  }

  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold)
  }

  // Don't render anything if not mounted (prevents Leaflet errors)
  if (!isMounted) {
    return null
  }

  if (isLoading) {
    return (
      <section className={`mt-12 ${className}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-card-foreground">Similar Properties</h2>
              <p className="text-muted-foreground">Finding the best matches for you...</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="h-48 rounded-xl bg-muted/50 border border-border" />
                <div className="space-y-3">
                  <div className="h-5 rounded-full bg-muted/50 w-3/4" />
                  <div className="h-4 rounded-full bg-muted/50 w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-6 rounded-full bg-muted/50 w-16" />
                    <div className="h-6 rounded-full bg-muted/50 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (noResults) {
    return (
      <section className={`mt-12 ${className}`}>
        <div className="text-center py-12 rounded-xl border border-border bg-card/50">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto rounded-xl bg-muted/30 border border-border flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-card-foreground mb-3">No Similar Properties Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We couldn't find properties matching your criteria. Try adjusting the filters or similarity level.
          </p>
          
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {FILTERS.map((filterBtn) => (
              <Button
                key={filterBtn.key}
                onClick={() => handleFilterChange(filterBtn.key)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <filterBtn.icon className="h-4 w-4" />
                {filterBtn.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => fetchSimilarProperties()} 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              asChild
              variant="outline" 
              size="lg"
            >
              <a href="/properties">
                <Search className="h-4 w-4 mr-2" />
                Browse All Properties
              </a>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  const hasFallbackMatches = properties.some(p => calculateSimilarity(p).total < threshold)

  return (
    <section className={`mt-12 ${className}`}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">Similar Properties</h2>
              <p className="text-muted-foreground text-sm">
                {hasFallbackMatches 
                  ? "Showing best available matches" 
                  : `Curated based on ${filter.replace('comprehensive', 'multiple criteria')}`}
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={filter === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange(key)}
                  className="gap-2 text-xs"
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </Button>
              ))}
            </div>

            {/* Enhanced Threshold Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground font-medium px-1">
                Match Level
              </label>
              <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border">
                {THRESHOLDS.map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => handleThresholdChange(value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      threshold === value
                        ? `bg-gradient-to-r ${color} text-white shadow-lg`
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Fallback Notice - Better Dark Mode Visibility */}
        {hasFallbackMatches && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-orange-100 border border-orange-200 dark:bg-orange-950/30 dark:border-orange-800"
          >
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <div className="text-sm">
                <strong className="text-orange-800 dark:text-orange-300">Showing Best Available Matches</strong>
                <span className="text-orange-700 dark:text-orange-400 ml-1">
                  - No properties meet your {threshold}% similarity criteria
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {properties.map((property, index) => {
              const similarity = calculateSimilarity(property)
              const scoreColor = getScoreColor(similarity.total)
              
              return (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="relative rounded-lg border border-border bg-card overflow-hidden shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/30">
                    
                    {/* Score Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <Badge className={`${scoreColor} font-bold text-xs px-2 py-1 shadow-lg border-0 flex items-center gap-1`}>
                        <Target className="h-3 w-3" />
                        {similarity.total}% Match
                      </Badge>
                    </div>

                    {/* Property Card */}
                    <PropertyCard 
                      property={property} 
                      viewMode="grid"
                      compact={true}
                    />

                    {/* Similarity Breakdown */}
                    <div className="p-3 bg-muted/20 border-t border-border">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Overall Similarity</span>
                          <span className="font-semibold text-foreground">{similarity.total}%</span>
                        </div>
                        
                        <div className="space-y-1">
                          {similarity.breakdown.location > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-green-500" />
                                <span className="text-foreground">Location</span>
                              </div>
                              <span className="font-medium text-foreground">+{similarity.breakdown.location}%</span>
                            </div>
                          )}
                          
                          {similarity.breakdown.price > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                <Euro className="h-3 w-3 text-blue-500" />
                                <span className="text-foreground">Price</span>
                              </div>
                              <span className="font-medium text-foreground">+{similarity.breakdown.price}%</span>
                            </div>
                          )}
                          
                          {similarity.breakdown.size > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1">
                                <Ruler className="h-3 w-3 text-purple-500" />
                                <span className="text-foreground">Size</span>
                              </div>
                              <span className="font-medium text-foreground">+{similarity.breakdown.size}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* CTA */}
        <div className="text-center pt-6">
          <Button 
            asChild 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-11 text-sm"
          >
            <a href="/properties">
              <Search className="h-4 w-4 mr-2" />
              View All Properties in {currentProperty.city}
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}