"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Shield, Check } from 'lucide-react';
import Link from 'next/link';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.801 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);




// --- TYPE DEFINITIONS ---

interface SignUpPageProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    heroImageSrc?: string;
    onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
    onGoogleSignUp?: () => void;
    onOtpSubmit?: (code: string) => void;
    onResendOtp?: () => void;
    view?: 'signup' | 'verify-email';
    verifyEmail?: string;
    otpLoading?: boolean;
    signInHref?: string;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-accent/70 focus-within:bg-accent/5">
        {children}
    </div>
);

const features = [
    "AES-256-GCM encryption for all keys",
    "Zero API key exposure to frontend",
    "Works with OpenAI, Anthropic & more",
    "Built with security best practices",
];

const OtpInput = ({ length = 6, onComplete, loading }: { length?: number, onComplete: (code: string) => void, loading?: boolean }) => {
    const [values, setValues] = useState<string[]>(Array(length).fill(''));
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (i: number, val: string) => {
        if (!/^\d*$/.test(val)) return;
        const newValues = [...values];
        newValues[i] = val.slice(-1);
        setValues(newValues);
        if (val && i < length - 1) inputs.current[i + 1]?.focus();
        const code = newValues.join('');
        if (code.length === length) onComplete(code);
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !values[i] && i > 0) {
            inputs.current[i - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
        if (!pasted) return;
        const newValues = Array(length).fill('');
        pasted.split('').forEach((c, i) => { newValues[i] = c; });
        setValues(newValues);
        inputs.current[Math.min(pasted.length, length - 1)]?.focus();
        if (pasted.length === length) onComplete(pasted);
    };

    return (
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {values.map((v, i) => (
                <input
                    key={i}
                    ref={el => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    autoFocus={i === 0}
                    disabled={loading}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-12 h-14 rounded-xl border border-border bg-foreground/5 backdrop-blur-sm text-center text-xl font-bold focus:outline-none focus:border-accent/70 focus:bg-accent/5 transition-all disabled:opacity-50"
                />
            ))}
        </div>
    );
};

const ResendTimer = ({ onResend }: { onResend: () => void }) => {
    const [secs, setSecs] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (secs <= 0) { setCanResend(true); return; }
        const t = setTimeout(() => setSecs(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [secs]);

    const handleResend = () => {
        onResend();
        setSecs(60);
        setCanResend(false);
    };

    return canResend ? (
        <button onClick={handleResend} className="text-sm font-medium text-accent hover:underline transition-colors mt-2">
            Resend Code
        </button>
    ) : (
        <div className="text-sm text-muted-foreground mt-2">
            Resend in {secs}s
        </div>
    );
};

// --- MAIN COMPONENT ---

export const SignUpPage: React.FC<SignUpPageProps> = ({
    title = <span className="text-foreground">Create your account</span>,
    description = "Start protecting your AI agent credentials today",
    heroImageSrc,
    onSignUp,
    onGoogleSignUp,
    onOtpSubmit,
    onResendOtp,
    view = 'signup',
    verifyEmail = '',
    otpLoading = false,
    signInHref = "/sign-in",
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isVerify = view === 'verify-email';

    return (
        <div className="min-h-screen flex flex-col lg:flex-row w-full">
            {/* Left column: sign-up form */}
            <section className="flex-1 flex items-center justify-center p-6 md:p-8">
                <div className="w-full max-w-md">
                    <div className="flex flex-col gap-5">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 mb-2">
                            <img src="/assets/providers/logo.png" alt="SecureGate Logo" className="h-8 w-8 object-contain" />
                            <span className="text-xl font-semibold tracking-tight font-mono">SecureGate</span>
                        </Link>

                        <h1 className="animate-element animate-delay-100 text-3xl md:text-4xl font-bold leading-tight">
                            {isVerify ? "Verify your email" : title}
                        </h1>
                        <p className="animate-element animate-delay-200 text-muted-foreground">
                            {isVerify ? `We've sent a 6-digit code to ${verifyEmail}` : description}
                        </p>

                        {isVerify ? (
                            <div className="animate-element animate-delay-300 py-4 space-y-6">
                                <OtpInput onComplete={onOtpSubmit || (() => { })} loading={otpLoading} />

                                {otpLoading && (
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                                        <div className="w-4 h-4 border-2 border-muted-foreground/40 border-t-foreground rounded-full animate-spin" />
                                        Verifying...
                                    </div>
                                )}

                                <div className="text-center pt-2">
                                    <ResendTimer onResend={onResendOtp || (() => { })} />
                                </div>
                            </div>
                        ) : (
                            <>
                                <form className="space-y-4" onSubmit={onSignUp}>
                                    <div className="animate-element animate-delay-300 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">First name</label>
                                            <GlassInputWrapper>
                                                <input name="firstName" type="text" placeholder="John" className="w-full bg-transparent text-sm p-3 rounded-xl focus:outline-none" />
                                            </GlassInputWrapper>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Last name</label>
                                            <GlassInputWrapper>
                                                <input name="lastName" type="text" placeholder="Doe" className="w-full bg-transparent text-sm p-3 rounded-xl focus:outline-none" />
                                            </GlassInputWrapper>
                                        </div>
                                    </div>

                                    <div className="animate-element animate-delay-400">
                                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                                        <GlassInputWrapper>
                                            <input name="email" type="email" placeholder="you@example.com" required className="w-full bg-transparent text-sm p-3.5 rounded-xl focus:outline-none" />
                                        </GlassInputWrapper>
                                    </div>

                                    <div className="animate-element animate-delay-500">
                                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
                                        <GlassInputWrapper>
                                            <div className="relative">
                                                <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password" required className="w-full bg-transparent text-sm p-3.5 pr-12 rounded-xl focus:outline-none" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                                                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />}
                                                </button>
                                            </div>
                                        </GlassInputWrapper>
                                        <p className="text-xs text-muted-foreground mt-1.5">Must be at least 8 characters</p>
                                    </div>

                                    <button type="submit" className="animate-element animate-delay-700 w-full rounded-xl bg-primary py-3.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                                        Create Account
                                    </button>
                                </form>

                                <div className="animate-element animate-delay-800 relative flex items-center justify-center">
                                    <span className="w-full border-t border-border"></span>
                                    <span className="px-4 text-sm text-muted-foreground bg-background absolute">or</span>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={onGoogleSignUp} className="animate-element animate-delay-900 flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-3 hover:bg-secondary transition-colors">
                                        <GoogleIcon />
                                        <span className="text-sm">Google</span>
                                    </button>
                                </div>

                                <p className="animate-element animate-delay-1000 text-center text-sm text-muted-foreground">
                                    Already have an account? <Link href={signInHref} className="text-accent hover:underline transition-colors">Sign in</Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Right column: features showcase */}
            {heroImageSrc && (
                <section className="hidden lg:flex flex-1 relative p-4">
                    <div className="absolute inset-4 rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}>
                        {/* Dark overlay */}
                        <div className="absolute inset-0 rounded-2xl bg-black/50" />

                        {/* Content */}
                        <div className="relative z-10 h-full flex flex-col justify-center p-12">
                            <h2 className="text-3xl font-bold text-white mb-6">Security-focused protection for your AI agents</h2>
                            <ul className="space-y-4">
                                {features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/90">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                                            <Check className="h-4 w-4 text-accent" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default SignUpPage;
