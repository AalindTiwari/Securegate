'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
    const router = useRouter()
    const supabase = createBrowserClient()
    const [status, setStatus] = useState('Completing secure sign in...')
    const [isRetrying, setIsRetrying] = useState(false)

    useEffect(() => {
        let mounted = true

        const handleAuth = async () => {
            // Helper to parse JWT locally to check timestamps
            const parseJwt = (token: string) => {
                try {
                    return JSON.parse(atob(token.split('.')[1]))
                } catch (e) {
                    return null
                }
            }

            const attemptSetSession = async (accessToken: string, refreshToken: string | null) => {
                const result = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken || '',
                })
                return result
            }

            // 1. Try standard check first
            const { data: { session }, error } = await supabase.auth.getSession()

            if (session) {
                if (mounted) router.push('/dashboard')
                return
            }

            // 2. Manual parsing with Time Warp
            const hash = window.location.hash
            if (hash && hash.includes('access_token')) {
                if (mounted) {
                    setStatus('Syncing secure session...')
                    setIsRetrying(true)
                }

                try {
                    const params = new URLSearchParams(hash.substring(1))
                    const accessToken = params.get('access_token')
                    const refreshToken = params.get('refresh_token')

                    if (accessToken) {
                        // Check for clock skew
                        const claims = parseJwt(accessToken)
                        const iat = claims?.iat ? claims.iat * 1000 : Date.now()
                        const timeDiff = iat - Date.now()

                        let result

                        // If token is from the "future" (> 2s), we need to warp time for the client check
                        if (timeDiff > 2000) {
                            console.log(`Clock skew detected: Client is ${timeDiff}ms behind server. Applying time warp...`)

                            // Save originals
                            const originalDate = globalThis.Date
                            const originalNow = Date.now

                            // Patch Date to be in the "future" (server time)
                            // We construct a proxy class that adds the offset
                            const ServerDate = class extends Date {
                                constructor(...args: any[]) {
                                    if (args.length === 0) {
                                        super(originalNow() + timeDiff + 1000) // +1s buffer
                                    } else {
                                        // @ts-ignore
                                        super(...args)
                                    }
                                }
                                static now() {
                                    return originalNow() + timeDiff + 1000
                                }
                            }

                            // Apply patch
                            // @ts-ignore
                            globalThis.Date = ServerDate

                            try {
                                result = await attemptSetSession(accessToken, refreshToken)
                            } finally {
                                // Restore immediately
                                globalThis.Date = originalDate
                            }
                        } else {
                            // Normal attempt
                            result = await attemptSetSession(accessToken, refreshToken)
                        }

                        if (!result.error && result.data.session) {
                            console.log('Session established with time warp!')
                            if (mounted) {
                                setStatus('Session verified.')
                                router.push('/dashboard')
                            }
                            return
                        } else {
                            console.warn('SetSession failed even with retry using valid API key:', result.error)
                        }
                    }
                } catch (e) {
                    console.error('Auth processing failed:', e)
                }
            }

            // 3. Last resort fallback listener
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                (event, session) => {
                    if (event === 'SIGNED_IN' || session) {
                        if (mounted) router.push('/dashboard')
                    }
                }
            )

            return subscription
        }

        handleAuth()

        const timeout = setTimeout(() => {
            if (mounted) {
                // If we're still here, try a hard reload which sometimes bypasses stuck states
                if (window.location.hash) {
                    window.location.reload()
                } else {
                    router.push('/sign-in?error=Unable+to+sync+session.+Please+check+your+system+clock.')
                }
            }
        }, 5000)

        return () => {
            mounted = false
            clearTimeout(timeout)
        }
    }, [router, supabase.auth])

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className={`w-8 h-8 text-accent animate-spin ${isRetrying ? 'text-purple-500' : ''}`} />
                <p className="text-muted-foreground font-medium animate-pulse">{status}</p>
                {isRetrying && (
                    <p className="text-xs text-muted-foreground/70 max-w-xs text-center">
                        Adjusting for system time difference...
                    </p>
                )}
            </div>
        </div>
    )
}
