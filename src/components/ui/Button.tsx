"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger";
    loading?: boolean;
    icon?: React.ReactNode;
}

export function Button({
    variant = "primary",
    loading = false,
    icon,
    children,
    className = "",
    disabled,
    ...props
}: ButtonProps) {
    const base =
        "h-12 px-6 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide transition-opacity disabled:opacity-50";

    const variants: Record<string, string> = {
        primary:
            "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90",
        secondary:
            "border-2 border-[var(--border)] hover:opacity-70",
        danger:
            "border-2 border-red-500 text-red-500 hover:opacity-70",
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {icon}
            {loading ? "Loading..." : children}
        </button>
    );
}
