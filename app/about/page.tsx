import { Building2, Users, Award, TrendingUp, Shield, Heart, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  const stats = [
    { label: "Properties Listed", value: "10,000+", icon: Building2 },
    { label: "Happy Clients", value: "5,000+", icon: Users },
    { label: "Years Experience", value: "15+", icon: Award },
    { label: "Success Rate", value: "98%", icon: TrendingUp },
  ]

  const values = [
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "We believe in honest communication and transparent dealings with all our clients.",
    },
    {
      icon: Heart,
      title: "Client-Focused",
      description: "Your satisfaction is our priority. We go above and beyond to meet your needs.",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We maintain the highest standards in everything we do, from service to results.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">Your Trusted Partner in Real Estate</h1>
            <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
              For over 15 years, we've been helping people find their dream homes and investment properties. Our
              commitment to excellence and client satisfaction has made us a leader in the real estate industry.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-base text-white/80">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Our Mission</h2>
              <p className="text-xl text-muted-foreground text-pretty leading-relaxed max-w-3xl mx-auto">
                To revolutionize the real estate experience by providing innovative solutions, exceptional service, and
                unwavering support to buyers, sellers, and investors.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value) => {
                const Icon = value.icon
                return (
                  <Card key={value.title} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                    <CardContent className="pt-8 pb-8 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-3">{value.title}</h3>
                      <p className="text-muted-foreground leading-relaxed text-lg">{value.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-8 text-center">Our Story</h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed text-lg">
              <p>
                Founded in 2009, our platform was born from a simple idea: make real estate accessible, transparent, and
                stress-free for everyone. What started as a small team with big dreams has grown into a thriving
                community of real estate professionals and satisfied clients.
              </p>
              <p>
                Today, we're proud to be one of the most trusted names in real estate, connecting thousands of buyers
                and sellers every year. Our innovative platform combines cutting-edge technology with personalized
                service to deliver results that exceed expectations.
              </p>
              <p>
                As we look to the future, our commitment remains the same: to help you find not just a house, but a
                place to call home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-accent text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4 text-balance">Ready to Start Your Journey?</h2>
            <p className="text-xl mb-10 leading-relaxed text-white/90">
              Join thousands of satisfied clients who have found their dream properties with us.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90 shadow-xl font-medium"
              >
                <Link href="/properties">Browse Properties</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 shadow-xl font-medium"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Component */}
      <Footer />
    </div>
  )
}
