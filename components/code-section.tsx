"use client"

import { useState, useEffect } from "react"
import { Shield } from "lucide-react"
import { PUBLIC_V1_BASE_URL } from "@/lib/public-config"

const codeExamples = {
  connect: `// 1. Store your API key in SecureGate dashboard
// Dashboard → Connections → New → Paste your key
// Returns:
//   connection_id: "openai_x8z92a"
//   security_key:  "SG_xxxxxxxxxxxxx"  ← shown ONCE
//
// Your key is AES-256-GCM encrypted at rest.`,

  request: `// 2. Use SecureGate as your OpenAI base URL
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: "SG_xxxxxxxxxxxxxxxx",        // Security key
  baseURL: "${PUBLIC_V1_BASE_URL}",  // Proxy
});

const res = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
// ✓ Real key decrypted server-side only
// ✓ Never exposed to your agent code`,

  verify: `// How SecureGate validates each request:
//
// 1. Hash the SG_ key with SHA-256
// 2. Match against stored key_hash in DB
// 3. Check IP Lock   → 403 if IP mismatch
// 4. Check Geo Lock  → 403 if country mismatch
// 5. Check Device Lock → 403 if fingerprint mismatch
// 6. Check Model Lock → 403 if model not allowed
// 7. Decrypt real API key (AES-256-GCM)
// 8. Forward to provider → return response`,

  audit: `// Every request is automatically logged:
{
  action: "proxy_request",
  connection_id: "openai_x8z...",
  provider: "openai",
  ip_address: "203.0.113.42",
  metadata: {
    path: "/v1/chat/completions",
    status: 200,
    latency_ms: 847,
    model: "gpt-4o"
  }
}
// ✓ Full audit trail, zero secret exposure`,
}

const features = [
  { key: "connect", label: "Store API key securely" },
  { key: "request", label: "Make secure requests" },
  { key: "verify", label: "JWT verification flow" },
  { key: "audit", label: "Audit logging" },
] as const

export function CodeSection() {
  const [activeFeature, setActiveFeature] = useState<keyof typeof codeExamples>("connect")
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    const fullText = codeExamples[activeFeature]
    setDisplayedText("")
    setIsTyping(true)

    let currentIndex = 0
    const typingSpeed = 8 // milliseconds per character

    const typeInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(typeInterval)
        setIsTyping(false)
      }
    }, typingSpeed)

    return () => clearInterval(typeInterval)
  }, [activeFeature])

  return (
    <section id="security" className="py-24 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <p className="text-sm font-medium uppercase tracking-wider text-accent">Security Architecture</p>
          </div>
          <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Defense in depth for your API keys
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Multiple independent security layers ensure that compromise of any single layer does not expose secrets.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="flex flex-col md:flex-row md:gap-8">
            {/* Menu buttons - horizontal on mobile, vertical sidebar on tablet+ */}
            <div className="flex flex-row flex-wrap gap-2 mb-4 md:mb-0 md:flex-col md:gap-3 md:w-48 md:shrink-0">
              {features.map((feature) => (
                <button
                  key={feature.key}
                  onClick={() => setActiveFeature(feature.key)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 ${activeFeature === feature.key
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border/60 bg-card/50 text-muted-foreground hover:border-accent/50 hover:text-foreground"
                    }`}
                >
                  {feature.label}
                </button>
              ))}
            </div>

            {/* Terminal - right side on tablet+ */}
            <div
              className="flex-1 overflow-hidden rounded-2xl border border-border/60"
              style={{ backgroundColor: "#141414" }}
            >
              <div
                className="flex h-10 items-center gap-2 border-b border-border/60 px-4"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-muted-foreground">secure-gateway.ts</span>
              </div>
              <pre className="overflow-x-auto overflow-y-auto p-4 sm:p-6 h-[200px] md:h-[240px]" style={{ backgroundColor: "#0d0d0d" }}>
                <code className="font-mono text-sm text-muted-foreground">
                  {displayedText.split("\n").map((line, i) => (
                    <span key={i} className="block">
                      {line.startsWith("//") ? (
                        <span className="text-muted-foreground/60">{line}</span>
                      ) : line.startsWith("$") ? (
                        <span className="text-accent">{line}</span>
                      ) : line.startsWith("✓") ? (
                        <span className="text-green-400">{line}</span>
                      ) : line.includes(":") && !line.includes("//") ? (
                        <span className="text-foreground">{line}</span>
                      ) : (
                        <span className="text-foreground/80">{line}</span>
                      )}
                    </span>
                  ))}
                  {isTyping && <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5 align-middle" />}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
