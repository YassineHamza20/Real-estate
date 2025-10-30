// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { GlobalChatbot } from "@/components/global-chatbot"
import { ThemeProvider } from "next-themes"
import { cn } from "@/lib/utils"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "RealEstate Pro - Find Your Dream Home",
  description: "Professional real estate platform for buying, selling, and managing properties",
  generator: "v0.app",
  openGraph: {
    title: "RealEstate Pro - Your Trusted Real Estate Platform",
    description: "Find dream homes, sell with confidence. Verified, secure, smart.",
    type: "website",
    images: ["/og-image.jpg"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              name: "RealEstate Pro",
              url: "https://realestatepro.com",
              logo: "/logo.svg",
              description: "Professional real estate platform with verified listings and AI search",
              sameAs: ["https://twitter.com/realestatepro", "https://facebook.com/realestatepro"],
            }),
          }}
        />
      </head>
      <body className={cn(inter.variable, "font-sans antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <Navbar />
            {children}
            <GlobalChatbot />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}