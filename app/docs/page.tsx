'use client'

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowLeft, Copy, Check, Terminal, Code, Shield, Lock, Key, Zap, Globe, Fingerprint, MapPin, AlertTriangle, BookOpen, Layers, Activity, CreditCard, Box, Heart, ArrowRight, Download, Server, Cpu, Package, Plug, Settings, Wrench, MonitorSmartphone, Bot, ShieldCheck, Wifi, Smartphone, FileAudio, FileImage, FileText, Music } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { PUBLIC_DASHBOARD_URL, PUBLIC_DOCS_URL, PUBLIC_V1_BASE_URL } from "@/lib/public-config"

// ─── Cover Domain ───
const API_BASE = PUBLIC_V1_BASE_URL

function CodeBlock({ filename, language, children, onCopy }: { filename: string; language: string; children: string; onCopy: (t: string) => void }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        onCopy(children)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    const langColors: Record<string, string> = { python: '#3776AB', javascript: '#F7DF1E', typescript: '#3178C6', bash: '#4EAA25', json: '#292929' }
    return (
        <div className="relative rounded-xl border border-white/10 overflow-hidden bg-[#0d1117] my-6 shadow-2xl shadow-black/50 group">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono group-hover:text-white transition-colors">{filename}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded text-white font-medium" style={{ background: langColors[language] || '#555' }}>{language}</span>
                    <button onClick={handleCopy} className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-all">
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>
            <div className="p-5 overflow-x-auto">
                <pre className="text-sm font-mono text-gray-300 leading-relaxed selection:bg-accent/30 selection:text-white"><code>{children}</code></pre>
            </div>
        </div>
    )
}

function ConceptCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
            <div className="w-12 h-12 rounded-lg bg-black/50 flex items-center justify-center mb-4 border border-white/5 group-hover:border-accent/20 transition-colors">{icon}</div>
            <h3 className="font-semibold text-lg mb-2 text-white">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
        </div>
    )
}

