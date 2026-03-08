'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, ShieldCheck, Activity, Server, AlertCircle, RefreshCw } from 'lucide-react'

interface SystemStatus {
    status: 'operational' | 'degraded' | 'down'
    timestamp: string
    services: {
        api_gateway: 'operational' | 'degraded' | 'down'
        database: 'operational' | 'degraded' | 'down'
        edge_network: 'operational' | 'degraded' | 'down'
    }
}

export default function StatusPage() {
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const fetchStatus = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/health')
            const data = await res.json()
            setSystemStatus(data)
            setLastUpdated(new Date(data.timestamp))
        } catch (e) {
            setSystemStatus({
                status: 'degraded',
                timestamp: new Date().toISOString(),
                services: {
                    api_gateway: 'degraded',
                    database: 'degraded',
                    edge_network: 'degraded'
                }
            })
            setLastUpdated(new Date())
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
        const interval = setInterval(fetchStatus, 30000) // Auto-refresh every 30s
        return () => clearInterval(interval)
    }, [])

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'operational': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'degraded': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'down': return 'bg-red-500/10 text-red-500 border-red-500/20'
            default: return 'bg-muted/10 text-muted-foreground border-border'
        }
    }

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'operational': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            case 'degraded': return <AlertCircle className="w-5 h-5 text-amber-500" />
            case 'down': return <AlertCircle className="w-5 h-5 text-red-500" />
            default: return <Activity className="w-5 h-5 text-muted-foreground" />
        }
    }

    const systemMessage =
        systemStatus?.status === 'operational' ? 'All Systems Operational' :
            systemStatus?.status === 'degraded' ? 'Minor Service Disturbance' :
                'Major System Outage'

    const headerColor =
        systemStatus?.status === 'operational' ? 'from-emerald-500/20 via-emerald-500/5 to-transparent' :
            systemStatus?.status === 'degraded' ? 'from-amber-500/20 via-amber-500/5 to-transparent' :
                'from-red-500/20 via-red-500/5 to-transparent'

    const accentColor =
        systemStatus?.status === 'operational' ? 'bg-emerald-500 shadow-emerald-500/50' :
            systemStatus?.status === 'degraded' ? 'bg-amber-500 shadow-amber-500/50' :
                'bg-red-500 shadow-red-500/50'

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        SecureGate Status
                    </Link>
                    <div className="flex items-center gap-4">
                        {lastUpdated && (
                            <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={fetchStatus}
                            disabled={loading}
                            className="p-2 hover:bg-secondary rounded-full transition-colors disabled:opacity-50"
                            title="Refresh status"
                        >
                            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-accent hover:underline hidden sm:block"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Header Status Banner */}
                <div className={`relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl mb-12`}>
                    <div className={`absolute inset-0 bg-gradient-to-b ${headerColor} -z-10`} />

                    <div className="px-8 py-10 sm:py-16 md:py-20 flex flex-col items-center justify-center text-center">
                        {loading && !systemStatus ? (
                            <div className="w-16 h-16 border-4 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mb-6" />
                        ) : (
                            <>
                                <div className="relative mb-6">
                                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-card border border-border shadow-xl`}>
                                        {getStatusIcon(systemStatus?.status)}
                                    </div>
                                    <div className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 border-background ${accentColor} shadow-lg`} />
                                </div>

                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
                                    {systemMessage}
                                </h1>
                                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                                    Monitoring SecureGate infrastructure across all global regions.
                                    Refreshed every 30 seconds.
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Services Breakdown */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        System Components
                    </h2>

                    <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {/* API Gateway */}
                        <div className="bg-card border border-border rounded-xl p-5 hover:border-accent/30 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-foreground" />
                                </div>
                                {loading && !systemStatus ? (
                                    <div className="w-16 h-6 bg-secondary animate-pulse rounded" />
                                ) : (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(systemStatus?.services.api_gateway)}`}>
                                        {systemStatus?.services.api_gateway === 'operational' ? 'Operational' : 'Degraded'}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-semibold mb-1">API Gateway</h3>
                            <p className="text-sm text-muted-foreground">Request routing and rate limiting infrastructure.</p>
                        </div>

                        {/* Edge Network */}
                        <div className="bg-card border border-border rounded-xl p-5 hover:border-accent/30 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                                    <Server className="w-5 h-5 text-foreground" />
                                </div>
                                {loading && !systemStatus ? (
                                    <div className="w-16 h-6 bg-secondary animate-pulse rounded" />
                                ) : (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(systemStatus?.services.edge_network)}`}>
                                        {systemStatus?.services.edge_network === 'operational' ? 'Operational' : 'Degraded'}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-semibold mb-1">Supabase Edge</h3>
                            <p className="text-sm text-muted-foreground">Global edge function execution and encryption.</p>
                        </div>

                        {/* Database */}
                        <div className="bg-card border border-border rounded-xl p-5 hover:border-accent/30 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-foreground" />
                                </div>
                                {loading && !systemStatus ? (
                                    <div className="w-16 h-6 bg-secondary animate-pulse rounded" />
                                ) : (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(systemStatus?.services.database)}`}>
                                        {systemStatus?.services.database === 'operational' ? 'Operational' : 'Degraded'}
                                    </span>
                                )}
                            </div>
                            <h3 className="font-semibold mb-1">Database & Auth</h3>
                            <p className="text-sm text-muted-foreground">User identity and connection storage.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border pt-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        SecureGate contributors. MIT licensed.
                    </p>
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
                        <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">Sign in</Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
