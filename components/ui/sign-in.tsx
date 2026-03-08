"use client"

import React, { useState, useRef } from 'react';
import { Eye, EyeOff, Shield } from 'lucide-react';
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

export interface Testimonial {
    avatarSrc: string;
    name: string;
    handle: string;
    text: string;
}

interface SignInPageProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    heroImageSrc?: string;
    testimonials?: Testimonial[];
    onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
    onResetRequest?: (event: React.FormEvent<HTMLFormElement>) => void;
    onGoogleSignIn?: () => void;
    onResetPassword?: () => void;
    onBackToSignIn?: () => void;
    onMfaSubmit?: (code: string) => void;
    mfaLoading?: boolean;
    signUpHref?: string;
    showSignUp?: boolean;
    view?: 'signin' | 'reset' | 'mfa';
}

// ... SUB-COMPONENTS ...

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-accent/70 focus-within:bg-accent/5">
        {children}
    </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
    <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10 p-4 w-56`}>
        <img src={testimonial.avatarSrc} className="h-9 w-9 object-cover rounded-xl" alt="avatar" />
        <div className="text-xs leading-snug">
            <p className="flex items-center gap-1 font-medium text-foreground">{testimonial.name}</p>
            <p className="text-muted-foreground">{testimonial.handle}</p>
            <p className="mt-1 text-foreground/80">{testimonial.text}</p>
        </div>
    </div>
);

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

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
    title,
    description,
    heroImageSrc,
    testimonials = [],
    onSignIn,
    onResetRequest,
    onGoogleSignIn,
    onMfaSubmit,
    mfaLoading,
    onResetPassword,
    onBackToSignIn,
    signUpHref = "/sign-up",
    showSignUp = true,
    view = 'signin',
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const isReset = view === 'reset';
    const isMfa = view === 'mfa';
    const displayTitle = title || (isReset ? "Reset password" : isMfa ? "Two-Factor Auth" : "Welcome back");
    const displayDescription = description || (isReset
        ? "Enter your email and we'll send you a link to reset your password"
        : isMfa ? "Enter the 6-digit code from your authenticator app"
            : "Sign in to your account to continue");

    return (
        <div className="min-h-screen flex flex-col md:flex-row w-full">
            {/* Left column: sign-in form */}
            <section className="flex-1 flex items-center justify-center p-6 md:p-8">
                <div className="w-full max-w-md">
                    <div className="flex flex-col gap-6">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 mb-2">
                            <img src="/assets/providers/logo.png" alt="SecureGate Logo" className="h-8 w-8 object-contain" />
                            <span className="text-xl font-semibold tracking-tight font-mono">SecureGate</span>
                        </Link>

                        <h1 className="animate-element animate-delay-100 text-3xl md:text-4xl font-bold leading-tight">{displayTitle}</h1>
                        <p className="animate-element animate-delay-200 text-muted-foreground">{displayDescription}</p>

                        {isMfa && (
                            <div className="animate-element animate-delay-300 py-4 space-y-6">
                                <OtpInput onComplete={onMfaSubmit || (() => { })} loading={mfaLoading} />

                                {mfaLoading && (
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                                        <div className="w-4 h-4 border-2 border-muted-foreground/40 border-t-foreground rounded-full animate-spin" />
                                        Verifying...
                                    </div>
                                )}

                                <button onClick={onBackToSignIn} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors mt-4">
                                    Back to sign in
                                </button>
                            </div>
                        )}

                        {!isMfa && (
                            <form className="space-y-4" onSubmit={isReset ? onResetRequest : onSignIn}>
                                <div className="animate-element animate-delay-300">
                                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                                    <GlassInputWrapper>
                                        <input name="email" type="email" placeholder="you@example.com" required className="w-full bg-transparent text-sm p-3.5 rounded-xl focus:outline-none" />
                                    </GlassInputWrapper>
                                </div>

                                {!isReset && (
                                    <div className="animate-element animate-delay-400">
                                        <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
                                        <GlassInputWrapper>
                                            <div className="relative">
                                                <input name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required className="w-full bg-transparent text-sm p-3.5 pr-12 rounded-xl focus:outline-none" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                                                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />}
                                                </button>
                                            </div>
                                        </GlassInputWrapper>
                                    </div>
                                )}

                                {!isReset && (
                                    <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                                        <label className="flex items-center gap-2.5 cursor-pointer">
                                            <input type="checkbox" name="rememberMe" className="w-4 h-4 rounded border-border bg-secondary accent-accent" />
                                            <span className="text-foreground/90">Remember me</span>
                                        </label>
                                        <button type="button" onClick={onResetPassword} className="hover:underline text-accent transition-colors">Forgot password?</button>
                                    </div>
                                )}

                                <button type="submit" className="animate-element animate-delay-600 w-full rounded-xl bg-primary py-3.5 font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                                    {isReset ? "Send Reset Link" : "Sign In"}
                                </button>

                                {isReset && (
                                    <button type="button" onClick={onBackToSignIn} className="animate-element animate-delay-700 w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        Back to sign in
                                    </button>
                                )}
                            </form>
                        )}

                        {!isReset && !isMfa && (
                            <>
                                <div className="animate-element animate-delay-700 relative flex items-center justify-center">
                                    <span className="w-full border-t border-border"></span>
                                    <span className="px-4 text-sm text-muted-foreground bg-background absolute">or</span>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={onGoogleSignIn} className="animate-element animate-delay-800 flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-3 hover:bg-secondary transition-colors">
                                        <GoogleIcon />
                                        <span className="text-sm">Google</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {showSignUp && !isReset && !isMfa && (
                            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
                                Don&apos;t have an account? <Link href={signUpHref} className="text-accent hover:underline transition-colors">Sign up</Link>
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* Right column: hero image + testimonials */}
            {heroImageSrc && (
                <section className="hidden lg:block flex-1 relative p-4">
                    <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}>
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    {testimonials.length > 0 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 px-8 w-full justify-center">
                            <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
                            {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default SignInPage;
