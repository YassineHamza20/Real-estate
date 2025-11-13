"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { 
  Users, Home, TrendingUp, UserCheck, Heart, 
  Image, Building, Shield, RefreshCw 
} from "lucide-react"
import { motion } from "framer-motion"

interface AdminDashboardLayoutProps {
  children: ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

export function AdminDashboardLayout({ 
  children, 
  activeTab, 
  onTabChange 
}: AdminDashboardLayoutProps) {
  const { user: currentUser } = useAuth()

  // Don't render if user is not admin
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to access the admin dashboard.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Managing platform as {currentUser?.username}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 bg-card border p-1 h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">
            <Home className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">
            <Users className="h-4 w-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">
            <Building className="h-4 w-4 mr-2" /> Properties
          </TabsTrigger>
          <TabsTrigger value="verifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">
            <UserCheck className="h-4 w-4 mr-2" /> Verifications
          </TabsTrigger>
          <TabsTrigger value="wishlists" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">
            <Heart className="h-4 w-4 mr-2" /> Wishlists
          </TabsTrigger>
          <TabsTrigger value="property-images" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">
            <Image className="h-4 w-4 mr-2" /> Images
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-2">
            <TrendingUp className="h-4 w-4 mr-2" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value={activeTab} className="space-y-6 m-0">
          {children}
        </TabsContent>
      </Tabs>
    </div>
  )
}