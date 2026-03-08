'use client'

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Shield, Gavel, CheckCircle2, AlertTriangle } from "lucide-react"

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono mb-4">
                        <Gavel className="w-3 h-3" />
                        LEGAL FRAMEWORK
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Terms of Service</h1>
                    <p className="text-xl text-muted-foreground">Last updated: February 19, 2026</p>
                </div>

                <div className="prose prose-invert max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="text-accent">01.</span> Acceptance of Terms
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using SecureGate, you agree to be bound by these Terms of Service. If you are using the service on behalf of an organization, you are agreeing to these terms for that organization.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="text-accent">02.</span> Service Description
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            SecureGate provides a security proxy layer for AI API interactions. We encrypt your provider API keys and allow you to interact with them via temporary, scoped security keys (SG_). The service includes various security "locks" (IP, Geo, Device) designed to prevent unauthorized key usage.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">
                            <span className="text-accent">03.</span> Security Responsibilities
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-4 my-6">
                            <div className="p-4 rounded-xl border border-border/50 bg-green-500/5">
                                <div className="flex items-center gap-2 mb-2 text-green-500 font-semibold">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Our Responsibility
                                </div>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• Encrypting keys with AES-256-GCM</li>
                                    <li>• Enforcing active security locks</li>
                                    <li>• Securely hashing your SG_ keys</li>
                                    <li>• Maintaining infrastructure uptime</li>
                                </ul>
                            </div>
                            <div className="p-4 rounded-xl border border-border/50 bg-amber-500/5">
                                <div className="flex items-center gap-2 mb-2 text-amber-500 font-semibold">
                                    <AlertTriangle className="w-4 h-4" />
                                    Your Responsibility
                                </div>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• Safe storage of the raw SG_ key</li>
                                    <li>• Configuring appropriate security locks</li>
                                    <li>• Revoking keys if overlap is suspected</li>
                                    <li>• Compliance with AI provider terms</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="text-accent">04.</span> Strict Locks Policy
                        </h2>
                        <p className="text-muted-foreground leading-relaxed italic border-l-2 border-accent pl-6">
                            Note: For maximum security, certain locks (such as the Device/MAC Lock) are "immutable once bound." This means that after the first successful request binds a key to a specific device fingerprint, it cannot be changed for that security key. You must generate a new key to bind to a different device.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">
                            <span className="text-accent">05.</span> Self-Hosted Operations
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            SecureGate is distributed as self-hostable software. You are responsible for operating the infrastructure, configuring environment variables, and setting any connection or usage limits that match your deployment requirements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="text-accent">06.</span> Limitation of Liability
                        </h2>
                        <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5 mt-4">
                            <p className="text-muted-foreground leading-relaxed mb-4">
                                SecureGate provides tools to help secure API keys, but <strong>we are not liable for compromised keys, unauthorized usage, or resulting financial damages</strong>.
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                                You expressly understand and agree that SecureGate shall not be liable for breaches resulting from:
                            </p>
                            <ul className="list-disc list-inside space-y-2 mt-4 text-sm text-white/80">
                                <li>Malware, spyware, or keyloggers on your local device.</li>
                                <li>Compromised local networks or man-in-the-middle (MITM) attacks on your end.</li>
                                <li>Accidental leakage of the <code className="text-accent bg-accent/10 px-1 rounded">SG_</code> proxy key by you or your users.</li>
                                <li>Phishing attacks or social engineering.</li>
                                <li>Failure to properly configure or utilize the provided IP, Geo, or Device locks.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span className="text-accent">07.</span> Indemnification
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You agree to indemnify and hold harmless SecureGate, its creators, and affiliates from any claims, damages, obligations, losses, liabilities, costs, and expenses arising from your use of the service or any violation of these Terms or third-party AI provider terms.
                        </p>
                    </section>
                </div>

                <div className="mt-20 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Build with confidence.</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">Our legal framework is designed to protect both the developer and the end-user through transparency and robust security defaults.</p>
                </div>
            </div>
            <Footer />
        </div>
    )
}
