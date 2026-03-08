"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const navLinks = [
  {
    label: "Features",
    href: "#features",
  },
  {
    label: "How It Works",
    href: "#how-it-works",
  },
  {
    label: "Security",
    href: "#security",
  },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, loading } = useAuth()

  const primaryHref = !loading && user ? "/dashboard" : "/sign-up"
  const primaryLabel = !loading && user ? "Dashboard" : "Get Started"
  const secondaryHref = !loading && user ? "/dashboard/connections" : "/sign-in"
  const secondaryLabel = !loading && user ? "Connections" : "Sign in"

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault()
      const targetId = href.replace("#", "")
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
      setIsOpen(false)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img src="/assets/providers/logo.png" alt="SecureGate Logo" className="h-8 w-8 object-contain" />
          <span className="text-lg font-semibold tracking-tight font-mono">SecureGate</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleSmoothScroll(e, link.href)}
              className="px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground rounded-lg hover:bg-secondary/50 cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href={secondaryHref}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              {secondaryLabel}
            </Button>
          </Link>
          <Link href={primaryHref}>
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
              {primaryLabel}
            </Button>
          </Link>
        </div>

        <button
          className="lg:hidden flex items-center justify-center h-10 w-10 rounded-lg hover:bg-secondary/50 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border/40 bg-background lg:hidden">
          <nav className="flex flex-col px-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="px-3 py-3 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 cursor-pointer"
              >
                {link.label}
              </a>
            ))}

            <div className="mt-4 pt-4 border-t border-border/40 flex flex-col gap-2">
              <Link href={secondaryHref} onClick={() => setIsOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  {secondaryLabel}
                </Button>
              </Link>
              <Link href={primaryHref} onClick={() => setIsOpen(false)}>
                <Button size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {primaryLabel}
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
