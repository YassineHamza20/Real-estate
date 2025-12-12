"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Building2, Menu, Home, LogOut, Moon, Sun, Languages } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"

// Theme Toggle Component
function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light")
  }, [theme, setTheme])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleThemeToggle}
      className="h-9 w-9 rounded-full relative"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}

// Language Toggle Component
function LanguageToggle() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'de' : 'en'
    i18n.changeLanguage(newLang)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="h-9 w-9 rounded-full"
      aria-label="Toggle language"
    >
      <Languages className="h-4 w-4" />
    </Button>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = useMemo(
    () => [
      { href: "/properties", label: "Properties" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
    []
  )

  const displayName = user?.first_name || user?.username || "User"
  const initials =
    (user?.first_name?.[0] || "") + (user?.last_name?.[0] || "") || user?.username?.[0] || "U"

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleLogout = useCallback(async () => {
    await logout()
    setMobileMenuOpen(false)
    router.refresh()
  }, [logout, router])

  // Simplified NavLink component
  const NavLink = useCallback(
    ({ href, label }: { href: string; label: string }) => {
      const isActive = pathname === href

      return (
        <Link
          href={href}
          className={cn(
            "group relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg",
            isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
          aria-current={isActive ? "page" : undefined}
        >
          <span className="relative z-10">{label}</span>
          
          {/* Simple active indicator */}
          {isActive && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
          )}
        </Link>
      )
    },
    [pathname]
  )

  const UserAvatar = () => (
    <Avatar className="h-10 w-10 border-2 border-background">
      <AvatarImage
        src={user?.profile_picture_url || "/placeholder.svg"}
        alt={displayName}
        className="object-cover"
      />
      <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
        {initials.toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )

  return (
    <>
      {/* Simplified Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold text-xl tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
              aria-label="WohnTräume Home"
            >
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <span className="text-foreground">WohnTräume</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} />
              ))}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto hover:bg-transparent focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full"
                      aria-label={`User menu for ${displayName}`}
                    >
                      <UserAvatar />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-64 p-4 border-border/40 bg-background/95 backdrop-blur-md"
                    align="end"
                    sideOffset={8}
                  >
                    <DropdownMenuLabel className="p-0 mb-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar />
                        <div>
                          <p className="font-semibold text-sm">{displayName}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/40" />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer py-2">
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/40" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2 py-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button
              className="md:hidden p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors focus-visible:ring-2 focus-visible:ring-primary/50"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5 text-primary" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sheet Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-80 bg-background/95 backdrop-blur-lg"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Menu
            </SheetTitle>
          </SheetHeader>

          {/* Theme Toggle in Mobile Menu */}
          <div className="flex justify-center mb-6">
            <ThemeToggle />
          </div>

          <nav className="flex flex-col space-y-1" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 space-y-4 border-t border-border/40 pt-6">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-2">
                  <UserAvatar />
                  <div>
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start text-foreground hover:bg-accent/50"
                  size="lg"
                >
                  <Link href="/dashboard">
                    <Home className="mr-3 h-5 w-5" />
                    Dashboard
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/5"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button asChild variant="ghost" className="w-full" size="lg">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}