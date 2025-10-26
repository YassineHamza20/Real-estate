import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, Search, TrendingUp, Shield, Award } from "lucide-react"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[700px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              "url(/placeholder.svg?height=700&width=1920&query=modern luxury home exterior with blue sky)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/60" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Building2 className="h-10 w-10" />
            </div>
            <h1 className="text-6xl font-bold tracking-tight">RealEstate Pro</h1>
          </div>
          <p className="text-2xl mb-4 text-balance max-w-3xl mx-auto font-light leading-relaxed">
            Find your dream home or sell your property with confidence
          </p>
          <p className="text-lg mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
            Professional real estate platform trusted by thousands of buyers and sellers
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="text-lg h-14 px-8 bg-white text-primary hover:bg-white/90 shadow-xl">
              <Link href="/properties">Browse Properties</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg h-14 px-8 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 shadow-xl"
            >
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-white/80">Active Listings</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5K+</div>
              <div className="text-white/80">Happy Clients</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-white/80">Verified Agents</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-white/80">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-balance">Why Choose RealEstate Pro</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Experience the future of real estate with our comprehensive platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl border-2 border-border hover:border-primary transition-all hover:shadow-lg bg-card">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Advanced Search</h3>
              <p className="text-muted-foreground leading-relaxed">
                Find properties that match your exact criteria with our powerful search filters and AI-powered
                recommendations
              </p>
            </div>
            <div className="group p-8 rounded-2xl border-2 border-border hover:border-primary transition-all hover:shadow-lg bg-card">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Verified Listings</h3>
              <p className="text-muted-foreground leading-relaxed">
                All properties are verified and reviewed to ensure quality, authenticity, and accurate information
              </p>
            </div>
            <div className="group p-8 rounded-2xl border-2 border-border hover:border-primary transition-all hover:shadow-lg bg-card">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Market Insights</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get real-time market data and analytics to make informed decisions about your property investments
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-balance">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Get started in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-white text-3xl font-bold mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Create Your Account</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sign up for free and set your preferences to get personalized property recommendations
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-white text-3xl font-bold mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Search & Explore</h3>
              <p className="text-muted-foreground leading-relaxed">
                Browse thousands of verified listings and use advanced filters to find your perfect match
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary text-white text-3xl font-bold mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Connect & Close</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect with verified agents and close deals with confidence using our secure platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-accent text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Award className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-4xl font-bold mb-4 text-balance">Ready to Get Started?</h2>
            <p className="text-xl mb-10 leading-relaxed text-white/90">
              Join thousands of buyers and sellers who trust RealEstate Pro for their property needs. Start your journey
              today.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90 shadow-xl">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 shadow-xl"
              >
                <Link href="/register">Create Free Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <Footer />
    </div>
  )
}
