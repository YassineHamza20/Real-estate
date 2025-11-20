"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { 
  Users, UserCheck, TrendingUp, Shield,
  Heart, Building, Home, RefreshCw,
  Eye, BarChart3, Activity, Target,
  CheckCircle, Clock, AlertCircle,
  Sparkles, Rocket, Zap,
  Download,
  FileText,
  Table,
  Image
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

interface DashboardStats {
  total_users: number
  total_buyers: number
  total_sellers: number
  total_admins: number
  pending_verifications: number
  approved_verifications: number
  rejected_verifications: number
  total_wishlists?: number
  total_users_with_wishlists?: number
  total_wishlist_items?: number
}

interface PropertyStats {
  total_properties: number
  active_properties: number
  inactive_properties: number
  recent_properties: number
}

interface RecentActivity {
  id: string
  type: 'user' | 'property' | 'verification' | 'wishlist' | 'system'
  message: string
  timestamp: string
  badge: string
  priority: number
}

export function OverviewTab() {
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<DashboardStats & PropertyStats>({
    total_users: 0,
    total_buyers: 0,
    total_sellers: 0,
    total_admins: 0,
    pending_verifications: 0,
    approved_verifications: 0,
    rejected_verifications: 0,
    total_wishlists: 0,
    total_users_with_wishlists: 0,
    total_wishlist_items: 0,
    total_properties: 0,
    active_properties: 0,
    inactive_properties: 0,
    recent_properties: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [exportLoading, setExportLoading] = useState<string | null>(null)

  const fetchStats = async () => {
    if (!isAuthenticated) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('No authentication token')
      }

      // Fetch user stats
      const userStatsResponse = await fetch('http://localhost:8000/api/users/admin/stats/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!userStatsResponse.ok) {
        throw new Error('Failed to fetch user stats')
      }

      const userStats: DashboardStats = await userStatsResponse.json()

      // Fetch property stats
      const propertyStatsResponse = await fetch('http://localhost:8000/api/properties/admin/properties/stats/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      let propertyStats: PropertyStats = {
        total_properties: 0,
        active_properties: 0,
        inactive_properties: 0,
        recent_properties: 0
      }

      if (propertyStatsResponse.ok) {
        propertyStats = await propertyStatsResponse.json()
      }

      // Fetch wishlist stats
      const wishlistStatsResponse = await fetch('http://localhost:8000/api/properties/admin/wishlists/stats/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      let wishlistStats = {
        total_wishlists: 0,
        total_users_with_wishlists: 0,
        total_wishlist_items: 0
      }

      if (wishlistStatsResponse.ok) {
        wishlistStats = await wishlistStatsResponse.json()
      }

      // Combine all stats
      const combinedStats = {
        ...userStats,
        ...propertyStats,
        ...wishlistStats
      }

      setStats(combinedStats)
      await fetchRecentActivity(token, combinedStats)

    } catch (error: any) {
      console.error('Error fetching stats:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard stats",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async (token: string, currentStats: any) => {
    try {
      const activities: RecentActivity[] = []

      // High priority activities (needs attention)
      if (currentStats.pending_verifications > 0) {
        activities.push({
          id: 'verifications-1',
          type: 'verification',
          message: `${currentStats.pending_verifications} seller verifications awaiting review`,
          timestamp: 'Needs Attention',
          badge: 'Urgent',
          priority: 1
        })
      }

      // Recent growth activities
      if (currentStats.recent_properties > 0) {
        activities.push({
          id: 'properties-1',
          type: 'property',
          message: `${currentStats.recent_properties} new properties listed this week`,
          timestamp: 'Recent',
          badge: 'Growth',
          priority: 2
        })
      }

      // Platform health activities
      if (currentStats.total_properties > 0) {
        activities.push({
          id: 'properties-2',
          type: 'property',
          message: `${currentStats.total_properties} total properties on platform`,
          timestamp: 'Active',
          badge: 'Inventory',
          priority: 3
        })
      }

      if (currentStats.total_users > 0) {
        activities.push({
          id: 'users-1',
          type: 'user',
          message: `${currentStats.total_users} registered users in system`,
          timestamp: 'Active',
          badge: 'Community',
          priority: 4
        })
      }

      if (currentStats.total_wishlist_items && currentStats.total_wishlist_items > 0) {
        activities.push({
          id: 'wishlists-1',
          type: 'wishlist',
          message: `${currentStats.total_wishlist_items} items saved in user wishlists`,
          timestamp: 'Engagement',
          badge: 'Interest',
          priority: 5
        })
      }

      if (currentStats.approved_verifications > 0) {
        activities.push({
          id: 'verifications-2',
          type: 'verification',
          message: `${currentStats.approved_verifications} sellers successfully verified`,
          timestamp: 'Verified',
          badge: 'Quality',
          priority: 6
        })
      }

      // System status
      activities.push({
        id: 'system-1',
        type: 'system',
        message: 'All systems operational and running smoothly',
        timestamp: 'Optimal',
        badge: 'System',
        priority: 7
      })

      // Sort by priority
      activities.sort((a, b) => a.priority - b.priority)
      setRecentActivity(activities.slice(0, 6))

    } catch (error) {
      console.error('Error fetching recent activity:', error)
      setRecentActivity([
        {
          id: 'default-1',
          type: 'system',
          message: 'Platform is running and ready',
          timestamp: 'Ready',
          badge: 'System',
          priority: 1
        }
      ])
    }
  }


// Enhanced PDF export with proper spacing and layout
const exportToPDF = async () => {
  setExportLoading('pdf')
  try {
    const { jsPDF } = await import('jspdf')
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Set document properties
    doc.setProperties({
      title: `Dashboard Report - ${new Date().toLocaleDateString()}`,
      subject: 'Real Estate Platform Analytics',
      author: user?.username || 'Admin User',
      creator: 'Real Estate Platform',
      keywords: 'dashboard, analytics, statistics, real estate'
    })

    // Add header with professional design
    doc.setFillColor(59, 130, 246) // blue-600
    doc.rect(0, 0, 210, 25, 'F')
    
    // Platform name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('REAL ESTATE PLATFORM', 20, 15)
    
    // Report title
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.text('Dashboard Analytics Report', 20, 21)

    // Generation info box
    doc.setFillColor(248, 250, 252) // gray-50
    doc.roundedRect(15, 32, 180, 12, 2, 2, 'F')
    doc.setDrawColor(226, 232, 240) // gray-200
    doc.roundedRect(15, 32, 180, 12, 2, 2, 'S')
    
    doc.setTextColor(100, 116, 139) // gray-500
    doc.setFontSize(9)
    doc.text(`Report generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })} at ${new Date().toLocaleTimeString()} • By: ${user?.username || 'Admin User'}`, 20, 39)

    let yPosition = 55

    // Executive Summary Section
    doc.setTextColor(15, 23, 42) // gray-900
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('EXECUTIVE SUMMARY', 15, yPosition)
    
    yPosition += 8
    
    // Summary text
    doc.setTextColor(71, 85, 105) // gray-600
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    const summaryText = `Platform overview showing ${stats.total_users} total users, ${stats.total_properties} properties, and ${stats.active_properties} active listings. ${stats.pending_verifications > 0 ? `${stats.pending_verifications} verifications pending review.` : 'All verifications are current.'}`
    const summaryLines = doc.splitTextToSize(summaryText, 180)
    summaryLines.forEach((line: string, index: number) => {
      doc.text(line, 15, yPosition + (index * 5))
    })
    
    yPosition += (summaryLines.length * 5) + 15

    // Key Statistics Section - Better spaced grid
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('KEY PERFORMANCE INDICATORS', 15, yPosition)
    
    yPosition += 10

    // Stats cards in a properly spaced 2x3 grid
    const cardWidth = 85
    const cardHeight = 28
    const horizontalGap = 10
    const verticalGap = 8
    
    statCards.forEach((stat, index) => {
      const row = Math.floor(index / 2)
      const col = index % 2
      const x = 15 + col * (cardWidth + horizontalGap)
      const y = yPosition + row * (cardHeight + verticalGap)

      // Check if we need a new page
      if (y + cardHeight > 270) {
        doc.addPage()
        yPosition = 30
        // Recalculate position for new page
        const newRow = Math.floor(index / 2)
        const newCol = index % 2
        const newX = 15 + newCol * (cardWidth + horizontalGap)
        const newY = yPosition + newRow * (cardHeight + verticalGap)
        drawStatCard(doc, stat, newX, newY, cardWidth, cardHeight, index)
      } else {
        drawStatCard(doc, stat, x, y, cardWidth, cardHeight, index)
      }
    })

    yPosition += (Math.ceil(statCards.length / 2) * (cardHeight + verticalGap)) + 15

    // Platform Health Metrics Section
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 30
    }

    doc.setTextColor(15, 23, 42)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('PLATFORM HEALTH METRICS', 15, yPosition)
    
    yPosition += 10

    // Health metrics with better spacing
    const healthMetrics = [
      { 
        label: 'Active Properties', 
        value: stats.active_properties, 
        color: [34, 197, 94], // green-500
        description: 'Currently listed and available properties'
      },
      { 
        label: 'Verified Sellers', 
        value: stats.total_sellers, 
        color: [59, 130, 246], // blue-500
        description: 'Sellers with completed verification process'
      },
      { 
        label: 'Pending Reviews', 
        value: stats.pending_verifications, 
        color: [249, 115, 22], // orange-500
        description: 'Seller applications awaiting approval'
      },
      { 
        label: 'Wishlist Engagement', 
        value: stats.total_wishlist_items || 0, 
        color: [168, 85, 247], // purple-500
        description: 'Total items saved in user wishlists'
      }
    ]

    healthMetrics.forEach((metric, index) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 30
      }

      drawHealthMetric(doc, metric, yPosition)
      yPosition += 20 // More space between metrics
    })

    yPosition += 10

    // User Distribution Section
    if (yPosition > 220) {
      doc.addPage()
      yPosition = 30
    }

    doc.setTextColor(15, 23, 42)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('USER DISTRIBUTION', 15, yPosition)
    
    yPosition += 10

    const userMetrics = [
      { label: 'Total Users', value: stats.total_users, percentage: 100 },
      { label: 'Sellers', value: stats.total_sellers, percentage: ((stats.total_sellers / stats.total_users) * 100) },
      { label: 'Buyers', value: stats.total_buyers, percentage: ((stats.total_buyers / stats.total_users) * 100) },
      { label: 'Administrators', value: stats.total_admins, percentage: ((stats.total_admins / stats.total_users) * 100) }
    ]

    userMetrics.forEach((metric, index) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 30
      }

      drawUserMetric(doc, metric, yPosition)
      yPosition += 12
    })

    yPosition += 15

    // Recent Activity Section
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 30
    }

    doc.setTextColor(15, 23, 42)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('RECENT ACTIVITY & NOTIFICATIONS', 15, yPosition)
    
    yPosition += 10

    recentActivity.forEach((activity, index) => {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 30
      }

      drawActivityItem(doc, activity, yPosition)
      yPosition += 25 // More space between activities
    })

    // Add professional footer to all pages
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      
      // Page number
      doc.setTextColor(148, 163, 184) // gray-400
      doc.setFontSize(8)
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
      
      // Confidential footer
      doc.setFont(undefined, 'bold')
      doc.text('• CONFIDENTIAL •', 105, 295, { align: 'center' })
      
      // Generated info
      doc.setFont(undefined, 'normal')
      doc.text(`Real Estate Platform - ${new Date().getFullYear()}`, 15, 295)
    }

    // Save the PDF
    doc.save(`professional-dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`)
    
    toast({
      title: "Professional PDF Export Complete",
      description: " Dashboard report has been downloaded",
      variant: "default",
    })
  } catch (error) {
    console.error('Error exporting to PDF:', error)
    toast({
      title: "Export Failed",
      description: "Could not generate PDF export",
      variant: "destructive",
    })
  } finally {
    setExportLoading(null)
  }
}

