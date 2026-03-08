"use client"

import Link from "next/link"
import { ArrowRight, Shield, Lock, CheckCircle, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PUBLIC_V1_BASE_URL } from "@/lib/public-config"
import { useAuth } from "@/hooks/use-auth"

const securityFeatures = [
    "AES-256-GCM Encryption",
    "Zero API Key Exposure",
    "JWT Authentication",
    "Row Level Security",
]

const securityPath = [
    { step: "01", title: "Authenticate", description: "Create your workspace and sign in." },
    { step: "02", title: "Connect", description: "Add provider keys inside SecureGate." },
    { step: "03", title: "Operate", description: "Issue SG_ keys from the dashboard." },
]

export function HeroSection() {
    const { user, loading } = useAuth()
    const primaryHref = !loading && user ? "/dashboard" : "/sign-up"
    const primaryLabel = !loading && user ? "Open Dashboard" : "Start with Auth"
    const secondaryHref = !loading && user ? "/dashboard/connections" : "/sign-in"
    const secondaryLabel = !loading && user ? "Manage Connections" : "Sign In"

    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '64px 64px'
                }}
            />

            {/* Glowing orb effect */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] sm:w-[450px] lg:w-[600px] h-[300px] sm:h-[450px] lg:h-[600px] bg-accent/20 rounded-full blur-[128px] opacity-30" />

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5 text-sm backdrop-blur-sm mb-8">
                        <Shield className="h-4 w-4 text-accent" />
                        <span className="text-muted-foreground">Auth-first security path</span>
                        <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
                        <span className="text-foreground font-medium">For AI agents</span>
                    </div>

                    {/* Main headline */}
                    <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                        <span className="block text-foreground">Secure Your Path</span>
                        <span className="block mt-2 bg-gradient-to-r from-accent via-orange-500 to-red-500 bg-clip-text text-transparent">
                            From Auth To Dashboard
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
                        SecureGate gives you one clean workflow for AI key security:
                        authenticate, connect your providers inside your deployment, then manage revocable <span className="text-foreground font-medium">SG_</span> keys from the dashboard.
                    </p>

                    {/* Security features row */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        {securityFeatures.map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/30 px-3 py-1.5 text-sm backdrop-blur-sm"
                            >
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-muted-foreground">{feature}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA buttons */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href={primaryHref}>
                            <Button
                                size="lg"
                                className="group h-12 px-8 text-base font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all"
                            >
                                <Lock className="mr-2 h-4 w-4" />
                                {primaryLabel}
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                        <Link href={secondaryHref}>
                            <Button
                                variant="outline"
                                size="lg"
                                className="h-12 px-8 text-base font-semibold border-border/60 hover:bg-secondary/80 transition-all"
                            >
                                <KeyRound className="mr-2 h-4 w-4 text-accent" />
                                {secondaryLabel}
                            </Button>
                        </Link>
                    </div>

                    {/* Trust indicators */}
                    <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span>Self-hostable</span>
                        </div>
                        <div className="hidden sm:block h-4 w-px bg-border" />
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>Built with security best practices</span>
                        </div>
                        <div className="hidden sm:block h-4 w-px bg-border" />
                        <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            <span>Dashboard-controlled access</span>
                        </div>
                    </div>
                    <div className="mt-12 grid gap-3 sm:grid-cols-3">
                        {securityPath.map((item) => (
                            <div
                                key={item.step}
                                className="rounded-2xl border border-border/50 bg-card/40 p-4 text-left backdrop-blur-sm"
                            >
                                <div className="text-[11px] font-mono text-accent">{item.step}</div>
                                <div className="mt-2 text-sm font-semibold text-foreground">{item.title}</div>
                                <div className="mt-1 text-sm text-muted-foreground">{item.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Architecture preview card */}
                <div className="mt-16 mx-auto max-w-4xl">
                    <div className="relative rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm overflow-hidden">
                        {/* Glow effect */}
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

                        <div className="relative">
                            {/* Terminal header */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-red-500/80" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                                    <div className="h-3 w-3 rounded-full bg-green-500/80" />
                                </div>
                                <span className="ml-4 font-mono text-xs text-muted-foreground">secure-agent.py</span>
                            </div>

                            {/* Code preview */}
                            <pre className="font-mono text-xs sm:text-sm text-muted-foreground overflow-x-auto text-left">
                                <code>{`# Avoid shipping provider secrets in agents
# client = OpenAI(api_key="sk-proj-12345...")

# Route traffic through SecureGate instead
client = OpenAI(
    api_key="SG_xxxxxxxxxxxxxxxx",        # Scoped, revocable key
    base_url="${PUBLIC_V1_BASE_URL}",     # SecureGate proxy
)

# Your provider keys stay inside your SecureGate deployment.
# If this agent is compromised, revoke the SG_ key.`}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
