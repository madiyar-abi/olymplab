'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MessageSquare, ExternalLink, Mail } from 'lucide-react'

const footerLinks = {
  product: [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Problems', href: '/dashboard/problems' },
    { name: 'Learning', href: '/dashboard/learning' },
    { name: 'Whiteboard', href: '/dashboard/whiteboard' },
  ],
  resources: [
    { name: 'Documentation', href: '#' },
    { name: 'API Reference', href: '#' },
    { name: 'Community', href: '#' },
    { name: 'Help Center', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Privacy', href: '#' },
    { name: 'Terms', href: '#' },
  ],
  social: [
    { 
      name: 'GitHub', 
      href: 'https://github.com',
      icon: (props: any) => (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
      )
    },
    { 
      name: 'Twitter', 
      href: 'https://twitter.com',
      icon: (props: any) => (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
      )
    },
    { 
      name: 'Discord', 
      href: 'https://discord.com',
      icon: MessageSquare
    },
  ],
}

export function Footer() {
  return (
    <footer className="bg-background/20 backdrop-blur-2xl border-t border-white/5 relative z-50">
      <div className="container mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-3 group">
              <Image 
                src="/logo.png" 
                alt="OlympLab" 
                width={32} 
                height={32} 
                className="rounded-lg shadow-sm transition-shadow" 
              />
              <span className="font-mono font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                OlympLab
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Elite training platform bridging abstract mathematical analysis and high-performance competitive programming.
            </p>
            <div className="flex items-center gap-4">
              {footerLinks.social.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="p-2 rounded-lg bg-secondary border border-white/5 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="sr-only">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-bold text-foreground mb-6">Product</h3>
            <ul className="space-y-4">
              {footerLinks.product.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center group"
                  >
                    {item.name}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-bold text-foreground mb-6">Resources</h3>
            <ul className="space-y-4">
              {footerLinks.resources.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact/Newsletter Section */}
          <div className="space-y-6">
            <h3 className="font-bold text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Get the latest updates on new features and problem sets.
            </p>
            <form className="relative group" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-secondary border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                <Mail className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-muted-foreground/60 font-mono">
            &copy; {new Date().getFullYear()} OlympLab. Built for absolute rigor.
          </p>
          <div className="flex items-center gap-8">
            <Link href="#" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="text-xs text-muted-foreground/60 hover:text-primary transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
