'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Key,
    Plus,
    ArrowRight,
    Lock,
    MoreVertical,
    Trash2,
    Settings,
    Copy,
    CheckCircle2,
    Globe,
    Fingerprint,
    ShieldCheck
} from 'lucide-react'
import { providerColors, getProvider } from '@/lib/providers'

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

export default function ConnectionsPage() {
    const { user } = useAuth()
    const [connections, setConnections] = useState<Connection[]>([])
    const [loading, setLoading] = useState(true)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const supabase = createBrowserClient()
    const router = useRouter()
    useEffect(() => {
        async function fetchConnections() {
            if (!user) return

            const token = (await supabase.auth.getSession()).data.session?.access_token
            if (!token) return

            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/list-connections`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        cache: 'no-store'
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

    const copyConnectionId = async (id: string) => {
        await navigator.clipboard.writeText(id)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <DashboardLayout>
            <div className="max-w-4xl">
                <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Connections</h1>
                        <p className="text-muted-foreground">
                            Your encrypted API key connections
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

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : connections.length === 0 ? (
                    <div className="text-center py-20 rounded-xl border border-dashed border-border">
                        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                            <Key className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No connections yet</h2>
                        <p className="text-muted-foreground mb-6">Add your first API key to get started</p>
                        <Link
                            href="/dashboard/connections/new"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Connection
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {connections.map((conn) => (
                            <div
                                key={conn.connection_id}
                                onClick={() => router.push(`/dashboard/connections/${conn.connection_id}`)}
                                className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 rounded-xl bg-card border border-border/50 hover:border-accent/30 hover:bg-card/50 hover:shadow-sm cursor-pointer transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${providerColors[conn.provider] || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                                        <Lock className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-semibold capitalize text-lg">{conn.provider}</p>
                                            {/* Security Status Indicators */}
                                            {conn.security_keys?.[0] && (
                                                <div className="flex items-center gap-2">
                                                    {conn.security_keys[0].bound_ip && conn.security_keys[0].bound_ip !== 'unbound' && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20" title={`IP Locked: ${conn.security_keys[0].bound_ip}`}>
                                                            <Globe className="w-3 h-3" />
                                                            IP
                                                        </div>
                                                    )}
                                                    {conn.security_keys[0].bound_country && conn.security_keys[0].bound_country !== 'global' && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20" title={`Geo Locked: ${conn.security_keys[0].bound_country}`}>
                                                            <ShieldCheck className="w-3 h-3" />
                                                            GEO
                                                        </div>
                                                    )}
                                                    {conn.security_keys[0].device_hash && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20" title="Device Locked">
                                                            <Fingerprint className="w-3 h-3" />
                                                            DEV
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <code className="text-sm text-muted-foreground font-mono truncate">
                                                {conn.connection_id}
                                            </code>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyConnectionId(conn.connection_id)
                                                }}
                                                className="p-1 rounded hover:bg-secondary transition-colors"
                                                title="Copy connection ID"
                                            >
                                                {copiedId === conn.connection_id ? (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:self-center">
                                    <span className="text-xs text-muted-foreground mr-2 hidden sm:inline">
                                        {new Date(conn.created_at).toLocaleDateString()}
                                    </span>
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Link
                                            href={`/dashboard/connections/${conn.connection_id}`}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-sm font-medium transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Manage
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
