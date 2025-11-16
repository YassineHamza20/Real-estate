// components/RealMap.tsx
"use client"

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RealMapProps {
  address: string
  city: string
  className?: string
}

interface Coordinates {
  lat: number
  lng: number
}

export function RealMap({ address, city, className = "" }: RealMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fullAddress = `${address}, ${city}`
  const encodedQuery = encodeURIComponent(fullAddress)

  // Geocode the address to get exact coordinates
  useEffect(() => {
    const geocodeAddress = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Use OpenStreetMap Nominatim API for geocoding (free)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=1`
        )
        
        const data = await response.json()
        
        if (data && data.length > 0) {
          const { lat, lon } = data[0]
          setCoordinates({
            lat: parseFloat(lat),
            lng: parseFloat(lon)
          })
        } else {
          throw new Error('Address not found')
        }
      } catch (err) {
        console.error('Geocoding error:', err)
        setError('Could not find exact location. Showing city center.')
        // Fallback to city center coordinates
        const fallbackCoords = getCityCoords(city)
        setCoordinates(fallbackCoords)
      } finally {
        setIsLoading(false)
      }
    }

    geocodeAddress()
  }, [address, city, encodedQuery])

  // Initialize map once we have coordinates
  useEffect(() => {
    if (!coordinates || typeof window === 'undefined') return

    const initializeMap = async () => {
      if (!mapRef.current) return

      try {
        // Dynamically import Leaflet
        const L = await import('leaflet')
        
        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        // Initialize map with exact coordinates
        mapInstance.current = L.map(mapRef.current!).setView(
          [coordinates.lat, coordinates.lng], 
          16 // Zoom closer for exact address
        )

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstance.current)

        // Add custom red marker for exact location
        const redIcon = L.divIcon({
          html: `
            <div style="
              background: #dc2626;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 4px solid white;
              box-shadow: 0 4px 15px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              animation: pulse 2s infinite;
            ">
              <div style="
                width: 10px;
                height: 10px;
                background: white;
                border-radius: 50%;
              "></div>
            </div>
            <style>
              @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
              }
            </style>
          `,
          className: 'exact-location-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        // Add marker with exact coordinates
        const marker = L.marker([coordinates.lat, coordinates.lng], { icon: redIcon })
          .addTo(mapInstance.current)
          .bindPopup(`
            <div style="padding: 12px; min-width: 220px;">
              <strong style="font-size: 14px; color: #dc2626;">📍 Location</strong><br>
              <strong style="font-size: 13px;">${address}</strong><br>
              <span style="font-size: 12px; color: #666;">${city}</span>
            </div>
          `)
          .openPopup()

        // Add a circle to highlight the exact area
        L.circle([coordinates.lat, coordinates.lng], {
          color: '#dc2626',
          fillColor: '#fecaca',
          fillOpacity: 0.2,
          radius: 50, // 50 meter radius around the exact location
        }).addTo(mapInstance.current)

      } catch (error) {
        console.error('Error initializing map:', error)
        setError('Failed to load map')
      }
    }

    initializeMap()

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [coordinates, address, city])

  // Fallback coordinates based on city (used if geocoding fails)
  const getCityCoords = (cityName: string): Coordinates => {
    const cityLower = cityName.toLowerCase()
    if (cityLower.includes('berlin')) return { lat: 52.5200, lng: 13.4050 }
    if (cityLower.includes('munich') || cityLower.includes('münchen')) return { lat: 48.1351, lng: 11.5820 }
    if (cityLower.includes('hamburg')) return { lat: 53.5511, lng: 9.9937 }
    if (cityLower.includes('cologne') || cityLower.includes('köln')) return { lat: 50.9375, lng: 6.9603 }
    if (cityLower.includes('frankfurt')) return { lat: 50.1109, lng: 8.6821 }
    if (cityLower.includes('stuttgart')) return { lat: 48.7758, lng: 9.1829 }
    if (cityLower.includes('düsseldorf')) return { lat: 51.2277, lng: 6.7735 }
    if (cityLower.includes('dortmund')) return { lat: 51.5136, lng: 7.4653 }
    if (cityLower.includes('essen')) return { lat: 51.4556, lng: 7.0116 }
    if (cityLower.includes('leipzig')) return { lat: 51.3397, lng: 12.3731 }
    return { lat: 52.5200, lng: 13.4050 } // Default to Berlin
  }

  const openStreetMapUrl = `https://www.openstreetmap.org/search?query=${encodedQuery}`
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`

  const openInNativeMaps = () => {
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      window.open(`http://maps.apple.com/?q=${encodedQuery}`)
    } else {
      window.open(googleMapsUrl)
    }
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden border-2 border-border ${className}`}>
      <div className="w-full h-80 relative">
        {/* Real Map Container */}
        <div 
          ref={mapRef} 
          className="w-full h-80 z-10 rounded-2xl"
        />
        
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-2xl z-30">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Finding exact location...</p>
              <p className="text-sm text-gray-500 mt-1">{fullAddress}</p>
            </div>
          </div>
        )}
        
        {/* Error state */}
        {error && !isLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg z-30 text-sm">
            {error}
          </div>
        )}
        
        {/* Success state - Exact location found */}
        {/* {coordinates && !isLoading && !error && (
          <div className="absolute top-4 left-4 bg-green-100 border border-green-400 text-green-800 px-3 py-1 rounded-lg z-30 text-sm">
            ✓ Exact location found
          </div>
        )} */}
        
        {/* Overlay Info */}
        {/* <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-2xl border z-20">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-bold text-sm">Property Location</h3>
              <p className="text-xs text-gray-600 max-w-[200px] truncate">{fullAddress}</p>
              {coordinates && (
                <p className="text-xs text-green-600 font-medium mt-1">
                  {error ? 'Approximate location' : 'Exact location'}
                </p>
              )}
            </div>
          </div>
        </div> */}
        
        {/* Action Buttons */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 z-20">
          {/* <Button 
            onClick={() => window.open(openStreetMapUrl, '_blank')}
            size="sm"
            variant="secondary"
            className="flex-1 gap-2 bg-white/95 hover:bg-white backdrop-blur-md"
          >
            <ExternalLink className="h-4 w-4" />
            OpenStreetMap
          </Button> */}
          <Button 
            onClick={openInNativeMaps}
            size="sm"
            className="flex-1 gap-2"
          >
            <Navigation className="h-4 w-4" />
            View on Google Maps
          </Button>
        </div>
        
        {/* Coordinates info */}
        {coordinates && (
          <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg z-20 text-xs">
            <div>Lat: {coordinates.lat.toFixed(6)}</div>
            <div>Lng: {coordinates.lng.toFixed(6)}</div>
          </div>
        )}
      </div>
    </div>
  )
}