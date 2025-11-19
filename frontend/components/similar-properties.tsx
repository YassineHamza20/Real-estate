"use client"

import { useState, useEffect } from "react"
import { PropertyCard } from "@/components/property-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { propertiesApi } from "@/lib/api/properties"
import type { Property } from "@/types/property"
import { motion, AnimatePresence } from "framer-motion"
import { 
  RefreshCw, 
  MapPin, 
  Home, 
  Euro, 
  Ruler, 
  Bed, 
  Search, 
  Frown, 
  Filter,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  Building,
  ArrowRight,
  SlidersHorizontal
} from "lucide-react"

interface SimilarPropertiesProps {
  currentProperty: Property
  className?: string
}

type SimilarityFilter = "location" | "price" | "size" | "type" | "comprehensive"

export function SimilarProperties({ currentProperty, className = "" }: SimilarPropertiesProps) {
  const [similarProperties, setSimilarProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<SimilarityFilter>("comprehensive")
  const [hasNoSimilar, setHasNoSimilar] = useState(false)
  const [minSimilarity, setMinSimilarity] = useState(40)

  const calculateSimilarityScore = (property: Property): number => {
    let score = 0

    // 1. Location similarity (30 points)
    if (property.city === currentProperty.city) {
      score += 30
    }

    // 2. Price similarity (25 points)
    const priceDifference = Math.abs(property.price - currentProperty.price)
    const priceRatio = priceDifference / currentProperty.price
    if (priceRatio <= 0.1) score += 25
    else if (priceRatio <= 0.2) score += 20
    else if (priceRatio <= 0.3) score += 15
    else if (priceRatio <= 0.5) score += 10

    // 3. Size similarity (20 points)
    const sizeDifference = Math.abs(property.squareMeters - currentProperty.squareMeters)
    const sizeRatio = sizeDifference / currentProperty.squareMeters
    if (sizeRatio <= 0.1) score += 20
    else if (sizeRatio <= 0.2) score += 15
    else if (sizeRatio <= 0.3) score += 10

    // 4. Type similarity (15 points)
    if (property.type === currentProperty.type) {
      score += 15
    }

    // 5. Bedroom similarity (10 points)
    if (property.bedrooms === currentProperty.bedrooms) {
      score += 10
    } else if (Math.abs(property.bedrooms - currentProperty.bedrooms) === 1) {
      score += 5
    }

    return Math.min(100, score)
  }

  const getSimilarityBadge = (score: number) => {
    if (score >= 80) return { 
      label: "Perfect Match", 
      color: "bg-gradient-to-r from-primary to-primary/90",
      icon: <Sparkles className="h-3 w-3" />
    }
    if (score >= 60) return { 
      label: "Very Similar", 
      color: "bg-gradient-to-r from-orange-500 to-amber-500",
      icon: <Target className="h-3 w-3" />
    }
    if (score >= 40) return { 
      label: "Similar", 
      color: "bg-gradient-to-r from-amber-500 to-orange-500",
      icon: <TrendingUp className="h-3 w-3" />
    }
    return { 
      label: "Related", 
      color: "bg-gradient-to-r from-muted to-muted/80",
      icon: <Zap className="h-3 w-3" />
    }
  }

  const fetchSimilarProperties = async (type: SimilarityFilter = filterType) => {
    try {
      setIsLoading(true)
      setError(null)
      setHasNoSimilar(false)
      
      let filters: any = { exclude: currentProperty.id }
      
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
      
      const similar = await propertiesApi.getProperties(filters)
      
      const scoredProperties = similar
        .filter(property => property.id !== currentProperty.id)
        .map(property => ({
          property,
          similarityScore: calculateSimilarityScore(property)
        }))
        .sort((a, b) => b.similarityScore - a.similarityScore)
      
      const filteredBySimilarity = scoredProperties.filter(item => item.similarityScore >= minSimilarity)
      
      if (filteredBySimilarity.length === 0 && scoredProperties.length > 0) {
        const fallbackProperties = scoredProperties.slice(0, 3).map(item => item.property)
        setSimilarProperties(fallbackProperties)
        setHasNoSimilar(false)
      } else {
        const finalProperties = (filteredBySimilarity.length > 0 ? filteredBySimilarity : scoredProperties)
          .slice(0, 3)
          .map(item => item.property)
        
        setSimilarProperties(finalProperties)
        setHasNoSimilar(finalProperties.length === 0)
      }
      
    } catch (err) {
      console.error("Error fetching similar properties:", err)
      setError("Failed to load similar properties")
      setHasNoSimilar(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSimilarProperties()
  }, [currentProperty, minSimilarity])

  const filterButtons = [
    { 
      key: "comprehensive" as SimilarityFilter, 
      label: "Smart Match", 
      icon: <Sparkles className="h-4 w-4" />,
      description: "AI-powered matching"
    },
    { 
      key: "location" as SimilarityFilter, 
      label: "Same Location", 
      icon: <MapPin className="h-4 w-4" />,
      description: currentProperty.city
    },
    { 
      key: "price" as SimilarityFilter, 
      label: "Similar Budget", 
      icon: <Euro className="h-4 w-4" />,
      description: `±30% of ${currentProperty.price.toLocaleString()}€`
    },
    { 
      key: "size" as SimilarityFilter, 
      label: "Similar Size", 
      icon: <Ruler className="h-4 w-4" />,
      description: `±30% of ${currentProperty.squareMeters}m²`
    },
    { 
      key: "type" as SimilarityFilter, 
      label: "Same Category", 
      icon: <Building className="h-4 w-4" />,
      description: currentProperty.type
    },
  ]

  const similarityThresholds = [
    { value: 30, label: "Broad", level: "30%+", color: "from-blue-400 to-cyan-500" },
    { value: 40, label: "Balanced", level: "40%+", color: "from-primary/80 to-primary/60" },
    { value: 50, label: "Specific", level: "50%+", color: "from-orange-500 to-amber-500" },
    { value: 60, label: "Exact", level: "60%+", color: "from-primary to-primary/90" },
  ]

  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-12 ${className}`}
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-lg p-8">
          {/* Background with your theme colors */}
          <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-accent/5" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-primary/5 to-accent/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
          
          <div className="relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-card-foreground">
                  Finding Your Matches
                </h3>
                <p className="text-muted-foreground mt-1">Discovering properties tailored to your preferences...</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-4"
                >
                  <Skeleton className="h-52 w-full rounded-xl bg-gradient-to-br from-muted to-muted/50 animate-pulse border border-border" />
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-3/4 rounded-full bg-gradient-to-r from-muted to-muted/50" />
                    <Skeleton className="h-4 w-1/2 rounded-full bg-gradient-to-r from-muted to-muted/50" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full bg-gradient-to-r from-muted to-muted/50" />
                      <Skeleton className="h-6 w-20 rounded-full bg-gradient-to-r from-muted to-muted/50" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (hasNoSimilar && similarProperties.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-12 ${className}`}
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-lg p-8">
          {/* Background with your theme colors */}
          <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-accent/5" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-primary/5 to-accent/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
          
          <div className="relative text-center py-12">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-muted to-accent/10 border border-border flex items-center justify-center mx-auto mb-6"
            >
              <Frown className="h-12 w-12 text-muted-foreground" />
            </motion.div>
            
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold mb-4 text-card-foreground"
            >
              No Matching Properties Found
            </motion.h3>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground mb-8 max-w-md mx-auto text-lg"
            >
              We couldn't find properties matching your current criteria. Try adjusting the filters or similarity level.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-3 justify-center mb-8"
            >
              {filterButtons.map((filter) => (
                <Button
                  key={filter.key}
                  onClick={() => {
                    setFilterType(filter.key)
                    fetchSimilarProperties(filter.key)
                  }}
                  variant="outline"
                  className="gap-2 rounded-lg bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {filter.icon}
                  {filter.label}
                </Button>
              ))}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                onClick={() => fetchSimilarProperties()} 
                className="gap-3 rounded-lg h-12 px-6 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105"
                size="lg"
              >
                <RefreshCw className="h-5 w-5" />
                Search Again
              </Button>
              <Button 
                onClick={() => window.location.href = '/properties'} 
                className="gap-3 rounded-lg h-12 px-6 bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                size="lg"
                variant="outline"
              >
                <Search className="h-5 w-5" />
                Browse All Properties
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-12 ${className}`}
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-lg p-8">
        {/* Background Elements using your theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-card via-background to-accent/5" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-primary/5 to-accent/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-accent/5 to-primary/5 rounded-full blur-3xl transform -translate-x-32 translate-y-32" />
        
        <div className="relative">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-8 gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-card-foreground">
                    Properties You Might Like
                  </h3>
                  <p className="text-muted-foreground text-lg mt-1">
                    {similarProperties.some(p => calculateSimilarityScore(p) < minSimilarity) 
                      ? "Showing the closest matches we found" 
                      : `Curated based on ${filterType.replace('comprehensive', 'multiple criteria')}`}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Controls Section */}
            <div className="flex flex-col gap-4">
              {/* Similarity Threshold Selector */}
              <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm text-foreground">Match Precision</span>
                </div>
                <div className="flex gap-2">
                  {similarityThresholds.map((threshold) => (
                    <button
                      key={threshold.value}
                      onClick={() => setMinSimilarity(threshold.value)}
                      className={`flex-1 text-xs py-2 px-3 rounded-lg transition-all border ${
                        minSimilarity === threshold.value
                          ? `bg-gradient-to-r ${threshold.color} text-primary-foreground shadow-lg border-transparent`
                          : "bg-background/50 border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <div className="font-medium">{threshold.label}</div>
                      <div className="text-xs opacity-75">{threshold.level}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {filterButtons.map((filter) => (
                  <motion.button
                    key={filter.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setFilterType(filter.key)
                      fetchSimilarProperties(filter.key)
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      filterType === filter.key
                        ? "bg-primary text-primary-foreground shadow-lg border-transparent"
                        : "bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {filter.icon}
                    {filter.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Info Banner */}
          {similarProperties.some(p => calculateSimilarityScore(p) < minSimilarity) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-5 bg-gradient-to-r from-accent/20 to-primary/20 rounded-lg border border-primary/20 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground">Showing Best Available Matches</h4>
                  <p className="text-muted-foreground text-sm mt-1">
                    No properties meet your {minSimilarity}% similarity criteria. We're showing the closest matches available.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Properties Grid */}
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarProperties.map((property, index) => {
                const similarityScore = calculateSimilarityScore(property)
                const similarityBadge = getSimilarityBadge(similarityScore)
                const isBelowThreshold = similarityScore < minSimilarity
                
                return (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.15 }}
                    className="group relative"
                  >
                    {/* Similarity Badge */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.2 }}
                      className="absolute top-4 left-4 z-20"
                    >
                      <Badge className={`${similarityBadge.color} px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border-0 flex items-center gap-1.5 ${
                        isBelowThreshold ? 'opacity-90' : ''
                      }`}>
                        {similarityBadge.icon}
                        {isBelowThreshold ? 'Best Match' : similarityBadge.label}
                      </Badge>
                    </motion.div>

                    {/* Score Indicator */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className={`px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm ${
                        isBelowThreshold 
                          ? 'bg-accent/80 text-accent-foreground border-primary/30' 
                          : 'bg-background/80 text-foreground border-border'
                      }`}>
                        {similarityScore}% Match
                      </div>
                    </div>

                    <motion.div
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={`relative overflow-hidden rounded-lg border bg-background/60 backdrop-blur-sm ${
                        isBelowThreshold ? 'border-primary/30 shadow-lg shadow-primary/10' : 'border-border shadow-lg shadow-muted/10'
                      } group-hover:shadow-xl group-hover:shadow-muted/20 transition-all duration-300`}
                    >
                      <PropertyCard 
                        property={property} 
                        viewMode="grid"
                        compact={true}
                      />

                      {/* Similarity Details */}
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-4 bg-gradient-to-r from-muted/20 to-accent/5 border-t border-border"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-4 text-muted-foreground">
                            {property.city === currentProperty.city && (
                              <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                                <MapPin className="h-3 w-3" />
                                Same Area
                              </span>
                            )}
                            {property.type === currentProperty.type && (
                              <span className="flex items-center gap-1 bg-accent/10 text-accent-foreground px-2 py-1 rounded-full border border-accent/20">
                                <Building className="h-3 w-3" />
                                Same Type
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>

          {/* CTA Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8 pt-6 border-t border-border/60"
          >
            <Button 
              onClick={() => window.location.href = '/properties'}
              className="gap-3 rounded-lg h-12 px-8 bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
              size="lg"
            >
              <Search className="h-5 w-5" />
              Explore More in {currentProperty.city}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}