"use client";

import { getStatusStyle } from "@/lib/types";

export function StatusBadge({ status }: { status: string }) {
    return (
        <span
            className={`px-3 py-1 text-xs font-bold uppercase ${getStatusStyle(status)}`}
        >
            {status}
        </span>
    );
}
