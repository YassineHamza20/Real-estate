"use client"

import { useState, useEffect } from "react" // Add useEffect
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { SellerVerification } from "@/lib/api/adminVerifications"
import { 
  User, FileText, Calendar, Mail, Phone, CheckCircle, 
  XCircle, Download, UserCheck, UserX
} from "lucide-react"

interface VerificationDetailModalProps {
  verification: SellerVerification | null
  isOpen: boolean
  onClose: () => void
  onVerificationAction: (verificationId: number, action: 'approve' | 'reject', adminNotes?: string) => void
  onVerificationUpdate: () => void
}

export function VerificationDetailModal({ 
  verification, 
  isOpen, 
  onClose, 
  onVerificationAction,
  onVerificationUpdate 
}: VerificationDetailModalProps) {
  const [adminNotes, setAdminNotes] = useState("")
  const [actionLoading, setActionLoading] = useState<'approve' | 'reject' | null>(null)

  // Add debug logging
  useEffect(() => {
    if (isOpen && verification) {
      console.log("🔍 VerificationDetailModal - verification data:", verification)
      console.log("👤 User data:", verification.user)
      console.log("📄 Document:", verification.document)
    }
  }, [isOpen, verification])

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!verification) return
    
    setActionLoading(action)
    try {
      await onVerificationAction(verification.id, action, adminNotes)
      onVerificationUpdate()
      onClose()
    } finally {
      setActionLoading(null)
    }
  }

  const handleClose = () => {
    setAdminNotes("")
    setActionLoading(null)
    onClose()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Invalid Date'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error("Error formatting date:", dateString, error)
      return 'Invalid Date'
    }
  }

  if (!verification) {
    console.log("❌ VerificationDetailModal: verification is null")
    return null
  }

  // Safe data access with fallbacks
  const safeUser = verification.user || {}
  const safeUsername = safeUser.username || 'Unknown User'
  const safeUserId = safeUser.id || 'N/A'
  const safeEmail = safeUser.email || 'No email provided'
  const safePhone = safeUser.phone_number || 'Not provided'
  const safeCreatedAt = safeUser.created_at || safeUser.date_joined
  const safeProfilePicture = safeUser.profile_picture_url || safeUser.profile_picture

  console.log("🛡️ Safe user data:", {
    username: safeUsername,
    id: safeUserId,
    email: safeEmail,
    phone: safePhone,
    created_at: safeCreatedAt,
    profile_picture: safeProfilePicture
  })

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Verification Details - {safeUsername}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{safeUsername}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={
                  verification.status === 'approved' ? 'default' :
                  verification.status === 'rejected' ? 'destructive' : 'secondary'
                }>
                  {verification.status?.charAt(0).toUpperCase() + verification.status?.slice(1) || 'Unknown'}
                </Badge>
                <Badge variant="outline">{safeUser.role || 'Unknown'}</Badge>
              </div>
            </div>
            {verification.status === 'pending' && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleAction('reject')}
                  variant="outline"
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'reject' ? (
                    <>
                      <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <UserX className="h-4 w-4 mr-1" /> Reject
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === 'approve' ? (
                    <>
                      <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" /> Approve
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    {safeProfilePicture ? (
                      <img 
                        src={safeProfilePicture} 
                        alt={safeUsername}
                        className="w-16 h-16 rounded-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{safeUsername}</h3>
                    <p className="text-sm text-muted-foreground">User ID: {safeUserId}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{safeEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{safePhone}</span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User Since</label>
                    <p className="text-sm">
                      {safeCreatedAt ? formatDate(safeCreatedAt) : 'Unknown date'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <p className="text-sm">{safeUser.role || 'Unknown'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Document */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Verification Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {verification.document ? (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Verification Document</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted on {formatDate(verification.submitted_at)}
                      </p>
                    </div>
                    <Button 
                      asChild
                      className="w-full"
                    >
                      <a href={verification.document} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download Document
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Document</h3>
                    <p className="text-muted-foreground">
                      User has not uploaded a verification document.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Admin Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {verification.status === 'pending' ? (
                <div className="space-y-3">
                  <Label htmlFor="adminNotes">Add notes (optional)</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes about this verification..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    These notes will be saved when you approve or reject this verification.
                  </p>
                </div>
              ) : verification.admin_notes ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {verification.admin_notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No admin notes.</p>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Submitted</label>
                  <p>{formatDate(verification.submitted_at)}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">
                    {verification.status === 'pending' ? 'Not Reviewed' : 'Reviewed'}
                  </label>
                  <p>
                    {verification.reviewed_at 
                      ? formatDate(verification.reviewed_at)
                      : 'Pending review'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}