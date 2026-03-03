"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const supabase = createClient();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            setSent(true);
            toast.success("Password reset email sent!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to send reset email";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">hearMD</h1>
                    <p className="text-sm text-[var(--muted)]">Reset your password</p>
                </div>

                {sent ? (
                    <div className="space-y-6">
                        <div className="p-6 border-2 border-[var(--border)] text-center space-y-3">
                            <p className="text-2xl">📧</p>
                            <p className="text-sm font-bold">Check your inbox</p>
                            <p className="text-sm text-[var(--muted)]">
                                We&apos;ve sent a password reset link to <strong>{email}</strong>.
                                Click the link in the email to set a new password.
                            </p>
                        </div>

                        <button
                            onClick={() => setSent(false)}
                            className="w-full h-12 border-2 border-[var(--border)] text-sm font-bold uppercase tracking-wide hover:opacity-70 transition-opacity"
                        >
                            Try a different email
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <p className="text-sm text-[var(--muted)]">
                            Enter your email address and we&apos;ll send you a link to reset your password.
                        </p>

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wide">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="doctor@clinic.com"
                                className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-0"
                                autoComplete="email"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                )}

                {/* Back to Login */}
                <p className="text-center text-sm text-[var(--muted)]">
                    Remember your password?{" "}
                    <Link href="/login" className="text-[var(--foreground)] font-bold hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
