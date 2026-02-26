"use client";

import React from "react";

/**
 * Base skeleton pulse block — the building primitive for all skeleton loaders.
 *
 * Uses a CSS animation that pulses between the surface and border colors to
 * feel natural in both light and dark themes.
 */
export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div
            className={`animate-pulse bg-[var(--surface)] rounded ${className}`}
            style={{ minHeight: "1rem" }}
        />
    );
}

/** Full-width skeleton line at a specific height. */
export function SkeletonLine({
    width = "100%",
    height = "1rem",
}: {
    width?: string;
    height?: string;
}) {
    return (
        <div
            className="animate-pulse bg-[var(--surface)] rounded"
            style={{ width, height }}
        />
    );
}

/** Repeated skeleton lines to simulate a block of text. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
                />
            ))}
        </div>
    );
}

// ── Page-specific skeletons ──────────────────────────────────

/** Dashboard page skeleton: header, 2 action buttons, 4 stat cards, 5 patients. */
export function DashboardSkeleton() {
    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
                <Skeleton className="h-4 w-28" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
                <Skeleton className="h-4 w-20" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-6 border-2 border-[var(--border)] space-y-4">
                            <Skeleton className="h-5 w-5" />
                            <div className="space-y-2">
                                <Skeleton className="h-9 w-16" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Patients */}
            <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <div className="border-2 border-[var(--border)] divide-y-2 divide-[var(--border)]">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-36" />
                                <Skeleton className="h-3 w-52" />
                            </div>
                            <Skeleton className="h-4 w-4" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Consultations / Patients list skeleton: header, search bar, list items. */
export function ListSkeleton({ items = 6 }: { items?: number }) {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-44" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-12 w-44" />
            </div>

            {/* Search */}
            <Skeleton className="h-12 w-full" />

            {/* List */}
            <div className="border-2 border-[var(--border)] divide-y-2 divide-[var(--border)]">
                {Array.from({ length: items }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-3 w-72" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-4 w-4" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Consultation detail skeleton: header card, clinical notes card, prescription, instructions. */
export function ConsultationDetailSkeleton() {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Back */}
            <Skeleton className="h-5 w-40" />

            {/* Header Card */}
            <div className="border-2 border-[var(--border)] p-6 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-52" />
                        <Skeleton className="h-4 w-36" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-20" />
                    </div>
                </div>
                {/* Patient info */}
                <div className="flex items-center gap-3 p-3 border-2 border-[var(--border)]">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                </div>
            </div>

            {/* Clinical Notes */}
            <div className="border-2 border-[var(--border)] p-6 space-y-6">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>

            {/* Prescription */}
            <div className="border-2 border-[var(--border)] p-6 space-y-4">
                <Skeleton className="h-6 w-28" />
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="p-4 border-2 border-[var(--border)] space-y-3">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-32" />
                            <div className="flex gap-4">
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Patient detail skeleton: back button, patient card with details, consultation history. */
export function PatientDetailSkeleton() {
    return (
        <div className="space-y-8">
            <Skeleton className="h-5 w-36" />

            {/* Patient Card */}
            <div className="border-2 border-[var(--border)] p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-44" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-10 w-36" />
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t-2 border-[var(--border)]">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    ))}
                </div>
                <Skeleton className="h-3 w-40" />
            </div>

            {/* Consultation History */}
            <div className="space-y-4">
                <Skeleton className="h-4 w-44" />
                <div className="border-2 border-[var(--border)] divide-y-2 divide-[var(--border)]">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-52" />
                                <Skeleton className="h-3 w-36" />
                                <Skeleton className="h-3 w-44" />
                            </div>
                            <Skeleton className="h-6 w-20" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Settings page skeleton: header, toggle, form fields, save button. */
export function SettingsSkeleton() {
    return (
        <div className="max-w-2xl space-y-12">
            <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Appearance */}
            <div className="space-y-6">
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center justify-between p-4 border-2 border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-14 rounded-full" />
                </div>
            </div>

            {/* Profile fields */}
            <div className="space-y-6">
                <Skeleton className="h-4 w-36" />
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Clinic */}
            <div className="space-y-6">
                <Skeleton className="h-4 w-32" />
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            </div>

            <Skeleton className="h-14 w-full" />
        </div>
    );
}
