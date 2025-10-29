"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { BuyerDashboard } from "@/components/dashboards/buyer-dashboard"
import { SellerDashboard } from "@/components/dashboards/seller-dashboard"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-80 mb-8 rounded-lg" />
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {user.role === "buyer" && <BuyerDashboard />}
      {user.role === "seller" && <SellerDashboard />}
      {user.role === "admin" && <AdminDashboard />}
    </div>
  )
}