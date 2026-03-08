"use client"

import { useState, useEffect, useRef } from "react"
import { Check, Shield } from "lucide-react"

const features = [
  "One-time secure key submission",
  "Encrypted storage with AES-256-GCM",
  "JWT-authenticated requests only",
  "Zero plaintext exposure in logs",
]

export function DeveloperExperience() {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const [visibleChecks, setVisibleChecks] = useState<number[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  const fullText = `$ curl -X POST /api/chat \\
  -H "Authorization: Bearer <jwt>" \\
  -d '{"connection_id": "prov_8f23a"}'

✓ JWT verified locally
✓ Key decrypted in memory
✓ Request proxied to OpenAI
✓ Response returned securely`

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
          }
        })
      },
      { threshold: 0.3 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [hasAnimated])

  useEffect(() => {
    if (!hasAnimated) return

    setDisplayedText("")
    setIsTyping(true)

    let currentIndex = 0
    const typingSpeed = 8

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
  }, [fullText, hasAnimated])

  useEffect(() => {
    if (!hasAnimated) return

    setVisibleChecks([])

    features.forEach((_, index) => {
      setTimeout(
        () => {
          setVisibleChecks((prev) => [...prev, index])
        },
        1000 + index * 150,
      )
    })
  }, [hasAnimated])

  return (
    <section ref={sectionRef} id="how-it-works" className="border-y border-border/40 bg-card/30 py-24 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent" />
              <p className="font-mono text-sm font-medium uppercase tracking-wider text-accent">
                How It Works
              </p>
            </div>
            <h2 className="mt-2 font-mono text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Your keys stay locked in our vault
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Submit your API key once. We encrypt and store it. Every request uses a safe connection ID — your key never leaves our backend.
            </p>
            <ul className="mt-8 space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 transition-all duration-300 ${visibleChecks.includes(index) ? "opacity-100 scale-100" : "opacity-0 scale-50"
                      }`}
                  >
                    <Check className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div
              className="aspect-video overflow-hidden rounded-2xl border border-border/60 flex flex-col"
              style={{ backgroundColor: "#141414" }}
            >
              <div
                className="flex h-8 items-center gap-2 border-b border-border/60 px-4 shrink-0"
                style={{ backgroundColor: "#1a1a1a" }}
              >
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-muted-foreground">Terminal</span>
              </div>
              <div className="p-4 font-mono text-sm flex-1" style={{ backgroundColor: "#0d0d0d" }}>
                <code className="text-muted-foreground">
                  {displayedText.split("\n").map((line, i) => (
                    <span key={i} className="block">
                      {line.startsWith("$") ? (
                        <span className="text-accent">{line}</span>
                      ) : line.startsWith("✓") ? (
                        <span className="text-green-400">{line}</span>
                      ) : (
                        <span>{line}</span>
                      )}
                    </span>
                  ))}
                  {isTyping && <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5 align-middle" />}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
