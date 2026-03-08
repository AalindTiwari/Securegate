'use client'

import React, { useState, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { X, Shield, Fingerprint, Mail, Loader2, AlertTriangle } from 'lucide-react'

type StepUpMethod = 'totp' | 'email'

interface StepUpModalProps {
    isOpen: boolean
    onClose: () => void
    onVerified: () => void
    userEmail: string
    method: StepUpMethod
    factorId?: string | null
    action?: string
}

// 6-digit OTP input
const OtpBoxes = ({ onComplete, loading }: { onComplete: (code: string) => void; loading: boolean }) => {
    const length = 6
    const [values, setValues] = useState<string[]>(Array(length).fill(''))
    const inputs = useRef<(HTMLInputElement | null)[]>([])

    const handleChange = (i: number, val: string) => {
        if (!/^\d*$/.test(val)) return
        const next = [...values]
        next[i] = val.slice(-1)
        setValues(next)
        if (val && i < length - 1) inputs.current[i + 1]?.focus()
        const code = next.join('')
        if (code.length === length) onComplete(code)
    }

    const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !values[i] && i > 0) inputs.current[i - 1]?.focus()
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
        if (!pasted) return
        const next = Array(length).fill('')
        pasted.split('').forEach((c, i) => { next[i] = c })
        setValues(next)
        inputs.current[Math.min(pasted.length, length - 1)]?.focus()
        if (pasted.length === length) onComplete(pasted)
    }

    return (
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {values.map((v, i) => (
                <input
                    key={i}
                    ref={el => { inputs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    autoFocus={i === 0}
                    disabled={loading}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-11 h-13 rounded-lg border border-border bg-secondary/40 text-center text-xl font-mono font-bold focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all disabled:opacity-40"
                />
            ))}
        </div>
    )
}

export const StepUpModal: React.FC<StepUpModalProps> = ({
    isOpen,
    onClose,
    onVerified,
    userEmail,
    method,
    factorId,
    action = 'perform this action',
}) => {
    const supabase = createBrowserClient()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCode = async (code: string) => {
        setLoading(true)
        setError(null)
        try {
            if (method === 'totp' && factorId) {
                const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId })
                if (chErr) throw chErr
                const { error: verifyErr } = await supabase.auth.mfa.verify({
                    factorId,
                    challengeId: ch.id,
                    code,
                })
                if (verifyErr) throw verifyErr
            } else {
                // Email OTP
                const { error: verifyErr } = await supabase.auth.verifyOtp({
                    email: userEmail,
                    token: code,
                    type: 'magiclink',
                })
                if (verifyErr) throw verifyErr
            }
            onVerified()
        } catch (err) {
            setError('Invalid code. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-secondary/20">
                    <div className="flex items-center gap-2">
                        {method === 'totp'
                            ? <Fingerprint className="w-5 h-5 text-accent" />
                            : <Mail className="w-5 h-5 text-accent" />
                        }
                        <h2 className="font-semibold">Confirm your identity</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-secondary text-muted-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                            To <span className="text-foreground font-medium">{action}</span>, please verify your identity first.
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            {method === 'totp'
                                ? 'Enter the 6-digit code from your authenticator app'
                                : <>Code sent to <span className="text-foreground">{userEmail}</span></>
                            }
                        </p>
                        <OtpBoxes onComplete={handleCode} loading={loading} />
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying...
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                <div className="px-6 pb-5 text-center">
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

export default StepUpModal
