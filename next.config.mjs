/** @type {import('next').NextConfig} */
const supabaseInternalUrl =
  process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },

  // ─────────────────────────────────────────────────────────────
  // CUSTOM DOMAIN PROXY
  // Hides the Supabase URL from end users.
  // Users see:  https://yourdomain.com/api/securegate/v1/chat/completions
  // Actually:   https://<project>.supabase.co/functions/v1/securegate/v1/chat/completions
  // ─────────────────────────────────────────────────────────────
  async rewrites() {
    if (!supabaseInternalUrl) {
      return []
    }

    return [
      // Direct OpenAI-compatible path: /v1/* → Supabase Proxy Edge Function
      // Supports: /v1/chat/completions, /v1/audio/speech, /v1/audio/transcriptions,
      //           /v1/embeddings, /v1/images/generations, etc.
      {
        source: '/v1/:path*',
        destination: `${supabaseInternalUrl}/functions/v1/proxy/v1/:path*`,
      },
      // Proxy: /api/securegate/* → Supabase Edge Function
      {
        source: '/api/securegate/:path*',
        destination: `${supabaseInternalUrl}/functions/v1/proxy/:path*`,
      },
      // Edge Functions proxy: /api/functions/* → Supabase Edge Functions
      {
        source: '/api/functions/:path*',
        destination: `${supabaseInternalUrl}/functions/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
