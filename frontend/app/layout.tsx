import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { GlobalChatbot } from "@/components/global-chatbot"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { GoogleOAuthScript } from "@/components/google-oauth-script"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "WohnTräume - Find Your Dream Home",
  description: "Professional real estate platform for buying, selling, and managing properties",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleOAuthScript />
      </head>
      <body className={cn(inter.variable, "font-sans antialiased")}>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            {children}
            <GlobalChatbot />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}