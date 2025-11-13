"use client"

import { useState, useEffect } from "react"
import { AdminDashboardLayout } from "./admin-dashboard-layout"
import { UsersTab } from "./tabs/users-tab"
import { VerificationsTab } from "./tabs/verifications-tab"
import { PropertiesTab } from "./tabs/properties-tab"
import { WishlistsTab } from "./tabs/wishlists-tab"
import { PropertyImagesTab } from "./tabs/property-images-tab"
import { AnalyticsTab } from "./tabs/analytics-tab"
import { OverviewTab } from "./tabs/overview-tab"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <AdminDashboardLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
    >
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "properties" && <PropertiesTab />}
      {activeTab === "verifications" && <VerificationsTab />}
      {activeTab === "wishlists" && <WishlistsTab />}
      {activeTab === "property-images" && <PropertyImagesTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
    </AdminDashboardLayout>
  )
}