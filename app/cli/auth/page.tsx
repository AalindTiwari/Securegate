"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Terminal, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

// Supabase client instance
const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function CLIAuthContent() {
    const searchParams = useSearchParams()
    const port = searchParams.get('port')
    const [status, setStatus] = useState<'loading' | 'needs_login' | 'redirecting' | 'error'>('loading')
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        if (!port || isNaN(Number(port))) {
            setStatus('error')
            setErrorMsg('Invalid or missing port parameter.')
            return
        }

        const checkSessionAndRedirect = async () => {
            const { data: { session }, error } = await supabase.auth.getSession()

            if (error) {
                setStatus('error')
                setErrorMsg(error.message)
                return
            }

            if (session) {
                setStatus('redirecting')
                const redirectUrl = `http://127.0.0.1:${port}/auth#access_token=${session.access_token}&refresh_token=${session.refresh_token}`
                window.location.href = redirectUrl
            } else {
                setStatus('needs_login')
            }
        }

        // Check initially
        checkSessionAndRedirect()

        // Listen for auth changes (e.g. if they log in on another tab)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && event === 'SIGNED_IN') {
                setStatus('redirecting')
                const redirectUrl = `http://127.0.0.1:${port}/auth#access_token=${session.access_token}&refresh_token=${session.refresh_token}`
                window.location.href = redirectUrl
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [port])

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] opacity-70"></div>
            </div>

            <div className="max-w-md w-full z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-xl backdrop-blur-sm">
                        <Terminal className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">SecureGate CLI</h1>
                    <p className="text-muted-foreground">Terminal Authentication</p>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
                    {/* Status indicator line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>

                    {status === 'loading' && (
                        <div className="text-center py-8">
                            <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Connecting...</h2>
                            <p className="text-muted-foreground text-sm">Communicating with your local terminal.</p>
                        </div>
                    )}

                    {status === 'redirecting' && (
                        <div className="text-center py-8 animate-in zoom-in-95 duration-300">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Authentication Successful!</h2>
                            <p className="text-muted-foreground text-sm mb-6">Redirecting you back to your terminal...</p>
                            <p className="text-xs text-muted-foreground opacity-70">You can close this tab once your terminal updates.</p>
                        </div>
                    )}

                    {status === 'needs_login' && (
                        <div className="text-center py-4">
                            <h2 className="text-xl font-semibold mb-4">Sign in required</h2>
                            <p className="text-sm text-muted-foreground mb-8">
                                You need to log in to SecureGate to authenticate your CLI session.
                            </p>
                            <Link
                                href="/sign-in"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors"
                            >
                                Sign In via Browser
                            </Link>
                            <p className="text-xs text-muted-foreground mt-6">
                                The CLI will automatically detect when you&apos;ve signed in.
                            </p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center py-4 text-red-400">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-80" />
                            <h2 className="text-xl font-semibold mb-2 text-red-500">Connection Failed</h2>
                            <p className="text-sm mb-6 opacity-90">{errorMsg}</p>
                            <p className="text-xs text-muted-foreground">
                                Please return to your terminal and run <code className="text-red-300 bg-red-900/20 px-1 py-0.5 rounded">securegate login</code> again.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function CLIAuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
            <CLIAuthContent />
        </Suspense>
    )
}
