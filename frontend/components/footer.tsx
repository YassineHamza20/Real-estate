import Link from "next/link"
import { Building2, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
   <footer className="bg-background text-foreground border-t border-primary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-6 w-6 text-black" />
              </div>
              <span className="text-xl font-bold text-primary">WohnTraume</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your trusted partner in finding the perfect property. We make real estate simple, transparent, and
              accessible for everyone.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-primary/10 hover:bg-primary flex items-center justify-center transition-colors group"
              >
                <Facebook className="h-4 w-4 text-primary group-hover:text-black" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-primary/10 hover:bg-primary flex items-center justify-center transition-colors group"
              >
                <Twitter className="h-4 w-4 text-primary group-hover:text-black" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-primary/10 hover:bg-primary flex items-center justify-center transition-colors group"
              >
                <Instagram className="h-4 w-4 text-primary group-hover:text-black" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-primary/10 hover:bg-primary flex items-center justify-center transition-colors group"
              >
                <Linkedin className="h-4 w-4 text-primary group-hover:text-black" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/properties" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Browse Properties
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">Vogelsanger Weg 157, 40470 Düsseldorf</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="tel:+15551234567" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  +49 155 109 16 918
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a
                  href="mailto:support@WohnTraume.com"
                  className="text-sm text-gray-400 hover:text-primary transition-colors"
                >
                  support@WohnTraume.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">© {currentYear} WohnTraume. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
