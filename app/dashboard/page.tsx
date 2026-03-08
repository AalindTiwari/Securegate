'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import Link from 'next/link'
import {
    Key,
    Plus,
    Zap,
    Shield,
    ArrowRight,
    CheckCircle2,
    Clock,
    Lock
} from 'lucide-react'

interface Connection {
    connection_id: string
    provider: string
    created_at: string
    security_keys?: {
        bound_ip: string | null
        bound_country: string | null
        device_hash: string | null
    }[]
}

export default function DashboardPage() {
    const { user } = useAuth()
    const [connections, setConnections] = useState<Connection[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createBrowserClient()

    useEffect(() => {
        async function fetchConnections() {
            if (!user) return

            // Get user's connections via edge function
            const token = (await supabase.auth.getSession()).data.session?.access_token
            if (!token) return

            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/list-connections`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                )
                if (res.ok) {
                    const data = await res.json()
                    setConnections(data.connections || [])
                }
            } catch (e) {
                console.error('Failed to fetch connections')
            } finally {
                setLoading(false)
            }
        }

        fetchConnections()
    }, [user, supabase.auth])

    const isNewUser = !loading && connections.length === 0

    return (
        <DashboardLayout>
            {isNewUser ? (
                // Welcome/Onboarding screen for new users
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-orange-500/20 border border-accent/30 mb-6">
                            <Shield className="w-10 h-10 text-accent" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Welcome to SecureGate</h1>
                        <p className="text-lg text-muted-foreground max-w-md mx-auto">
                            Protect your AI agent API keys with military-grade encryption
                        </p>
                    </div>

                    {/* Quick setup steps */}
                    <div className="grid gap-4 mb-8">
                        <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border/50">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                <span className="text-accent font-bold">1</span>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Add your API key</h3>
                                <p className="text-sm text-muted-foreground">
                                    Submit your OpenAI, Anthropic, or other provider key. It's encrypted immediately.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border/50">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                <span className="text-accent font-bold">2</span>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Generate a security key</h3>
                                <p className="text-sm text-muted-foreground">
                                    Get a locked key bound to your device, IP, and location.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border/50">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                <span className="text-accent font-bold">3</span>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Use with your AI agent</h3>
                                <p className="text-sm text-muted-foreground">
                                    Point your agent to our proxy. We validate and forward to the real API.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Link
                        href="/dashboard/connections/new"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Add Your First API Key
                    </Link>
                </div>
            ) : (
                // Dashboard for existing users
                <div>
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard</h1>
                            <p className="text-muted-foreground">
                                Manage your secure API connections
                            </p>
                        </div>
                        <Link
                            href="/dashboard/connections/new"
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors w-full sm:w-auto shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            Add Connection
                        </Link>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="p-5 rounded-xl bg-card border border-border/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Key className="w-5 h-5 text-blue-500" />
                                </div>
                                <span className="text-muted-foreground text-sm">Connections</span>
                            </div>
                            <p className="text-3xl font-bold">{connections.length}</p>
                        </div>

                        <div className="p-5 rounded-xl bg-card border border-border/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                </div>
                                <span className="text-muted-foreground text-sm">Active Keys</span>
                            </div>
                            <p className="text-3xl font-bold">—</p>
                        </div>

                        <div className="p-5 rounded-xl bg-card border border-border/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-accent" />
                                </div>
                                <span className="text-muted-foreground text-sm">Requests Today</span>
                            </div>
                            <p className="text-3xl font-bold">—</p>
                        </div>
                    </div>

                    {/* Connections list */}
                    <div className="rounded-xl border border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50 bg-card/50">
                            <h2 className="font-semibold">Your Connections</h2>
                        </div>
                        <div className="divide-y divide-border/50">
                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    Loading...
                                </div>
                            ) : connections.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No connections yet
                                </div>
                            ) : (
                                connections.map((conn) => (
                                    <Link
                                        key={conn.connection_id}
                                        href={`/dashboard/connections/${conn.connection_id}`}
                                        className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                                <Lock className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium capitalize">{conn.provider}</p>
                                                <p className="text-sm text-muted-foreground font-mono">
                                                    {conn.connection_id}
                                                </p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