// Helper function to draw stat cards
const drawStatCard = (doc: any, stat: any, x: number, y: number, width: number, height: number, index: number) => {
  // Card background with different colors
  const colors = [
    [239, 246, 255], // blue-50
    [240, 253, 244], // green-50
    [255, 247, 237], // orange-50
    [253, 242, 248], // pink-50
    [250, 245, 255]  // purple-50
  ]
  doc.setFillColor(...colors[index % colors.length])
  doc.roundedRect(x, y, width, height, 3, 3, 'F')
  
  // Card border
  doc.setDrawColor(203, 213, 225) // gray-300
  doc.roundedRect(x, y, width, height, 3, 3, 'S')

  // Card content
  doc.setTextColor(71, 85, 105) // gray-600
  doc.setFontSize(8)
  doc.setFont(undefined, 'bold')
  doc.text(stat.title.toUpperCase(), x + 8, y + 8)

  doc.setTextColor(15, 23, 42) // gray-900
  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text(stat.value.toLocaleString(), x + 8, y + 18)

  doc.setTextColor(100, 116, 139) // gray-500
  doc.setFontSize(7)
  doc.setFont(undefined, 'normal')
  
  // Split subtitle into multiple lines if needed
  const subLines = doc.splitTextToSize(stat.sub, width - 16)
  subLines.forEach((line: string, lineIndex: number) => {
    doc.text(line, x + 8, y + 23 + (lineIndex * 3.5))
  })
}

