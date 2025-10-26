"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { Home, Eye, DollarSign, MessageSquare, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { propertiesApi } from "@/lib/api/properties"
import type { Property } from "@/types/property"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function SellerDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [myListings, setMyListings] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadMyProperties()
  }, [])

  const loadMyProperties = async () => {
    try {
      setIsLoading(true)
      const properties = await propertiesApi.getMyProperties()
      setMyListings(properties)
    } catch (error) {
      console.error("[v0] Failed to load properties:", error)
      toast({
        title: "Error",
        description: "Failed to load your properties",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProperty = async () => {
    if (!deletePropertyId) return

    try {
      setIsDeleting(true)
      await propertiesApi.deleteProperty(deletePropertyId)
      setMyListings(myListings.filter((p) => p.id !== deletePropertyId))
      toast({
        title: "Success",
        description: "Property deleted successfully",
      })
    } catch (error) {
      console.error("[v0] Failed to delete property:", error)
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeletePropertyId(null)
    }
  }

  const activeListings = myListings.filter((p) => p.status === "active").length
  const totalViews = myListings.reduce((sum, p) => sum + p.views, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
          <p className="text-lg text-muted-foreground">Manage your property listings and track performance</p>
        </div>
        <Button asChild size="lg" className="gap-2 font-medium shadow-sm h-12 px-6">
          <Link href="/dashboard/properties/new">
            <Plus className="h-5 w-5" />
            List New Property
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Home className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeListings}</div>
            <p className="text-xs text-muted-foreground mt-1">{myListings.length} total listings</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all listings</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Offers Received</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">3 pending review</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">15</div>
            <p className="text-xs text-muted-foreground mt-1">5 unread</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="listings" className="space-y-6">
        <TabsList className="bg-background border-2">
          <TabsTrigger
            value="listings"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            My Listings
          </TabsTrigger>
          <TabsTrigger
            value="offers"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Offers
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">My Property Listings</h2>
              <p className="text-muted-foreground text-lg">Manage and track your listed properties</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : myListings.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Home className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">No listings yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md leading-relaxed">
                  Start by creating your first property listing
                </p>
                <Button asChild size="lg" className="font-medium">
                  <Link href="/dashboard/properties/new">Create Listing</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myListings.map((property) => (
                <Card key={property.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        <div className="w-32 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {property.images[0] && (
                            <img
                              src={property.images[0].url || "/placeholder.svg"}
                              alt={property.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{property.name}</h3>
                            <Badge
                              variant={property.status === "active" ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {property.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {property.city}, {property.state}
                          </p>
                          <p className="text-lg font-bold text-primary">${property.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/properties/${property.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/properties/${property.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletePropertyId(property.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Views</p>
                        <p className="font-semibold">{property.views}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bedrooms</p>
                        <p className="font-semibold">{property.bedrooms}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bathrooms</p>
                        <p className="font-semibold">{property.bathrooms}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Sq Ft</p>
                        <p className="font-semibold">{property.squareFeet.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="offers" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Offers Received</h2>
            <p className="text-muted-foreground text-lg">Review and respond to buyer offers</p>
          </div>

          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <DollarSign className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No offers yet</h3>
              <p className="text-muted-foreground text-center max-w-md leading-relaxed">
                When buyers make offers on your properties, they'll appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Performance Analytics</h2>
            <p className="text-muted-foreground text-lg">Track how your listings are performing</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Views Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
                  Chart placeholder - Views trend
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
                  Chart placeholder - Engagement data
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Messages</h2>
            <p className="text-muted-foreground text-lg">Communicate with potential buyers</p>
          </div>

          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">No messages</h3>
              <p className="text-muted-foreground text-center max-w-md leading-relaxed">
                Your conversations with buyers will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deletePropertyId} onOpenChange={() => setDeletePropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
