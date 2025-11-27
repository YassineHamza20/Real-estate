"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis  } from 'recharts'
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid  } from 'recharts'
import { AreaChart, Area  } from 'recharts'
import {
  PieChart as RePieChart, 
  Pie, 
  Cell,BarChart,Bar,
  ResponsiveContainer,
  Tooltip, 
  Legend
} from 'recharts'
import { 
  TrendingUp, TrendingDown, Users, Building, 
  Heart, Eye, DollarSign, Home, MapPin,
  BarChart3, PieChart, Target, Star,
  RefreshCw, Calendar, Image, CheckCircle,
  ArrowUp, ArrowDown, Minus,
  Download,
  FileText,
  Table as TableIcon
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { propertyAnalyticsApi, type PropertyAnalyticsData, type PropertyPerformanceData, type OverviewAnalyticsData } from "@/lib/api/property-analytics"

export function AnalyticsTab() {
  const [overviewData, setOverviewData] = useState<OverviewAnalyticsData | null>(null)
  const [propertyData, setPropertyData] = useState<PropertyAnalyticsData | null>(null)
  const [performanceData, setPerformanceData] = useState<PropertyPerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'performance'>('overview')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

  // Safe data access helpers - ONLY use properties that exist in your API
  const getOverviewData = () => ({
    period: overviewData?.period || 'Last 30d',
    userDemographics: {
      buyers: overviewData?.userDemographics?.buyers ?? 0,
      sellers: overviewData?.userDemographics?.sellers ?? 0,
      verifiedSellers: overviewData?.userDemographics?.verifiedSellers ?? 0,
      topLocations: overviewData?.userDemographics?.topLocations || []
    },
    topProperties: overviewData?.topProperties || [],
    // Calculate totals from existing data
    totalProperties: overviewData?.propertyMetrics?.total ?? 0,
    activeProperties: overviewData?.propertyMetrics?.active ?? 0,
    totalUsers: (overviewData?.userDemographics?.buyers ?? 0) + (overviewData?.userDemographics?.sellers ?? 0),
    totalWishlists: overviewData?.engagement?.wishlistAdds ?? 0
  })

  const getPropertyData = () => ({
    overview: {
      total: propertyData?.overview?.total ?? 0,
      active: propertyData?.overview?.active ?? 0,
      new: propertyData?.overview?.new ?? 0,
      inactive: propertyData?.overview?.inactive ?? 0
    },
    priceStats: {
      total_value: propertyData?.priceStats?.total_value ?? 0,
      average_price: propertyData?.priceStats?.avg_price ?? 0,
      min_price: propertyData?.priceStats?.min_price ?? 0,
      max_price: propertyData?.priceStats?.max_price ?? 0
    },
    typeDistribution: propertyData?.typeDistribution || [],
    topProperties: propertyData?.topProperties || [],
    recentActivity: propertyData?.recentActivity || []
  })

  const getPerformanceData = () => ({
    qualityMetrics: {
      properties_with_images: performanceData?.qualityMetrics?.properties_with_images ?? 0,
      properties_without_images: performanceData?.qualityMetrics?.properties_without_images ?? 0,
      avg_images_per_property: performanceData?.qualityMetrics?.avg_images_per_property ?? 0,
      properties_with_primary_image: performanceData?.qualityMetrics?.properties_with_primary_image ?? 0
    },
    availabilityStats: performanceData?.availabilityStats || [],
    ageDistribution: performanceData?.ageDistribution || {
      less_than_week: 0,
      less_than_month: 0,
      less_than_3_months: 0,
      older_than_3_months: 0
    },
    highEngagementProperties: performanceData?.highEngagementProperties || []
  })

  // Export functionality - FIXED to use only existing properties
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
        title: `Analytics Report - ${new Date().toLocaleDateString()}`,
        subject: 'Property Analytics Export',
        author: 'Admin User',
        creator: 'Real Estate Platform',
        keywords: 'analytics, properties, performance, export'
      })

      // Add header
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 210, 25, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('REAL ESTATE PLATFORM - ANALYTICS REPORT', 20, 15)

      // Generation info
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 22)
      doc.text(`Time Range: ${timeRange}`, 150, 22)

      let yPosition = 35

      // Summary section - FIXED to use calculated properties
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('ANALYTICS SUMMARY', 20, yPosition)

      yPosition += 8
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')

      const overview = getOverviewData()
      const summaryLines = [
        `Total Properties: ${overview.totalProperties}`,
        `Active Listings: ${overview.activeProperties}`,
        `Total Users: ${overview.totalUsers}`,
        `Total Wishlists: ${overview.totalWishlists}`,
        `Period: ${overview.period}`
      ]
      
      summaryLines.forEach((line, index) => {
        doc.text(line, 20, yPosition + (index * 5))
      })
      yPosition += (summaryLines.length * 5) + 10

      // Active Tab Data
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text(`ACTIVE TAB: ${activeTab.toUpperCase()}`, 20, yPosition)
      yPosition += 10

      // Add tab-specific data
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      
      switch (activeTab) {
        case 'overview':
          doc.text('User Demographics:', 20, yPosition)
          yPosition += 5
          doc.text(`Buyers: ${overview.userDemographics.buyers}`, 25, yPosition)
          yPosition += 4
          doc.text(`Sellers: ${overview.userDemographics.sellers}`, 25, yPosition)
          yPosition += 4
          doc.text(`Verified Sellers: ${overview.userDemographics.verifiedSellers}`, 25, yPosition)
          yPosition += 8
          
          doc.text('Top Locations:', 20, yPosition)
          yPosition += 5
          overview.userDemographics.topLocations.slice(0, 3).forEach((location, index) => {
            doc.text(`${index + 1}. ${location.city}: ${location.users} users (${location.percentage?.toFixed(1) ?? 0}%)`, 25, yPosition)
            yPosition += 4
          })
          yPosition += 8
          
          doc.text('Top Properties:', 20, yPosition)
          yPosition += 5
          overview.topProperties.slice(0, 5).forEach((property, index) => {
            doc.text(`${index + 1}. ${property.name}: ${property.wishlists} wishlists`, 25, yPosition)
            yPosition += 4
          })
          break
          
        case 'properties':
          const property = getPropertyData()
          doc.text('Property Statistics:', 20, yPosition)
          yPosition += 5
          doc.text(`Total: ${property.overview.total}`, 25, yPosition)
          yPosition += 4
          doc.text(`Active: ${property.overview.active}`, 25, yPosition)
          yPosition += 4
          doc.text(`New: ${property.overview.new}`, 25, yPosition)
          yPosition += 4
          doc.text(`Total Value: ${formatCurrency(property.priceStats.total_value)}`, 25, yPosition)
          yPosition += 8
          
          doc.text('Property Type Distribution:', 20, yPosition)
          yPosition += 5
          property.typeDistribution.forEach((type, index) => {
            doc.text(`${type.property_type}: ${type.count} properties, Avg: ${formatCurrency(type.avg_price)}`, 25, yPosition)
            yPosition += 4
          })
          break
          
        case 'performance':
          const performance = getPerformanceData()
          doc.text('Quality Metrics:', 20, yPosition)
          yPosition += 5
          doc.text(`Properties with Images: ${performance.qualityMetrics.properties_with_images}`, 25, yPosition)
          yPosition += 4
          doc.text(`Avg Images/Property: ${performance.qualityMetrics.avg_images_per_property.toFixed(1)}`, 25, yPosition)
          yPosition += 4
          doc.text(`With Primary Image: ${performance.qualityMetrics.properties_with_primary_image}`, 25, yPosition)
          yPosition += 4
          doc.text(`Without Images: ${performance.qualityMetrics.properties_without_images}`, 25, yPosition)
          yPosition += 8
          
          doc.text('High Engagement Properties:', 20, yPosition)
          yPosition += 5
          performance.highEngagementProperties.slice(0, 5).forEach((property, index) => {
            doc.text(`${index + 1}. ${property.name}: ${property.wishlists} wishlists, ${formatCurrency(property.price)}`, 25, yPosition)
            yPosition += 4
          })
          break
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(8)
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
        doc.text(`Real Estate Platform - ${new Date().getFullYear()}`, 20, 290)
      }

      doc.save(`analytics-report-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast.success("Analytics report exported to PDF")
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      toast.error("Could not generate PDF export")
    } finally {
      setExportLoading(null)
    }
  }

  const exportToExcel = async () => {
    setExportLoading('excel')
    try {
      let csvContent = ''
      
      // Header
      csvContent += 'Analytics Export\n'
      csvContent += `Generated,${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`
      csvContent += `Time Range,${timeRange}\n`
      csvContent += `Active Tab,${activeTab}\n`
      csvContent += '\n'

      const overview = getOverviewData()
      const property = getPropertyData()
      const performance = getPerformanceData()

      switch (activeTab) {
        case 'overview':
          csvContent += 'OVERVIEW DATA\n'
          csvContent += 'Metric,Value\n'
          csvContent += `Total Properties,${overview.totalProperties}\n`
          csvContent += `Active Properties,${overview.activeProperties}\n`
          csvContent += `Total Users,${overview.totalUsers}\n`
          csvContent += `Total Wishlists,${overview.totalWishlists}\n`
          csvContent += `Period,${overview.period}\n`
          csvContent += '\n'
          
          csvContent += 'USER DEMOGRAPHICS\n'
          csvContent += 'Category,Count\n'
          csvContent += `Buyers,${overview.userDemographics.buyers}\n`
          csvContent += `Sellers,${overview.userDemographics.sellers}\n`
          csvContent += `Verified Sellers,${overview.userDemographics.verifiedSellers}\n`
          csvContent += '\n'
          
          csvContent += 'TOP LOCATIONS\n'
          csvContent += 'Rank,City,Users,Percentage\n'
          overview.userDemographics.topLocations.forEach((location, index) => {
            csvContent += `${index + 1},${location.city},${location.users},${location.percentage?.toFixed(2) ?? 0}\n`
          })
          csvContent += '\n'
          
          csvContent += 'TOP PROPERTIES\n'
          csvContent += 'Rank,Property Name,Wishlists,Conversion Rate\n'
          overview.topProperties.forEach((property, index) => {
            csvContent += `${index + 1},"${property.name}",${property.wishlists},${property.conversionRate?.toFixed(2) ?? 0}\n`
          })
          break
          
        case 'properties':
          csvContent += 'PROPERTY OVERVIEW\n'
          csvContent += 'Metric,Value\n'
          csvContent += `Total Properties,${property.overview.total}\n`
          csvContent += `Active Properties,${property.overview.active}\n`
          csvContent += `New Properties,${property.overview.new}\n`
          csvContent += `Total Value,${property.priceStats.total_value}\n`
          csvContent += `Average Price,${property.priceStats.average_price}\n`
          csvContent += `Price Range,"${property.priceStats.min_price} - ${property.priceStats.max_price}"\n`
          csvContent += '\n'
          
          csvContent += 'PROPERTY TYPE DISTRIBUTION\n'
          csvContent += 'Type,Count,Average Price\n'
          property.typeDistribution.forEach(type => {
            csvContent += `${type.property_type},${type.count},${type.avg_price}\n`
          })
          csvContent += '\n'
          
          csvContent += 'TOP PROPERTIES\n'
          csvContent += 'Rank,Name,City,Type,Price,Wishlists\n'
          property.topProperties.forEach((property, index) => {
            csvContent += `${index + 1},"${property.name}",${property.city},${property.type},${property.price},${property.wishlists}\n`
          })
          csvContent += '\n'
          
          csvContent += 'RECENT ACTIVITY\n'
          csvContent += 'Date,Properties Added\n'
          property.recentActivity.forEach(activity => {
            csvContent += `${activity.created_at__date},${activity.count}\n`
          })
          break
          
        case 'performance':
          csvContent += 'QUALITY METRICS\n'
          csvContent += 'Metric,Value\n'
          csvContent += `Properties with Images,${performance.qualityMetrics.properties_with_images}\n`
          csvContent += `Properties without Images,${performance.qualityMetrics.properties_without_images}\n`
          csvContent += `Average Images per Property,${performance.qualityMetrics.avg_images_per_property.toFixed(2)}\n`
          csvContent += `Properties with Primary Image,${performance.qualityMetrics.properties_with_primary_image}\n`
          csvContent += '\n'
          
          csvContent += 'AVAILABILITY STATS\n'
          csvContent += 'Status,Count\n'
          performance.availabilityStats.forEach(stat => {
            csvContent += `${stat.is_available ? 'Available' : 'Not Available'},${stat.count}\n`
          })
          csvContent += '\n'
          
          csvContent += 'AGE DISTRIBUTION\n'
          csvContent += 'Age Category,Count\n'
          Object.entries(performance.ageDistribution).forEach(([key, value]) => {
            csvContent += `${formatAgeCategory(key)},${value}\n`
          })
          csvContent += '\n'
          
          csvContent += 'HIGH ENGAGEMENT PROPERTIES\n'
          csvContent += 'Rank,Name,City,Price,Wishlists,Available\n'
          performance.highEngagementProperties.forEach((property, index) => {
            csvContent += `${index + 1},"${property.name}",${property.city},${property.price},${property.wishlists},${property.is_available ? 'Yes' : 'No'}\n`
          })
          break
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `analytics-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success("Analytics data exported to Excel")
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error("Could not generate Excel export")
    } finally {
      setExportLoading(null)
    }
  }

  const exportToPNG = async () => {
    setExportLoading('png')
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // Set canvas size
      canvas.width = 1200
      canvas.height = 1600
      
      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Header
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(0, 0, canvas.width, 80)
      
      // Title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px Arial'
      ctx.fillText('Real Estate Platform - Analytics Report', 40, 48)
      
      // Generation info
      ctx.fillStyle = '#666666'
      ctx.font = '16px Arial'
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} | Time Range: ${timeRange} | Tab: ${activeTab}`, 40, 120)
      
      let yPos = 160

      // Summary section - FIXED to use calculated properties
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 24px Arial'
      ctx.fillText('Analytics Summary', 40, yPos)
      yPos += 40

      ctx.font = '16px Arial'
      ctx.fillStyle = '#666666'
      
      const overview = getOverviewData()
      const summaryLines = [
        `Total Properties: ${overview.totalProperties}`,
        `Active Listings: ${overview.activeProperties}`,
        `Total Users: ${overview.totalUsers}`,
        `Total Wishlists: ${overview.totalWishlists}`
      ]
      
      summaryLines.forEach(line => {
        ctx.fillText(line, 60, yPos)
        yPos += 30
      })

      yPos += 20

      // Active tab data
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 24px Arial'
      ctx.fillText(`${activeTab.toUpperCase()} DATA`, 40, yPos)
      yPos += 40

      ctx.font = '14px Arial'
      ctx.fillStyle = '#666666'

      switch (activeTab) {
        case 'overview':
          ctx.fillText('User Demographics:', 60, yPos)
          yPos += 25
          ctx.fillText(`• Buyers: ${overview.userDemographics.buyers}`, 80, yPos)
          yPos += 20
          ctx.fillText(`• Sellers: ${overview.userDemographics.sellers}`, 80, yPos)
          yPos += 20
          ctx.fillText(`• Verified Sellers: ${overview.userDemographics.verifiedSellers}`, 80, yPos)
          yPos += 30
          
          ctx.fillText('Top Properties:', 60, yPos)
          yPos += 25
          overview.topProperties.slice(0, 5).forEach((property, index) => {
            ctx.fillText(`${index + 1}. ${property.name}: ${property.wishlists} wishlists`, 80, yPos)
            yPos += 20
          })
          break
          
        case 'properties':
          const property = getPropertyData()
          ctx.fillText('Property Statistics:', 60, yPos)
          yPos += 25
          ctx.fillText(`• Total: ${property.overview.total}`, 80, yPos)
          yPos += 20
          ctx.fillText(`• Active: ${property.overview.active}`, 80, yPos)
          yPos += 20
          ctx.fillText(`• New: ${property.overview.new}`, 80, yPos)
          yPos += 20
          ctx.fillText(`• Total Value: ${formatCurrency(property.priceStats.total_value)}`, 80, yPos)
          yPos += 30
          
          ctx.fillText('Property Types:', 60, yPos)
          yPos += 25
          property.typeDistribution.slice(0, 5).forEach((type, index) => {
            ctx.fillText(`${index + 1}. ${type.property_type}: ${type.count} properties`, 80, yPos)
            yPos += 20
          })
          break
          
        case 'performance':
          const performance = getPerformanceData()
          ctx.fillText('Quality Metrics:', 60, yPos)
          yPos += 25
          ctx.fillText(`• Properties with Images: ${performance.qualityMetrics.properties_with_images}`, 80, yPos)
          yPos += 20
          ctx.fillText(`• Avg Images/Property: ${performance.qualityMetrics.avg_images_per_property.toFixed(1)}`, 80, yPos)
          yPos += 20
          ctx.fillText(`• Without Images: ${performance.qualityMetrics.properties_without_images}`, 80, yPos)
          yPos += 30
          
          ctx.fillText('Top Properties:', 60, yPos)
          yPos += 25
          performance.highEngagementProperties.slice(0, 5).forEach((property, index) => {
            ctx.fillText(`${index + 1}. ${property.name}: ${property.wishlists} wishlists`, 80, yPos)
            yPos += 20
          })
          break
      }

      // Footer
      ctx.fillStyle = '#666666'
      ctx.font = '12px Arial'
      ctx.fillText(`Real Estate Platform - ${new Date().getFullYear()}`, 40, 1550)
      ctx.fillText('Analytics Dashboard Export', 40, 1570)

      // Convert to PNG and download
      const link = document.createElement('a')
      link.download = `analytics-snapshot-${activeTab}-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
      
      toast.success("Analytics snapshot exported to PNG")
    } catch (error) {
      console.error('Error exporting to PNG:', error)
      toast.error("Could not generate PNG export")
    } finally {
      setExportLoading(null)
    }
  }

  // Fetch data function - keep this the same
  const fetchAllData = async () => {
    setLoading(true)
    
    try {
      // Fetch all data in parallel
      const [overviewData, propertyAnalyticsData] = await Promise.all([
        propertyAnalyticsApi.getOverviewAnalytics(timeRange),
        propertyAnalyticsApi.getPropertyAnalytics(timeRange)
      ])
      
      setOverviewData(overviewData)
      setPropertyData(propertyAnalyticsData)
      
      // Try to fetch performance data, but don't fail if it doesn't exist
      try {
        const performanceData = await propertyAnalyticsApi.getPropertyPerformance()
        setPerformanceData(performanceData)
      } catch (error) {
        console.warn('Performance data not available:', error)
        // Set mock performance data for now
        setPerformanceData({
          highEngagementProperties: propertyAnalyticsData.topProperties?.slice(0, 8).map(prop => ({
            ...prop,
            is_available: true
          })) || [],
          qualityMetrics: {
            properties_without_images: 3,
            properties_with_images: 8,
            avg_images_per_property: 2.5,
            properties_with_primary_image: 8
          },
          availabilityStats: [
            { is_available: true, count: propertyAnalyticsData.overview?.active || 0 },
            { is_available: false, count: propertyAnalyticsData.overview?.inactive || 0 }
          ],
          ageDistribution: {
            less_than_week: 2,
            less_than_month: 5,
            less_than_3_months: 3,
            older_than_3_months: 1
          }
        })
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      toast.error(error.message || "Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

   
  useEffect(() => {
    fetchAllData()
  }, [timeRange])

  // Keep all your helper functions the same...
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4" />
      case 'down': return <ArrowDown className="h-4 w-4" />
      case 'stable': return <Minus className="h-4 w-4" />
    }
  }

  const formatAgeCategory = (key: string): string => {
    if (!key) return 'Unknown';
    return key.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getShortAgeName = (key: string): string => {
    if (!key) return 'Unknown';
    if (key.includes('week')) return '<1 Week';
    if (key.includes('month') && !key.includes('3')) return '<1 Month';
    if (key.includes('3')) return '1-3 Months';
    return '3+ Months';
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400'
      case 'down': return 'text-red-600 dark:text-red-400'
      case 'stable': return 'text-yellow-600 dark:text-yellow-400'
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  // Keep all your tab components the same...
  const OverviewTab = () => {
    const overview = getOverviewData()
    return (
      <div className="space-y-6">
        {/* User Demographics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">User Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">Buyers</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatNumber(overview.userDemographics.buyers)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">Sellers</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatNumber(overview.userDemographics.sellers)}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <div>
                        <div className="font-medium">Verified Sellers</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatNumber(overview.userDemographics.verifiedSellers)}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Top Locations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {overview.userDemographics.topLocations.slice(0, 3).map((location, index) => (
                    <div key={location.city} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium capitalize">{location.city}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(location.users)} users
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{location.percentage?.toFixed(1) ?? 0}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Properties */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Properties by Wishlists
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-6">
                {/* Simple Bar Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={overview.topProperties.slice(0, 5).map((property, index) => ({
                        name: `#${index + 1}`,
                        wishlists: property.wishlists,
                        conversion: property.conversionRate || 0,
                        fullName: property.name
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="name" 
                        label={{ value: 'Property Rank', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === 'wishlists') return [formatNumber(Number(value)), 'Wishlists'];
                          if (name === 'conversion') return [`${Number(value).toFixed(1)}%`, 'Conversion Rate'];
                          return [value, name];
                        }}
                        labelFormatter={(label, props) => {
                          if (props && props[0]) {
                            return `Property: ${props[0].payload.fullName}`;
                          }
                          return label;
                        }}
                      />
                      <Bar 
                        dataKey="wishlists" 
                        name="Wishlists"
                        fill="#ec4899"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Property Cards */}
                <div className="grid grid-cols-1 gap-3">
                  {overview.topProperties.slice(0, 4).map((property, index) => (
                    <div
                      key={property.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg text-white flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{property.name}</h4>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-pink-600">{property.wishlists}</div>
                          <div className="text-xs text-muted-foreground">wishlists</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Keep PropertyOverview and PropertyPerformance components exactly as they are...
  const PropertyOverview = () => {
    const property = getPropertyData()
    return (
      <div className="space-y-6">
        {/* Property Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{formatNumber(property.overview.total)}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
              <Home className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(property.overview.active)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">New Properties</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{formatNumber(property.overview.new)}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(property.priceStats.total_value)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Property Type Distribution */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Property Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-4">
                {/* Pie Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={property.typeDistribution.map((type, index) => ({
                          name: type.property_type?.charAt(0).toUpperCase() + type.property_type?.slice(1) || 'Unknown',
                          value: type.count,
                          avgPrice: type.avg_price,
                          color: COLORS[index % COLORS.length]
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {property.typeDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => {
                          if (name === 'value') {
                            return [formatNumber(Number(value)), 'Properties'];
                          }
                          return [formatCurrency(Number(value)), 'Avg Price'];
                        }}
                        labelFormatter={(label) => `Type: ${label}`}
                      />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="font-medium text-muted-foreground">Total Properties</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatNumber(property.typeDistribution.reduce((sum, type) => sum + type.count, 0))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-muted-foreground">Average Price</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        property.typeDistribution.reduce((sum, type) => sum + type.avg_price, 0) / 
                        Math.max(property.typeDistribution.length, 1)
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Breakdown by Type</div>
                  <div className="space-y-2 max-h-70 overflow-y-auto">
                    {property.typeDistribution.map((type, index) => (
                      <div 
                        key={type.property_type} 
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium capitalize">
                            {type.property_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {formatNumber(type.count)} properties
                          </span>
                          <span className="font-medium">
                            {formatCurrency(type.avg_price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Popular Properties - Simple Bar Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Most Popular Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-6">
                {/* Vertical Bar Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={property.topProperties.slice(0, 5).map((property, index) => ({
                        name: `#${index + 1}`,
                        wishlists: property.wishlists,
                        price: property.price / 1000,
                        fullName: property.name,
                        city: property.city,
                        type: property.type
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="name" 
                        label={{ value: 'Property Rank', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === 'wishlists') return [formatNumber(Number(value)), 'Wishlists'];
                          if (name === 'price') return [formatCurrency(Number(value) * 1000), 'Price'];
                          return [value, name];
                        }}
                        labelFormatter={(label, props) => {
                          if (props && props[0]) {
                            return `Property: ${props[0].payload.fullName}`;
                          }
                          return label;
                        }}
                      />
                      <Bar 
                        dataKey="wishlists" 
                        name="Wishlists"
                        fill="#ec4899"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Property Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.topProperties.slice(0, 4).map((property, index) => (
                    <div
                      key={property.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div>
                            <h4 className="font-semibold text-sm">{property.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.city}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4 text-pink-500" />
                              <span className="font-bold">{property.wishlists}</span>
                            </div>
                            <div className="text-green-600 font-semibold">
                              {formatCurrency(property.price)}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="ml-2 capitalize text-xs"
                        >
                          {property.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const PropertyPerformance = () => {
    const performance = getPerformanceData()
    return (
      <div className="space-y-6">
        {/* Quality Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Properties with Images</CardTitle>
              <Image className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(performance.qualityMetrics.properties_with_images)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {((performance.qualityMetrics.properties_with_images / 
                      Math.max(performance.qualityMetrics.properties_with_images + 
                       performance.qualityMetrics.properties_without_images, 1)) * 100).toFixed(1)}% coverage
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Avg Images/Property</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {performance.qualityMetrics.avg_images_per_property.toFixed(1)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">With Primary Image</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatNumber(performance.qualityMetrics.properties_with_primary_image)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Without Images</CardTitle>
              <Eye className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-orange-600">
                  {formatNumber(performance.qualityMetrics.properties_without_images)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* High Engagement Properties - Radar Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              High Engagement Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <div className="space-y-6">
                {/* Radar Chart for Top Properties */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={performance.highEngagementProperties.slice(0, 6).map((property, index) => ({
                        subject: property.name?.length > 15 ? property.name.substring(0, 15) + '...' : property.name || 'Unknown',
                        wishlists: property.wishlists,
                        priceScore: Math.min(100, (property.price / 1000000) * 100),
                        engagement: Math.min(100, property.wishlists * 10),
                        availability: property.is_available ? 100 : 0,
                        fullName: property.name,
                        city: property.city,
                        actualPrice: property.price
                      }))}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Wishlists"
                        dataKey="wishlists"
                        stroke="#ec4899"
                        fill="#ec4899"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Price Score"
                        dataKey="priceScore"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Radar
                        name="Engagement"
                        dataKey="engagement"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'wishlists') {
                            return [formatNumber(Number(value)), 'Wishlists'];
                          }
                          if (name === 'priceScore') {
                            return [formatCurrency(props.payload.actualPrice), 'Price'];
                          }
                          if (name === 'engagement') {
                            return [`${Math.round(Number(value))}%`, 'Engagement Score'];
                          }
                          if (name === 'availability') {
                            return [Number(value) === 100 ? 'Available' : 'Not Available', 'Status'];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label, props) => {
                          if (props && props[0]) {
                            return `Property: ${props[0].payload.fullName}\nCity: ${props[0].payload.city}`;
                          }
                          return label;
                        }}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Enhanced Property Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {performance.highEngagementProperties.slice(0, 6).map((property, index) => (
                    <div
                      key={property.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors relative"
                    >
                      {/* Rank Badge */}
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      
                      <div className="space-y-3">
                        {/* Property Header */}
                        <div>
                          <h4 className="font-semibold text-sm truncate">{property.name}</h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            {property.city}
                          </div>
                        </div>

                        {/* Engagement Metrics */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Wishlists</span>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-pink-500" />
                              <span className="font-bold text-pink-600">{property.wishlists}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Price</span>
                            <span className="font-semibold text-green-600">{formatCurrency(property.price)}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Status</span>
                            <Badge 
                              variant={property.is_available ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              {property.is_available ? "Available" : "Not Available"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="text-center">
                    <div className="text-xl font-bold text-pink-600">
                      {formatNumber(
                        performance.highEngagementProperties.reduce((sum, prop) => sum + prop.wishlists, 0)
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Wishlists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(
                        performance.highEngagementProperties.reduce((sum, prop) => sum + prop.price, 0) / 
                        Math.max(performance.highEngagementProperties.length, 1)
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Price</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {performance.highEngagementProperties.filter(p => p.is_available).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      {Math.round(
                        (performance.highEngagementProperties.reduce((sum, prop) => sum + prop.wishlists, 0) / 
                        Math.max(performance.highEngagementProperties.length, 1)) * 10
                      )}%
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Engagement</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Timeline */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-6">
                {/* Area Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={propertyData?.recentActivity?.slice(0, 14).map(activity => ({
                        date: new Date(activity.created_at__date),
                        dateString: new Date(activity.created_at__date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        }),
                        properties: activity.count,
                        fullDate: new Date(activity.created_at__date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      })) || []}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorProperties" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="dateString"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatNumber(Number(value)), 'Properties']}
                        labelFormatter={(label, props) => {
                          if (props && props[0]) {
                            return props[0].payload.fullDate;
                          }
                          return label;
                        }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="properties" 
                        stroke="#3b82f6" 
                        fill="url(#colorProperties)" 
                        strokeWidth={2}
                        name="Properties Added"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(propertyData?.recentActivity?.reduce((sum, day) => sum + day.count, 0) || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Added</div>
                  </div>
                  <div className="space-y-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(
                        Math.max(...(propertyData?.recentActivity?.map(day => day.count) || [0]))
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Peak Day</div>
                  </div>
                  <div className="space-y-1 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatNumber(
                        (propertyData?.recentActivity?.reduce((sum, day) => sum + day.count, 0) || 0) / 
                        Math.max(propertyData?.recentActivity?.length || 1, 1)
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Daily Avg</div>
                  </div>
                </div>

                {/* Recent Days Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Daily Breakdown</h4>
                  <div className="space-y-2">
                    {(propertyData?.recentActivity?.slice(0, 7) || []).map((activity, index) => {
                      const maxCount = Math.max(...(propertyData?.recentActivity?.map(a => a.count) || [1]))
                      const percentage = (activity.count / maxCount) * 100;
                      return (
                        <div key={activity.created_at__date} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {new Date(activity.created_at__date).toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-20 bg-secondary rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{activity.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Age Distribution */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Property Age Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-6">
                {/* Pie Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={Object.entries(performance.ageDistribution).map(([key, value], index) => ({
                          name: key.replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' '),
                          value: value,
                          count: value,
                          shortName: getShortAgeName(key),
                          color: COLORS[index % COLORS.length]
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {Object.entries(performance.ageDistribution).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatNumber(Number(value)), 'Properties']}
                        labelFormatter={(label) => `Age: ${label}`}
                      />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                {/* Age Analysis */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-blue-600">Freshness Score</div>
                    <div className="text-lg font-bold">
                      {(() => {
                        const total = Object.values(performance.ageDistribution).reduce((sum, count) => sum + count, 0);
                        const recent = (performance.ageDistribution.less_than_week || 0) + (performance.ageDistribution.less_than_month || 0);
                        return total > 0 ? `${((recent / total) * 100).toFixed(1)}%` : '0%';
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-purple-600">Inventory Health</div>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const total = Object.values(performance.ageDistribution).reduce((sum, count) => sum + count, 0);
                        const recent = (performance.ageDistribution.less_than_week || 0) + (performance.ageDistribution.less_than_month || 0);
                        return recent > total * 0.5 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-bold text-green-500">Healthy</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-bold text-orange-500">Needs Refresh</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(performance.ageDistribution).map(([key, value], index) => (
                    <div key={key} className="text-center p-3 rounded-lg border">
                      <div 
                        className="text-lg font-bold"
                        style={{ color: COLORS[index % COLORS.length] }}
                      >
                        {value}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ').split(' ').slice(0, 2).join(' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Availability */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Property Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="space-y-6">
                {/* Gauge-style Visualization */}
                <div className="h-40 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={performance.availabilityStats.map((stat, index) => ({
                          name: stat.is_available ? 'Available' : 'Not Available',
                          value: stat.count,
                          fill: stat.is_available ? '#10b981' : '#ef4444'
                        }))}
                        cx="50%"
                        cy="90%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        startAngle={180}
                        endAngle={0}
                      >
                        {performance.availabilityStats.map((stat, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={stat.is_available ? '#10b981' : '#ef4444'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatNumber(Number(value)), 'Properties']}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {(() => {
                        const total = performance.availabilityStats.reduce((sum, s) => sum + s.count, 0);
                        const available = performance.availabilityStats.find(stat => stat.is_available)?.count || 0;
                        return total > 0 ? `${((available / total) * 100).toFixed(0)}%` : '0%';
                      })()}
                    </div>
                    <div className="text-sm text-muted-foreground">Availability Rate</div>
                  </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 gap-3">
                  {performance.availabilityStats.map((stat, index) => {
                    const total = performance.availabilityStats.reduce((sum, s) => sum + s.count, 0);
                    const percentage = total > 0 ? (stat.count / total) * 100 : 0;
                    
                    return (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${
                          stat.is_available 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                            : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className={`h-5 w-5 ${
                              stat.is_available ? 'text-green-500' : 'text-red-500'
                            }`} />
                            <div>
                              <div className="font-semibold">
                                {stat.is_available ? 'Available Properties' : 'Unavailable Properties'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {stat.count} properties • {percentage.toFixed(1)}% of total
                              </div>
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${
                            stat.is_available ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.count}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-foreground">Analytics</h2>
          <p className="text-muted-foreground">
            {overviewData ? `Data for ${overviewData.period}` : 'Loading platform insights...'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Export Button */}
          <div className="relative group">
            <Button 
              variant="outline"
              size="sm"
              disabled={exportLoading !== null || loading}
              className="rounded-lg border-2 hover:border-primary/50 transition-all duration-300"
            >
              <Download className={`h-4 w-4 mr-2 ${exportLoading ? 'animate-spin' : ''}`} />
              Export
            </Button>
            
            {/* Export Options Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-background border-2 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="p-2 space-y-1">
                <button
                  onClick={exportToPDF}
                  disabled={exportLoading !== null || loading}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  {exportLoading === 'pdf' ? 'Generating...' : 'Export as PDF'}
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={exportLoading !== null || loading}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <TableIcon className="h-4 w-4 text-green-500" />
                  {exportLoading === 'excel' ? 'Generating...' : 'Export as Excel'}
                </button>
                <button
                  onClick={exportToPNG}
                  disabled={exportLoading !== null || loading}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <Image className="h-4 w-4 text-blue-500" />
                  {exportLoading === 'png' ? 'Generating...' : 'Export as PNG'}
                </button>
              </div>
            </div>
          </div>

          {/* Time Range Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeRange('7d')}
            className={timeRange === '7d' ? 'bg-primary/10 border-primary' : ''}
          >
            7D
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeRange('30d')}
            className={timeRange === '30d' ? 'bg-primary/10 border-primary' : ''}
          >
            30D
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeRange('90d')}
            className={timeRange === '90d' ? 'bg-primary/10 border-primary' : ''}
          >
            90D
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeRange('1y')}
            className={timeRange === '1y' ? 'bg-primary/10 border-primary' : ''}
          >
            1Y
          </Button>
          
          <Button 
            onClick={fetchAllData} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        <Button
          variant={activeTab === 'overview' ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab('overview')}
          className="flex-1"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'properties' ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab('properties')}
          className="flex-1"
        >
          <Building className="h-4 w-4 mr-2" />
          Properties
        </Button>
         <Button
  variant={activeTab === 'performance' ? "default" : "ghost"}
  size="sm"
  onClick={() => setActiveTab('performance')}
  className="flex-1"
>
  <Target className="h-4 w-4 mr-2" />
  Performance
</Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'properties' && <PropertyOverview />}
      {activeTab === 'performance' && <PropertyPerformance />}
    </div>
  )
}