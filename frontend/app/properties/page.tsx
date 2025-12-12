"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PropertyCard } from "@/components/property-card"
import { PropertyFilters } from "@/components/property-filters"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { propertiesApi } from "@/lib/api/properties"
import type { Property, PropertyFilters as Filters, PropertyType } from "@/types/property"
import { SlidersHorizontal, Grid3x3, List, Sparkles, LogIn } from "lucide-react"
import { Footer } from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import { motion, AnimatePresence } from "framer-motion"

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showFilters, setShowFilters] = useState(true)
  const [filters, setFilters] = useState<Filters>({})
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const { user, isAuthenticated } = useAuth()
  const observer = useRef<IntersectionObserver | null>(null)
  const lastPropertyRef = useRef<HTMLDivElement>(null)

  // --- Simple Load Properties Function ---
  const loadProperties = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setIsLoading(true)
    else setIsLoadingMore(true)

    try {
      // Transform filters to match backend API parameter names
      const apiFilters: any = {}

      // Add search query
      if (searchQuery.trim()) {
        apiFilters.search = searchQuery.trim()
      }

      // Add other filters - using the exact parameter names your backend expects
      if (filters.city) {
        apiFilters.city = filters.city
      }
      
      // Handle type filter - map 'type' to 'property_type' for backend
      if (filters.type) {
        apiFilters.property_type = filters.type
      }
      
      // Also check if property_type is set directly
      if (filters.property_type) {
        apiFilters.property_type = filters.property_type
      }

      if (filters.bedrooms) {
        apiFilters.bedrooms = filters.bedrooms
      }

      // Handle price range - your backend expects price_min and price_max
      if (filters.priceRange) {
        const { min, max } = filters.priceRange
        if (min !== undefined && min !== null && min > 0) {
          apiFilters.price_min = min
        }
        if (max !== undefined && max !== null && max > 0) {
          apiFilters.price_max = max
        }
      }

      // Also support direct minPrice/maxPrice (fallback)
      if (filters.minPrice) {
        apiFilters.price_min = filters.minPrice
      }
      if (filters.maxPrice) {
        apiFilters.price_max = filters.maxPrice
      }

      //console.log("🔍 Loading properties with filters:", apiFilters)

      const newProperties = await propertiesApi.getProperties(apiFilters)
      
      setProperties(prev => append ? [...prev, ...newProperties] : newProperties)
      setHasMore(newProperties.length === 9)
    } catch (error) {
      console.error("❌ Failed to load properties:", error)
      setProperties([])
      setHasMore(false)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [filters, searchQuery])

  // --- Initial Load & Filter/Search Change ---
  useEffect(() => {
    //console.log("🔄 Filters or search changed, reloading properties")
    setPage(1)
    loadProperties(1, false)
  }, [filters, searchQuery, loadProperties])

  // --- Infinite Scroll ---
  useEffect(() => {
    if (isLoading || isLoadingMore || !hasMore) return

    observer.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (lastPropertyRef.current) {
      observer.current.observe(lastPropertyRef.current)
    }

    return () => observer.current?.disconnect()
  }, [isLoading, isLoadingMore, hasMore, properties])

  // --- Load More on Page Change ---
  useEffect(() => {
    if (page > 1) {
      console.log("📄 Loading more properties, page:", page)
      loadProperties(page, true)
    }
  }, [page, loadProperties])

  // --- Clear All Filters ---
  const clearAllFilters = () => {
    console.log("🧹 Clearing all filters")
    setFilters({})
    setSearchQuery("")
    import("canvas-confetti").then(confetti => {
      confetti.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    })
  }

  // Get active filter count for badge
  const activeFilterCount = Object.keys(filters).filter(key => {
    if (key === 'priceRange') {
      return filters.priceRange && (filters.priceRange.min !== undefined || filters.priceRange.max !== undefined)
    }
    return filters[key as keyof Filters] !== undefined && filters[key as keyof Filters] !== ''
  }).length + (searchQuery ? 1 : 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background overflow-x-hidden">
      {/* Floating Orb Behind Filters */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{
            x: [0, -60, 0],
            y: [0, 80, 0],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-32 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/95 backdrop-blur-xl rounded-3xl border-2 border-border p-8 mb-10 shadow-2xl"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Browse Properties
              </h1>
              <p className="text-xl text-muted-foreground flex items-center gap-2">
                {isLoading ? (
                  <>Loading properties...</>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-primary" />
                    <strong>{properties.length}+</strong> homes available
                    {activeFilterCount > 0 && (
                      <span className="ml-2 text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full">
                        {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                      </span>
                    )}
                  </>
                )}
                {isAuthenticated && (
                  <span className="ml-4 inline-flex items-center gap-1 text-sm text-primary font-medium">
                    <LogIn className="h-4 w-4" />
                    Logged in
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted/50 backdrop-blur-sm rounded-xl border border-border">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-9 w-9 p-0 rounded-lg"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-9 w-9 p-0 rounded-lg"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Filters Toggle */}
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 font-semibold h-10 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all relative"
              >
                <motion.div
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </motion.div>
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:col-span-1"
              >
                <div className="sticky top-24 bg-card/95 backdrop-blur-xl rounded-3xl border-2 border-border p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">Refine Search</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-primary hover:text-primary/80"
                      disabled={activeFilterCount === 0}
                    >
                      Clear All
                    </Button>
                  </div>
                  <PropertyFilters 
                    filters={filters} 
                    onFiltersChange={setFilters}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Properties Grid */}
          <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            {isLoading ? (
              <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="space-y-4"
                  >
                    <Skeleton className="h-56 w-full rounded-2xl bg-muted/50 animate-pulse" />
                    <Skeleton className="h-5 w-3/4 rounded-full" />
                    <Skeleton className="h-4 w-1/2 rounded-full" />
                  </motion.div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-24 bg-card/95 backdrop-blur-xl rounded-3xl border-2 border-dashed border-border"
              >
                <div className="max-w-md mx-auto">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
                  >
                    <SlidersHorizontal className="h-10 w-10 text-primary" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3">No properties found</h3>
                  <p className="text-muted-foreground mb-8">
                    {searchQuery ? `No results for "${searchQuery}"` : "Try adjusting your filters to see more results"}
                  </p>
                  <Button
                    size="lg"
                    onClick={clearAllFilters}
                    className="gap-2 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="h-5 w-5" />
                    Clear All Filters
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                layout
                className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}
              >
                <AnimatePresence>
                  {properties.map((property, i) => (
                    <motion.div
                      key={`${property.id}-${i}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.05 }}
                      ref={i === properties.length - 1 ? lastPropertyRef : null}
                    >
                      <PropertyCard property={property} viewMode={viewMode} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Load More Indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      className="w-3 h-3 bg-primary rounded-full"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}