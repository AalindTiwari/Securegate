'use client'

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Shield, Lock, FileText, ChevronRight } from "lucide-react"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono mb-4">
                        <Lock className="w-3 h-3" />
                        SECURE PROTOCOL
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-xl text-muted-foreground">Last updated: February 19, 2026</p>
                </div>

                <div className="prose prose-invert max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="text-accent">01.</span> Data Minimization principle
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            SecureGate is designed with a "zero-trust" and "zero-visibility" architecture. Unlike traditional API gateways, we do not store your raw API keys in plain text, and we do not log the contents of your AI requests or responses. Our primary objective is to facilitate secure transmission, not data collection.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="text-accent">02.</span> Information We Collect
                        </h2>
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl border border-border/50 bg-secondary/10">
                                <h4 className="font-semibold text-foreground mb-2">Account Information</h4>
                                <p className="text-sm text-muted-foreground">When you sign up, we collect your email address via Supabase Auth to manage authentication and your saved SecureGate connections.</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border/50 bg-secondary/10">
                                <h4 className="font-semibold text-foreground mb-2">Security Hash Data</h4>
                                <p className="text-sm text-muted-foreground">We store SHA-256 hashes of your security keys (SG_) and device fingerprints. These are one-way hashes; the original values cannot be recovered once set.</p>
                            </div>
                            <div className="p-4 rounded-xl border border-border/50 bg-secondary/10">
                                <h4 className="font-semibold text-foreground mb-2">Metadata Logs</h4>
                                <p className="text-sm text-muted-foreground">We log request metadata (timestamp, status code, IP address, and country) for your audit trail and to enforce security locks. We do NOT log request bodies.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="text-accent">03.</span> Encryption & Security
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Your provider API keys are encrypted using AES-256-GCM before they touch our database. The encryption keys are managed in a secure environment. Access to these keys is strictly limited to our automated proxy service and is never accessible to human operators.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="text-red-500">04.</span> Boundary of Responsibility
                        </h2>
                        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 mt-4">
                            <p className="text-white/90 font-medium mb-3">
                                Our security guarantees only apply to data within our infrastructure.
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                We cannot protect your API keys or data if your own environment is compromised. SecureGate is <strong>not responsible or liable</strong> for any data breaches, key theft, or unauthorized usage resulting from:
                            </p>
                            <ul className="list-disc list-inside space-y-1 mt-3 text-sm text-white/70">
                                <li>Insecure storage of your generated proxy keys (`SG_...`) on your end.</li>
                                <li>Compromised developer machines, local networks, or CI/CD pipelines.</li>
                                <li>Vulnerabilities in third-party libraries, agents, or software you use to connect to SecureGate.</li>
                                <li>Failure to heed security warnings or implement our provided security locks.</li>
                            </ul>
                            <p className="text-xs text-red-400 mt-4 font-mono">
                                SECURITY REMAINS A SHARED RESPONSIBILITY. YOU MUST SECURE YOUR LOCAL EDGE.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="text-accent">05.</span> Third-Party Services
                        </h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            We use the following specialized partners to provide our service:
                        </p>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                            <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-accent" /> <strong>Supabase:</strong> For authentication and database hosting.</li>
                            <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-accent" /> <strong>AI Providers:</strong> (OpenAI, Anthropic, etc.) for executing your proxied requests.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="text-accent">06.</span> Your Rights
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You have the right to delete your individual security keys, purge your audit logs, or delete your entire account at any time. Upon account deletion, all encrypted API keys and associated data are permanently removed from our active databases.
                        </p>
                    </section>
                </div>

                <div className="mt-20 p-8 rounded-2xl border border-border/60 bg-gradient-to-br from-accent/5 to-transparent">
                    <h3 className="text-lg font-bold mb-2">Questions?</h3>
                    <p className="text-muted-foreground text-sm">
                        Contact the maintainer of your SecureGate deployment for any privacy-related inquiries.
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    )
}
