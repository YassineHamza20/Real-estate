"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, MapPin, Clock, Send, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Footer } from "@/components/footer"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 1200))

    toast({
      title: (
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Message Sent Successfully!
        </span>
      ),
      description: "Our team will reach out within 24 hours.",
    })

    setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
    setIsSubmitting(false)
  }

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const contactInfo = [
    {
      icon: Phone,
      title: "Phone",
      details: "+49 (155)10916 918",
      subdetails: "Mon–Fri 9 AM–6 PM ",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: Mail,
      title: "Email",
      details: "yhamza@pekerholding.com",
      subdetails: "Replies within 24 hours",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: MapPin,
      title: "Office",
      details: "Vogelsanger Weg 157",
      subdetails: "40470 Düsseldorf, Germany",
      gradient: "from-purple-500 to-pink-600",
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: "Monday – Friday",
      subdetails: "9:00 AM – 6:00 PM",
      gradient: "from-orange-500 to-amber-600",
    },
  ]

  const faqItems = [
    {
      question: "How do I become a verified seller?",
      answer: "Register as a normal account (buyer/renter) first, then navigate to your profile and click 'Become a Seller'. You'll need to submit verification documents including ID and proof of ownership."
    },
    {
      question: "How long does verification take?",
      answer: "Seller verification typically takes 2-3 business days. You'll receive an email notification once your application is reviewed."
    },
    {
      question: "Is there a fee to list properties?",
      answer: "All listings are completely free. We believe in making real estate accessible to everyone without any upfront costs."
    },
    {
      question: "What types of properties can I list?",
      answer: "You can list residential properties (houses, apartments, villas), commercial properties (offices, retail spaces), land, and rental properties. All properties must be legally owned and properly documented."
    },
   
    {
      question: "What documents do I need to buy a property?",
      answer: "Typically you'll need proof of funds or mortgage pre-approval, government-issued ID, and sometimes references. Our agents will guide you through the specific requirements for each property."
    },
    {
      question: "Can I list my property for both sale and rent?",
      answer: "No, each property can only be listed for one purpose at a time to avoid confusion. You'll need to choose either sale or rental listing."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/20 via-background to-muted/30">
      {/* Hero Section with Parallax Effect */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-accent/10 py-24 md:py-32">
        <div className="absolute inset-0 bg-grid-primary/5 bg-grid-16 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="container mx-auto px-4 relative z-10"
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/15 backdrop-blur-sm border border-primary/20 mb-8 shadow-xl"
            >
              <Mail className="h-12 w-12 text-primary" />
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Let's Connect
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Your dream property is just a message away. Our experts are ready to guide you.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Contact Info Cards with Hover Effects */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {contactInfo.map((info, index) => {
              const Icon = info.icon
              return (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <Card className="group relative overflow-hidden border-2 border-transparent bg-card/80 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:shadow-2xl h-full">
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity",
                        info.gradient
                      )}
                    />
                    <CardContent className="pt-10 pb-8 text-center relative z-10">
                      <div className="inline-flex items-center justify-center w-18 h-18 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 mb-5 shadow-lg group-hover:scale-110 transition-transform">
                        <Icon className="h-9 w-9 text-primary" />
                      </div>
                      <h3 className="font-bold text-xl mb-3 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                        {info.title}
                      </h3>
                      <p className="text-lg font-semibold mb-1 text-primary">{info.details}</p>
                      <p className="text-sm text-muted-foreground">{info.subdetails}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Enhanced Contact Form */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
{/*             
            
            <Card className="border-2 border-primary/10 shadow-2xl bg-card/95 backdrop-blur-xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-primary/70 to-accent" />
              <CardHeader className="text-center pt-10 pb-8 bg-gradient-to-b from-muted/30 to-transparent -m-px">
                <CardTitle className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  Send Us a Message
                </CardTitle>
                <CardDescription className="text-lg mt-3 max-w-2xl mx-auto">
                  Fill out the form below and our dedicated team will respond within <strong>24 hours</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="name" className="text-base font-medium flex items-center gap-1">
                        Full Name <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="h-14 text-base border-primary/20 focus:border-primary/50 focus:ring-primary/20 transition-all"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="email" className="text-base font-medium flex items-center gap-1">
                        Email Address <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="h-14 text-base border-primary/20 focus:border-primary/50 focus:ring-primary/20 transition-all"
                      />
                    </motion.div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="phone" className="text-base font-medium">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-14 text-base border-primary/20 focus:border-primary/50 focus:ring-primary/20 transition-all"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="subject" className="text-base font-medium flex items-center gap-1">
                        Subject <span className="text-primary">*</span>
                      </Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => setFormData({ ...formData, subject: value })}
                        required
                      >
                        <SelectTrigger
                          id="subject"
                          className="h-14 text-base border-primary/20 data-[state=open]:border-primary/50"
                        >
                          <SelectValue placeholder="Choose a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="buying">Buying Property</SelectItem>
                          <SelectItem value="selling">Selling Property</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                          <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="message" className="text-base font-medium flex items-center gap-1">
                      Your Message <span className="text-primary">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can assist you with your real estate journey..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      className="text-base resize-none border-primary/20 focus:border-primary/50 focus:ring-primary/20 transition-all"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button
                      type="submit"
                      className="w-full h-16 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-accent gap-3 group"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-3">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Sending Message...
                        </span>
                      ) : (
                        <>
                          <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
             */}

             <Card className="border-2 border-primary/10 shadow-2xl bg-card/95 backdrop-blur-xl overflow-hidden">
  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-primary/70 to-accent" />

  <CardHeader className="text-center pt-10 pb-8 bg-gradient-to-b from-muted/30 to-transparent -m-px">
    <CardTitle className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
      Contact Us
    </CardTitle>
    <CardDescription className="text-lg mt-3 max-w-2xl mx-auto">
      We would love to hear from you!  
      For any inquiries, feel free to reach out directly via phone or email.
    </CardDescription>
  </CardHeader>

  <CardContent className="pt-6 pb-10">
    <div className="space-y-8 text-center">

      <div className="space-y-3">
        <h3 className="text-2xl font-semibold text-primary">Phone</h3>
        <p className="text-lg">
          <a
            href="tel:+4915510916918"
            className="text-accent font-medium hover:underline"
          >
            +49 155 10916918
          </a>
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-2xl font-semibold text-primary">Email</h3>
        <p className="text-lg">
          <a
            href="mailto:yhamza@pekerholding.com"
            className="text-accent font-medium hover:underline"
          >
            yhamza@pekerholding.com
          </a>
        </p>
      </div>

      <p className="text-lg max-w-xl mx-auto text-muted-foreground">
        Send us an inquiry through phone or email and our team will get back to you as soon as possible.
      </p>
    </div>
  </CardContent>
</Card>

          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Before reaching out, you might find answers to common questions in our FAQ section.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {faqItems.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="mb-4"
              >
                <Card className="border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-lg font-semibold text-foreground pr-4">
                        {faq.question}
                      </span>
                      {activeFaq === index ? (
                        <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {activeFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5">
                            <div className="w-12 h-1 bg-gradient-to-r from-primary to-accent rounded-full mb-4" />
                            <p className="text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-12"
          >
            <p className="text-lg text-muted-foreground mb-6">
              Still have questions? We're here to help!
            </p>
            <Button
              onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Us Directly
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}