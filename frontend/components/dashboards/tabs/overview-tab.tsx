"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { 
  Users, UserCheck, TrendingUp, Shield, User,
  FileText, Heart, Image, Building, Home,
  CheckCircle, XCircle, Clock
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export function OverviewTab() {
  const { token } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    pendingVerifications: 0,
    totalWishlists: 0,
    totalImages: 0,
    activeUsers: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch overview stats
  useEffect(() => {
    // Your API calls here
    const fetchStats = async () => {
      if (!token) return
      
      setLoading(true)
      try {
        // Simulate API calls
        setTimeout(() => {
          setStats({
            totalUsers: 1247,
            totalProperties: 543,
            pendingVerifications: 23,
            totalWishlists: 892,
            totalImages: 2156,
            activeUsers: 987
          })
          setLoading(false)
        }, 1000)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load dashboard stats",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchStats()
  }, [token])

  const statCards = [
    { 
      title: "Total Users", 
      value: stats.totalUsers, 
      sub: `${stats.activeUsers} active`, 
      icon: Users,
      color: "blue"
    },
    { 
      title: "Properties", 
      value: stats.totalProperties, 
      sub: "Listed properties", 
      icon: Building,
      color: "green"
    },
    { 
      title: "Pending Verifications", 
      value: stats.pendingVerifications, 
      sub: "Need review", 
      icon: UserCheck,
      color: "orange"
    },
    { 
      title: "Wishlists", 
      value: stats.totalWishlists, 
      sub: "User collections", 
      icon: Heart,
      color: "pink"
    },
    { 
      title: "Property Images", 
      value: stats.totalImages, 
      sub: "Uploaded images", 
      icon: Image,
      color: "purple"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border hover:border-primary/50 transition-all hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  {loading ? (
                    <Skeleton className="h-4 w-4 rounded-full" />
                  ) : (
                    <stat.icon className="h-4 w-4 text-primary" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <>
                    <Skeleton className="h-7 w-16 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent activity items */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
                <Badge variant="outline">User</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Property listed</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
                <Badge variant="outline">Property</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex-col gap-1">
                <Users className="h-5 w-5" />
                <span className="text-xs">Manage Users</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1">
                <UserCheck className="h-5 w-5" />
                <span className="text-xs">Review Verifications</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1">
                <Building className="h-5 w-5" />
                <span className="text-xs">View Properties</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1">
                <Image className="h-5 w-5" />
                <span className="text-xs">Manage Images</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}