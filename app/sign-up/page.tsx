"use client"

import { SignUpPage } from "@/components/ui/sign-up";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export default function SignUp() {
    const { signUp, signInWithGoogle, verifyOtp, loading } = useAuth();
    const [view, setView] = useState<'signup' | 'verify-email'>('signup');
    const [error, setError] = useState<string | null>(null);
    const [pendingEmail, setPendingEmail] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const firstName = formData.get('firstName') as string;
        const lastName = formData.get('lastName') as string;
        const fullName = [firstName, lastName].filter(Boolean).join(' ');

        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            await signUp(email, password, fullName);
            // Move to OTP verification step
            setPendingEmail(email);
            setView('verify-email');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign up failed');
        }
    };

    const handleOtpSubmit = async (code: string) => {
        if (!pendingEmail) return;
        setOtpLoading(true);
        setError(null);
        try {
            await verifyOtp(pendingEmail, code);
            // verifyOtp redirects to /dashboard on success
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid verification code. Please try again.');
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!pendingEmail) return;
        try {
            await signUp(pendingEmail, ''); // Resend by triggering signup again - Supabase will resend
        } catch {
            // Ignore error on resend, just swallow
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Google sign up failed');
        }
    };

    return (
        <div className="bg-background text-foreground">
            {error && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2 rounded-lg text-sm font-mono">
                    {error}
                </div>
            )}
            <SignUpPage
                view={view}
                onSignUp={handleSignUp}
                onGoogleSignUp={handleGoogleSignUp}
                onOtpSubmit={handleOtpSubmit}
                onResendOtp={handleResendOtp}
                verifyEmail={pendingEmail}
                otpLoading={otpLoading}
                signInHref="/sign-in"
            />
        </div>
    );
}
