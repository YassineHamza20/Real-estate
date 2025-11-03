"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Building2, Menu, Home, LogOut, Moon, Sun } from "lucide-react"
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
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"

// Theme Toggle Component
function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-9 w-9 rounded-full"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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

  // Unique layoutId per link to prevent underline "sticking"
  const NavLink = useCallback(
    ({ href, label }: { href: string; label: string }) => {
      const isActive = pathname === href
      const layoutId = `nav-underline-${href}`

      return (
        <Link
          href={href}
          className={cn(
            "group relative px-4 py-2 text-sm font-medium tracking-tight transition-all duration-300 rounded-lg overflow-hidden",
            isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
          aria-current={isActive ? "page" : undefined}
        >
          <span className="relative z-10">{label}</span>

          {/* Animated Underline – Per Link */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                initial={{ scaleX: 0, originX: 0.5 }}
                animate={{ scaleX: 1, originX: 0.5 }}
                exit={{ scaleX: 0, originX: 0.5 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </AnimatePresence>

          {/* Active Glow */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-lg bg-primary/10 blur-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Hover Lift */}
          <motion.div
            className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          />
        </Link>
      )
    },
    [pathname]
  )

  const UserAvatar = () => (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Avatar className="h-10 w-10 ring-4 ring-background shadow-lg transition-shadow hover:shadow-xl">
        <AvatarImage
          src={user?.profile_picture_url || "/placeholder.svg"}
          alt={displayName}
          className="object-cover"
        />
        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
          {initials.toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </motion.div>
  )

  return (
    <>
      {/* Glass Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center gap-2.5 font-bold text-xl tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
              aria-label="WohnTraume Home"
            >
              <motion.div
                initial={{ scale: 0.8, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="p-2 rounded-xl bg-primary/10 shadow-md ring-1 ring-primary/20"
              >
                <Building2 className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="text-foreground">WohnTraume</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2" aria-label="Main navigation">
              {navLinks.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} />
              ))}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-2">
              {/* Theme Toggle */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ThemeToggle />
              </motion.div>
              
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
                    className="w-64 p-4 border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl"
                    align="end"
                    sideOffset={12}
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
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer py-2">
                        <Home className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
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
                    className="font-medium shadow-md bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:shadow-lg"
                  >
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="md:hidden p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all focus-visible:ring-2 focus-visible:ring-primary/50"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5 text-primary" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Sheet Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent
              side="right"
              className="w-full sm:w-96 border-l-0 bg-background/95 backdrop-blur-2xl shadow-2xl"
            >
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              >
                <SheetHeader className="mb-8">
                  <SheetTitle className="flex items-center gap-3 text-left text-2xl font-bold">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20"
                    >
                      <Building2 className="h-6 w-6 text-primary" />
                    </motion.div>
                    Menu
                  </SheetTitle>
                </SheetHeader>

                {/* Theme Toggle in Mobile Menu */}
                <div className="flex justify-center mb-6">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <ThemeToggle />
                  </motion.div>
                </div>

                <nav className="flex flex-col space-y-2" aria-label="Mobile navigation">
                  {navLinks.map((link) => (
                    <motion.div
                      key={link.href}
                      whileHover={{ x: 8 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center rounded-xl px-4 py-3 text-base font-medium transition-all",
                          pathname === link.href
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <div className="mt-8 space-y-4 border-t border-border/50 pt-6">
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
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                        size="lg"
                      >
                        <Link href="/register">Get Started</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  )
}