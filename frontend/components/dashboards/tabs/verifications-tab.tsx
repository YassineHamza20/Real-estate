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
  User, FileText, Calendar, RefreshCw, Download, UserCheck, UserX,
  FileText as FileTextIcon,
  Table as TableIcon,
  Image
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { VerificationDetailModal } from "../modals/verification-detail-modal"

export function VerificationsTab() {
  const { user, isAuthenticated } = useAuth()
  const [verifications, setVerifications] = useState<SellerVerification[]>([])
  const [loading, setLoading] = useState({
    verifications: false,
    stats: false,
    export: false
  })
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState<VerificationStats | null>(null)
  
  // Verification detail modal state
  const [selectedVerification, setSelectedVerification] = useState<SellerVerification | null>(null)
  const [isVerificationDetailOpen, setIsVerificationDetailOpen] = useState(false)

  // Selected verifications for bulk actions
  const [selectedVerifications, setSelectedVerifications] = useState<number[]>([])

  // Export functionality
  const exportToPDF = async () => {
    setLoading(prev => ({ ...prev, export: true }))
    try {
      const { jsPDF } = await import('jspdf')
      
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      // Set document properties
      doc.setProperties({
        title: `Verifications Report - ${new Date().toLocaleDateString()}`,
        subject: 'Seller Verifications Export',
        author: user?.username || 'Admin User',
        creator: 'Real Estate Platform',
        keywords: 'verifications, sellers, export'
      })

      // Add header
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 297, 20, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.text('REAL ESTATE PLATFORM - VERIFICATIONS REPORT', 20, 12)

      // Generation info
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 18)
      doc.text(`By: ${user?.username || 'Admin User'}`, 200, 18)

      let yPosition = 30

      // Summary section
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('SUMMARY', 20, yPosition)
      
      yPosition += 8
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      const summaryText = `Total Verifications: ${verifications.length} | Pending: ${verifications.filter(v => v.status === 'pending').length} | Approved: ${verifications.filter(v => v.status === 'approved').length} | Rejected: ${verifications.filter(v => v.status === 'rejected').length}`
      doc.text(summaryText, 20, yPosition)

      yPosition += 15

      // Table headers
      const headers = ['ID', 'Username', 'Email', 'Status', 'Submitted', 'Reviewed', 'Admin Notes']
      const columnWidths = [15, 40, 50, 30, 30, 30, 72]
      
      let xPosition = 20
      doc.setFillColor(240, 240, 240)
      doc.rect(xPosition, yPosition, 257, 8, 'F')
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      doc.setFont(undefined, 'bold')
      
      headers.forEach((header, index) => {
        doc.text(header, xPosition + 2, yPosition + 6)
        xPosition += columnWidths[index]
      })

      yPosition += 8

      // Table rows
      doc.setFont(undefined, 'normal')
      verifications.forEach((verification, index) => {
        if (yPosition > 180) {
          doc.addPage()
          yPosition = 30
          
          // Add headers to new page
          xPosition = 20
          doc.setFillColor(240, 240, 240)
          doc.rect(xPosition, yPosition, 257, 8, 'F')
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(8)
          doc.setFont(undefined, 'bold')
          
          headers.forEach((header, index) => {
            doc.text(header, xPosition + 2, yPosition + 6)
            xPosition += columnWidths[index]
          })
          yPosition += 8
        }

        xPosition = 20
        const rowData = [
          verification.id.toString(),
          verification.user?.username || 'Unknown',
          verification.user?.email || 'No email',
          verification.status.charAt(0).toUpperCase() + verification.status.slice(1),
          formatDate(verification.submitted_at),
          verification.reviewed_at ? formatDate(verification.reviewed_at) : 'Not reviewed',
          verification.admin_notes || 'No notes'
        ]

        doc.setFontSize(7)
        rowData.forEach((data, dataIndex) => {
          const lines = doc.splitTextToSize(data, columnWidths[dataIndex] - 2)
          lines.forEach((line: string, lineIndex: number) => {
            doc.text(line, xPosition + 1, yPosition + 4 + (lineIndex * 3))
          })
          xPosition += columnWidths[dataIndex]
        })

        yPosition += 15
      })

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(8)
        doc.text(`Page ${i} of ${pageCount}`, 150, 200, { align: 'center' })
        doc.text(`Real Estate Platform - ${new Date().getFullYear()}`, 20, 290)
      }

      doc.save(`verifications-report-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "PDF Export Complete",
        description: "Verifications data has been exported to PDF",
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
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

  const exportToExcel = async () => {
    setLoading(prev => ({ ...prev, export: true }))
    try {
      const csvContent = [
        // Header
        ['Verifications Export', '', '', '', '', '', ''],
        [`Generated,${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
        [`By,${user?.username || 'Admin'}`],
        [''],
        
        // Data headers
        ['ID', 'Username', 'Email', 'User Role', 'Status', 'Submitted At', 'Reviewed At', 'Admin Notes', 'Document Type', 'Document URL'],
        
        // Data rows
        ...verifications.map(verification => [
          verification.id,
          `"${verification.user?.username || 'Unknown'}"`,
          `"${verification.user?.email || 'No email'}"`,
          verification.user?.role || 'Unknown',
          verification.status,
          verification.submitted_at,
          verification.reviewed_at || '',
          `"${(verification.admin_notes || '').replace(/"/g, '""')}"`,
          verification.document?.document_type || '',
          verification.document?.document_url || ''
        ]),
        [''],
        ['Summary', '', '', '', '', '', '', '', '', ''],
        [`Total Verifications,${verifications.length}`],
        [`Pending,${verifications.filter(v => v.status === 'pending').length}`],
        [`Approved,${verifications.filter(v => v.status === 'approved').length}`],
        [`Rejected,${verifications.filter(v => v.status === 'rejected').length}`]
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `verifications-${new Date().toISOString().split('T')[0]}.csv`)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Excel Export Complete",
        description: "Verifications data exported successfully",
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
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

  const exportToPNG = async () => {
    setLoading(prev => ({ ...prev, export: true }))
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // Set canvas size
      canvas.width = 1200
      canvas.height = 800
      
      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Header
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(0, 0, canvas.width, 60)
      
      // Title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.fillText('Real Estate Platform - Verifications Report', 20, 35)
      
      // Generation info
      ctx.fillStyle = '#666666'
      ctx.font = '14px Arial'
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()} by ${user?.username || 'Admin'}`, 20, 85)
      
      // Summary
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 16px Arial'
      ctx.fillText(`Total Verifications: ${verifications.length} | Pending: ${verifications.filter(v => v.status === 'pending').length} | Approved: ${verifications.filter(v => v.status === 'approved').length} | Rejected: ${verifications.filter(v => v.status === 'rejected').length}`, 20, 115)
      
      let yPos = 150
      const rowHeight = 30
      const headers = ['ID', 'Username', 'Status', 'Submitted', 'Reviewed']
      const columnWidths = [50, 200, 150, 150, 150]
      
      // Table headers
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(20, yPos, canvas.width - 40, rowHeight)
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 12px Arial'
      
      let xPos = 25
      headers.forEach((header, index) => {
        ctx.fillText(header, xPos, yPos + 20)
        xPos += columnWidths[index]
      })
      
      yPos += rowHeight
      
      // Table rows
      ctx.font = '11px Arial'
      verifications.slice(0, 20).forEach((verification, index) => { // Limit to 20 rows for PNG
        if (index % 2 === 0) {
          ctx.fillStyle = '#fafafa'
          ctx.fillRect(20, yPos, canvas.width - 40, rowHeight)
        }
        
        ctx.fillStyle = '#333333'
        xPos = 25
        
        const rowData = [
          verification.id.toString(),
          verification.user?.username || 'Unknown',
          verification.status.charAt(0).toUpperCase() + verification.status.slice(1),
          formatDate(verification.submitted_at),
          verification.reviewed_at ? formatDate(verification.reviewed_at) : 'Not reviewed'
        ]
        
        rowData.forEach((data, dataIndex) => {
          ctx.fillText(data, xPos, yPos + 20)
          xPos += columnWidths[dataIndex]
        })
        
        yPos += rowHeight
      })
      
      // Footer
      ctx.fillStyle = '#666666'
      ctx.font = '10px Arial'
      ctx.fillText(`Real Estate Platform - ${new Date().getFullYear()} | Page 1 of 1`, 20, 780)
      
      // Convert to PNG and download
      const link = document.createElement('a')
      link.download = `verifications-snapshot-${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()
      
      toast({
        title: "PNG Export Complete",
        description: "Verifications snapshot has been saved as PNG",
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
      setLoading(prev => ({ ...prev, export: false }))
    }
  }

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
          {/* Export Button */}
          <div className="relative group">
            <Button 
              
              size="sm"
              disabled={loading.export || verifications.length === 0}
              className="rounded-lg border-2 hover:border-primary/50 transition-all duration-300"
            >
              <Download className={`h-4 w-4 mr-2 ${loading.export ? 'animate-spin' : ''}`} />
              Export Data
            </Button>
            
            {/* Export Options Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-background border-2 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="p-2 space-y-1">
                <button
                  onClick={exportToPDF}
                  disabled={loading.export || verifications.length === 0}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <FileTextIcon className="h-4 w-4 text-red-500" />
                  {loading.export ? 'Generating...' : 'Export as PDF'}
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={loading.export || verifications.length === 0}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <TableIcon className="h-4 w-4 text-green-500" />
                  {loading.export ? 'Generating...' : 'Export as Excel'}
                </button>
                <button
                  onClick={exportToPNG}
                  disabled={loading.export || verifications.length === 0}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium"
                >
                  <Image className="h-4 w-4 text-blue-500" />
                  {loading.export ? 'Generating...' : 'Export as PNG'}
                </button>
              </div>
            </div>
          </div>

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