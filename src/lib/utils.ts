import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Format a date as a relative string ("Today", "Yesterday", "3 days ago")
 * or fall back to locale date for older dates.
 */
export function formatRelativeDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
}

/**
 * Format a date string as "23 Feb 2026" (short date, no time).
 */
export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * Format a date string as "23 Feb 2026, 08:30 PM" (date + time).
 */
export function formatDateTime(date: string): string {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Generate the next sequential patient number (P-0001, P-0002, ...).
 *
 * Queries the latest patient_number and increments. This is NOT fully
 * race-condition-proof without a DB sequence, but it uses ordering by
 * patient_number descending to be more reliable than ordering by created_at,
 * which can produce duplicates under concurrent inserts.
 */
export async function generatePatientNumber(supabase: SupabaseClient): Promise<string> {
    const { data: lastPatient } = await supabase
        .from("patients")
        .select("patient_number")
        .not("patient_number", "is", null)
        .order("patient_number", { ascending: false })
        .limit(1)
        .single();

    const nextNum = lastPatient?.patient_number
        ? parseInt(lastPatient.patient_number.replace("P-", "")) + 1
        : 1;

    return `P-${nextNum.toString().padStart(4, "0")}`;
}
