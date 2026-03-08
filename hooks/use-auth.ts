'use client'

import { createBrowserClient } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createBrowserClient()

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [supabase.auth])

    const signIn = useCallback(async (email: string, password: string) => {
        setLoading(true)
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        setLoading(false)

        if (error) throw error

        // Check if MFA is required
        if (data.session === null && data.user) {
            // MFA challenge needed
            const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
            if (aal?.nextLevel === 'aal2') {
                // Enroll a challenge
                const factors = data.user.factors?.filter(f => f.factor_type === 'totp') || []
                if (factors.length > 0) {
                    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factors[0].id })
                    if (challengeError) throw challengeError
                    return { mfaRequired: true, factorId: factors[0].id, challengeId: challengeData.id }
                }
            }
        }

        router.push('/dashboard')
        return data
    }, [supabase.auth, router])

    const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
        setLoading(true)
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        setLoading(false)

        if (error) throw error
        return data
    }, [supabase.auth])

    const verifyOtp = useCallback(async (email: string, token: string) => {
        setLoading(true)
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        })
        setLoading(false)
        if (error) throw error
        router.push('/dashboard')
        return data
    }, [supabase.auth, router])

    const verifyMfa = useCallback(async (factorId: string, challengeId: string, code: string) => {
        setLoading(true)
        const { data, error } = await supabase.auth.mfa.verify({
            factorId,
            challengeId,
            code,
        })
        setLoading(false)
        if (error) throw error
        router.push('/dashboard')
        return data
    }, [supabase.auth, router])

    const enrollTOTP = useCallback(async () => {
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
        if (error) throw error
        return data
    }, [supabase.auth])

    const unenrollTOTP = useCallback(async (factorId: string) => {
        const { data, error } = await supabase.auth.mfa.unenroll({ factorId })
        if (error) throw error
        return data
    }, [supabase.auth])

    const getUserFactors = useCallback(async () => {
        const { data, error } = await supabase.auth.mfa.listFactors()
        if (error) throw error
        return data
    }, [supabase.auth])

    const signInWithGoogle = useCallback(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) throw error
    }, [supabase.auth])

    const signInWithGitHub = useCallback(async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) throw error
    }, [supabase.auth])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
        router.push('/')
    }, [supabase.auth, router])

    const resetPassword = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
    }, [supabase.auth])

    return {
        user,
        session,
        loading,
        signIn,
        signUp,
        verifyOtp,
        verifyMfa,
        enrollTOTP,
        unenrollTOTP,
        getUserFactors,
        signInWithGoogle,
        signInWithGitHub,
        signOut,
        resetPassword,
    }
}
