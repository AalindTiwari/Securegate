'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import {
    User,
    Mail,
    Lock,
    Shield,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    Fingerprint,
    X,
    QrCode,
    Eye,
    EyeOff,
    KeyRound,
} from 'lucide-react'
import { StepUpModal } from '@/components/ui/step-up-modal'
import { useStepUpAuth } from '@/hooks/use-step-up-auth'

export default function SettingsPage() {
    const { user, signOut, enrollTOTP, unenrollTOTP, getUserFactors } = useAuth()
    const supabase = createBrowserClient()

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // 2FA State
    const [totpEnrolled, setTotpEnrolled] = useState(false)
    const [totpFactorId, setTotpFactorId] = useState<string | null>(null)
    const [showEnrollModal, setShowEnrollModal] = useState(false)
    const [enrollData, setEnrollData] = useState<{ qrCode: string; secret: string; factorId: string } | null>(null)
    const [totpCode, setTotpCode] = useState('')
    const [totpLoading, setTotpLoading] = useState(false)
    const [totpSuccess, setTotpSuccess] = useState(false)
    const [showSecret, setShowSecret] = useState(false)
    const [mfaLoading, setMfaLoading] = useState(false)

    // Passkey state
    const [passkeyLoading, setPasskeyLoading] = useState(false)
    const [passkeySuccess, setPasskeySuccess] = useState(false)

    // Step-up auth
    const stepUp = useStepUpAuth()

    // Check 2FA status on load
    useEffect(() => {
        if (!user) return
        getUserFactors?.().then(data => {
            const totp = data?.totp?.[0]
            if (totp) {
                setTotpEnrolled(true)
                setTotpFactorId(totp.id)
            }
        }).catch(() => { })
    }, [user])

    const handleEnrollStart = async () => {
        setTotpLoading(true)
        try {
            const data = await enrollTOTP()
            setEnrollData({
                qrCode: data?.totp?.qr_code || '',
                secret: data?.totp?.secret || '',
                factorId: data?.id || '',
            })
            setShowEnrollModal(true)
        } catch (err) {
            setError('Failed to start 2FA enrollment. Please try again.')
        } finally {
            setTotpLoading(false)
        }
    }

    const handleEnrollVerify = async () => {
        if (!enrollData || totpCode.length !== 6) return
        setTotpLoading(true)
        try {
            const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: enrollData.factorId })
            if (challengeErr) throw challengeErr
            const { error: verifyErr } = await supabase.auth.mfa.verify({
                factorId: enrollData.factorId,
                challengeId: challengeData.id,
                code: totpCode,
            })
            if (verifyErr) throw verifyErr
            setTotpEnrolled(true)
            setTotpFactorId(enrollData.factorId)
            setTotpSuccess(true)
            setShowEnrollModal(false)
            setEnrollData(null)
            setTotpCode('')
        } catch (err) {
            setError('Invalid code. Please check your authenticator app.')
        } finally {
            setTotpLoading(false)
        }
    }

    const handleUnenroll = async () => {
        if (!totpFactorId) return
        if (!confirm('Are you sure you want to disable Two-Factor Authentication?')) return
        setMfaLoading(true)
        try {
            await unenrollTOTP(totpFactorId)
            setTotpEnrolled(false)
            setTotpFactorId(null)
        } catch (err) {
            setError('Failed to disable 2FA.')
        } finally {
            setMfaLoading(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        // Require step-up verification
        const { verified } = await stepUp.requireVerification(user?.email || '')
        if (!verified) return

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error

            setSuccess('Password updated successfully')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update password')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete your account? This action cannot be undone.'
        )
        if (!confirmed) return

        // Step-up verification before deleting account
        const { verified } = await stepUp.requireVerification(user?.email || '')
        if (!verified) return

        alert('Account deletion will be implemented via edge function for security')
    }

    // Passkey enrollment
    const handleEnrollPasskey = async () => {
        setPasskeyLoading(true)
        setError(null)
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'webauthn',
            } as any)
            if (error) throw error
            setPasskeySuccess(true)
        } catch (err) {
            setError('Passkeys are not supported in this environment, or enrollment failed. Ensure you are on HTTPS and using a compatible browser.')
        } finally {
            setPasskeyLoading(false)
        }
    }

    return (
        <DashboardLayout>
            {/* Step-Up Verification Modal */}
            <StepUpModal
                isOpen={stepUp.isOpen}
                onClose={stepUp.closeModal}
                onVerified={stepUp.handleVerified}
                userEmail={stepUp.userEmail}
                method={stepUp.method}
                factorId={stepUp.factorId}
                action="change password"
            />
            <div className="max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-muted-foreground">Manage your account and preferences</p>
                </div>

                {/* Account Info */}
                <div className="rounded-xl border border-border/50 overflow-hidden mb-6">
                    <div className="p-4 border-b border-border/50 bg-card/50">
                        <h2 className="font-semibold flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Account
                        </h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground">Email</label>
                            <div className="flex items-center gap-3 mt-1">
                                <Mail className="w-5 h-5 text-muted-foreground" />
                                <p className="font-medium">{user?.email}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">User ID</label>
                            <p className="font-mono text-sm mt-1 text-muted-foreground">{user?.id}</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Member since</label>
                            <p className="font-medium mt-1">
                                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <div className="rounded-xl border border-border/50 overflow-hidden mb-6">
                    <div className="p-4 border-b border-border/50 bg-card/50">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Change Password
                        </h2>
                    </div>
                    <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border focus:border-accent outline-none transition-colors"
                                placeholder="Enter new password"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border focus:border-accent outline-none transition-colors"
                                placeholder="Confirm new password"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-500 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !newPassword || !confirmPassword}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>

                {/* Security - 2FA */}
                <div className="rounded-xl border border-border/50 overflow-hidden mb-6">
                    <div className="p-4 border-b border-border/50 bg-card/50">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Fingerprint className="w-5 h-5 text-accent" />
                            Two-Factor Authentication
                        </h2>
                    </div>
                    <div className="p-6">
                        {totpSuccess && (
                            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-500/10 text-green-500 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                2FA has been enabled on your account!
                            </div>
                        )}

                        {/* ENROLL MODAL */}
                        {showEnrollModal && enrollData && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                                    <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                                        <h2 className="text-lg font-bold flex items-center gap-2">
                                            <Fingerprint className="w-5 h-5 text-accent" />
                                            Enable 2FA
                                        </h2>
                                        <button onClick={() => { setShowEnrollModal(false); setEnrollData(null); }} className="p-1 rounded hover:bg-secondary text-muted-foreground">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        {/* Step 1: QR */}
                                        <div>
                                            <p className="text-sm font-medium mb-3">1. Scan with your authenticator app</p>
                                            {enrollData.qrCode ? (
                                                <div className="bg-white p-3 rounded-xl inline-block">
                                                    <img src={enrollData.qrCode} alt="TOTP QR Code" className="w-44 h-44" />
                                                </div>
                                            ) : (
                                                <div className="w-44 h-44 bg-secondary/50 rounded-xl flex items-center justify-center">
                                                    <QrCode className="w-8 h-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        {/* Step 2: Manual key */}
                                        <div>
                                            <p className="text-sm font-medium mb-1">2. Or enter manually</p>
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs bg-secondary/50 px-3 py-2 rounded-lg flex-1 font-mono text-muted-foreground tracking-widest select-all">
                                                    {showSecret ? enrollData.secret : '•'.repeat(Math.min(enrollData.secret.length, 32))}
                                                </code>
                                                <button onClick={() => setShowSecret(!showSecret)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
                                                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        {/* Step 3: Verify */}
                                        <div>
                                            <p className="text-sm font-medium mb-2">3. Enter the 6-digit code to confirm</p>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={totpCode}
                                                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                                                placeholder="000000"
                                                className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-border focus:border-accent outline-none transition-colors font-mono text-lg tracking-[0.5em] text-center"
                                            />
                                        </div>
                                        {error && (
                                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                                <AlertTriangle className="w-4 h-4" />{error}
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-6 py-4 border-t border-border/50 flex justify-end gap-3">
                                        <button onClick={() => { setShowEnrollModal(false); setEnrollData(null); }} className="px-4 py-2 rounded-lg hover:bg-secondary text-sm font-medium transition-colors">
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleEnrollVerify}
                                            disabled={totpCode.length !== 6 || totpLoading}
                                            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {totpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Verify & Enable
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium">Authenticator App (TOTP)</p>
                                <p className="text-sm text-muted-foreground">
                                    {totpEnrolled
                                        ? 'Your account is protected with 2FA'
                                        : 'Use Google Authenticator or Authy for extra protection'}
                                </p>
                            </div>
                            {totpEnrolled ? (
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Enabled
                                    </span>
                                    <button
                                        onClick={handleUnenroll}
                                        disabled={mfaLoading}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive text-sm hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                    >
                                        {mfaLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                        Disable
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleEnrollStart}
                                    disabled={totpLoading}
                                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 w-full sm:w-auto"
                                >
                                    {totpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                                    Enable 2FA
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Passkeys */}
                <div className="rounded-xl border border-border/50 overflow-hidden mb-6">
                    <div className="p-4 border-b border-border/50 bg-card/50">
                        <h2 className="font-semibold flex items-center gap-2">
                            <KeyRound className="w-5 h-5 text-accent" />
                            Passkeys
                        </h2>
                    </div>
                    <div className="p-6">
                        {passkeySuccess && (
                            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-green-500/10 text-green-500 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Passkey enrolled! You can now sign in without a password.
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium">Hardware / Biometric Passkey</p>
                                <p className="text-sm text-muted-foreground">Sign in with Face ID, Touch ID, or a hardware key — no password needed</p>
                            </div>
                            <button
                                onClick={handleEnrollPasskey}
                                disabled={passkeyLoading}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 w-full sm:w-auto"
                            >
                                {passkeyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                Enroll Passkey
                            </button>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 overflow-hidden">
                    <div className="p-4 border-b border-destructive/30">
                        <h2 className="font-semibold text-destructive flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Danger Zone
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                            <div>
                                <p className="font-medium">Delete Account</p>
                                <p className="text-sm text-muted-foreground">
                                    Permanently delete your account and all data
                                </p>
                            </div>
                            <button
                                onClick={handleDeleteAccount}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-destructive/50 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors w-full sm:w-auto"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
