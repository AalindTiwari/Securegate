"use client"

import { SignInPage, Testimonial } from "@/components/ui/sign-in";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

const testimonials: Testimonial[] = [
    {
        avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        name: "Sarah Chen",
        handle: "@sarahchen",
        text: "Finally, I can use AI agents without worrying about key exposure. Game changer!",
    },
    {
        avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        name: "Marcus Johnson",
        handle: "@marcusdev",
        text: "The encryption is rock solid. Our security team approved it in days.",
    },
];

export default function SignIn() {
    const { signIn, signInWithGoogle, resetPassword, verifyMfa, loading } = useAuth();
    const [view, setView] = useState<'signin' | 'reset' | 'mfa'>('signin');
    const [error, setError] = useState<string | null>(null);
    const [resetSent, setResetSent] = useState(false);
    const [mfaState, setMfaState] = useState<{ factorId: string; challengeId: string } | null>(null);
    const [mfaLoading, setMfaLoading] = useState(false);

    const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }

        try {
            const result = await signIn(email, password) as any;
            // If MFA is required, switch to the MFA view
            if (result?.mfaRequired) {
                setMfaState({ factorId: result.factorId, challengeId: result.challengeId });
                setView('mfa');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign in failed');
        }
    };

    const handleMfaSubmit = async (code: string) => {
        if (!mfaState) return;
        setMfaLoading(true);
        setError(null);
        try {
            await verifyMfa(mfaState.factorId, mfaState.challengeId, code);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid code');
            setMfaLoading(false);
        }
    };

    const handleResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;

        if (!email) {
            setError('Please enter your email');
            return;
        }

        try {
            await resetPassword(email);
            setResetSent(true);
            setError(null);
            setView('signin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Password reset failed');
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Google sign in failed');
        }
    };

    return (
        <div className="bg-background text-foreground">
            {error && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2 rounded-lg text-sm font-mono">
                    {error}
                </div>
            )}
            {resetSent && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-2 rounded-lg text-sm font-mono">
                    Password reset email sent!
                </div>
            )}
            <SignInPage
                view={view}
                onSignIn={handleSignIn}
                onResetRequest={handleResetRequest}
                onGoogleSignIn={handleGoogleSignIn}
                onMfaSubmit={handleMfaSubmit}
                mfaLoading={mfaLoading}
                onResetPassword={() => setView('reset')}
                onBackToSignIn={() => setView('signin')}
                heroImageSrc="https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1200&q=80"
                testimonials={testimonials}
                signUpHref="/sign-up"
            />
        </div>
    );
}
