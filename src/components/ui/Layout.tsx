"use client";

import React from "react";

export function Card({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`border-2 border-[var(--border)] p-6 ${className}`}>
            {children}
        </div>
    );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            {children}
        </h2>
    );
}

export function PageHeader({
    title,
    subtitle,
    actions,
}: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {subtitle && (
                    <p className="text-sm text-[var(--muted)]">{subtitle}</p>
                )}
            </div>
            {actions}
        </div>
    );
}

export function EmptyState({ message }: { message: string }) {
    return (
        <div className="p-6 text-center text-[var(--muted)]">{message}</div>
    );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="p-6 text-center text-[var(--muted)]">{message}</div>
    );
}
