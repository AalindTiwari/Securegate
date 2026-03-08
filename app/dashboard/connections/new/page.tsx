'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { useAuth } from '@/hooks/use-auth'
import { useState, useMemo, useCallback, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
    providers as allProviders,
    categoryLabels,
    categoryOrder,
    type ProviderInfo,
} from '@/lib/providers'
import {
    Key,
    ArrowLeft,
    Lock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Search,
    Globe,
    Sparkles,
    Plug,
    Tag,
    Copy,
    Code2,
    Plus,
    Trash2,
    Variable,
    Info,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'
import Link from 'next/link'
import { IntegrationGuide } from '@/components/integration-guide'
import { PUBLIC_V1_BASE_URL } from '@/lib/public-config'

/* ─── Custom Code Connection State ──────────────────────────────── */

interface Variable {
    key: string
    value: string
}

const DEFAULT_CODE = `// Your custom handler — receives { variables, requestBody } and returns a fetch Response.
// 'variables' is the map of your env vars (including 'API_KEY' if you set one).
// Return a Response object.

export default async function handler({ variables, requestBody }) {
  const response = await fetch("https://api.example.com/v1/generate", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${variables.API_KEY}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}
`

export default function NewConnectionPage() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = createBrowserClient()

    const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
    const [apiKey, setApiKey] = useState('')
    const [baseUrl, setBaseUrl] = useState('')
    const [customName, setCustomName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [generatedSecurityKey, setGeneratedSecurityKey] = useState<string | null>(null)
    const [keyCopied, setKeyCopied] = useState(false)
    const [search, setSearch] = useState('')

    // Custom code state
    const [customCode, setCustomCode] = useState(DEFAULT_CODE)
    const [variables, setVariables] = useState<Variable[]>([{ key: 'API_KEY', value: '' }])
    const [noVariables, setNoVariables] = useState(false)
    const [showCodeHelp, setShowCodeHelp] = useState(false)

    const selectedProviderInfo = useMemo(
        () => allProviders.find((p) => p.id === selectedProvider),
        [selectedProvider]
    )

    const filteredProviders = useMemo(() => {
        if (!search.trim()) return allProviders
        const q = search.toLowerCase()
        return allProviders.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.id.toLowerCase().includes(q)
        )
    }, [search])

    const groupedProviders = useMemo(() => {
        const groups: Record<string, ProviderInfo[]> = {}
        for (const cat of categoryOrder) {
            const items = filteredProviders.filter((p) => p.category === cat)
            if (items.length > 0) groups[cat] = items
        }
        return groups
    }, [filteredProviders])

    const apiKeyRef = useRef<HTMLDivElement>(null)

    const handleProviderSelect = (providerId: string) => {
        setSelectedProvider(providerId)
        setBaseUrl('')
        setCustomName('')
        setTimeout(() => {
            apiKeyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    // ── Standard submit ────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!selectedProvider) {
            setError('Please select a provider')
            return
        }

        if (!apiKey.trim()) {
            setError('Please enter your API key')
            return
        }

        if (selectedProviderInfo?.supportsCustomName && !customName.trim()) {
            setError('Please enter a name for your provider')
            return
        }

        setLoading(true)

        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token
            if (!token) {
                setError('Not authenticated')
                setLoading(false)
                return
            }

            const providerName = selectedProviderInfo?.supportsCustomName
                ? customName.trim()
                : selectedProvider

            const body: Record<string, string> = {
                provider: providerName!,
                api_key: apiKey,
            }
            if (selectedProviderInfo?.supportsBaseUrl && baseUrl.trim()) {
                body.base_url = baseUrl.trim()
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-connection`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                    signal: controller.signal,
                }
            )
            clearTimeout(timeoutId)

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to create connection')
                setLoading(false)
                return
            }

            setSuccess(data.connection_id)
            setGeneratedSecurityKey(data.security_key || null)
            setApiKey('')
            setBaseUrl('')
            setCustomName('')
        } catch (err: any) {
            if (err.name === 'AbortError' || err.message?.includes('aborted')) {
                setError('Request timed out. Please check your connection.')
            } else {
                setError(err.message || 'Network error. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    // ── Custom code submit ─────────────────────────────────────────
    const handleCustomCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!customName.trim()) {
            setError('Please enter a name for your custom connection')
            return
        }

        if (!customCode.trim()) {
            setError('Please enter your handler code')
            return
        }

        if (!noVariables) {
            const emptyKey = variables.find(v => !v.key.trim())
            if (emptyKey) {
                setError('All variable names must be filled in')
                return
            }
        }

        setLoading(true)

        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token
            if (!token) {
                setError('Not authenticated')
                setLoading(false)
                return
            }

            // Build variable map
            const variableMap: Record<string, string> = {}
            if (!noVariables) {
                for (const v of variables) {
                    if (v.key.trim()) variableMap[v.key.trim()] = v.value
                }
            }

            // Use API_KEY variable value as the canonical "api_key" for encryption
            // Falls back to a placeholder if no API_KEY variable was set
            const canonicalApiKey = variableMap['API_KEY'] || variableMap['api_key'] || '__custom_code__'

            const body = {
                provider: customName.trim(),
                api_key: canonicalApiKey,
                connection_type: 'custom-code',
                custom_code: customCode,
                variables: variableMap,
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-connection`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                    signal: controller.signal,
                }
            )
            clearTimeout(timeoutId)

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Failed to create connection')
                setLoading(false)
                return
            }

            setSuccess(data.connection_id)
            setGeneratedSecurityKey(data.security_key || null)
        } catch (err: any) {
            if (err.name === 'AbortError') {
                setError('Request timed out. Please try again.')
            } else {
                setError(err.message || 'Network error. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    const addVariable = () => {
        setVariables(prev => [...prev, { key: '', value: '' }])
    }

    const removeVariable = (index: number) => {
        setVariables(prev => prev.filter((_, i) => i !== index))
    }

    const updateVariable = (index: number, field: 'key' | 'value', val: string) => {
        setVariables(prev => prev.map((v, i) => i === index ? { ...v, [field]: val } : v))
    }

    const isCustomOther = selectedProvider === 'custom-other'

    return (
        <DashboardLayout>
            <div className="max-w-3xl">
                <Link
                    href="/dashboard/connections"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Connections
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Add Connection</h1>
                    <p className="text-muted-foreground">
                        Your API key will be encrypted with AES-256-GCM and stored securely.
                    </p>
                </div>

                {success ? (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center top-0 overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6 pb-20">
                        <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col my-auto mt-16 sm:mt-auto relative">
                            {/* Header */}
                            <div className="px-6 pt-6 pb-4">
                                <h2 className="text-xl font-bold mb-3">Save your key</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Please save your secret key in a safe place since{' '}
                                    <span className="text-foreground font-medium">you won&apos;t be able to view it again</span>.
                                    Keep it secure, as anyone with your API key can make requests on your behalf.
                                    If you do lose it, you&apos;ll need to generate a new one.
                                </p>
                            </div>

                            <div className="px-6 pb-5 space-y-5">
                                {/* Name row */}
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5">Name</p>
                                    <p className="text-sm font-medium capitalize">{selectedProviderInfo?.name || selectedProvider} — {success}</p>
                                </div>

                                {/* Key display */}
                                {generatedSecurityKey && (
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5">Key</p>
                                        <div className="flex items-center gap-2 bg-secondary/60 border border-border rounded-lg px-4 py-3">
                                            <code className="flex-1 text-sm font-mono truncate select-all">
                                                {generatedSecurityKey}
                                            </code>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    await navigator.clipboard.writeText(generatedSecurityKey)
                                                    setKeyCopied(true)
                                                    setTimeout(() => setKeyCopied(false), 2000)
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary border border-border hover:bg-secondary/80 transition-colors text-sm font-medium shrink-0"
                                            >
                                                {keyCopied ? (
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
                                )}

                                {/* Integration Guide Component */}
                                {generatedSecurityKey && (
                                    <div className="mt-2">
                                        <IntegrationGuide
                                            baseUrl={PUBLIC_V1_BASE_URL}
                                            apiKey={generatedSecurityKey}
                                        />
                                    </div>
                                )}

                                {/* Permissions */}
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5">Permissions</p>
                                    <p className="text-sm">Read and write API resources</p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-border flex justify-end bg-secondary/20 sticky bottom-0 rounded-b-2xl">
                                <Link
                                    href={`/dashboard/connections/${success}`}
                                    className="px-6 py-2.5 rounded-xl bg-accent border border-accent/20 text-white font-medium hover:bg-accent/90 transition-all shadow-md active:scale-95"
                                >
                                    Done & View Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form
                        onSubmit={isCustomOther ? handleCustomCodeSubmit : handleSubmit}
                        className="space-y-8"
                    >
                        {/* Search bar */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search providers..."
                                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-secondary/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Provider sections by category */}
                        {Object.entries(groupedProviders).map(([category, items]) => (
                            <div key={category}>
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    {categoryLabels[category] || category}
                                </h2>
                                <div className={`grid gap-3 ${category === 'custom' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                    {items.map((provider) => (
                                        <ProviderCard
                                            key={provider.id}
                                            provider={provider}
                                            isSelected={selectedProvider === provider.id}
                                            onSelect={() => handleProviderSelect(provider.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* 50+ Models Callout Sidebar-style */}
                        {search === '' && (
                            <div className="mt-6 p-5 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col sm:flex-row sm:items-center gap-4 align-middle group hover:border-accent/30 transition-colors">
                                <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-5 h-5 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm group-hover:text-accent transition-colors">Need a different model?</h3>
                                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                        We support <span className="text-foreground font-medium">50+ cloud models</span>. Connect to any OpenAI-compatible endpoint (OpenRouter, DeepInfra, Anyscale, Novita, etc).
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('')
                                        setSelectedProvider('custom')
                                        setTimeout(() => {
                                            apiKeyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                        }, 100)
                                    }}
                                    className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border hover:border-accent/40 rounded-xl text-sm font-medium transition-all sm:whitespace-nowrap w-full sm:w-auto"
                                >
                                    Select Custom Provider
                                </button>
                            </div>
                        )}

                        {filteredProviders.length === 0 && (
                            <div className="text-center py-12 rounded-xl border border-dashed border-border">
                                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No providers match &ldquo;{search}&rdquo;</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Try the{' '}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('')
                                            setSelectedProvider('custom')
                                        }}
                                        className="text-accent hover:underline"
                                    >
                                        Custom / OpenAI-Compatible
                                    </button>{' '}
                                    or{' '}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('')
                                            setSelectedProvider('custom-other')
                                        }}
                                        className="text-accent hover:underline"
                                    >
                                        Custom / Non-OpenAI
                                    </button>{' '}
                                    option
                                </p>
                            </div>
                        )}

                        <div ref={apiKeyRef} className="scroll-mt-24 space-y-8">
                            {/* ── Custom Code Section ──────────────────────────── */}
                            {isCustomOther ? (
                                <div className="space-y-6">
                                    {/* Header banner */}
                                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
                                        <div className="flex items-start gap-3">
                                            <Code2 className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm mb-1">Bring Your Own Code</h3>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    Paste a handler function that makes the actual API call. SecureGate will run it
                                                    serverlessly — it stays alive for 1 hour after each request, then sleeps until
                                                    the next call. Your code and variables are encrypted at rest.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connection name */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Connection Name <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={customName}
                                                onChange={(e) => setCustomName(e.target.value)}
                                                placeholder='e.g. "Stability AI", "ElevenLabs", "My Private API"'
                                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-secondary/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Code editor */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium">
                                                Handler Code <span className="text-red-400">*</span>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowCodeHelp(h => !h)}
                                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Info className="w-3.5 h-3.5" />
                                                How to write this
                                                {showCodeHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </button>
                                        </div>

                                        {showCodeHelp && (
                                            <div className="mb-3 rounded-lg border border-border bg-secondary/30 p-4 text-xs text-muted-foreground space-y-2">
                                                <p className="font-medium text-foreground">Your handler receives:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li><code className="bg-secondary px-1 rounded">variables</code> — your env vars (e.g. <code className="bg-secondary px-1 rounded">variables.API_KEY</code>)</li>
                                                    <li><code className="bg-secondary px-1 rounded">requestBody</code> — the JSON body from the agent's request</li>
                                                    <li><code className="bg-secondary px-1 rounded">requestHeaders</code> — headers from the incoming request (sanitized)</li>
                                                    <li><code className="bg-secondary px-1 rounded">requestMethod</code> — HTTP method</li>
                                                </ul>
                                                <p className="font-medium text-foreground mt-2">Return a <code className="bg-secondary px-1 rounded">Response</code> object.</p>
                                                <p>The connection is warm for <strong>1 hour</strong> after each request, then sleeps. Cold start is ~100ms.</p>
                                            </div>
                                        )}

                                        <div className="relative rounded-xl border border-border overflow-hidden">
                                            <div className="absolute top-0 left-0 right-0 h-9 bg-secondary/60 border-b border-border flex items-center px-4 gap-2">
                                                <div className="flex gap-1.5">
                                                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                                </div>
                                                <span className="text-xs text-muted-foreground font-mono ml-2">handler.js</span>
                                            </div>
                                            <textarea
                                                value={customCode}
                                                onChange={(e) => setCustomCode(e.target.value)}
                                                rows={18}
                                                spellCheck={false}
                                                className="w-full pt-12 pb-4 px-4 bg-[#0d0d0d] text-[#e2e8f0] font-mono text-[13px] leading-relaxed outline-none resize-y min-h-[280px]"
                                                placeholder="// Your async handler function..."
                                                required
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Code is encrypted with AES-256-GCM before storage. Never stored in plaintext.
                                        </p>
                                    </div>

                                    {/* Variables section */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Variable className="w-4 h-4 text-muted-foreground" />
                                                <label className="block text-sm font-medium">Environment Variables</label>
                                            </div>
                                            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={noVariables}
                                                    onChange={(e) => setNoVariables(e.target.checked)}
                                                    className="rounded border-border accent-accent"
                                                />
                                                No variables needed
                                            </label>
                                        </div>

                                        {!noVariables && (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs text-muted-foreground uppercase tracking-wider px-1 mb-1">
                                                    <span>Variable Name</span>
                                                    <span>Value</span>
                                                    <span className="w-8" />
                                                </div>

                                                {variables.map((variable, idx) => (
                                                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                                        <input
                                                            type="text"
                                                            value={variable.key}
                                                            onChange={(e) => updateVariable(idx, 'key', e.target.value.toUpperCase().replace(/\s/g, '_'))}
                                                            placeholder="VAR_NAME"
                                                            className="px-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono text-sm uppercase"
                                                        />
                                                        <input
                                                            type={variable.key === 'API_KEY' || variable.key.includes('SECRET') || variable.key.includes('KEY') || variable.key.includes('TOKEN') ? 'password' : 'text'}
                                                            value={variable.value}
                                                            onChange={(e) => updateVariable(idx, 'value', e.target.value)}
                                                            placeholder="value"
                                                            className="px-3 py-2.5 rounded-lg bg-secondary/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm font-mono"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVariable(idx)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                            title="Remove variable"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={addVariable}
                                                    className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors mt-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add variable
                                                </button>

                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Variables named <code className="bg-secondary px-1 rounded">API_KEY</code>, <code className="bg-secondary px-1 rounded">SECRET</code>, <code className="bg-secondary px-1 rounded">TOKEN</code> are masked and encrypted separately.
                                                    Access in your code as <code className="bg-secondary px-1 rounded">variables.VAR_NAME</code>.
                                                </p>
                                            </div>
                                        )}

                                        {noVariables && (
                                            <div className="rounded-lg border border-border/50 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
                                                No variables — your code has direct access without any injected secrets.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Custom name input (non-OpenAI custom provider) */}
                                    {selectedProviderInfo?.supportsCustomName && (
                                        <div className="animate-element" style={{ animationDelay: '0ms' }}>
                                            <label className="block text-sm font-medium mb-2">Provider Name</label>
                                            <div className="relative">
                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    value={customName}
                                                    onChange={(e) => setCustomName(e.target.value)}
                                                    placeholder='e.g. "My Local LLM", "Stability AI", "AI21 Labs"'
                                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-secondary/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                A label to identify this provider in your connections list
                                            </p>
                                        </div>
                                    )}

                                    {/* Base URL input (custom providers) */}
                                    {selectedProviderInfo?.supportsBaseUrl && (
                                        <div className="animate-element" style={{ animationDelay: '0ms' }}>
                                            <label className="block text-sm font-medium mb-2">
                                                Base URL{' '}
                                            </label>
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <input
                                                    type="url"
                                                    value={baseUrl}
                                                    onChange={(e) => setBaseUrl(e.target.value)}
                                                    placeholder="https://api.example.com/v1"
                                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-secondary/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono text-sm"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {selectedProvider === 'custom'
                                                    ? 'The OpenAI-compatible base URL (e.g., https://api.deepinfra.com/v1 for DeepInfra)'
                                                    : 'The API endpoint URL for this provider (if applicable)'}
                                            </p>
                                        </div>
                                    )}

                                    {/* API Key input */}
                                    {selectedProvider && (
                                        <div className="animate-element" style={{ animationDelay: '0ms' }}>
                                            <label className="block text-sm font-medium mb-2">API Key</label>
                                            <div className="relative">
                                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <input
                                                    type="password"
                                                    value={apiKey}
                                                    onChange={(e) => setApiKey(e.target.value)}
                                                    placeholder={selectedProviderInfo?.placeholder || 'Enter your API key'}
                                                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-secondary/50 border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all font-mono text-sm"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Your key is encrypted immediately and never stored in plain text
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit button */}
                        {selectedProvider && (
                            <button
                                type="submit"
                                disabled={
                                    isCustomOther
                                        ? loading || !customName.trim() || !customCode.trim()
                                        : loading || !selectedProvider || !apiKey.trim()
                                }
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {isCustomOther ? 'Encrypting & deploying...' : 'Encrypting...'}
                                    </>
                                ) : isCustomOther ? (
                                    <>
                                        <Code2 className="w-5 h-5" />
                                        Deploy Custom Handler
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-5 h-5" />
                                        Encrypt &amp; Store
                                    </>
                                )}
                            </button>
                        )}
                    </form>
                )}
            </div>
        </DashboardLayout>
    )
}

/* ─── Provider Card Component ──────────────────────────────────── */

function ProviderCard({
    provider,
    isSelected,
    onSelect,
}: {
    provider: ProviderInfo
    isSelected: boolean
    onSelect: () => void
}) {
    const isCustom = provider.category === 'custom'
    const [logoError, setLogoError] = useState(false)

    const handleLogoError = useCallback(() => setLogoError(true), [])

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`group w-full flex items-center justify-between p-4 rounded-xl border bg-card transition-all duration-200 ${isSelected
                ? 'border-accent shadow-[0_0_15px_rgba(var(--accent),0.1)] bg-accent/5'
                : 'border-border/50 hover:border-border hover:shadow-sm hover:bg-secondary/20'
                }`}
        >
            <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Logo / Icon */}
                <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${provider.logoUrl && !logoError ? 'bg-transparent border border-border/50' : `bg-gradient-to-br ${provider.color}`
                        }`}
                >
                    {provider.logoUrl && !logoError ? (
                        <img
                            src={provider.logoUrl}
                            alt={`${provider.name} logo`}
                            width={24}
                            height={24}
                            className="w-6 h-6 object-contain rounded-sm"
                            onError={handleLogoError}
                        />
                    ) : isCustom ? (
                        provider.id === 'custom-other' ? (
                            <Code2 className="w-5 h-5 text-white" />
                        ) : (
                            <Sparkles className="w-5 h-5 text-white" />
                        )
                    ) : (
                        <span className="text-white font-bold text-sm">
                            {provider.name.charAt(0)}
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col items-start min-w-0 text-left">
                    <p className="font-semibold text-[15px] truncate max-w-full text-foreground group-hover:text-accent transition-colors">
                        {provider.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground line-clamp-1">
                            {provider.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action */}
            <div className="shrink-0 ml-4 flex items-center">
                {isSelected ? (
                    <span className="text-accent text-sm font-medium flex items-center gap-1.5 bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20">
                        <CheckCircle2 className="w-4 h-4" /> Selected
                    </span>
                ) : (
                    <span className="text-accent/80 group-hover:text-accent text-sm font-medium transition-colors">
                        Select
                    </span>
                )}
            </div>
        </button >
    )
}
