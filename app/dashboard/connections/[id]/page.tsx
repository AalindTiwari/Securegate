'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStepUpAuth } from '@/hooks/use-step-up-auth'
import { StepUpModal } from '@/components/ui/step-up-modal'
import {
    ArrowLeft,
    Lock,
    Key,
    Copy,
    CheckCircle2,
    Shield,
    Globe,
    Wifi,
    Smartphone,
    Trash2,
    Plus,
    AlertTriangle,
    MapPin,
    Clock,
    Activity,
    MoreVertical,
    X,
    CheckSquare,
    Square,
    Search,
    Settings2,
    Code2,
    Variable,
    Terminal,
    ExternalLink,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { IntegrationGuide } from '@/components/integration-guide'
import { PUBLIC_RUN_CUSTOM_CODE_URL, PUBLIC_V1_BASE_URL } from '@/lib/public-config'

const AVAILABLE_MODELS = [
    // Reasoning & Deep Research
    "o1", "o1-pro", "o1-mini", "o1 Preview",
    "o3", "o3-pro", "o3-mini", "o3-deep-research",
    "o4-mini", "o4-mini-deep-research",

    // GPT-5 Series
    "GPT-5", "GPT-5.1", "GPT-5.2",
    "GPT-5 mini", "GPT-5 nano", "GPT-5 pro", "GPT-5.2 pro",
    "GPT-5 Chat", "GPT-5.1 Chat", "GPT-5.2 Chat",

    // Codex
    "GPT-5-Codex", "GPT-5.1 Codex", "GPT-5.2-Codex",
    "GPT-5.1-Codex-Max", "GPT-5.1 Codex mini", "codex-mini-latest",

    // GPT-4 Series
    "GPT-4o", "GPT-4o mini",
    "GPT-4.1", "GPT-4.1 mini", "GPT-4.1 nano",
    "GPT-4 Turbo", "GPT-4", "GPT-3.5 Turbo",
    "ChatGPT-4o",

    // Search & Tools
    "GPT-4o Search Preview", "GPT-4o mini Search Preview",
    "computer-use-preview",

    // Audio & Realtime
    "gpt-audio", "gpt-audio-mini",
    "gpt-realtime", "gpt-realtime-mini",
    "GPT-4o Audio", "GPT-4o mini Audio",
    "GPT-4o Realtime", "GPT-4o mini Realtime",
    "Whisper", "TTS-1", "TTS-1 HD",
    "GPT-4o Transcribe", "GPT-4o Transcribe Diarize",
    "GPT-4o mini Transcribe", "GPT-4o mini TTS",

    // Image & Video
    "Sora 2", "Sora 2 Pro",
    "DALL-E 3", "DALL-E 2",
    "GPT Image 1", "GPT Image 1.5", "gpt-image-1-mini",
    "chatgpt-image-latest",

    // Open Source / Embeddings / Moderation
    "gpt-oss-120b", "gpt-oss-20b",
    "text-embedding-3-large", "text-embedding-3-small", "text-embedding-ada-002",
    "text-moderation-stable", "omni-moderation",
].sort()

interface SecurityKey {
    id: string
    key_hash: string
    bound_ip: string
    bound_city: string | null
    device_hash: string | null
    status: string
    created_at: string
    last_used_at: string | null
    request_count: number
    allowed_models: string[] | null
}

interface ConnectionDetail {
    connection_id: string
    provider: string
    created_at: string
    connection_type: string
    variable_keys: string[]
    has_variables: boolean
    base_url: string | null
    security_keys: SecurityKey[]
}

const providerColors: Record<string, string> = {
    openai: 'from-green-500 to-emerald-600',
    anthropic: 'from-orange-500 to-amber-600',
    google: 'from-blue-500 to-blue-600',
    azure: 'from-cyan-500 to-blue-500',
    cohere: 'from-purple-500 to-violet-600',
}

const providerAccent: Record<string, string> = {
    openai: 'text-green-400',
    anthropic: 'text-orange-400',
    google: 'text-blue-400',
    azure: 'text-cyan-400',
    cohere: 'text-purple-400',
}

export default function ConnectionDetailPage() {
    const params = useParams()
    const router = useRouter()
    const connectionId = params.id as string
    const { user } = useAuth()
    const supabase = createBrowserClient()

    const [connection, setConnection] = useState<ConnectionDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const stepUp = useStepUpAuth()

    const [isDeleting, setIsDeleting] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedKey, setGeneratedKey] = useState<string | null>(null)
    const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null)
    const [menuOpenKeyId, setMenuOpenKeyId] = useState<string | null>(null)

    const [editingKeyId, setEditingKeyId] = useState<string | null>(null)
    const [selectedModels, setSelectedModels] = useState<string[]>([])
    const [boundCity, setBoundCity] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        if (!user) return
        fetchData()
    }, [user, connectionId])

    async function fetchData() {
        const token = (await supabase.auth.getSession()).data.session?.access_token
        if (!token) return

        try {
            const connRes = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-connection?connection_id=${connectionId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store'
                }
            )

            if (connRes.ok) {
                const data = await connRes.json()
                setConnection(data)
            }
        } catch (e) {
            console.error('Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDelete = async () => {
        if (!connection) return

        if (!confirm('Are you sure you want to delete this connection? This action cannot be undone.')) return

        // Require step-up verification before deleting a connection
        const { verified } = await stepUp.requireVerification(user?.email || '')
        if (!verified) return

        setIsDeleting(true)
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-connection`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ connection_id: connection.connection_id })
            })

            if (!res.ok) throw new Error('Failed to delete')

            router.push('/dashboard/connections')
            router.refresh()
        } catch (e) {
            console.error('Delete failed', e)
            alert('Failed to delete connection')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleGenerateKey = async () => {
        if (!connection) return
        setIsGenerating(true)
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-key`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ connection_id: connection.connection_id })
            })

            if (!res.ok) throw new Error('Failed to generate key')

            const data = await res.json()
            setGeneratedKey(data.api_key)
            fetchData()
        } catch (e) {
            console.error('Generation failed', e)
            alert('Failed to generate key')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDeleteKey = async (keyId: string) => {
        if (!connection || !confirm('Revoke this security key? Any agents using it will lose access immediately.')) return

        setDeletingKeyId(keyId)
        setMenuOpenKeyId(null)
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token
            if (!token) return

            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-key`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key_id: keyId, connection_id: connection.connection_id })
            })

            if (!res.ok) throw new Error('Failed to delete key')

            fetchData()
        } catch (e) {
            console.error('Key deletion failed', e)
            alert('Failed to delete security key')
        } finally {
            setDeletingKeyId(null)
        }
    }

    const openEditModal = (key: SecurityKey) => {
        setEditingKeyId(key.id)
        setSelectedModels(key.allowed_models || [])
        setBoundCity(key.bound_city || '')
        setSearchQuery('')
        setMenuOpenKeyId(null)
    }

    const toggleModel = (model: string) => {
        setSelectedModels(prev =>
            prev.includes(model)
                ? prev.filter(m => m !== model)
                : [...prev, model]
        )
    }

    const toggleAll = () => {
        const filtered = AVAILABLE_MODELS.filter(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
        const allSelected = filtered.every(m => selectedModels.includes(m))

        if (allSelected) {
            // Deselect visible
            setSelectedModels(prev => prev.filter(m => !filtered.includes(m)))
        } else {
            // Select visible
            const newModels = new Set([...selectedModels, ...filtered])
            setSelectedModels(Array.from(newModels))
        }
    }

    const handleUpdateKey = async () => {
        if (!editingKeyId || !connection) return
        setIsUpdating(true)

        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token
            if (!token) return

            const payloadModels = selectedModels.length > 0 ? selectedModels : null
            const payloadCity = boundCity.trim() ? boundCity.trim() : null

            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-key`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key_id: editingKeyId,
                    update_data: { allowed_models: payloadModels, bound_city: payloadCity }
                })
            })

            if (!res.ok) throw new Error('Failed to update key')

            setEditingKeyId(null)
            fetchData()
        } catch (e) {
            console.error('Key update failed', e)
            alert('Failed to update security key')
        } finally {
            setIsUpdating(false)
        }
    }

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const timeAgo = (dateStr: string | null) => {
        if (!dateStr) return 'Never'
        const now = new Date()
        const d = new Date(dateStr)
        const diff = now.getTime() - d.getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'Just now'
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        )
    }

    if (!connection) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Connection not found</h2>
                    <Link href="/dashboard/connections" className="text-accent hover:underline">
                        Back to connections
                    </Link>
                </div>
            </DashboardLayout>
        )
    }

    const totalRequests = connection.security_keys?.reduce((sum, k) => sum + (k.request_count || 0), 0) || 0
    const activeKeys = connection.security_keys?.filter(k => k.status === 'active').length || 0

    return (
        <DashboardLayout>
            <StepUpModal
                isOpen={stepUp.isOpen}
                onClose={stepUp.closeModal}
                onVerified={stepUp.handleVerified}
                userEmail={stepUp.userEmail}
                method={stepUp.method}
                factorId={stepUp.factorId}
                action="delete this connection"
            />
            <div className="max-w-4xl relative">
                {/* Generated key modal */}
                {generatedKey && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                            <div className="px-6 pt-6 pb-4">
                                <h2 className="text-xl font-bold mb-3">Save your key</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Please save your secret key in a safe place since{' '}
                                    <span className="text-foreground font-medium">you won&apos;t be able to view it again</span>.
                                    If you lose it, you&apos;ll need to generate a new one.
                                </p>
                            </div>
                            <div className="px-6 pb-5">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5">Key</p>
                                <div className="flex items-center gap-2 bg-secondary/60 border border-border rounded-lg px-4 py-3">
                                    <code className="flex-1 text-sm font-mono truncate select-all">
                                        {generatedKey}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await navigator.clipboard.writeText(generatedKey)
                                            setCopied(true)
                                            setTimeout(() => setCopied(false), 2000)
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary border border-border hover:bg-secondary/80 transition-colors text-sm font-medium shrink-0"
                                    >
                                        {copied ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-border flex justify-end">
                                <button
                                    onClick={() => setGeneratedKey(null)}
                                    className="px-5 py-2.5 rounded-lg bg-secondary border border-border text-sm font-medium hover:bg-secondary/80 transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Key Modal */}
                {editingKeyId && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                                <h2 className="text-lg font-bold">Key Permissions</h2>
                                <button
                                    onClick={() => setEditingKeyId(null)}
                                    className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="mb-6">
                                    <label className="text-sm font-medium mb-1.5 block">
                                        City Lock (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. San Francisco"
                                        value={boundCity}
                                        onChange={(e) => setBoundCity(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                                    />
                                </div>
                                <div className="border-t border-border/50 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium">
                                            Allowed Models
                                        </label>
                                        <div className="text-xs text-muted-foreground">
                                            {selectedModels.length > 0 ? `${selectedModels.length} selected` : 'All models allowed'}
                                        </div>
                                    </div>

                                    <div className="relative mb-3">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search models..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                                        />
                                    </div>

                                    <div className="border border-border rounded-lg overflow-hidden h-64 flex flex-col">
                                        <div className="p-2 border-b border-border bg-secondary/30 flex justify-between items-center">
                                            <button
                                                onClick={toggleAll}
                                                className="text-xs font-medium text-accent hover:underline px-2"
                                            >
                                                Toggle Visible
                                            </button>
                                        </div>
                                        <div className="overflow-y-auto flex-1 p-1 space-y-0.5 custom-scrollbar">
                                            {AVAILABLE_MODELS.filter(m => m.toLowerCase().includes(searchQuery.toLowerCase())).map(model => (
                                                <button
                                                    key={model}
                                                    onClick={() => toggleModel(model)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left ${selectedModels.includes(model)
                                                        ? 'bg-accent/10 text-accent-foreground'
                                                        : 'hover:bg-secondary/50 text-muted-foreground'
                                                        }`}
                                                >
                                                    {selectedModels.includes(model) ? (
                                                        <CheckSquare className="w-4 h-4 text-accent shrink-0" />
                                                    ) : (
                                                        <Square className="w-4 h-4 opacity-30 shrink-0" />
                                                    )}
                                                    <span className="truncate">{model}</span>
                                                </button>
                                            ))}
                                            {AVAILABLE_MODELS.filter(m => m.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                                <div className="p-4 text-center text-xs text-muted-foreground">
                                                    No models found
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground mt-2">
                                        Only checked models will be accessible. Uncheck all to allow everything.
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-border/50 flex justify-end gap-3 bg-secondary/30">
                                <button
                                    onClick={() => setEditingKeyId(null)}
                                    className="px-4 py-2 rounded-lg hover:bg-secondary border border-transparent hover:border-border text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateKey}
                                    disabled={isUpdating}
                                    className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                                >
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Breadcrumb & Actions */}
                <div className="flex items-center justify-between mb-8">
                    <Link
                        href="/dashboard/connections"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Connections
                    </Link>

                    <button
                        onClick={() => copyToClipboard(window.location.href)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-card hover:bg-accent/5 transition-all text-xs font-medium text-muted-foreground hover:text-foreground shadow-sm"
                    >
                        {copied ? (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                Copied Page URL
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy Page URL
                            </>
                        )}
                    </button>
                </div>

                {/* Hero header */}
                <div className="relative rounded-2xl border border-border/50 bg-card overflow-hidden mb-8">
                    {/* Gradient accent bar */}
                    <div className={`h-1.5 bg-gradient-to-r ${providerColors[connection.provider] || 'from-gray-500 to-gray-600'}`} />

                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${providerColors[connection.provider] || 'from-gray-500 to-gray-600'} flex items-center justify-center shadow-lg`}>
                                    <Lock className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold capitalize tracking-tight">{connection.provider}</h1>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <code className="text-xs text-muted-foreground font-mono bg-secondary/60 px-2 py-0.5 rounded">
                                            {connection.connection_id}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(connection.connection_id)}
                                            className="p-1 rounded hover:bg-secondary transition-colors"
                                            title="Copy connection ID"
                                        >
                                            {copied ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:self-start">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Active
                                </span>
                            </div>
                        </div>

                        {/* Top Section Grid for Prominent Metrics / Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                            {/* Quick Connect / Proxy URL Card */}
                            <div className="rounded-2xl border border-border/50 bg-card p-6 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-semibold text-base flex items-center gap-2">
                                        <Globe className="w-5 h-5 text-accent" />
                                        Proxy Base URL
                                    </h2>
                                    <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded border border-accent/20">
                                        Required
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Replace your code's default Base URL with this endpoint. All requests will be securely routed through SecureGate.
                                </p>
                                <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-4 py-3 shadow-inner">
                                    <code className="flex-1 text-sm font-mono text-foreground truncate select-all">
                                        {connection.connection_type === 'custom-code'
                                            ? PUBLIC_RUN_CUSTOM_CODE_URL
                                            : PUBLIC_V1_BASE_URL}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(connection.connection_type === 'custom-code'
                                            ? PUBLIC_RUN_CUSTOM_CODE_URL
                                            : PUBLIC_V1_BASE_URL)}
                                        className="p-2 rounded-md bg-background hover:bg-secondary border border-border transition-colors text-muted-foreground hover:text-foreground shrink-0 shadow-sm"
                                        title="Copy URL"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div className="rounded-2xl border border-border/50 bg-card p-6 flex flex-col justify-center">
                                <h2 className="font-semibold text-base flex items-center gap-2 mb-4">
                                    <Activity className="w-5 h-5 text-accent" />
                                    Connection Activity
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-secondary/30 rounded-xl p-4 border border-border/40">
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                                            <Key className="w-4 h-4" /> Active Keys
                                        </p>
                                        <p className="text-2xl font-semibold">{activeKeys}</p>
                                    </div>
                                    <div className="bg-secondary/30 rounded-xl p-4 border border-border/40">
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                                            <Activity className="w-4 h-4" /> Total Requests
                                        </p>
                                        <p className="text-2xl font-semibold">{totalRequests.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Integration Guide Snippets */}
                        <div className="mb-8">
                            <IntegrationGuide
                                baseUrl={
                                    connection.connection_type === 'custom-code'
                                        ? PUBLIC_RUN_CUSTOM_CODE_URL
                                        : PUBLIC_V1_BASE_URL
                                }
                                apiKey={connection.security_keys?.find(k => k.status === 'active')?.id ? '••• SECURE •••' : 'GENERATE_A_KEY'}
                            />
                        </div>

                        {/* Security Keys - Moved UP for immediate access */}
                        <div className="rounded-2xl border border-border/50 bg-card mb-8 shadow-sm">
                            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-secondary/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                                        <Lock className="w-5 h-5 text-accent" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-base text-foreground">Security Keys</h2>
                                        <p className="text-sm text-muted-foreground">Manage access credentials & binding rules</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleGenerateKey}
                                    disabled={isGenerating}
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/90 focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-accent/20 w-full sm:w-auto"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            New Security Key
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Custom Code Info Panel */}
                            {connection.connection_type === 'custom-code' && (
                                <div className="rounded-2xl flex flex-col border border-violet-500/30 bg-violet-500/[0.02] overflow-hidden mb-8">
                                    <div className="px-6 py-5 border-b border-violet-500/20 flex items-center gap-4 bg-violet-500/5">
                                        <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center border border-violet-500/20">
                                            <Terminal className="w-5 h-5 text-violet-400" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-base text-violet-100">Custom Handler</h2>
                                            <p className="text-sm text-muted-foreground">Executes your serverless code on every request</p>
                                        </div>
                                        <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/25">
                                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                                            Code Runner
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Security Keys List */}
                            {!connection.security_keys || connection.security_keys.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto mb-4">
                                        <Shield className="w-7 h-7 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold mb-1">No security keys yet</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                        Generate a security key to start using this connection with your AI agent.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/30">
                                    {connection.security_keys.map((key) => (
                                        <div
                                            key={key.id}
                                            className={`group px-4 sm:px-6 py-4 flex items-start sm:items-center justify-between gap-3 hover:bg-secondary/20 transition-colors ${deletingKeyId === key.id ? 'opacity-50 pointer-events-none' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${key.status === 'active'
                                                    ? 'bg-green-500/10 border border-green-500/20'
                                                    : 'bg-red-500/10 border border-red-500/20'
                                                    }`}>
                                                    <Key className={`w-4.5 h-4.5 ${key.status === 'active' ? 'text-green-400' : 'text-red-400'}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <code className="text-sm font-mono text-muted-foreground">
                                                            SG_••••{key.key_hash?.slice(-6) || 'unknown'}
                                                        </code>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${key.status === 'active'
                                                            ? 'bg-green-500/10 text-green-400'
                                                            : 'bg-red-500/10 text-red-400'
                                                            }`}>
                                                            {key.status}
                                                        </span>
                                                    </div>
                                                    {/* Explicit Security Locks Display */}
                                                    <TooltipProvider delayDuration={0}>
                                                        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                                                            {/* IP Lock */}
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className={`cursor-default flex items-center gap-1 px-2 py-0.5 rounded border ${key.bound_ip && key.bound_ip !== 'unbound'
                                                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                                            : key.bound_ip === 'unbound'
                                                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                                                                            }`}
                                                                    >
                                                                        <Wifi className="w-3.5 h-3.5" />
                                                                        <span className="text-xs font-medium">IP Lock</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-[260px] p-3">
                                                                    <div className="space-y-2">
                                                                        <p className="font-semibold text-sm">
                                                                            {key.bound_ip && key.bound_ip !== 'unbound' ? `Bound to ${key.bound_ip}` : key.bound_ip === 'unbound' ? 'Awaiting 1st request to bind IP' : 'IP Lock Not Configured'}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                                            Automatically locks this key to the IP address of its very first request. Any requests from a different IP using this key will be instantly blocked.
                                                                        </p>
                                                                        <Link href="/docs#security-locks" className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium transition-colors">
                                                                            Learn how to configure <ExternalLink className="w-3 h-3" />
                                                                        </Link>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            {/* City Lock */}
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className={`cursor-default flex items-center gap-1 px-2 py-0.5 rounded border ${key.bound_city && key.bound_city !== 'unbound'
                                                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                                            : key.bound_city === 'unbound'
                                                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                                                                            }`}
                                                                    >
                                                                        <MapPin className="w-3 h-3" />
                                                                        <span className="text-xs font-medium">City Lock</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-[260px] p-3">
                                                                    <div className="space-y-2">
                                                                        <p className="font-semibold text-sm">
                                                                            {key.bound_city && key.bound_city !== 'unbound' ? `Bound to ${key.bound_city}` : key.bound_city === 'unbound' ? 'Awaiting 1st request to bind City' : 'City Lock Not Configured'}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                                            Restricts this key so it can only be used from a specific city, preventing unauthorized API usage.
                                                                        </p>
                                                                        <Link href="/docs#security-locks" className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium transition-colors">
                                                                            Learn how to configure <ExternalLink className="w-3 h-3" />
                                                                        </Link>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            {/* Device Lock */}
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className={`cursor-default flex items-center gap-1 px-2 py-0.5 rounded border ${key.device_hash
                                                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                                                                            }`}
                                                                    >
                                                                        <Smartphone className="w-3 h-3" />
                                                                        <span className="text-xs font-medium">Device Lock</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-[260px] p-3">
                                                                    <div className="space-y-2">
                                                                        <p className="font-semibold text-sm">
                                                                            {key.device_hash ? 'Device fingerprint verified ✅' : 'Device Lock Not Configured'}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                                            {key.device_hash ? 'Verification requires the `x-device-fingerprint` header obtained via `securegate env`.' : 'Bind via `securegate keys bind-device`. Then include the fingerprint header found in `securegate env`.'}
                                                                        </p>
                                                                        <Link href="/docs#security-locks" className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium transition-colors">
                                                                            Learn how to configure <ExternalLink className="w-3 h-3" />
                                                                        </Link>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            {/* Model Lock */}
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        className={`cursor-default flex items-center gap-1 px-2 py-0.5 rounded border ${key.allowed_models && key.allowed_models.length > 0
                                                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                                                                            }`}
                                                                    >
                                                                        <Shield className="w-3 h-3" />
                                                                        <span className="text-xs font-medium">Model Lock</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-[260px] p-3">
                                                                    <div className="space-y-2">
                                                                        <p className="font-semibold text-sm">
                                                                            {key.allowed_models && key.allowed_models.length > 0 ? `${key.allowed_models.length} Models Allowed` : 'All Models Allowed'}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                                            Restricts which specific models (e.g. gpt-4o-mini) can be called with this key. This prevents users from spamming expensive models with a leaked key.
                                                                        </p>
                                                                        <Link href="/docs#security-locks" className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-medium transition-colors">
                                                                            Learn how to configure <ExternalLink className="w-3 h-3" />
                                                                        </Link>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </TooltipProvider>

                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 border-t border-border/30 pt-2">
                                                        <span className="flex items-center gap-1">
                                                            <Activity className="w-3 h-3 text-muted-foreground mr-0.5" />
                                                            {key.request_count || 0} requests
                                                        </span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span className="hidden sm:inline">Created {formatDate(key.created_at)}</span>
                                                        {key.last_used_at && (
                                                            <>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span className="hidden sm:inline">Last used {timeAgo(key.last_used_at)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="relative shrink-0 ml-3">
                                                <button
                                                    onClick={() => setMenuOpenKeyId(menuOpenKeyId === key.id ? null : key.id)}
                                                    className="p-2 rounded-lg hover:bg-secondary transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                                                    title="Key options"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                </button>

                                                {menuOpenKeyId === key.id && (
                                                    <>
                                                        {/* Backdrop to close menu */}
                                                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpenKeyId(null)} />
                                                        <div className="absolute right-0 top-10 z-50 bg-card border border-border rounded-xl shadow-xl w-48 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                                            <button
                                                                onClick={() => openEditModal(key)}
                                                                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors"
                                                            >
                                                                <Settings2 className="w-4 h-4 text-muted-foreground" />
                                                                Model Management
                                                            </button>
                                                            <div className="h-px bg-border/50 my-0"></div>
                                                            <button
                                                                onClick={() => handleDeleteKey(key.id)}
                                                                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Revoke Key
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Integration Guide - Collapsible/Bottom placed for cleanliness */}
                    {!loading && connection.connection_type !== 'custom-code' && (
                        <div className="rounded-2xl border border-border/50 bg-secondary/10 overflow-hidden mb-8 shadow-sm">
                            <div className="px-6 py-5 border-b border-border/30 flex items-center gap-3 bg-secondary/20">
                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                                    <Code2 className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-base">Examples & Integration</h2>
                                    <p className="text-sm text-muted-foreground">Drop-in code snippets to connect your agents</p>
                                </div>
                            </div>

                            <div className="px-6 py-6">
                                <div className="rounded-xl bg-[#0d0d0d] border border-border overflow-hidden shadow-inner">
                                    <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-white/5">
                                        <div className="flex items-center gap-2.5">
                                            <Terminal className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm text-gray-300 font-mono tracking-wide">Usage Example</span>
                                        </div>
                                    </div>
                                    <div className="p-5 overflow-x-auto">
                                        <pre className="text-[13px] font-mono text-[#a5b4fc] leading-relaxed">
                                            {connection.provider === 'openai' ? (
                                                `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: '${PUBLIC_V1_BASE_URL}',
  apiKey: 'SG_YOUR_KEY' // Use your generated security key
});

const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'SecureGate is ready to route!' }]
});`
                                            ) : connection.provider === 'anthropic' ? (
                                                `import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  baseURL: '${PUBLIC_V1_BASE_URL}',
  apiKey: 'SG_YOUR_KEY'
});

const message = await client.messages.create({
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'SecureGate is routing this request!' }],
  model: 'claude-3-opus-20240229',
});`
                                            ) : (
                                                `// Generic Fetch Example
const response = await fetch('${PUBLIC_V1_BASE_URL}/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SG_YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});`
                                            )}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Custom Code Variables - Moved down if applicable */}
                    {connection.connection_type === 'custom-code' && connection.has_variables && connection.variable_keys.length > 0 && (
                        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.02] overflow-hidden mb-8">
                            <div className="px-6 py-4 border-b border-violet-500/10 flex items-center gap-3">
                                <Variable className="w-5 h-5 text-violet-400" />
                                <h3 className="font-semibold text-violet-100">Environment Variables</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-wrap gap-2">
                                    {connection.variable_keys.map(k => (
                                        <span
                                            key={k}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs font-mono text-foreground"
                                        >
                                            <Variable className="w-3.5 h-3.5 text-muted-foreground" />
                                            {k}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground mt-4">
                                    Use <code className="bg-secondary px-1.5 py-0.5 rounded border border-border">variables.{`{KEY_NAME}`}</code> to access these securely in your serverless code.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Danger zone */}
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] overflow-hidden">
                        <div className="px-6 py-4 border-b border-red-500/10">
                            <h3 className="font-semibold text-sm flex items-center gap-2 text-red-400">
                                <AlertTriangle className="w-4 h-4" />
                                Danger Zone
                            </h3>
                        </div>
                        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-medium mb-0.5">Delete this connection</p>
                                <p className="text-xs text-muted-foreground">
                                    All security keys will be revoked. This cannot be undone.
                                </p>
                            </div>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50 active:scale-95 shrink-0 w-full sm:w-auto"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
