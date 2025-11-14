"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { adminVerificationsApi, SellerVerification, VerificationStats } from "@/lib/api/adminVerifications"
import { 
  Search, MoreVertical, CheckCircle, XCircle, Loader2, Eye, 
  User, FileText, Calendar, RefreshCw, Download, UserCheck, UserX
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { VerificationDetailModal } from "../modals/verification-detail-modal"

export function VerificationsTab() {
  const { user, isAuthenticated } = useAuth()
  const [verifications, setVerifications] = useState<SellerVerification[]>([])
  const [loading, setLoading] = useState({
    verifications: false,
    stats: false
  })
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState<VerificationStats | null>(null)
  
  // Verification detail modal state
  const [selectedVerification, setSelectedVerification] = useState<SellerVerification | null>(null)
  const [isVerificationDetailOpen, setIsVerificationDetailOpen] = useState(false)

  // Selected verifications for bulk actions
  const [selectedVerifications, setSelectedVerifications] = useState<number[]>([])

  // Add debug logging for selected verification
  useEffect(() => {
    if (selectedVerification) {
      console.log("🔄 Selected verification updated:", selectedVerification)
      console.log("👤 Selected verification user data:", selectedVerification.user)
    }
  }, [selectedVerification])

  // Fetch verifications
  const fetchVerifications = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access verifications",
        variant: "destructive",
      })
      return
    }
    
    setLoading(prev => ({ ...prev, verifications: true }))
    try {
      console.log("🔄 Starting to fetch verifications...")
      const data = await adminVerificationsApi.getVerifications(statusFilter)
      console.log("📦 Raw data from API:", data)
      
      // Check the first verification to see user data
      if (data.length > 0) {
        console.log("🔍 First verification sample:", data[0])
        console.log("👤 First verification user data:", data[0].user)
      }
      
      setVerifications(data)
      console.log("✅ Verifications set in state")
    } catch (error: any) {
      console.error("❌ Failed to fetch verifications:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load verifications",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, verifications: false }))
    }
  }, [isAuthenticated, statusFilter])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return
    
    setLoading(prev => ({ ...prev, stats: true }))
    try {
      const statsData = await adminVerificationsApi.getVerificationStats()
      setStats(statsData)
    } catch (error: any) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }, [isAuthenticated])

  // Handle verification actions
  const handleVerificationAction = async (verificationId: number, action: 'approve' | 'reject', adminNotes?: string) => {
    if (!isAuthenticated) return
    
    try {
      await adminVerificationsApi.updateVerification(verificationId, { 
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_notes: adminNotes || ''
      })
      
      toast({
        title: "Success",
        description: `Verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      })
      
      fetchVerifications()
      fetchStats()
      
      if (action === 'reject') {
        setIsVerificationDetailOpen(false)
        setSelectedVerifications(prev => prev.filter(id => id !== verificationId))
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} verification`,
        variant: "destructive",
      })
    }
  }

  // Handle bulk actions
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (!isAuthenticated || selectedVerifications.length === 0) return
    
    try {
      await adminVerificationsApi.bulkVerificationAction(selectedVerifications, action)
      toast({
        title: "Success",
        description: `Bulk ${action} completed for ${selectedVerifications.length} verifications`,
      })
      setSelectedVerifications([])
      fetchVerifications()
      fetchStats()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} verifications`,
        variant: "destructive",
      })
    }
  }

  // Toggle verification selection
  const toggleVerificationSelection = (verificationId: number) => {
    setSelectedVerifications(prev => 
      prev.includes(verificationId) 
        ? prev.filter(id => id !== verificationId)
        : [...prev, verificationId]
    )
  }

  // Select all verifications
  const selectAllVerifications = () => {
    if (selectedVerifications.length === verifications.length) {
      setSelectedVerifications([])
    } else {
      setSelectedVerifications(verifications.map(v => v.id))
    }
  }

  // Enhanced view details handler with debugging
  const handleViewDetails = (verification: SellerVerification) => {
    console.log("🔄 handleViewDetails called with:", verification)
    console.log("👤 User data in handleViewDetails:", verification.user)
    console.log("📄 Document in handleViewDetails:", verification.document)
    
    setSelectedVerification(verification)
    setIsVerificationDetailOpen(true)
    
    // Double check after state update
    setTimeout(() => {
      console.log("⏱️ After state update - selectedVerification:", selectedVerification)
    }, 100)
  }

  // Load data on mount
  useEffect(() => {
    console.log("🏁 VerificationsTab mounted")
    fetchVerifications()
    fetchStats()
  }, [fetchVerifications, fetchStats])

  // Refresh verifications when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchVerifications()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [statusFilter, fetchVerifications])

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total_verifications}</p>
                </div>
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_verifications}</p>
                </div>
                <Loader2 className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved_verifications}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected_verifications}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seller Verifications</h2>
          <p className="text-muted-foreground">
            {verifications.length} verification{verifications.length !== 1 ? 's' : ''} found
            {statusFilter !== 'all' && ' (filtered)'}
            {selectedVerifications.length > 0 && ` • ${selectedVerifications.length} selected`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={fetchVerifications} 
            variant="outline" 
            size="icon" 
            disabled={loading.verifications}
            className="shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading.verifications ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedVerifications.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium text-blue-800">
                  {selectedVerifications.length} verification{selectedVerifications.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleBulkAction('approve')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve Selected
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleBulkAction('reject')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject Selected
                  </Button>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedVerifications([])}
              >
                Clear selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verifications Table */}
      <Card className="border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedVerifications.length === verifications.length && verifications.length > 0}
                    onChange={selectAllVerifications}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Reviewed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading.verifications ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">Loading verifications...</p>
                  </TableCell>
                </TableRow>
              ) : verifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No verifications found</h3>
                    <p className="text-muted-foreground">
                      {statusFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'No seller verification requests'
                      }
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                verifications.map((verification) => {
                  console.log("📋 Rendering verification row:", verification.id)
                  console.log("👤 User data in row:", verification.user)
                  
                  return (
                    <TableRow key={verification.id} className={selectedVerifications.includes(verification.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedVerifications.includes(verification.id)}
                          onChange={() => toggleVerificationSelection(verification.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {verification.user?.profile_picture_url ? (
                              <img 
                                src={verification.user.profile_picture_url} 
                                alt={verification.user.username || 'User'}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{verification.user?.username || 'Unknown User'}</div>
                            <div className="text-xs text-muted-foreground">
                              {verification.user?.email || 'No email'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Role: {verification.user?.role || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {verification.document ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(verification)}
                            className="gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            View Document
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">No document</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(verification.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(verification.submitted_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {verification.reviewed_at ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(verification.reviewed_at)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not reviewed</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(verification)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {verification.status !== 'approved' && (
                              <DropdownMenuItem onClick={() => handleVerificationAction(verification.id, 'approve')}>
                                <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {verification.status !== 'rejected' && (
                              <DropdownMenuItem onClick={() => handleVerificationAction(verification.id, 'reject')}>
                                <UserX className="h-4 w-4 mr-2 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verification Detail Modal */}
      <VerificationDetailModal
        verification={selectedVerification}
        isOpen={isVerificationDetailOpen}
        onClose={() => {
          console.log("🚪 Closing modal, selectedVerification:", selectedVerification)
          setIsVerificationDetailOpen(false)
          setSelectedVerification(null)
        }}
        onVerificationAction={handleVerificationAction}
        onVerificationUpdate={() => {
          fetchVerifications()
          fetchStats()
        }}
      />
    </div>
  )
}

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return 'Invalid Date'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.error("Error formatting date:", dateString, error)
    return 'Invalid Date'
  }
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { label: "Pending", variant: "secondary" as const, icon: Loader2 },
    approved: { label: "Approved", variant: "default" as const, icon: CheckCircle },
    rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle }
  }
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  const IconComponent = config.icon
  
  return (
    <Badge variant={config.variant} className="gap-1">
      <IconComponent className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}