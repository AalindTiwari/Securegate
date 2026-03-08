'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import {
    Activity,
    Shield,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Globe,
    Wifi,
    Key
} from 'lucide-react'

interface AuditLog {
    id: string
    action: string
    connection_id: string | null
    provider: string | null
    ip_address: string | null
    created_at: string
    metadata: any
}

const actionIcons: Record<string, any> = {
    create: CheckCircle2,
    access: Key,
    proxy_request: Activity,
    proxy_blocked: XCircle,
    revoke: AlertTriangle,
}

const actionColors: Record<string, string> = {
    create: 'text-green-500 bg-green-500/10',
    access: 'text-blue-500 bg-blue-500/10',
    proxy_request: 'text-accent bg-accent/10',
    proxy_blocked: 'text-red-500 bg-red-500/10',
    revoke: 'text-yellow-500 bg-yellow-500/10',
}

export default function AuditPage() {
    const { user } = useAuth()
    const supabase = createBrowserClient()

    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchLogs() {
            if (!user) return

            const token = (await supabase.auth.getSession()).data.session?.access_token
            if (!token) return

            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-audit-logs`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                if (res.ok) {
                    const data = await res.json()
                    setLogs(data.logs || [])
                }
            } catch (e) {
                console.error('Failed to fetch logs')
            } finally {
                setLoading(false)
            }
        }

        fetchLogs()
    }, [user, supabase.auth])

    return (
        <DashboardLayout>
            <div className="max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Audit Logs</h1>
                    <p className="text-muted-foreground">
                        Security events and activity history
                    </p>
                </div>

                <div className="rounded-xl border border-border/50 overflow-hidden">
                    <div className="p-4 border-b border-border/50 bg-card/50 flex items-center justify-between">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Recent Activity
                        </h2>
                        <span className="text-sm text-muted-foreground">Last 7 days</span>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center">
                            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="font-semibold mb-2">No activity yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Security events will appear here
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {logs.map((log) => {
                                const Icon = actionIcons[log.action] || Activity
                                const colorClass = actionColors[log.action] || 'text-muted-foreground bg-secondary'

                                return (
                                    <div key={log.id} className="p-4 flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium capitalize">
                                                    {log.action.replace('_', ' ')}
                                                </span>
                                                {log.provider && (
                                                    <span className="px-2 py-0.5 rounded bg-secondary text-xs capitalize">
                                                        {log.provider}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                                {log.connection_id && (
                                                    <span className="font-mono text-xs truncate max-w-[180px]">{log.connection_id}</span>
                                                )}
                                                {log.ip_address && (
                                                    <span className="flex items-center gap-1">
                                                        <Wifi className="w-3.5 h-3.5" />
                                                        {log.ip_address}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            {log.metadata?.reason && (
                                                <p className="text-sm text-destructive mt-1">
                                                    Reason: {log.metadata.reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