// Helper function to draw health metrics
const drawHealthMetric = (doc: any, metric: any, y: number) => {
  // Metric background
  doc.setFillColor(248, 250, 252) // gray-50
  doc.roundedRect(15, y, 180, 15, 2, 2, 'F')
  
  // Colored indicator
  doc.setFillColor(...metric.color)
  doc.roundedRect(15, y, 4, 15, 1, 1, 'F')

  // Metric label
  doc.setTextColor(15, 23, 42) // gray-900
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text(metric.label, 25, y + 9)

  // Metric value
  doc.setTextColor(...metric.color)
  doc.text(metric.value.toLocaleString(), 160, y + 9, { align: 'right' })

  // Metric description
  doc.setTextColor(100, 116, 139) // gray-500
  doc.setFontSize(8)
  doc.setFont(undefined, 'normal')
  doc.text(metric.description, 25, y + 14)
}

// Helper function to draw user metrics
const drawUserMetric = (doc: any, metric: any, y: number) => {
  // User type and count
  doc.setTextColor(71, 85, 105) // gray-600
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.text(metric.label, 20, y + 8)

  doc.setTextColor(15, 23, 42) // gray-900
  doc.text(metric.value.toLocaleString(), 120, y + 8, { align: 'right' })

  // Percentage bar (visual representation)
  const barWidth = 50
  const barHeight = 4
  const fillWidth = (metric.percentage / 100) * barWidth
  
  doc.setFillColor(226, 232, 240) // gray-200
  doc.rect(130, y + 4, barWidth, barHeight, 'F')
  
  doc.setFillColor(59, 130, 246) // blue-500
  doc.rect(130, y + 4, fillWidth, barHeight, 'F')

  // Percentage text
  doc.setTextColor(100, 116, 139) // gray-500
  doc.setFontSize(8)
  doc.text(`${metric.percentage.toFixed(1)}%`, 185, y + 8, { align: 'right' })
}

