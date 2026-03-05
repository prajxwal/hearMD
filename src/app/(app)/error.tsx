"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("App error:", error);
    }, [error]);

    return (
        <div className="max-w-lg mx-auto py-24 px-6 text-center space-y-6">
            <div className="flex justify-center">
                <div className="w-16 h-16 flex items-center justify-center border-2 border-red-500/30 bg-red-500/10">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-bold">Something went wrong</h2>
                <p className="text-sm text-[var(--muted)]">
                    An unexpected error occurred. Your data is safe — try refreshing the page.
                </p>
            </div>

            {error.digest && (
                <p className="text-xs text-[var(--muted)] font-mono">
                    Error ID: {error.digest}
                </p>
            )}

            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={reset}
                    className="h-10 px-5 flex items-center gap-2 border-2 border-[var(--border)] text-sm font-bold uppercase tracking-wide hover:bg-[var(--foreground)]/5 transition-colors"
                >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                </button>
                <Link
                    href="/dashboard"
                    className="h-10 px-5 flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity"
                >
                    <Home className="h-4 w-4" />
                    Dashboard
                </Link>
            </div>
        </div>
    );
}
