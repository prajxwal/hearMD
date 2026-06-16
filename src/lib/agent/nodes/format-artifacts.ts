/**
 * formatArtifacts node — Pure data transforms (no LLM) that convert
 * consultation data into pharmacy-ready prescription and lab order formats.
 *
 * F4: Prescription Formatter — medication list → structured pharmacy format
 * F5: Lab Order Sheet — investigations list → structured lab order format
 */

import type { AgentGraphState } from "../state";
import type { FormattedPrescription, LabOrderItem } from "../types";

// ── Common fasting tests lookup ─────────────────────────────

const FASTING_TESTS = new Set([
    "fbs", "fasting blood sugar", "fasting glucose",
    "fasting blood glucose", "lipid profile", "lipid panel",
    "cholesterol", "triglycerides", "hdl", "ldl", "vldl",
    "fasting insulin", "glucose tolerance", "gtt", "ogtt",
]);

/**
 * Determine if a test likely requires fasting.
 */
function requiresFasting(testName: string): boolean {
    const lower = testName.toLowerCase().trim();
    return Array.from(FASTING_TESTS).some((t) => lower.includes(t));
}

/**
 * Determine priority based on common urgent test patterns.
 */
function determinePriority(testName: string): "routine" | "urgent" {
    const lower = testName.toLowerCase();
    const urgentKeywords = [
        "urgent", "stat", "emergency", "immediate",
        "troponin", "d-dimer", "blood culture",
    ];
    return urgentKeywords.some((k) => lower.includes(k)) ? "urgent" : "routine";
}

/**
 * Convert morning/noon/night dosage into a human-readable frequency.
 */
function formatFrequency(morning: string, noon: string, night: string): string {
    const m = parseInt(morning) || 0;
    const n = parseInt(noon) || 0;
    const ni = parseInt(night) || 0;
    const total = m + n + ni;

    if (total === 0) return "As directed";

    const parts: string[] = [];
    if (m) parts.push(`${m} morning`);
    if (n) parts.push(`${n} noon`);
    if (ni) parts.push(`${ni} night`);

    const dosageStr = `${m}-${n}-${ni}`;

    if (total === 1) return `${dosageStr} (Once daily)`;
    if (total === 2) return `${dosageStr} (Twice daily)`;
    if (total === 3) return `${dosageStr} (Thrice daily)`;
    return `${dosageStr} (${total} times daily)`;
}

// ── Node Implementation ─────────────────────────────────────

export async function formatArtifactsNode(
    state: AgentGraphState
): Promise<Partial<AgentGraphState>> {
    // ── F4: Prescription Formatter ──────────────────────────

    const formattedPrescription: FormattedPrescription[] = [];

    if (state.consultation?.prescription && Array.isArray(state.consultation.prescription)) {
        for (const med of state.consultation.prescription) {
            const morning = med.morning || "0";
            const noon = med.noon || "0";
            const night = med.night || "0";

            formattedPrescription.push({
                drugName: med.name || "Unknown",
                dosage: extractDosage(med.name || ""),
                frequency: formatFrequency(morning, noon, night),
                duration: med.duration || "As directed",
                route: "Oral", // Default for OPD
                specialInstructions: med.timing || "After Food",
            });
        }
    }

    // ── F5: Lab Order Sheet ─────────────────────────────────

    const labOrderSheet: LabOrderItem[] = [];

    if (state.consultation?.investigations && Array.isArray(state.consultation.investigations)) {
        for (const investigation of state.consultation.investigations) {
            if (!investigation || typeof investigation !== "string") continue;

            labOrderSheet.push({
                testName: investigation.trim(),
                priority: determinePriority(investigation),
                fastingRequired: requiresFasting(investigation),
                specialInstructions: requiresFasting(investigation)
                    ? "Patient should fast for 8-12 hours before sample collection"
                    : "",
            });
        }
    }

    return {
        formattedPrescription,
        labOrderSheet,
    };
}

/**
 * Attempt to extract dosage from a drug name string like "Paracetamol 500mg".
 */
function extractDosage(drugName: string): string {
    const match = drugName.match(/(\d+\s*(?:mg|ml|mcg|g|iu|units?))/i);
    return match ? match[1].trim() : "As prescribed";
}
