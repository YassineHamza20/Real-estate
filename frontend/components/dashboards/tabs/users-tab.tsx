"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
 
import { usersApi } from '@/lib/api/users'; // Adjust the path as needed
import { Separator } from "@/components/ui/separator"
import { 
  Users, Home, DollarSign, TrendingUp, Search, MoreVertical, 
  CheckCircle, XCircle, Loader2, Plus, RefreshCw, Shield, 
  UserCheck, UserX, Mail, Phone, Trash2,Calendar, Edit, Save, X,
  Eye, Shield as StaffIcon, Verified, Clock, User,Image,Download,
  FileText
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,DialogTrigger, 
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

// Types based on your backend
interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: 'buyer' | 'seller' | 'admin'
  phone_number: string
  email_verified: boolean
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login: string
  created_at: string
  updated_at: string
  verification_status?: string
  profile_picture_url?: string
}

interface SellerVerification {
  id: number
  user: number
  user_details: User
  document: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  admin_notes: string
}

interface UserFullDetail extends User {
  verification_details?: SellerVerification
}

// FIX: Get API URL with fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// API functions
const adminApi = {
  async getUsers(token: string, search?: string, role?: string): Promise<User[]> {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (role && role !== 'all') params.append('role', role)
    
    const url = `${API_BASE_URL}/api/users/admin/users/?${params}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`)
    }
    
    const data = await response.json()
    return Array.isArray(data) ? data : data.results || []
  },

  async getUserFullDetail(token: string, userId: number): Promise<UserFullDetail> {
    const response = await fetch(`${API_BASE_URL}/api/users/admin/users/${userId}/full/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user details: ${response.status}`)
    }
    
    return response.json()
  },

  async updateUser(token: string, userId: number, userData: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users/admin/users/${userId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || `Failed to update user: ${response.status}`)
    }
    
    return response.json()
  },

  async bulkUserAction(token: string, userIds: number[], action: 'activate' | 'deactivate' | 'delete'): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/users/admin/bulk-users/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_ids: userIds,
        action: action
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to ${action} users`)
    }
  },
}

export function UsersTab() {
  const { user: currentUser, token: authToken } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("users")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState({
    users: false,
    userDetail: false
  })
  const [roleFilter, setRoleFilter] = useState<string>("all")
   const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'buyer' as 'buyer' | 'seller' | 'admin',
    phone_number: '',
    is_active: true,
    is_staff: false,
    email_verified: false
  })
const [exportLoading, setExportLoading] = useState<string | null>(null)
  // User detail modal state
  const [selectedUser, setSelectedUser] = useState<UserFullDetail | null>(null)
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<User>>({})
  const [saving, setSaving] = useState(false)
// Add this to your existing state
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
const [userToDelete, setUserToDelete] = useState<{id: number; username: string} | null>(null)
  // Get token from localStorage as fallback
  const token = authToken || localStorage.getItem('access_token')
 const handleCreateUser = async () => {
    if (!token) return
    
    setCreatingUser(true)
    try {
      const result = await usersApi.createUser(createUserForm)
      toast({
        title: "Success",
        description: "User created successfully",
      })
      setIsCreateUserOpen(false)
      setCreateUserForm({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        role: 'buyer',
        phone_number: '',
        is_active: true,
        is_staff: false,
        email_verified: false
      })
      fetchUsers() // Refresh the users list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setCreatingUser(false)
    }
  }

 
// Enhanced PDF Export for Users
const exportToPDF = async () => {
  setExportLoading('pdf')
  try {
    const { jsPDF } = await import('jspdf')
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Header
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, 210, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text('USERS MANAGEMENT REPORT', 20, 15)
    
    // Generation info
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Generated on ${new Date().toLocaleDateString()} by ${currentUser?.username || 'Admin'}`, 20, 22)

    let yPosition = 40

    // User Statistics
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('USER STATISTICS', 15, yPosition)
    
    yPosition += 10

    const stats = [
      { label: 'Total Users', value: userStats.totalUsers },
      { label: 'Active Users', value: userStats.activeUsers },
      { label: 'Buyers', value: userStats.totalBuyers },
      { label: 'Sellers', value: userStats.totalSellers },
      { label: 'Admins', value: userStats.totalAdmins }
    ]

    stats.forEach((stat, index) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 30
      }

      doc.setFillColor(248, 250, 252)
      doc.rect(15, yPosition, 180, 8, 'F')
      
      doc.setTextColor(71, 85, 105)
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text(stat.label, 20, yPosition + 6)

      doc.setTextColor(15, 23, 42)
      doc.text(stat.value.toString(), 170, yPosition + 6, { align: 'right' })

      yPosition += 10
    })

    yPosition += 15

    // User List
    if (yPosition > 200) {
      doc.addPage()
      yPosition = 30
    }

    doc.setTextColor(15, 23, 42)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('USER LIST', 15, yPosition)
    
    yPosition += 10

    // Table headers
    doc.setFillColor(59, 130, 246)
    doc.rect(15, yPosition, 180, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('User', 20, yPosition + 6)
    doc.text('Email', 70, yPosition + 6)
    doc.text('Role', 130, yPosition + 6)
    doc.text('Status', 160, yPosition + 6)
    
    yPosition += 10

    // User rows
    users.slice(0, 20).forEach((user, index) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 30
        
        // Repeat headers on new page
        doc.setFillColor(59, 130, 246)
        doc.rect(15, yPosition, 180, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.text('User', 20, yPosition + 6)
        doc.text('Email', 70, yPosition + 6)
        doc.text('Role', 130, yPosition + 6)
        doc.text('Status', 160, yPosition + 6)
        yPosition += 10
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(15, yPosition, 180, 8, 'F')
      }

      doc.setTextColor(15, 23, 42)
      doc.setFontSize(8)
      
      // User name (truncate if too long)
      const userName = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}`.substring(0, 20)
        : user.username.substring(0, 20)
      doc.text(userName, 20, yPosition + 6)
      
      // Email (truncate)
      doc.text(user.email.substring(0, 25), 70, yPosition + 6)
      
      // Role
      doc.text(user.role, 130, yPosition + 6)
      
      // Status
      doc.text(user.is_active ? 'Active' : 'Inactive', 160, yPosition + 6)

      yPosition += 8
    })

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setTextColor(100, 116, 139)
      doc.setFontSize(8)
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' })
      doc.text(`Total Users: ${users.length} • Generated ${new Date().toLocaleDateString()}`, 105, 295, { align: 'center' })
    }

    doc.save(`users-report-${new Date().toISOString().split('T')[0]}.pdf`)
    
    toast({
      title: "PDF Export Complete",
      description: "Users report has been downloaded",
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
    setExportLoading(null)
  }
}

// Enhanced Excel Export for Users
const exportToExcel = async () => {
  setExportLoading('excel')
  try {
    const csvContent = [
      // Header
      ['Users Management Report'],
      [`Generated,${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
      [`By,${currentUser?.username || 'Admin'}`],
      [''],
      
      // Statistics
      ['STATISTICS'],
      ['Metric', 'Count'],
      ['Total Users', userStats.totalUsers],
      ['Active Users', userStats.activeUsers],
      ['Buyers', userStats.totalBuyers],
      ['Sellers', userStats.totalSellers],
      ['Admins', userStats.totalAdmins],
      [''],
      
      // User List
      ['USER LIST'],
      ['ID', 'Username', 'Name', 'Email', 'Role', 'Status', 'Phone', 'Joined Date'],
      ...users.map(user => [
        user.id,
        user.username,
        user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'N/A',
        user.email,
        user.role,
        user.is_active ? 'Active' : 'Inactive',
        user.phone_number || 'N/A',
        new Date(user.date_joined).toLocaleDateString()
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`)
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Excel Export Complete",
      description: "Users data exported successfully",
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
    setExportLoading(null)
  }
}

// Enhanced PNG Export for Users
const exportToPNG = async () => {
  setExportLoading('png')
  try {
    const createUsersPNG = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      canvas.width = 1400
      canvas.height = 1600
      
      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Header
      ctx.fillStyle = '#1e40af'
      ctx.fillRect(0, 0, canvas.width, 80)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 32px system-ui'
      ctx.fillText('Users Management Report', 60, 48)
      
      // Generation info
      ctx.fillStyle = '#374151'
      ctx.font = '20px system-ui'
      ctx.fillText(`Generated on ${new Date().toLocaleDateString()}`, 60, 120)
      ctx.fillText(`By: ${currentUser?.username || 'Administrator'}`, 60, 150)
      
      let yPos = 200

      // Statistics
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 28px system-ui'
      ctx.fillText('User Statistics', 60, yPos)
      
      yPos += 50

      const stats = [
        { label: 'Total Users', value: userStats.totalUsers, color: '#3b82f6' },
        { label: 'Active Users', value: userStats.activeUsers, color: '#10b981' },
        { label: 'Buyers', value: userStats.totalBuyers, color: '#f59e0b' },
        { label: 'Sellers', value: userStats.totalSellers, color: '#ef4444' },
        { label: 'Admins', value: userStats.totalAdmins, color: '#8b5cf6' }
      ]

      stats.forEach((stat, index) => {
        const x = 60 + (index % 3) * 400
        const y = yPos + Math.floor(index / 3) * 100
        
        // Stat card
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(x, y, 350, 80)
        ctx.strokeStyle = '#e5e7eb'
        ctx.strokeRect(x, y, 350, 80)
        
        // Accent bar
        ctx.fillStyle = stat.color
        ctx.fillRect(x, y, 6, 80)
        
        // Content
        ctx.fillStyle = '#6b7280'
        ctx.font = 'bold 16px system-ui'
        ctx.fillText(stat.label, x + 20, y + 30)
        
        ctx.fillStyle = '#111827'
        ctx.font = 'bold 32px system-ui'
        ctx.fillText(stat.value.toString(), x + 20, y + 65)
      })
      
      yPos += 180

      // User list header
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 28px system-ui'
      ctx.fillText('Recent Users', 60, yPos)
      
      yPos += 50

      // User table
      users.slice(0, 8).forEach((user, index) => {
        if (yPos > 1400) return
        
        const y = yPos + index * 60
        
        // Row background
        if (index % 2 === 0) {
          ctx.fillStyle = '#f8fafc'
          ctx.fillRect(60, y, 1280, 50)
        }
        
        // User info
        ctx.fillStyle = '#111827'
        ctx.font = '18px system-ui'
        
        const userName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`
          : user.username
        
        ctx.fillText(userName.substring(0, 25), 80, y + 20)
        ctx.fillText(user.email.substring(0, 30), 400, y + 20)
        ctx.fillText(user.role, 800, y + 20)
        
        // Status
        ctx.fillStyle = user.is_active ? '#10b981' : '#ef4444'
        ctx.fillText(user.is_active ? 'Active' : 'Inactive', 1000, y + 20)
        
        // Joined date
        ctx.fillStyle = '#6b7280'
        ctx.font = '14px system-ui'
        ctx.fillText(new Date(user.date_joined).toLocaleDateString(), 1150, y + 20)
      })
      
      // Footer
      ctx.fillStyle = '#374151'
      ctx.font = '16px system-ui'
      ctx.fillText(`Total Users: ${users.length} • Generated ${new Date().toLocaleDateString()}`, 60, 1550)
      
      return canvas
    }
    
    const canvas = createUsersPNG()
    const link = document.createElement('a')
    link.download = `users-report-${new Date().toISOString().split('T')[0]}.png`
    link.href = canvas.toDataURL('image/png', 1.0)
    link.click()
    
    toast({
      title: "PNG Export Complete",
      description: "Users report has been saved as PNG",
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
    setExportLoading(null)
  }
}




  // Fetch users



  const fetchUsers = useCallback(async () => {
    if (!token) return
    
    setLoading(prev => ({ ...prev, users: true }))
    try {
      const data = await adminApi.getUsers(token, searchQuery, roleFilter)
      setUsers(data)
    } catch (error: any) {
      console.error("[v0] Failed to fetch users:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, users: false }))
    }
  }, [token, searchQuery, roleFilter])

  // Fetch user full details
  const fetchUserDetail = async (userId: number) => {
    if (!token) return
    
    setLoading(prev => ({ ...prev, userDetail: true }))
    try {
      const userDetail = await adminApi.getUserFullDetail(token, userId)
      setSelectedUser(userDetail)
      setEditForm({
        first_name: userDetail.first_name,
        last_name: userDetail.last_name,
        email: userDetail.email,
        phone_number: userDetail.phone_number,
        role: userDetail.role,
        is_active: userDetail.is_active,
        is_staff: userDetail.is_staff,
      })
      setIsUserDetailOpen(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load user details",
        variant: "destructive",
      })
    } finally {
      setLoading(prev => ({ ...prev, userDetail: false }))
    }
  }

  // Handle user actions
  const handleUserAction = async (userId: number, action: 'activate' | 'deactivate' | 'delete') => {
    if (!token) return
    
    try {
      await adminApi.bulkUserAction(token, [userId], action)
      toast({
        title: "Success",
        description: `User ${action}d successfully`,
      })
      fetchUsers()
      if (action === 'delete') {
        setIsUserDetailOpen(false)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} user`,
        variant: "destructive",
      })
    }
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!token) return
    
    try {
      await adminApi.updateUser(token, userId, { role: newRole as User['role'] })
      toast({
        title: "Success",
        description: "User role updated successfully",
      })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      })
    }
  }

  // Save user edits
  const handleSaveUser = async () => {
    if (!token || !selectedUser) return
    
    setSaving(true)
    try {
      const updatedUser = await adminApi.updateUser(token, selectedUser.id, editForm)
      toast({
        title: "Success",
        description: "User updated successfully",
      })
      setSelectedUser(prev => prev ? { ...prev, ...updatedUser } : null)
      setIsEditing(false)
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Formatting functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return formatDate(dateString)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default'
      case 'seller': return 'secondary'
      case 'buyer': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusBadge = (user: User) => {
    if (!user.is_active) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Suspended
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    )
  }

  // Calculate basic stats from users data
  const userStats = useMemo(() => {
    const totalUsers = users.length
    const totalBuyers = users.filter(u => u.role === 'buyer').length
    const totalSellers = users.filter(u => u.role === 'seller').length
    const totalAdmins = users.filter(u => u.role === 'admin').length
    const activeUsers = users.filter(u => u.is_active).length
    
    return {
      totalUsers,
      totalBuyers,
      totalSellers,
      totalAdmins,
      activeUsers
    }
  }, [users])

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers()
    }
  }, [activeTab, fetchUsers])

  // Refresh users when search query changes
  useEffect(() => {
    if (activeTab === 'users') {
      const timeoutId = setTimeout(() => {
        fetchUsers()
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, activeTab, fetchUsers])

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

const handleDeleteClick = (userId: number, username: string) => {
  setUserToDelete({ id: userId, username })
  setDeleteConfirmOpen(true)
}

const handleConfirmDelete = async () => {
  if (!userToDelete || !token) return
  
  try {
    await usersApi.deleteUser(userToDelete.id)
    toast({
      title: "Success",
      description: `User "${userToDelete.username}" has been deleted successfully`,
    })
    fetchUsers()
    setIsUserDetailOpen(false)
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to delete user",
      variant: "destructive",
    })
  } finally {
    setDeleteConfirmOpen(false)
    setUserToDelete(null)
  }
}
const handleDeleteUser = async (userId: number, username: string) => {
  if (!token) return
  
  if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
    return
  }

  try {
    await usersApi.deleteUser(userId)
    toast({
      title: "Success",
      description: `User "${username}" has been deleted successfully`,
    })
    fetchUsers()
    setIsUserDetailOpen(false)
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Failed to delete user",
      variant: "destructive",
    })
  }
}
   
  return (
    <div className="container mx-auto px-0 py-1 max-w-7xl">
      
      

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { 
            title: "Total Users", 
            value: userStats.totalUsers, 
            sub: `${userStats.activeUsers} active`, 
            icon: Users,
            loading: loading.users
          },
          { 
            title: "Buyers", 
            value: userStats.totalBuyers, 
            sub: `${Math.round((userStats.totalBuyers / userStats.totalUsers) * 100) || 0}% of total`, 
            icon: User,
            loading: loading.users
          },
          { 
            title: "Sellers", 
            value: userStats.totalSellers, 
            sub: `${Math.round((userStats.totalSellers / userStats.totalUsers) * 100) || 0}% of total`, 
            icon: UserCheck,
            loading: loading.users
          },
          { 
            title: "Admins", 
            value: userStats.totalAdmins, 
            sub: "Platform administrators", 
            icon: Shield,
            loading: loading.users
          },
        ].map((stat, i) => (
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
                  {stat.loading ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  ) : (
                    <stat.icon className="h-4 w-4 text-primary" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>



      {/* Users Tab */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
       

        <TabsContent value="users" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">User Management</h2>
              
              <p className="text-muted-foreground">
                {users.length} user{users.length !== 1 ? 's' : ''} found
                {roleFilter !== 'all' && ` (filtered by ${roleFilter})`}
              </p>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 w-full sm:w-64"
                />
              </div>


              <div className="relative group">
 
  
  {/* Export Options Dropdown */}

<div className="relative group">
  <Button 
    
    size="sm"
    disabled={exportLoading !== null}
    className="gap-2"
  >
    <Download className={`h-4 w-4 ${exportLoading ? 'animate-spin' : ''}`} />
    Export Data
  </Button>
  
  {/* Export Options Dropdown */}
  <div className="absolute right-0 top-full mt-2 w-48 bg-background border-2 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform group-hover:translate-y-0 translate-y-1">
    <div className="p-2 space-y-1">
      <button
        onClick={exportToPDF}
        disabled={exportLoading !== null}
        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText className="h-4 w-4 text-red-500" />
        {exportLoading === 'pdf' ? 'Generating...' : 'Export as PDF'}
      </button>
      <button
        onClick={exportToExcel}
        disabled={exportLoading !== null}
        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText className="h-4 w-4 text-green-500" />
        {exportLoading === 'excel' ? 'Generating...' : 'Export as Excel'}
      </button>
      <button
        onClick={exportToPNG}
        disabled={exportLoading !== null}
        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Image className="h-4 w-4 text-blue-500" />
        {exportLoading === 'png' ? 'Generating...' : 'Export as PNG'}
      </button>
    </div>
  </div>
</div>


</div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchUsers} variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>


              {/* ADD THE CREATE USER BUTTON HERE */}
        <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the platform. All fields are required.
              </DialogDescription>
            </DialogHeader>
            {/* Add this with your other header buttons */}

            <div className="grid gap-4 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={createUserForm.first_name}
                    onChange={(e) => setCreateUserForm({...createUserForm, first_name: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={createUserForm.last_name}
                    onChange={(e) => setCreateUserForm({...createUserForm, last_name: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={createUserForm.username}
                  onChange={(e) => setCreateUserForm({...createUserForm, username: e.target.value})}
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({...createUserForm, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={createUserForm.phone_number}
                  onChange={(e) => setCreateUserForm({...createUserForm, phone_number: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm({...createUserForm, password: e.target.value})}
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_confirm">Confirm Password</Label>
                  <Input
                    id="password_confirm"
                    type="password"
                    value={createUserForm.password_confirm}
                    onChange={(e) => setCreateUserForm({...createUserForm, password_confirm: e.target.value})}
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              {/* Role and Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={createUserForm.role} 
                    onValueChange={(value: 'buyer' | 'seller' | 'admin') => 
                      setCreateUserForm({...createUserForm, role: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Account Settings</Label>
                  <div className="space-y-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_active" className="text-sm cursor-pointer">Active</Label>
                      <Switch
                        id="is_active"
                        checked={createUserForm.is_active}
                        onCheckedChange={(checked) => setCreateUserForm({...createUserForm, is_active: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_staff" className="text-sm cursor-pointer">Staff</Label>
                      <Switch
                        id="is_staff"
                        checked={createUserForm.is_staff}
                        onCheckedChange={(checked) => setCreateUserForm({...createUserForm, is_staff: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email_verified" className="text-sm cursor-pointer">Email Verified</Label>
                      <Switch
                        id="email_verified"
                        checked={createUserForm.email_verified}
                        onCheckedChange={(checked) => setCreateUserForm({...createUserForm, email_verified: checked})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsCreateUserOpen(false)}
                disabled={creatingUser}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={creatingUser || !createUserForm.password || !createUserForm.password_confirm}
              >
                {creatingUser ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
            </div>
          </div>

          <Card className="border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading.users ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="text-muted-foreground mt-2">Loading users...</p>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No users found</h3>
                        <p className="text-muted-foreground">
                          {searchQuery || roleFilter !== 'all' 
                            ? 'Try adjusting your search or filters' 
                            : 'No users in the system'
                          }
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profile_picture_url} />
                              <AvatarFallback className="text-xs">
                                {user.first_name?.[0]}{user.last_name?.[0] || user.username?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.username
                                }
                              </div>
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {user.email}
                            {user.email_verified && (
                              <Verified className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={user.role} 
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buyer">Buyer</SelectItem>
                              <SelectItem value="seller">Seller</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user)}
                          {user.is_staff && (
                            <Badge variant="outline" className="ml-2">
                              <StaffIcon className="h-3 w-3 mr-1" />
                              Staff
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(user.date_joined)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelativeTime(user.date_joined)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => fetchUserDetail(user.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                fetchUserDetail(user.id)
                                setIsEditing(true)
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              {user.is_active ? (
                                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'deactivate')}>
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'activate')}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Activate Account
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleUserAction(user.id, 'delete')}
                              >
                                
                              
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            
          </Card>
        </TabsContent>
      </Tabs>

      {/* Enhanced User Detail Modal - FIXED SCROLLING */}
      <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
        <DialogContent 
          className="max-w-4xl w-full h-[90vh] p-0 rounded-lg flex flex-col"
          showCloseButton={false}
        >
          {/* Hidden but accessible title for screen readers */}
          <DialogHeader className="sr-only">
            <DialogTitle>
              User Details - {selectedUser?.first_name} {selectedUser?.last_name} ({selectedUser?.username})
            </DialogTitle>
          </DialogHeader>

          {loading.userDetail ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : selectedUser && (
            <>
              {/* Header - Fixed */}
              <div className="border-b bg-background px-6 py-4 flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 ring-2 ring-background">
                      <AvatarImage src={selectedUser.profile_picture_url} />
                      <AvatarFallback className="text-sm font-bold">
                        {selectedUser.first_name?.[0]}{selectedUser.last_name?.[0] || selectedUser.username?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
                        {selectedUser.first_name && selectedUser.last_name
                          ? `${selectedUser.first_name} ${selectedUser.last_name}`
                          : selectedUser.username}
                        <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="text-xs">
                          {selectedUser.role}
                        </Badge>
                        {getStatusBadge(selectedUser)}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {selectedUser.email}
                          {selectedUser.email_verified && <Verified className="h-3 w-3 text-green-600" />}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          @{selectedUser.username}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
   {isEditing ? (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
        <X className="h-4 w-4 mr-1" /> Cancel
      </Button>
      <Button size="sm" onClick={handleSaveUser} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
        Save
      </Button>
    </>
  ) : (
    <>
      <Button size="sm" onClick={() => setIsEditing(true)}>
        <Edit className="h-4 w-4 mr-1" /> Edit
      </Button>
      
      {/* UPDATED DELETE BUTTON */}
      <Button 
        variant="destructive" 
        size="sm"
        onClick={() => selectedUser && handleDeleteClick(selectedUser.id, selectedUser.username)}
      >
        <Trash2 className="h-4 w-4 mr-1" /> Delete
      </Button>
    </>
  )}
  <Button
    variant="ghost"
    size="icon"
    onClick={() => setIsUserDetailOpen(false)}
    className="rounded-full h-8 w-8"
  >
    <X className="h-4 w-4" />
  </Button>
 {/* Beautiful Delete Confirmation Dialog */}
<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
  <DialogContent className="sm:max-w-md">
    <div className="flex flex-col items-center text-center">
      {/* Warning Icon */}
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
        <Trash2 className="h-6 w-6 text-red-600" />
      </div>
      
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">Delete User</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground mt-2">
          Are you sure you want to delete <span className="font-semibold text-foreground">"{userToDelete?.username}"</span>? 
          This action cannot be undone and all user data will be permanently removed.
        </DialogDescription>
      </DialogHeader>

      <div className="flex gap-3 w-full mt-6">
        <Button
          variant="outline"
          onClick={() => setDeleteConfirmOpen(false)}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleConfirmDelete}
          className="flex-1 gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete User
        </Button>
      </div>

      {/* Warning Note */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 w-full">
        <div className="flex items-start gap-2">
          <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>This will permanently remove the user account and all associated data.</span>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-6 lg:grid-cols-3 min-h-0">
                  {/* Left Column - Personal & Account Info */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Personal Information */}
                    <Card className="border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm">First Name</Label>
                              <Input
                                value={editForm.first_name || ''}
                                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                className="mt-1 h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Last Name</Label>
                              <Input
                                value={editForm.last_name || ''}
                                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                className="mt-1 h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Email</Label>
                              <Input
                                type="email"
                                value={editForm.email || ''}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="mt-1 h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Phone</Label>
                              <Input
                                value={editForm.phone_number || ''}
                                onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                                className="mt-1 h-9"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-muted-foreground text-xs">First Name</Label>
                              <p className="font-medium mt-1">{selectedUser.first_name || '—'}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Last Name</Label>
                              <p className="font-medium mt-1">{selectedUser.last_name || '—'}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Email</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-medium">{selectedUser.email}</span>
                                {selectedUser.email_verified && <Verified className="h-3 w-3 text-green-600" />}
                              </div>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Phone</Label>
                              <p className="font-medium mt-1">{selectedUser.phone_number || '—'}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Account Settings */}
                    <Card className="border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          Account Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm">Role</Label>
                              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v as User['role'] })}>
                                <SelectTrigger className="mt-1 h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="buyer">Buyer</SelectItem>
                                  <SelectItem value="seller">Seller</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                <Label htmlFor="active" className="cursor-pointer text-sm">Active</Label>
                                <Switch
                                  id="active"
                                  checked={editForm.is_active}
                                  onCheckedChange={(c) => setEditForm({ ...editForm, is_active: c })}
                                  className="scale-90"
                                />
                              </div>
                              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                <Label htmlFor="staff" className="cursor-pointer text-sm">Staff</Label>
                                <Switch
                                  id="staff"
                                  checked={editForm.is_staff}
                                  onCheckedChange={(c) => setEditForm({ ...editForm, is_staff: c })}
                                  className="scale-90"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-muted-foreground text-xs">Username</Label>
                              <p className="font-medium mt-1">@{selectedUser.username}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Status</Label>
                              <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Staff</Label>
                              <Badge variant={selectedUser.is_staff ? "default" : "outline"} className="mt-1 text-xs">
                                {selectedUser.is_staff ? "Yes" : "No"}
                              </Badge>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-xs">Superuser</Label>
                              <Badge variant={selectedUser.is_superuser ? "default" : "outline"} className="mt-1 text-xs">
                                {selectedUser.is_superuser ? "Yes" : "No"}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Seller Verification - NOW VISIBLE AND SCROLLABLE */}
                    {selectedUser.role === 'seller' && (
                      <Card className="border">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-primary" />
                            Seller Verification
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {selectedUser.verification_details ? (
                            <div className="space-y-4 text-sm">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <Label className="text-muted-foreground text-xs">Status</Label>
                                  <Badge
                                    variant={
                                      selectedUser.verification_details.status === 'approved' ? 'default' :
                                      selectedUser.verification_details.status === 'rejected' ? 'destructive' : 'secondary'
                                    }
                                    className="mt-1 text-xs"
                                  >
                                    {selectedUser.verification_details.status}
                                  </Badge>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground text-xs">Submitted</Label>
                                  <p className="font-medium mt-1 text-xs">{formatDate(selectedUser.verification_details.submitted_at)}</p>
                                </div>
                                {selectedUser.verification_details.reviewed_at && (
                                  <div>
                                    <Label className="text-muted-foreground text-xs">Reviewed</Label>
                                    <p className="font-medium mt-1 text-xs">{formatDate(selectedUser.verification_details.reviewed_at)}</p>
                                  </div>
                                )}
                              </div>
                              {selectedUser.verification_details.admin_notes && (
                                <div>
                                  <Label className="text-muted-foreground text-xs">Admin Notes</Label>
                                  <Textarea
                                    value={selectedUser.verification_details.admin_notes}
                                    readOnly
                                    className="mt-1 min-h-16 bg-muted/20 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground">
                              <FileText className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-sm">No verification submitted</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right Column - Timeline & System Info */}
                  <div className="space-y-4">
                    {/* Activity Timeline */}
                    <Card className="border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Activity Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                            <div>
                              <p className="font-medium text-xs">Account Created</p>
                              <p className="text-xs text-muted-foreground">{formatDate(selectedUser.date_joined)}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                            <div>
                              <p className="font-medium text-xs">Last Updated</p>
                              <p className="text-xs text-muted-foreground">{formatDate(selectedUser.updated_at)}</p>
                            </div>
                          </div>
                          {selectedUser.last_login && (
                            <div className="flex gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                              <div>
                                <p className="font-medium text-xs">Last Login</p>
                                <p className="text-xs text-muted-foreground">{formatDate(selectedUser.last_login)}</p>
                              </div>
                            </div>
                          )}
                          {selectedUser.role === 'seller' && selectedUser.verification_details && (
                            <div className="flex gap-3">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5" />
                              <div>
                                <p className="font-medium text-xs">Verification {selectedUser.verification_details.status}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(selectedUser.verification_details.reviewed_at || selectedUser.verification_details.submitted_at)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* System Info */}
                    <Card className="border">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          System Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User ID</span>
                          <code className="font-mono">{selectedUser.id}</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created</span>
                          <span>{formatDate(selectedUser.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Updated</span>
                          <span>{formatDate(selectedUser.updated_at)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}   