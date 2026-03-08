'use client'

import { useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'

type StepUpMethod = 'totp' | 'email'

interface StepUpResult {
    verified: boolean
}

interface UseStepUpAuthReturn {
    requireVerification: (userEmail: string) => Promise<StepUpResult>
    StepUpModal: React.ComponentType<StepUpModalProps> | null
    isOpen: boolean
    closeModal: () => void
}

export interface StepUpModalProps {
    isOpen: boolean
    onClose: () => void
    onVerified: () => void
    userEmail: string
    action?: string
}

// Hook for step-up auth - call requireVerification before sensitive actions
export function useStepUpAuth() {
    const supabase = createBrowserClient()
    const [pendingResolve, setPendingResolve] = useState<((result: StepUpResult) => void) | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [userEmail, setUserEmail] = useState('')
    const [method, setMethod] = useState<StepUpMethod>('email')
    const [factorId, setFactorId] = useState<string | null>(null)

    const requireVerification = useCallback(async (email: string): Promise<StepUpResult> => {
        setUserEmail(email)

        // Check if user has TOTP enrolled
        const { data } = await supabase.auth.mfa.listFactors()
        const totpFactor = data?.totp?.[0]
        if (totpFactor) {
            setMethod('totp')
            setFactorId(totpFactor.id)
        } else {
            setMethod('email')
            setFactorId(null)
            // Send email OTP
            await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
        }

        setIsOpen(true)
        return new Promise<StepUpResult>((resolve) => {
            setPendingResolve(() => resolve)
        })
    }, [supabase.auth])

    const handleVerified = useCallback(() => {
        setIsOpen(false)
        pendingResolve?.({ verified: true })
        setPendingResolve(null)
    }, [pendingResolve])

    const closeModal = useCallback(() => {
        setIsOpen(false)
        pendingResolve?.({ verified: false })
        setPendingResolve(null)
    }, [pendingResolve])

    return {
        requireVerification,
        isOpen,
        userEmail,
        method,
        factorId,
        handleVerified,
        closeModal,
    }
}
