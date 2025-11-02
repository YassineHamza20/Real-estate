"use client"
import { AutoLogout } from "@/components/auto-logout"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { usersApi } from "@/lib/api/users"
import type { UserProfile } from "@/types/user"
import { User, Mail, Phone, MapPin, Globe, Shield, Camera, Loader2, CheckCircle2, Building2, Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    website: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (user) {
      loadProfile()
    }
  }, [user, authLoading, router])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const data = await usersApi.getProfile()
      setProfile(data)
      setPersonalInfo({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || "",
        bio: data.bio || "",
        location: data.location || "",
        website: data.website || "",
      })
    } catch (error) {
      console.error("[v0] Failed to load profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      await usersApi.updateProfile(personalInfo)
      await refreshUser()
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("[v0] Failed to update profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return
    }

    try {
      setIsChangingPassword(true)
      await usersApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      toast({
        title: "Success",
        description: "Password changed successfully",
      })
    } catch (error) {
      console.error("[v0] Failed to change password:", error)
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Profile Header */}
        <Card className="mb-8 border-2">
          <CardContent className="pt-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.avatarUrl || "/placeholder.svg"} alt={profile.firstName} />
                  <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-8 w-8 text-white" />
                </button>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {profile.isVerified && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">@{profile.username}</p>
                {profile.bio && <p className="text-foreground/80 mb-4 max-w-2xl">{profile.bio}</p>}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-4 w-4" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {profile.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-primary" />
                    <div className="text-2xl font-bold text-foreground">{profile.propertiesCount}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Properties</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Heart className="h-4 w-4 text-primary" />
                    <div className="text-2xl font-bold text-foreground">{profile.wishlistCount}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Saved</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="personal" className="text-base">
              Personal Information
            </TabsTrigger>
            <TabsTrigger value="security" className="text-base">
              Security
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Personal Information</CardTitle>
                <CardDescription className="text-base">
                  Update your personal details and profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-base">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="firstName"
                        value={personalInfo.firstName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-base">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="lastName"
                        value={personalInfo.lastName}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base">
                      Phone
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-base">
                      Location
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="location"
                        value={personalInfo.location}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                        placeholder="City, State"
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-base">
                      Website
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="website"
                        type="url"
                        value={personalInfo.website}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, website: e.target.value })}
                        placeholder="https://example.com"
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-base">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={personalInfo.bio}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={isSaving} size="lg" className="min-w-32">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription className="text-base">Manage your password and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-base">
                      Current Password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-base">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-base">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={
                      isChangingPassword ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                    size="lg"
                    className="min-w-32"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