// Helper function to draw activity items
const drawActivityItem = (doc: any, activity: any, y: number) => {
  // Activity container
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(15, y, 180, 20, 2, 2, 'F')
  doc.setDrawColor(226, 232, 240) // gray-200
  doc.roundedRect(15, y, 180, 20, 2, 2, 'S')

  // Activity type indicator
  const iconColors: { [key: string]: number[] } = {
    'property': [34, 197, 94],    // green-500
    'verification': [249, 115, 22], // orange-500
    'wishlist': [236, 72, 153],   // pink-500
    'user': [59, 130, 246],       // blue-500
    'system': [168, 85, 247]      // purple-500
  }
  
  doc.setFillColor(...(iconColors[activity.type] || [100, 116, 139]))
  doc.circle(25, y + 10, 3, 'F')

  // Activity message
  doc.setTextColor(15, 23, 42) // gray-900
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  
  const messageLines = doc.splitTextToSize(activity.message, 140)
  messageLines.forEach((line: string, lineIndex: number) => {
    doc.text(line, 35, y + 8 + (lineIndex * 4))
  })

  // Badge
  doc.setFillColor(59, 130, 246) // blue-500
  doc.roundedRect(35, y + 15, 18, 6, 1, 1, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(6)
  doc.setFont(undefined, 'bold')
  doc.text(activity.badge.toUpperCase(), 37, y + 18.5)

  // Timestamp
  doc.setTextColor(100, 116, 139) // gray-500
  doc.setFontSize(7)
  doc.setFont(undefined, 'normal')
  doc.text(activity.timestamp, 58, y + 18.5)
}

  
 

 
     // Clean Excel export - minimal and useful
const exportToExcel = async () => {
  setExportLoading('excel')
  try {
    const csvContent = [
      // Header
      ['Dashboard Export', '', '', ''],
      [`Generated,${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
      [`By,${user?.username || 'Admin'}`],
      [''],
      
      // Core Statistics
      ['CORE STATISTICS'],
      ['Metric', 'Count', 'Details'],
      ['Total Users', stats.total_users, `${stats.total_sellers} sellers, ${stats.total_buyers} buyers`],
      ['Total Properties', stats.total_properties, `${stats.active_properties} active, ${stats.inactive_properties} inactive`],
      ['New Properties', stats.recent_properties, 'This week'],
      ['Pending Verifications', stats.pending_verifications, `${stats.approved_verifications} approved, ${stats.rejected_verifications} rejected`],
      ['Wishlist Items', stats.total_wishlist_items || 0, `${stats.total_users_with_wishlists || 0} users engaged`],
      [''],
      
      // User Breakdown
      ['USER BREAKDOWN'],
      ['Type', 'Count', 'Percentage'],
      ['Total Users', stats.total_users, '100%'],
      ['Sellers', stats.total_sellers, `${((stats.total_sellers / stats.total_users) * 100).toFixed(1)}%`],
      ['Buyers', stats.total_buyers, `${((stats.total_buyers / stats.total_users) * 100).toFixed(1)}%`],
      ['Admins', stats.total_admins, `${((stats.total_admins / stats.total_users) * 100).toFixed(1)}%`],
      [''],
      
      // Property Status
      ['PROPERTY STATUS'],
      ['Status', 'Count', 'Percentage'],
      ['Total Properties', stats.total_properties, '100%'],
      ['Active', stats.active_properties, `${((stats.active_properties / stats.total_properties) * 100).toFixed(1)}%`],
      ['Inactive', stats.inactive_properties, `${((stats.inactive_properties / stats.total_properties) * 100).toFixed(1)}%`],
      ['New This Week', stats.recent_properties, `${((stats.recent_properties / stats.total_properties) * 100).toFixed(1)}%`],
      [''],
      
      // Recent Activity
      ['RECENT ACTIVITY'],
      ['Type', 'Message', 'Status'],
      ...recentActivity.map(activity => [
        activity.type,
        activity.message,
        activity.badge
      ]),
      [''],
      
      // Summary
      ['SUMMARY'],
      ['Total Platform Users', stats.total_users],
      ['Available Properties', stats.active_properties],
      ['Pending Actions', stats.pending_verifications],
      ['User Engagement', stats.total_wishlist_items || 0]
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `dashboard-${new Date().toISOString().split('T')[0]}.csv`)
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Excel Export Complete",
      description: "Dashboard data exported successfully",
      variant: "default",
    })
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    toast({
      title: "Export Failed",
      description: "Could not generate Excel export",
      variant: "destructive",
    })
  } finally {
    setExportLoading(null)
  }
}
  



  // Enhanced PNG export with better design
const exportToPNG = async () => {
  setExportLoading('png')
  try {
    const createEnhancedPNG = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // Set canvas size for better proportions
      canvas.width = 1400
      canvas.height = 1800
      
      // Background with subtle gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      gradient.addColorStop(0, '#f8fafc')
      gradient.addColorStop(1, '#ffffff')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Header with accent
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(0, 0, canvas.width, 80)
      
      // Platform name
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px system-ui'
      ctx.fillText('Real Estate Platform', 60, 48)
      
      // Report title
      ctx.fillStyle = '#374151'
      ctx.font = 'bold 42px system-ui'
      ctx.fillText('Dashboard Report', 60, 140)
      
      // Timestamp and user
      ctx.fillStyle = '#6b7280'
      ctx.font = '20px system-ui'
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 60, 180)
      ctx.fillText(`By: ${user?.username || 'Administrator'}`, 60, 210)
      
      let yPos = 260

      // Key Statistics Section
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 32px system-ui'
      ctx.fillText('Key Statistics', 60, yPos)
      
      yPos += 50

      // Stats cards in a clean grid
      const cardWidth = 300
      const cardHeight = 100
      const horizontalGap = 30
      const verticalGap = 25
      const cardsPerRow = 4
      
      const cardColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      
      statCards.forEach((stat, index) => {
        const row = Math.floor(index / cardsPerRow)
        const col = index % cardsPerRow
        const x = 60 + col * (cardWidth + horizontalGap)
        const y = yPos + row * (cardHeight + verticalGap)
        
        // Card with shadow effect
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        ctx.fillRect(x, y, cardWidth, cardHeight)
        ctx.shadowColor = 'transparent'
        
        // Card border
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, cardWidth, cardHeight)
        
        // Accent color bar
        ctx.fillStyle = cardColors[index % cardColors.length]
        ctx.fillRect(x, y, 6, cardHeight)
        
        // Card content
        ctx.fillStyle = '#6b7280'
        ctx.font = 'bold 14px system-ui'
        ctx.fillText(stat.title.toUpperCase(), x + 20, y + 30)
        
        ctx.fillStyle = '#111827'
        ctx.font = 'bold 32px system-ui'
        const valueText = stat.value.toLocaleString()
        const valueWidth = ctx.measureText(valueText).width
        ctx.fillText(valueText, x + cardWidth - valueWidth - 20, y + 65)
        
        ctx.fillStyle = '#9ca3af'
        ctx.font = '12px system-ui'
        const subLines = wrapText(ctx, stat.sub, x + 20, y + 85, cardWidth - 40, 14)
        subLines.forEach((line, lineIndex) => {
          ctx.fillText(line, x + 20, y + 85 + (lineIndex * 14))
        })
      })
      
      yPos += (Math.ceil(statCards.length / cardsPerRow) * (cardHeight + verticalGap)) + 60

      // Recent Activity Section
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 32px system-ui'
      ctx.fillText('Recent Activity', 60, yPos)
      
      yPos += 50

      recentActivity.forEach((activity, index) => {
        if (yPos > 1500) return
        
        // Activity card
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.05)'
        ctx.shadowBlur = 5
        ctx.fillRect(60, yPos, 1280, 80)
        ctx.shadowColor = 'transparent'
        
        ctx.strokeStyle = '#f3f4f6'
        ctx.lineWidth = 1
        ctx.strokeRect(60, yPos, 1280, 80)
        
        // Activity type indicator
        const typeColors: { [key: string]: string } = {
          'property': '#10b981',
          'verification': '#f59e0b',
          'wishlist': '#ef4444',
          'user': '#3b82f6',
          'system': '#8b5cf6'
        }
        
        ctx.fillStyle = typeColors[activity.type] || '#6b7280'
        ctx.beginPath()
        ctx.arc(90, yPos + 40, 8, 0, 2 * Math.PI)
        ctx.fill()
        
        // Activity message
        ctx.fillStyle = '#111827'
        ctx.font = 'bold 18px system-ui'
        const messageLines = wrapText(ctx, activity.message, 120, yPos + 30, 1000, 22)
        messageLines.forEach((line, lineIndex) => {
          ctx.fillText(line, 120, yPos + 30 + (lineIndex * 22))
        })
        
        // Badge
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.roundRect(120, yPos + 55, 80, 20, 10)
        ctx.fill()
        
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px system-ui'
        ctx.fillText(activity.badge.toUpperCase(), 140, yPos + 69)
        
        // Timestamp
        ctx.fillStyle = '#6b7280'
        ctx.font = '14px system-ui'
        ctx.fillText(activity.timestamp, 220, yPos + 69)
        
        yPos += 100
      })
      
      // Footer
      ctx.fillStyle = '#374151'
      ctx.font = '16px system-ui'
      ctx.fillText('Real Estate Platform • Confidential Report', 60, 1700)
      ctx.fillText(`Page 1 of 1 • Export ID: ${Date.now()}`, 60, 1725)
      
      return canvas
    }
    
    // Enhanced text wrapping function
    const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ')
      const lines = []
      let currentLine = words[0]
      
      for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = context.measureText(currentLine + ' ' + word).width
        if (width < maxWidth) {
          currentLine += ' ' + word
        } else {
          lines.push(currentLine)
          currentLine = word
        }
      }
      lines.push(currentLine)
      return lines
    }
    
    const canvas = createEnhancedPNG()
    const link = document.createElement('a')
    link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
    
    toast({
      title: "Enhanced PNG Export Complete",
      description: "Professional dashboard report has been saved as PNG",
      variant: "default",
    })
    
  } catch (error) {
    console.error('Error exporting to PNG:', error)
    toast({
      title: "Export Failed",
      description: "Could not generate PNG export",
      variant: "destructive",
    })
  } finally {
    setExportLoading(null)
  }
}



  

  useEffect(() => {
    fetchStats()
  }, [isAuthenticated])

  const statCards = [
    { 
      title: "Total Users", 
      value: stats.total_users, 
      sub: `${stats.total_sellers} sellers • ${stats.total_buyers} buyers`, 
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800",
      description: "Platform community growth"
    },
    { 
      title: "Properties", 
      value: stats.total_properties, 
      sub: `${stats.active_properties} active • ${stats.recent_properties} new`, 
      icon: Building,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800",
      description: "Property inventory status"
    },
    { 
      title: "Pending Reviews", 
      value: stats.pending_verifications, 
      sub: `${stats.approved_verifications} approved • ${stats.rejected_verifications} rejected`, 
      icon: UserCheck,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      borderColor: "border-orange-200 dark:border-orange-800",
      description: "Verification queue status"
    },
    { 
      title: "Wishlist Items", 
      value: stats.total_wishlist_items || 0, 
      sub: `${stats.total_users_with_wishlists || 0} users engaged`, 
      icon: Heart,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50 dark:bg-pink-950/30",
      borderColor: "border-pink-200 dark:border-pink-800",
      description: "User engagement metrics"
    },
    { 
      title: "Active Listings", 
      value: stats.active_properties, 
      sub: `${stats.inactive_properties} inactive listings`, 
      icon: Home,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800",
      description: "Available properties"
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'property': return Building
      case 'verification': return UserCheck
      case 'wishlist': return Heart
      case 'user': return Users
      case 'system': return Zap
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'property': return 'bg-green-500 dark:bg-green-600'
      case 'verification': return 'bg-orange-500 dark:bg-orange-600'
      case 'wishlist': return 'bg-pink-500 dark:bg-pink-600'
      case 'user': return 'bg-blue-500 dark:bg-blue-600'
      case 'system': return 'bg-purple-500 dark:bg-purple-600'
      default: return 'bg-gray-500 dark:bg-gray-600'
    }
  }

  const getBadgeVariant = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'urgent': return 'destructive'
      case 'growth': return 'default'
      case 'inventory': return 'secondary'
      case 'community': return 'outline'
      case 'interest': return 'secondary'
      case 'quality': return 'default'
      case 'system': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <motion.div 
        className="flex justify-between items-start"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Dashboard Overview
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Welcome back, <span className="font-semibold text-primary">{user?.username}</span>. Here's your platform at a glance.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Export Button with Dropdown */}
          <div className="relative group">
            <Button 
              
              size="lg"
              disabled={loading || exportLoading !== null}
              className="rounded-xl border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <Download className={`h-5 w-5 mr-2 ${exportLoading ? 'animate-spin' : ''}`} />
              Export Data
            </Button>
            
            {/* Export Options Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-background border-2 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="p-2 space-y-1">
                <button
                  onClick={exportToPDF}
                  disabled={exportLoading !== null}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  {exportLoading === 'pdf' ? 'Generating...' : 'Export as PDF'}
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={exportLoading !== null}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <Table className="h-4 w-4 text-green-500" />
                  {exportLoading === 'excel' ? 'Generating...' : 'Export as Excel'}
                </button>
                <button
                  onClick={exportToPNG}
                  disabled={exportLoading !== null}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <Image className="h-4 w-4 text-blue-500" />
                  {exportLoading === 'png' ? 'Generating...' : 'Export as PNG'}
                </button>
              </div>
            </div>
          </div>

          <Button 
            onClick={fetchStats} 
            variant="outline" 
            size="lg"
            disabled={loading}
            className="rounded-xl border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </motion.div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <Card className={`border-2 ${stat.borderColor} ${stat.bgColor} hover:shadow-xl transition-all duration-300 group overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {stat.title}
                </CardTitle>
                <div className="w-10 h-10 rounded-xl bg-background/80 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border">
                  {loading ? (
                    <Skeleton className="h-5 w-5 rounded-full" />
                  ) : (
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  <>
                    <Skeleton className="h-8 w-20 mb-2 rounded-lg" />
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold text-foreground">
                        {stat.value.toLocaleString()}
                      </div>
                      <Sparkles className="h-4 w-4 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground leading-tight">
                      {stat.sub}
                    </p>
                    <p className="text-xs text-muted-foreground/80 leading-tight">
                      {stat.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Platform Overview - Wider */}
        <motion.div 
          className="xl:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="border-2 hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-background to-muted/20 border-b">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-foreground">Platform Overview</span>
                  <p className="text-sm font-normal text-muted-foreground mt-1">
                    Real-time platform activities and insights
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48 rounded" />
                        <Skeleton className="h-3 w-32 rounded" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.type)
                    return (
                      <motion.div
                        key={activity.id}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 border"
                        whileHover={{ scale: 1.01 }}
                        layout
                      >
                        <div className={`w-12 h-12 rounded-xl ${getActivityColor(activity.type)} flex items-center justify-center shadow-md`}>
                          <ActivityIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground leading-tight">
                            {activity.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant="secondary" 
                              className="text-xs font-medium px-2 py-1"
                            >
                              {activity.timestamp}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant={getBadgeVariant(activity.badge)}
                          className="shrink-0 font-medium px-3 py-1.5"
                        >
                          {activity.badge}
                        </Badge>
                      </motion.div>
                    )
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Eye className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Activity Yet
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Platform activity will appear here as users begin to interact with your application.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform Health - Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="border-2 hover:shadow-lg transition-all duration-300 sticky top-6">
            <CardHeader className="bg-gradient-to-r from-background to-muted/20 border-b">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <span className="text-foreground">Platform Health</span>
                  <p className="text-sm font-normal text-muted-foreground mt-1">
                    System status & metrics
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Active Properties */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {loading ? <Skeleton className="h-7 w-12" /> : stats.active_properties}
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">Active Properties</p>
                  </div>
                </div>
                <Target className="h-8 w-8 text-green-600/40 dark:text-green-400/40" />
              </div>

              {/* Verified Sellers */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {loading ? <Skeleton className="h-7 w-12" /> : stats.total_sellers}
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Verified Sellers</p>
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600/40 dark:text-blue-400/40" />
              </div>

              {/* Pending Reviews */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {loading ? <Skeleton className="h-7 w-12" /> : stats.pending_verifications}
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">Pending Reviews</p>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-orange-600/40 dark:text-orange-400/40" />
              </div>

              {/* Wishlist Engagement */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {loading ? <Skeleton className="h-7 w-12" /> : stats.total_wishlist_items || 0}
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Wishlist Items</p>
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600/40 dark:text-purple-400/40" />
              </div>

              {/* System Status */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">All Systems Go</div>
                    <p className="text-sm text-white/90">Platform running optimally</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}