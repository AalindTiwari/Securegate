import Link from "next/link"
import { Shield } from "lucide-react"

const footerLinks = {
  Resources: [
    { name: "Documentation", href: "/docs" },
    { name: "API Reference", href: "/docs#curl" },
    { name: "Security Guide", href: "/docs#security-keys" },
  ],
  Legal: [
    { name: "Privacy", href: "/legal/privacy" },
    { name: "Terms", href: "/legal/terms" },
    { name: "Security", href: "/docs#security-keys" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <img src="/assets/providers/logo.png" alt="SecureGate Logo" className="h-6 w-6 object-contain" />
              <span className="text-lg font-semibold tracking-tight font-mono">SecureGate</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              A zero-trust security layer for AI agents. Self-host SecureGate to protect provider credentials with scoped access keys.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/40 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} SecureGate contributors. Released under the MIT License.
          </p>
        </div>
      </div>
    </footer>
  )
}
