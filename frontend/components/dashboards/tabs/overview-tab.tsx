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
  Sparkles, Rocket, Zap
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