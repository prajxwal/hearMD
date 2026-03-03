"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ResetPasswordPage() {
    const router = useRouter();
    const supabase = createClient();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);

    // Supabase will auto-detect the recovery token from the URL hash
    // and establish a session. We listen for that event.
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setReady(true);
            }
        });

        // Also check if we already have a session (user clicked link and landed here)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setReady(true);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        if (!hasUpper || !hasLower || !hasNumber) {
            toast.error("Password must contain uppercase, lowercase, and a number");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            toast.success("Password updated successfully!");
            router.push("/dashboard");
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update password";
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
                    <p className="text-sm text-[var(--muted)]">Set your new password</p>
                </div>

                {!ready ? (
                    <div className="p-6 border-2 border-[var(--border)] text-center space-y-3">
                        <p className="text-sm text-[var(--muted)]">
                            Verifying your reset link...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {/* New Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wide">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 8 chars, 1 upper, 1 lower, 1 number"
                                        className="w-full h-12 px-4 pr-12 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-0"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-[var(--muted)] hover:text-[var(--foreground)]"
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wide">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-0"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
