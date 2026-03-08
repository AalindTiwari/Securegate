import { Button } from "@/components/ui/button"
import { ArrowRight, Shield } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 bg-card/30 py-24 sm:py-32">
      <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
        <div
          className="w-[200%] h-[70%] origin-bottom animate-floor"
          style={{
            background: `
              linear-gradient(to right, #3a3a3a 2px, transparent 2px),
              linear-gradient(to bottom, #3a3a3a 2px, transparent 2px)
            `,
            backgroundSize: "4rem 4rem",
            transform: "perspective(500px) rotateX(60deg)",
            maskImage: "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Ready to secure your AI agents?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Stop exposing API keys in your frontend. Protect your credentials with a self-hostable gateway built around security best practices.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                <Shield className="mr-2 h-4 w-4" />
                Start securing free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs#self-hosting">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                Self-hosting guide
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
