// components/google-oauth-script.tsx
"use client"

import { useEffect } from 'react'

declare global {
  interface Window {
    google: any
  }
}

export function GoogleOAuthScript() {
  useEffect(() => {
    // Only load if not already loaded
    if (window.google) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
     // console.log('Google Identity Services loaded successfully')
    }
    script.onerror = () => {
      console.error('Failed to load Google Identity Services')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return null
}