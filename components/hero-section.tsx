"use client"

import { ArrowRight, Shield, Lock, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PUBLIC_V1_BASE_URL } from "@/lib/public-config"

const securityFeatures = [
    "AES-256-GCM Encryption",
    "Zero API Key Exposure",
    "JWT Authentication",
    "Row Level Security",
]

export function HeroSection() {
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
                        <span className="text-muted-foreground">Secure AI Gateway</span>
                        <span className="h-1 w-1 rounded-full bg-accent animate-pulse" />
                        <span className="text-foreground font-medium">Now Available</span>
                    </div>

                    {/* Main headline */}
                    <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                        <span className="block text-foreground">Stop Storing API Keys</span>
                        <span className="block mt-2 bg-gradient-to-r from-accent via-orange-500 to-red-500 bg-clip-text text-transparent">
                            In Your Agent Code
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="mt-6 mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
                        SecureGate is a <span className="text-foreground font-medium">zero-trust proxy</span> for AI agents.
                        You store encrypted keys in your SecureGate deployment, and your agents use revocable, scoped security keys.
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
                        <Button
                            size="lg"
                            className="group h-12 px-8 text-base font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all"
                            onClick={() => window.location.href = '/dashboard/connections'}
                        >
                            <Lock className="mr-2 h-4 w-4" />
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-12 px-8 text-base font-semibold border-border/60 hover:bg-secondary/80 transition-all"
                            onClick={() => window.location.href = '/docs'}
                        >
                            <Zap className="mr-2 h-4 w-4 text-accent" />
                            Read Documentation
                        </Button>
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
                            <span>Privacy-focused</span>
                        </div>
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
                                <code>{`# ❌ STOP DOING THIS
# client = OpenAI(api_key="sk-proj-12345...") 

# ✅ DO THIS INSTEAD
client = OpenAI(
    api_key="SG_xxxxxxxxxxxxxxxx",            # Scoped, revocable key
    base_url="${PUBLIC_V1_BASE_URL}",      # SecureGate Proxy
)

# Your actual API keys never leave our encrypted vault.
# If this agent is compromised, just revoke the SG_ key.`}</code>
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
