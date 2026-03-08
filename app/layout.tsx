import type React from "react"
import type { Metadata } from "next"
import { Geist, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SecureGate — Self-Healing Identity for API Keys",
  description:
    "Protect your AI agent API keys with military-grade encryption and dynamic identity binding.",
  generator: "v0.app",
  icons: {
    icon: "/assets/providers/logo.png",
    shortcut: "/assets/providers/logo.png",
    apple: "/assets/providers/logo.png",
  },
  openGraph: {
    images: [
      {
        url: "/assets/ogimage.png",
        width: 1200,
        height: 630,
        alt: "SecureGate - Self-Healing Identity for API Keys",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
