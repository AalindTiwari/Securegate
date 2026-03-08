"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { Lock, Shield, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createBrowserClient()

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        setLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            })

            if (error) throw error

            setSuccess(true)
            setTimeout(() => {
                router.push("/dashboard")
            }, 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update password")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-10">
                <img src="/assets/providers/logo.png" alt="SecureGate Logo" className="h-10 w-10 object-contain" />
                <span className="text-2xl font-bold tracking-tight font-mono">SecureGate</span>
            </Link>

            <div className="w-full max-w-md bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-border/50 bg-secondary/20">
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-foreground" />
                        <h1 className="text-xl font-bold tracking-tight">Change Password</h1>
                    </div>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center py-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-500 mb-4 animate-bounce">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-medium mb-2">Password Updated!</h2>
                            <p className="text-muted-foreground text-sm">
                                Redirecting you to the dashboard...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            {error && (
                                <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive animate-in fade-in slide-in-from-top-1">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground block">
                                    New Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/50 group-focus-within:text-accent transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        required
                                        className="w-full bg-foreground/5 dark:bg-black/20 border border-border/50 rounded-xl py-3 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground block">
                                    Confirm New Password
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/50 group-focus-within:text-accent transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        required
                                        className="w-full bg-foreground/5 dark:bg-black/20 border border-border/50 rounded-xl py-3 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#9f3e2b] hover:bg-[#863424] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Update Password
                                        <Shield className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <p className="mt-8 text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/sign-in" className="text-accent hover:underline decoration-accent/30 underline-offset-4">
                    Back to sign in
                </Link>
            </p>
        </div>
    )
}