function SidebarSection({ icon, title, items }: { icon: React.ReactNode; title: string; items: { href: string; label: string }[] }) {
    return (
        <div className="group">
            <h3 className="font-semibold mb-4 flex items-center gap-2.5 text-white/90 group-hover:text-accent transition-colors">{icon} {title}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground border-l border-white/10 ml-1.5 pl-4">
                {items.map(item => (
                    <li key={item.href}>
                        <a href={item.href} className="block hover:text-white transition-all hover:translate-x-1">{item.label}</a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
    return (
        <div className="relative pl-10 border-l border-white/10 pb-12 last:pb-0 last:border-transparent">
            <div className="absolute -left-[1.3rem] top-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#050505] border border-white/10 text-accent font-bold shadow-xl">
                {n}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <div className="text-sm">
                {children}
            </div>
        </div>
    )
}

export default function DocsPage() {
    const [docCopied, setDocCopied] = useState(false)
    const [urlCopied, setUrlCopied] = useState(false)

    const copyToClipboard = (t: string, type: 'doc' | 'url' = 'doc') => {
        navigator.clipboard.writeText(t)
        if (type === 'url') {
            setUrlCopied(true)
            setTimeout(() => setUrlCopied(false), 2000)
        } else {
            setDocCopied(true)
            setTimeout(() => setDocCopied(false), 2000)
        }
    }

    const noop = (t: string) => navigator.clipboard.writeText(t)
    const [activeTab, setActiveTab] = useState<'python' | 'node' | 'curl'>('python')
    const [activeAgentTab, setActiveAgentTab] = useState<'openclaw' | 'standard'>('openclaw')
    const [activeMediaTab, setActiveMediaTab] = useState<'audio' | 'image' | 'vision'>('audio')

    // Simple cn utility to avoid imports if not available
    const cn = (...classes: string[]) => classes.filter(Boolean).join(" ")

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-accent/30 flex flex-col">
            <Navbar />

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-[90rem] mx-auto relative z-10 flex-1 w-full">
                <div className="flex flex-col lg:flex-row gap-16">
                    {/* ── Sidebar ── */}
                    <aside className="w-full lg:w-72 shrink-0 hidden lg:block">
                        <div className="sticky top-32 space-y-10 pr-4">
                            <SidebarSection icon={<Shield className="w-4 h-4 text-accent" />} title="Core Concepts" items={[
                                { href: '#overview', label: 'Overview' },
                                { href: '#architecture', label: 'Architecture 2.0' },
                                { href: '#quickstart', label: 'Quickstart' },
                            ]} />

                            <SidebarSection icon={<Lock className="w-4 h-4 text-accent" />} title="Security Locks" items={[
                                { href: '#ip-lock', label: 'IP Lock (Auto)' },
                                { href: '#city-lock', label: 'City Lock' },
                                { href: '#device-lock', label: 'Device Lock' },
                                { href: '#model-lock', label: 'Model Lock' },
                            ]} />

                            <SidebarSection icon={<Code className="w-4 h-4 text-accent" />} title="Integration" items={[
                                { href: '#integration', label: 'SDK Setup' },
                            ]} />

                            <SidebarSection icon={<Terminal className="w-4 h-4 text-accent" />} title="CLI" items={[
                                { href: '#cli', label: 'Installation' },
                                { href: '#cli-commands', label: 'Command Reference' },
                                { href: '#cli-agent', label: 'Agent Quick‑Setup' },
                            ]} />

                            <SidebarSection icon={<ShieldCheck className="w-4 h-4 text-accent" />} title="Advanced Features" items={[
                                { href: '#auditing', label: 'Detailed Audit Logs' },
                                { href: '#revocation', label: 'Instant Revocation' },
                            ]} />
                            <SidebarSection icon={<FileAudio className="w-4 h-4 text-accent" />} title="Media & Audio" items={[
                                { href: '#media-support', label: 'Overview & Endpoints' },
                                { href: '#media-audio', label: 'Audio Transcription' },
                                { href: '#media-image', label: 'Image Generation' },
                                { href: '#media-vision', label: 'Vision & PDF Analysis' },
                            ]} />
                        </div>
                    </aside>

                    {/* ── Main Content ── */}
                    <main className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="mb-16">
                            <div className="flex items-center justify-between mb-8">
                                <Link
                                    href="/dashboard/connections"
                                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors group"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                                </Link>

                                <button
                                    onClick={() => copyToClipboard(window.location.href, 'url')}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/10 transition-all shadow-sm"
                                >
                                    {urlCopied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                            Copied Page Link
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            Copy Page Link
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="mb-6">
                                <h1 className="text-5xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
                                    Documentation
                                </h1>
                            </div>

                            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                                SecureGate is the <span className="text-white font-medium">zero-trust security layer</span> for your AI agents.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mt-4 bg-accent/5 p-4 rounded-xl border border-accent/10">
                                <strong>The problem:</strong> Giving raw OpenAI/Anthropic keys directly to your agents is dangerous. They can be leaked, scraped, or abused.<br /><br />
                                <strong>The solution:</strong> Keep your real keys safely encrypted in our vault. Give your agents a <strong>SecureGate Proxy Key</strong> instead. You get complete control over <em>who</em> uses the key, <em>where</em> it's used from, and <em>which models</em> are allowed.
                            </p>

                            <div className="flex items-center gap-3 mt-8">
                                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/5 border border-white/10 w-fit backdrop-blur-sm">
                                    <Terminal className="w-4 h-4 text-accent" />
                                    <span className="font-mono text-sm text-white/90">{API_BASE}</span>
                                    <button
                                        onClick={() => copyToClipboard(API_BASE)}
                                        className="ml-2 p-1.5 hover:bg-white/10 rounded transition-colors group/btn relative"
                                    >
                                        {docCopied ? (
                                            <Check className="w-3.5 h-3.5 text-green-400" />
                                        ) : (
                                            <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover/btn:text-white" />
                                        )}
                                        {docCopied && (
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-accent text-[10px] text-white font-bold animate-in fade-in slide-in-from-bottom-1">
                                                COPIED!
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <div className="px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs font-medium text-purple-400">
                                    v2.0 Architecture
                                </div>
                                <Link
                                    href="/status"
                                    className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    System Status
                                </Link>
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════ */}
                        {/* OVERVIEW */}
                        {/* ═══════════════════════════════════════════════ */}
                        <section id="overview" className="mb-24 scroll-mt-32">
                            <div id="self-hosting" className="scroll-mt-32" />
                            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                <Zap className="w-8 h-8 text-accent" /> Overview
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                Don't give your agent raw API keys. They can be leaked, scraped, or abused.
                                Instead, use <strong>SecureGate</strong>. We act as a firewall for your AI usage,
                                giving you granular control over <em>who</em> uses your keys, <em>where</em> they use them, and <em>how much</em> they spend.
                            </p>

                            <div className="grid md:grid-cols-3 gap-6">
                                <ConceptCard icon={<Key className="w-6 h-6 text-green-400" />} title="Proxy Key (SG_)" desc="Your agent uses this. It's revocable, scope-limited, and never holds value itself." />
                                <ConceptCard icon={<Layers className="w-6 h-6 text-blue-400" />} title="Smart Router" desc="We sit between your code and OpenAI/Anthropic. We validate requests before they touch the provider." />
                                <ConceptCard icon={<Shield className="w-6 h-6 text-purple-400" />} title="Zero-Trust" desc="Every single request is checked for IP, Geo, Device, and Model permissions." />
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════ */}
                        {/* ARCHITECTURE 2.0 */}
                        {/* ═══════════════════════════════════════════════ */}
                        <section id="architecture" className="mb-24 scroll-mt-32">
                            <div className="p-8 rounded-2xl bg-gradient-to-br from-accent/10 via-transparent to-transparent border border-accent/20">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                                    <Box className="w-6 h-6 text-accent" /> New: Architecture 2.0 (10-Point Security)
                                </h2>
                                <p className="text-muted-foreground mb-6">
                                    We have expanded the core to protect you more effectively. Here is the current security posture:
                                </p>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {[
                                        { title: 'Project Scoped Keys', desc: 'Isolate budgets and usage per client or app. A compromised key only affects a single project compartment.' },
                                        { title: 'Model Registry', desc: 'Internal mapping of model names. Users see "gpt-4" but you control the exact provider endpoint and version.' },
                                        { title: 'Upstream Key Isolation', desc: 'Your actual OpenAI/Anthropic keys never reach the edge. They are stored encrypted and injected only at the final Gateway node.' },
                                        { title: 'Request Signature Validation', desc: 'Eliminates replay attacks. Each payload must have a valid signature (timestamp + payload hash).' },
                                        { title: 'Self-Healing Identity', desc: 'Keys auto-lock to the first IP, Device, or Geo signature they encounter, preventing lateral movement if stolen.' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                                                <Check className="w-3.5 h-3.5 text-accent" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════ */}
                        {/* SECURITY LOCKS */}
                        {/* ═══════════════════════════════════════════════ */}
                        <section id="security-locks" className="mb-24 scroll-mt-32">
                            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                <Lock className="w-8 h-8 text-accent" /> Configure Security Locks
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                Our Zero-Trust model employs 4 specialized locks that evaluate every API request.
                            </p>

                            <div className="space-y-12">
                                <div id="ip-lock" className="scroll-mt-32">
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                        <Wifi className="w-6 h-6 text-accent" /> IP Lock (Auto-binding)
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        Included by default. When a new Security Key is generated, it is initially in an "unbound" state. The very first successful API request made using that key will permanently lock it to the origin IP address of that request (even if behind a Vercel/AWS proxy).
                                    </p>
                                    <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                                        <strong className="text-white block mb-2">How to configure:</strong>
                                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                            <li>Generate a new key in the Dashboard.</li>
                                            <li>Plug it into your application or agent.</li>
                                            <li>Send your first request. The key is now permanently bound to that machine's true IP.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div id="city-lock" className="scroll-mt-32">
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                        <MapPin className="w-6 h-6 text-accent" /> City Lock
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        Restrict API usage to specific cities. If an attacker acquires your key and tries to use it from an unauthorized city, SecureGate will block the request at the edge.
                                    </p>
                                    <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                                        <strong className="text-white block mb-2">How to configure:</strong>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Easily configurable via the SecureGate Dashboard UI. Go to the Edit Key modal and type in your desired city name (e.g., 'San Francisco').
                                        </p>
                                    </div>
                                </div>

                                <div id="device-lock" className="scroll-mt-32">
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                        <Smartphone className="w-6 h-6 text-accent" /> Device Lock
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        Binds the key to a specific device fingerprint. In Architecture 2.0, you no longer need to run a background proxy. Just compute your fingerprint once and provide it as a header.
                                    </p>
                                    <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                                        <strong className="text-white block mb-2">How to configure:</strong>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            1. Run the CLI binding command once on the target machine.<br />
                                            2. Use the <code className="text-accent">env</code> command to get your header snippet.
                                        </p>
                                        <CodeBlock filename="terminal" language="bash" onCopy={noop}>{`securegate keys bind-device <key_id>\n# Then get your header snippet:\nsecuregate env`}</CodeBlock>
                                    </div>
                                </div>

                                <div id="model-lock" className="scroll-mt-32">
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                        <Shield className="w-6 h-6 text-accent" /> Model Lock
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        Restrict which specific AI models a key is allowed to call. For example, allow an agent to use `gpt-3.5-turbo` but block access to expensive `o1-pro` model calls.
                                    </p>
                                    <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                                        <strong className="text-white block mb-2">How to configure:</strong>
                                        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                            <li>Navigate to your Connection on the Dashboard.</li>
                                            <li>Find the required key and click the 3-dots menu on the right.</li>
                                            <li>Select <strong>Model Management</strong>.</li>
                                            <li>Check the specific models you want to allow. If none are selected, all models are allowed.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════ */}
                        {/* QUICKSTART */}
                        {/* ═══════════════════════════════════════════════ */}
                        <section id="quickstart" className="mb-24 scroll-mt-32">
                            <h2 className="text-3xl font-bold mb-8">Quickstart</h2>

                            <div className="relative ml-4 space-y-12">
                                <Step n="1" title="Connect a Provider">
                                    <p className="text-muted-foreground mb-2">Go to <Link href="/dashboard" className="text-accent hover:underline">Dashboard</Link>. Enter your OpenAI or Anthropic key. We encrypt it with AES-256-GCM immediately.</p>
                                </Step>
                                <Step n="2" title="Get your SG_ Key">
                                    <p className="text-muted-foreground mb-2">We generate a unique <code className="text-accent bg-accent/10 px-1 rounded">SG_...</code> key. This is your "Safe Key".</p>
                                </Step>
                                <Step n="3" title="Update your Code">
                                    <p className="text-muted-foreground mb-4">Just change the <code>baseURL</code> and <code>apiKey</code> in your favorite SDK.</p>
                                    <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
                                        <p className="text-sm text-accent">👇 See the Integration section below for specific code examples!</p>
                                    </div>
                                </Step>
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════ */}
                        {/* INTEGRATION */}
                        {/* ═══════════════════════════════════════════════ */}
                        <section id="integration" className="mb-24 scroll-mt-32">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                                <h2 className="text-3xl font-bold">Integration</h2>
                                <p className="text-sm text-muted-foreground">
                                    We support <strong>all frameworks</strong> where the OpenAI SDK is compatible.
                                </p>
                            </div>

                            <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="flex border-b border-white/10 overflow-x-auto">
                                    <button
                                        onClick={() => setActiveTab('python')}
                                        className={cn("px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap", activeTab === 'python' ? "border-accent text-white bg-white/5" : "border-transparent text-muted-foreground hover:text-white hover:bg-white/5")}
                                    >
                                        Python
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('node')}
                                        className={cn("px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap", activeTab === 'node' ? "border-accent text-white bg-white/5" : "border-transparent text-muted-foreground hover:text-white hover:bg-white/5")}
                                    >
                                        Node.js / TypeScript
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('curl')}
                                        className={cn("px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap", activeTab === 'curl' ? "border-accent text-white bg-white/5" : "border-transparent text-muted-foreground hover:text-white hover:bg-white/5")}
                                    >
                                        cURL
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="mb-4">
                                        <p className="text-sm text-muted-foreground">
                                            {activeTab === 'python' && "Works with the official OpenAI Python library. No new package to install."}
                                            {activeTab === 'node' && "Compatible with the standard openai npm package. Supports Vercel, Next.js, etc."}
                                            {activeTab === 'curl' && "Universal support for any language capable of HTTP requests."}
                                        </p>
                                    </div>

                                    {activeTab === 'python' && (
                                        <CodeBlock filename="main.py" language="python" onCopy={noop}>{`from openai import OpenAI
import os

client = OpenAI(
    api_key="SG_xxxxxxxxxxxxxxxxxxxxxxxxxxx", 
    base_url="${API_BASE}"
)

# Works exactly like standard OpenAI
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
)`}</CodeBlock>
                                    )}

                                    {activeTab === 'node' && (
                                        <CodeBlock filename="app.ts" language="typescript" onCopy={noop}>{`import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.SECUREGATE_KEY, // SG_...
  baseURL: '${API_BASE}'
});

async function main() {
  const completion = await client.chat.completions.create({
    messages: [{ role: 'user', content: 'Secure me.' }],
    model: 'gpt-4',
  });
}`}</CodeBlock>
                                    )}

                                    {activeTab === 'curl' && (
                                        <CodeBlock filename="terminal" language="bash" onCopy={noop}>{`curl -X POST ${API_BASE}/chat/completions \\
  -H "Authorization: Bearer SG_xxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}</CodeBlock>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════ */}
                        {/* SECURITY LOCKS */}
                        {/* ═══════════════════════════════════════════════ */}
                        <section id="ip-lock" className="mb-20 scroll-mt-32">
                            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                                <Globe className="w-8 h-8 text-blue-500" /> IP Lock
                            </h2>
                            <div className="prose prose-invert max-w-none">
                                <p className="text-lg text-muted-foreground">
                                    Every key starts as <strong>Unbound</strong>. The moment you use it, it locks to that IP address forever.
                                </p>
                                <div className="my-6 p-6 border border-red-500/20 bg-red-500/5 rounded-xl">
                                    <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Self-Lock Mechanism</h4>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        If an attacker steals your key and tries to use it from a different IP, SecureGate:
                                    </p>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                                        <li>Blocks the request (403 Forbidden).</li>
                                        <li>Logs the "IP Mismatch" event.</li>
                                        <li>Sends you an email alert immediately.</li>
                                    </ol>
                                </div>
                            </div>
                        </section>

                        <div className="grid md:grid-cols-2 gap-8 mb-24">
                            <div id="city-lock" className="scroll-mt-32">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-amber-500" /> City Lock
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                    Restrict usage to specific cities. Useful when you expect traffic from a known region and want to block requests from elsewhere.
                                </p>
                            </div>
                            <div id="device-lock" className="scroll-mt-32">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Fingerprint className="w-5 h-5 text-purple-500" /> Device Lock
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                    Bind usage to a specific hardware fingerprint. Use <code className="text-accent">securegate env</code> to generate a secure header snippet and paste it into your agent's config. No proxy server needed.
                                </p>
                            </div>
                        </div>



                        {/* ═══════════════════════════════════════════════ */}
                        {/* CLI */}
                        {/* ═══════════════════════════════════════════════ */}
                        <section id="cli" className="mb-24 scroll-mt-32">
                            <h2 className="text-3xl font-bold mb-3 flex items-center gap-3">
                                <Terminal className="w-8 h-8 text-green-400" /> CLI
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                                The SecureGate CLI lets you manage connections and security keys from your terminal.
                            </p>

                            <div className="mb-8 p-6 border border-white/10 bg-white/5 rounded-xl">
                                <h4 className="font-semibold text-white mb-4">Installation</h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Using <strong>npm</strong>:</p>
                                        <CodeBlock filename="terminal" language="bash" onCopy={noop}>{`npm install -g securegate-cli-tool`}</CodeBlock>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Using <strong>pnpm</strong> (Recommended if npm fails):</p>
                                        <CodeBlock filename="terminal" language="bash" onCopy={noop}>{`pnpm add -g securegate-cli-tool`}</CodeBlock>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground mb-8">Requires Node.js 18+. Run <code className="text-accent bg-accent/10 px-1.5 py-0.5 rounded">securegate --help</code> to see all commands.</p>

                            {/* Command Reference */}
                            <div id="cli-commands" className="scroll-mt-32">
                                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-accent" /> Command Reference
                                </h3>

                                <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10 bg-white/5">
                                                <th className="text-left px-5 py-3 font-semibold text-white">Command</th>
                                                <th className="text-left px-5 py-3 font-semibold text-white">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {[
                                                ['securegate login', 'Authenticate with your SecureGate account'],
                                                ['securegate connect', 'Add a new AI provider (OpenAI, Anthropic, etc.)'],
                                                ['securegate keys list', 'View all connections and their security keys'],
                                                ['securegate keys create', 'Generate a new security key for a connection'],
                                                ['securegate keys update <id>', 'Set --city or --models restrictions on a key'],
                                                ['securegate keys lock <id>', 'Manually lock key to an IP (optional)'],
                                                ['securegate keys bind-device <id>', 'Bind key to current device (one-time)'],
                                                ['securegate keys revoke <id>', 'Permanently revoke a security key'],
                                                ['securegate env', 'Generate header snippets for various languages'],
                                                ['securegate providers', 'List all 15 supported AI providers'],
                                                ['securegate status', 'Show account info and connection count'],
                                                ['securegate logout', 'Clear stored credentials'],
                                            ].map(([cmd, desc], i) => (
                                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-5 py-3 font-mono text-accent whitespace-nowrap">{cmd}</td>
                                                    <td className="px-5 py-3 text-muted-foreground">{desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>



                            {/* Authorized AI Behavior */}
                            <div id="ai-agents" className="scroll-mt-32 mt-12">
                                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <Bot className="w-5 h-5 text-emerald-400" /> Authorized AI Behavior
                                </h3>

                                <div className="flex border-b border-white/10 mb-6">
                                    <button
                                        onClick={() => setActiveAgentTab('openclaw')}
                                        className={cn("px-4 py-2 text-sm font-medium transition-colors border-b-2", activeAgentTab === 'openclaw' ? "border-emerald-400 text-white" : "border-transparent text-muted-foreground hover:text-white")}
                                    >
                                        OpenClaw (Clawdbot)
                                    </button>
                                    <button
                                        onClick={() => setActiveAgentTab('standard')}
                                        className={cn("px-4 py-2 text-sm font-medium transition-colors border-b-2", activeAgentTab === 'standard' ? "border-emerald-400 text-white" : "border-transparent text-muted-foreground hover:text-white")}
                                    >
                                        Standard Agents
                                    </button>
                                </div>

                                {activeAgentTab === 'openclaw' && (
                                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                                            <ul className="space-y-4 text-muted-foreground">
                                                <li className="flex gap-3">
                                                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                                                    <div>
                                                        <strong className="text-white">Native Integration:</strong> OpenClaw has SecureGate built-in. It creates its own keys.
                                                    </div>
                                                </li>
                                                <li className="flex gap-3">
                                                    <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                                                    <div>
                                                        <strong className="text-white">Zero-Touch Security:</strong> Clawdbot never sees or requests your raw provider keys.
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="p-6 rounded-xl border border-white/10 bg-[#0d1117]">
                                            <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                                                <Bot className="w-4 h-4 text-emerald-400" /> Tell this to your OpenClaw
                                            </h4>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Copy and paste this prompt to your OpenClaw agent to instantly enable security features:
                                            </p>

                                            <div className="relative">
                                                <div className="absolute -top-3 left-4 px-2 bg-[#0d1117] text-xs text-emerald-400 font-bold tracking-wider">AGENT PROMPT</div>
                                                <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-sm font-mono text-gray-300 whitespace-pre-wrap">
                                                    Run this command to get the SecureGate skill so you can safely secure files: `pnpm add -g securegate-cli-tool` (or use npm).
                                                    Then open the downloaded SKILL.md and follow the steps.
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">SKILL.md Content:</p>
                                                <CodeBlock filename="SKILL.md" language="markdown" onCopy={noop}>{`---
name: SecureGate Integration (OpenClaw)
description: Official SecureGate skill for OpenClaw agents. Use this to generate and manage secure API keys.
---

# SecureGate Skill for OpenClaw

Follow this **exact sequence** to secure your API access.

## Phase 1: Authentication

1.  **Check Status:** Run \`securegate status\`.
2.  **If Not Logged In:**
    *   Ask user: *"Please run \`securegate login\` in your terminal to authenticate me."*
    *   Stop and wait for them to say "done".

## Phase 2: Connection Setup

1.  **Ask User:** *"Do you have the AI provider (OpenAI/Anthropic) keys set up in SecureGate?"*
2.  **If No:**
    *   Tell user: *"Please add them in your SecureGate dashboard (${PUBLIC_DASHBOARD_URL}) or run \`securegate connect\`."*
    *   **CRITICAL:** Do NOT ask for the raw key in chat.
3.  **If Yes:** Proceed to Phase 3.

## Phase 3: Secure Key Generation

1.  **Ask User:** *"Shall I generate a secure key for myself? (It will automatically lock to my IP on first use)."*
2.  **If Yes:**
    *   Run \`securegate keys create\`.
    *   **Capture the \`SG_...\` key.**
    *   **Auto-Lock:** Confirm with *"Key generated. It is now auto-locked to this server."*
    *   **Manual Lock Option:** If you ever need to re-lock or pre-lock to a specific IP, use:
        \`\`\`bash
        securegate keys lock <key_id> --ip <ip_address>
        \`\`\`

3.  **Future Keys (Proactive Check):**
    *   Ask User: *"For future projects, will you add keys to SecureGate yourself?"*
    *   **If Yes:** *"Great! Just give me the \`SG_\` key when ready."*
    *   **If No:** *"Note: I cannot securely input raw keys into the CLI for you. You will need to run \`securegate connect\` manually."*

## Phase 4: Context Hygiene

*   **Once you have the \`SG_\` key:**
    *   **FORGET** any raw API keys mentioned in this conversation or found in files.
    *   **ONLY** use the \`SG_\` key for future requests.
    *   **NEVER** output the \`SG_\` key in chat again to prevent leaks.

## Using the API

To use your secure key, simply replace your raw provider key with the \`SG_...\` key and change the \`baseURL\`.

*   **Docs:** ${PUBLIC_DOCS_URL}
*   **Base URL:** \`${PUBLIC_V1_BASE_URL}\` (Direct OpenAI-compatible routing)`}</CodeBlock>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeAgentTab === 'standard' && (
                                    <div className="p-6 rounded-xl border border-white/10 bg-white/5 animate-in fade-in zoom-in-95 duration-200">
                                        <ul className="space-y-4 text-muted-foreground">
                                            <li className="flex gap-3">
                                                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                                                <div>
                                                    <strong className="text-white">Auto-Locking Keys:</strong> Agents generate their own keys which are instantly locked to their server IP.
                                                </div>
                                            </li>
                                            <li className="flex gap-3">
                                                <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                                                <div>
                                                    <strong className="text-white">No Raw Keys:</strong> Agents are strictly forbidden from asking for raw API keys in chat. They must direct users to the SecureGate connection portal.
                                                </div>
                                            </li>
                                            <li className="flex gap-3">
                                                <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
                                                <div>
                                                    <strong className="text-white">Security Guidance:</strong> Agents can recommend tighter controls such as city, device, or model restrictions when a workflow calls for them.
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════ */}
                        {/* ADVANCED FEATURES */}
                        {/* ═══════════════════════════════════════════════ */}
                        <section id="advanced-features" className="mb-24 scroll-mt-32">
                            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                <Activity className="w-8 h-8 text-rose-400" /> Advanced Features
                            </h2>

                            <div className="space-y-12">
                                <div id="security-locks-advanced" className="scroll-mt-32 p-6 rounded-2xl border border-white/10 bg-[#0d1117]">
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                                        <Shield className="w-6 h-6 text-accent" /> Configure Security Locks
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed mb-6">
                                        SecureGate protects your AI budget by restricting how, where, and when your keys can be used. Every proxy key can be armed with multiple authentication locks.
                                    </p>

                                    <div className="space-y-6">
                                        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                            <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                                                <Wifi className="w-4 h-4 text-accent" /> IP Lock
                                            </h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                When a new proxy key is generated, it is initially "unbound." The very first time you make a request to the SecureGate API using this key, our edge network automatically records the origin IP address. The key is now permanently locked to that IP. Any future requests from a different IP address will be instantly rejected with a <code className="text-rose-400">403 Forbidden</code>.
                                                <br /><br />
                                                <em>Best for: Backend servers, static IP deployments, and CI/CD pipelines.</em>
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                            <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                                                <MapPin className="w-4 h-4 text-accent" /> City Lock
                                            </h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                To prevent region-based API abuse, you can bind a key to strictly operate within a specific city (e.g., <code>San Francisco</code>). If a malicious actor extracts your key and attempts to use it from outside the allowed region, the request drops at the edge before ever reaching OpenAI.
                                                <br /><br />
                                                <em>Best for: Regional staging environments or client-side apps with known geographic userbases.</em>
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                                            <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                                                <Smartphone className="w-4 h-4 text-accent" /> Device Lock
                                            </h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                SecureGate validates hardware fingerprints to bind a proxy key to a specific physical device. <br /><br />
                                                <strong className="text-accent font-medium">No Proxy Required:</strong> In Architecture 2.0, you no longer need to run a local background process. Use <code className="text-accent">securegate env</code> to generate a static header snippet (<code className="text-purple-400">x-device-fingerprint</code>) and add it to your agent's configuration.
                                                <br /><br />
                                                <em>Best for: Node/Python CLI agents, fixed servers, and machines running automated agents.</em>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div id="model-allowlist" className="scroll-mt-32 p-6 rounded-2xl border border-white/10 bg-[#0d1117]">
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                                        <Shield className="w-6 h-6 text-rose-400" /> Model Allow-List
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        This feature restricts which AI models (e.g., <code>gpt-4o-mini</code>) can be invoked by a specific key, preventing leaked keys from draining budget via expensive models like <code>o1-preview</code>.
                                    </p>
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                        <h4 className="font-semibold text-white text-sm mb-3">How it works:</h4>
                                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                            <li><strong>Strict Mapping:</strong> Requests for `gpt-4` might be internally routed by SecureGate to `gpt-4-0613` based on your project settings.</li>
                                            <li><strong>Cost Control:</strong> Block access to `gpt-4-32k` or `claude-3-opus-20240229` entirely for specific proxy keys.</li>
                                            <li><strong>Instant Rejection:</strong> If a key attempts to call a non-allowlisted model, SecureGate returns a 403 instantly, saving upstream latency and cost.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div id="abuse-detection" className="scroll-mt-32 p-6 rounded-2xl border border-white/10 bg-[#0d1117]">
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                                        <AlertTriangle className="w-6 h-6 text-rose-400" /> Abuse Detection Layer
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Our edge nodes monitor request patterns globally. We employ fuzzy matching and velocity tracking across multiple dimensions (IP + Model + Token Volume). If an anomaly is detected (e.g., massive spike in 10 minutes), the offending Proxy Key is temporarily suspended and administrative alerts are fired.
                                    </p>
                                </div>

                                <div id="media-support" className="scroll-mt-32 p-6 rounded-2xl border border-white/10 bg-[#0d1117]">
                                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                                        <FileAudio className="w-6 h-6 text-rose-400" /> Binary & Media Transmission
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed mb-4">
                                        SecureGate proxies raw binary streams byte-for-byte — zero corruption. All media types go through the <strong className="text-white">same single v1 base URL</strong>, just like regular chat completions. No extra config needed.
                                    </p>
                                    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 mb-6">
                                        <p className="text-sm font-mono text-accent">{API_BASE}</p>
                                        <p className="text-xs text-muted-foreground mt-1">One endpoint for chat, audio, images, vision, PDFs — all secured by your SG_ key.</p>
                                    </div>
                                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-white/5">
                                                    <th className="text-left px-5 py-3 font-semibold text-white">Capability</th>
                                                    <th className="text-left px-5 py-3 font-semibold text-white">Endpoint Path</th>
                                                    <th className="text-left px-5 py-3 font-semibold text-white">Format</th>
                                                    <th className="text-left px-5 py-3 font-semibold text-white">Provider</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {[
                                                    ['🎙️ Audio Transcription', '/audio/transcriptions', 'multipart/form-data', 'OpenAI Whisper'],
                                                    ['🔊 Text-to-Speech', '/audio/speech', 'application/json', 'OpenAI TTS'],
                                                    ['🖼️ Image Generation', '/images/generations', 'application/json', 'DALL-E 3 / Stability'],
                                                    ['🔍 Image Editing', '/images/edits', 'multipart/form-data', 'DALL-E'],
                                                    ['👁️ Vision (Image+Text)', '/chat/completions', 'application/json (base64/url)', 'GPT-4o / Claude 3'],
                                                    ['📄 PDF / File Analysis', '/chat/completions', 'application/json (base64)', 'GPT-4o / Claude 3'],
                                                    ['🗂️ File Upload', '/files', 'multipart/form-data', 'OpenAI Files API'],
                                                ].map(([cap, path, fmt, prov], i) => (
                                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-5 py-3 text-white whitespace-nowrap">{cap}</td>
                                                        <td className="px-5 py-3 font-mono text-rose-400 whitespace-nowrap">{path}</td>
                                                        <td className="px-5 py-3 text-muted-foreground text-xs">{fmt}</td>
                                                        <td className="px-5 py-3 text-muted-foreground text-xs">{prov}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════ */}
                        {/* MEDIA TRANSMISSION */}
                        {/* ═══════════════════════════════════════════════ */}
                        <section id="media-audio" className="mb-24 scroll-mt-32">
                            <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                                <Music className="w-8 h-8 text-rose-400" /> Media Transmission
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                                All audio, image, PDF, and vision requests go through the <strong className="text-white">same SG_ key</strong> and <strong className="text-white">same base URL</strong> — SecureGate handles the binary data transparently.
                            </p>

                            {/* Tabs */}
                            <div className="bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="flex border-b border-white/10 overflow-x-auto">
                                    <button
                                        onClick={() => setActiveMediaTab('audio')}
                                        className={cn("px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2", activeMediaTab === 'audio' ? "border-rose-400 text-white bg-white/5" : "border-transparent text-muted-foreground hover:text-white hover:bg-white/5")}
                                    >
                                        <FileAudio className="w-4 h-4" /> Audio Transcription
                                    </button>
                                    <button
                                        onClick={() => setActiveMediaTab('image')}
                                        className={cn("px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2", activeMediaTab === 'image' ? "border-rose-400 text-white bg-white/5" : "border-transparent text-muted-foreground hover:text-white hover:bg-white/5")}
                                    >
                                        <FileImage className="w-4 h-4" /> Image Generation
                                    </button>
                                    <button
                                        onClick={() => setActiveMediaTab('vision')}
                                        className={cn("px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2", activeMediaTab === 'vision' ? "border-rose-400 text-white bg-white/5" : "border-transparent text-muted-foreground hover:text-white hover:bg-white/5")}
                                    >
                                        <FileText className="w-4 h-4" /> Vision & PDF Analysis
                                    </button>
                                </div>

                                <div className="p-6">
                                    {activeMediaTab === 'audio' && (
                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                            <p className="text-sm text-muted-foreground">Send audio files (<code className="text-rose-400">.mp3</code>, <code className="text-rose-400">.wav</code>, <code className="text-rose-400">.m4a</code>, <code className="text-rose-400">.webm</code>, etc.) for AI transcription or speech generation — all secured by your SG_ key.</p>
                                            <div id="media-audio-examples">
                                                <CodeBlock filename="transcription.py" language="python" onCopy={noop}>{`import openai

client = openai.OpenAI(
    api_key="SG_your_key_here",
    base_url="${API_BASE}"
)

# Transcribe an audio file (Whisper)
with open("recording.mp3", "rb") as f:
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=f,
        language="en"  # optional
    )
print(transcript.text)

# Text-to-Speech
response = client.audio.speech.create(
    model="tts-1",
    voice="alloy",
    input="Hello from SecureGate!"
)
response.stream_to_file("output.mp3")`}</CodeBlock>
                                            </div>
                                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                                {[
                                                    { icon: <FileAudio className="w-5 h-5 text-rose-400" />, label: 'Input Formats', val: 'mp3, wav, m4a, ogg, webm, flac, mp4' },
                                                    { icon: <FileAudio className="w-5 h-5 text-green-400" />, label: 'TTS Voices', val: 'alloy, echo, fable, onyx, nova, shimmer' },
                                                    { icon: <Shield className="w-5 h-5 text-accent" />, label: 'Security', val: 'IP locked · Zero key leakage' },
                                                ].map((item, i) => (
                                                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                        <div className="flex items-center gap-2 mb-1">{item.icon}<span className="text-xs font-semibold text-white">{item.label}</span></div>
                                                        <p className="text-xs text-muted-foreground">{item.val}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeMediaTab === 'image' && (
                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200" id="media-image">
                                            <p className="text-sm text-muted-foreground">Generate images with DALL-E or edit/vary existing images — same SG_ key, same endpoint.</p>
                                            <CodeBlock filename="images.py" language="python" onCopy={noop}>{`import openai, requests

client = openai.OpenAI(
    api_key="SG_your_key_here",
    base_url="${API_BASE}"
)

# Generate an image
response = client.images.generate(
    model="dall-e-3",
    prompt="A futuristic city protected by a glowing security shield",
    n=1,
    size="1024x1024",
    quality="hd"
)
print(response.data[0].url)

# Edit an image (pass a PNG file + mask)
with open("photo.png", "rb") as img, open("mask.png", "rb") as msk:
    edit = client.images.edit(
        model="dall-e-2",
        image=img,
        mask=msk,
        prompt="Replace the background with stars",
        n=1,
        size="1024x1024"
    )
print(edit.data[0].url)`}</CodeBlock>
                                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                                {[
                                                    { icon: <FileImage className="w-5 h-5 text-purple-400" />, label: 'Sizes', val: '256×256, 512×512, 1024×1024, 1792×1024' },
                                                    { icon: <FileImage className="w-5 h-5 text-blue-400" />, label: 'Models', val: 'dall-e-3 (generate), dall-e-2 (edit/vary)' },
                                                    { icon: <Shield className="w-5 h-5 text-accent" />, label: 'Security', val: 'IP locked · No raw provider key exposure' },
                                                ].map((item, i) => (
                                                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                        <div className="flex items-center gap-2 mb-1">{item.icon}<span className="text-xs font-semibold text-white">{item.label}</span></div>
                                                        <p className="text-xs text-muted-foreground">{item.val}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeMediaTab === 'vision' && (
                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200" id="media-vision">
                                            <p className="text-sm text-muted-foreground">Analyze images, screenshots, and PDFs by passing them as base64 or URL inside a regular <code className="text-rose-400">/chat/completions</code> request — no extra endpoint.</p>
                                            <CodeBlock filename="vision.py" language="python" onCopy={noop}>{`import openai, base64

client = openai.OpenAI(
    api_key="SG_your_key_here",
    base_url="${API_BASE}"
)

# ── Vision from URL ──────────────────────────
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What's in this image?"},
            {"type": "image_url", "image_url": {"url": "https://example.com/diagram.png"}}
        ]
    }]
)
print(response.choices[0].message.content)

# ── PDF / File via base64 ────────────────────
with open("report.pdf", "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Summarise this PDF report."},
            {"type": "image_url", "image_url": {
                "url": f"data:application/pdf;base64,{b64}"
            }}
        ]
    }]
)
print(response.choices[0].message.content)`}</CodeBlock>
                                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                                                {[
                                                    { icon: <FileText className="w-5 h-5 text-amber-400" />, label: 'File Types', val: 'PNG, JPG, WEBP, GIF, PDF (via base64)' },
                                                    { icon: <FileText className="w-5 h-5 text-blue-400" />, label: 'Models', val: 'gpt-4o, gpt-4-turbo, claude-3-5-sonnet' },
                                                    { icon: <Shield className="w-5 h-5 text-accent" />, label: 'Security', val: 'Passed through encrypted proxy — never cached' },
                                                ].map((item, i) => (
                                                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                                        <div className="flex items-center gap-2 mb-1">{item.icon}<span className="text-xs font-semibold text-white">{item.label}</span></div>
                                                        <p className="text-xs text-muted-foreground">{item.val}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Tips callout */}
                            <div className="mt-8 p-6 rounded-2xl border border-rose-500/20 bg-rose-500/5">
                                <h4 className="font-semibold text-rose-300 mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> Ideas & Tips</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>🎙️ <strong className="text-white">Live transcription pipelines</strong> — stream microphone chunks to Whisper via SecureGate without exposing your OpenAI key to the browser.</li>
                                    <li>🖼️ <strong className="text-white">Image moderation bots</strong> — send uploaded user images to GPT-4o Vision to check for policy violations before storing them.</li>
                                    <li>📄 <strong className="text-white">PDF document intelligence</strong> — drop any PDF into GPT-4o and extract structured data, summaries, or Q&A — all gated by your IP lock.</li>
                                    <li>🔊 <strong className="text-white">Voice assistants</strong> — chain TTS + STT through SecureGate to build private voice assistants that never expose provider keys to clients.</li>
                                    <li>🛡️ <strong className="text-white">Multi-modal model lock</strong> — restrict a key to only allow <code className="text-rose-400">whisper-1</code> on your transcription server so it can never spin up expensive vision calls.</li>
                                </ul>
                            </div>
                        </section>

                        {/* ═══════════════════════════════════════════════ */}
                        {/* ═══════════════════════════════════════════════ */}



                    </main>
                </div>
            </div>

            <div className="border-t border-white/10 py-12 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-2xl font-bold mb-4">Ready to secure your agents?</h2>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-medium hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 mb-12">
                        Get Started for Free <ArrowRight className="w-4 h-4" />
                    </Link>

                    <div className="pt-8 border-t border-white/5 flex flex-col items-center justify-center gap-4">
                        <div className="text-sm text-muted-foreground flex items-center gap-2 px-4 py-2 rounded-full">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            <span>Self-hostable, open source, and built for security-focused teams.</span>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}
