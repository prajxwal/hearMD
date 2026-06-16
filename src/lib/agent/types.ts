/**
 * Type definitions for the hearMD Post-Consultation Agent.
 *
 * These types define the structured output of each LangGraph node
 * and the aggregate AgentOutput stored in the consultation record.
 */

// ── Drug Interaction Types ──────────────────────────────────

export type InteractionSeverity = "major" | "moderate" | "minor";

export interface DrugInteractionResult {
    /** First drug in the interacting pair */
    drug1: string;
    /** Second drug in the interacting pair */
    drug2: string;
    /** Severity classification */
    severity: InteractionSeverity;
    /** Human-readable description of the interaction */
    description: string;
}

// ── Note Completeness Types ─────────────────────────────────

export interface MissingField {
    /** Name of the missing or incomplete field */
    field: string;
    /** Whether the field is strictly required or just recommended */
    severity: "required" | "recommended";
    /** Suggestion for what should be added */
    suggestion: string;
}

export interface CompletenessResult {
    /** List of missing or ambiguous fields */
    missingFields: MissingField[];
    /** Whether the note passes the completeness check */
    overallComplete: boolean;
}

// ── Referral Types ──────────────────────────────────────────

export interface ReferralResult {
    /** Whether a specialist referral was detected */
    detected: boolean;
    /** Type of specialist (e.g. "Cardiologist", "Orthopedic") */
    specialist?: string;
    /** Urgency level */
    urgency?: "routine" | "urgent" | "emergency";
    /** Full formatted referral letter */
    referralLetter?: string;
}

// ── Formatted Prescription ──────────────────────────────────

export interface FormattedPrescription {
    /** Drug name with strength (e.g. "Paracetamol 500mg") */
    drugName: string;
    /** Dosage string (e.g. "500mg") */
    dosage: string;
    /** Frequency string (e.g. "1-0-1" or "Twice daily") */
    frequency: string;
    /** Duration (e.g. "5 days") */
    duration: string;
    /** Route of administration */
    route: string;
    /** Any special instructions (e.g. "Take with milk") */
    specialInstructions: string;
}

// ── Lab Order Types ─────────────────────────────────────────

export interface LabOrderItem {
    /** Test name (e.g. "CBC", "Fasting Blood Sugar") */
    testName: string;
    /** Priority level */
    priority: "routine" | "urgent";
    /** Whether fasting is required */
    fastingRequired: boolean;
    /** Special instructions for the test */
    specialInstructions: string;
}

// ── Aggregate Agent Output ──────────────────────────────────

export interface AgentOutput {
    /** Agent run status */
    status: "running" | "completed" | "escalated" | "error";
    /** Timestamp of the agent run */
    runAt: string;

    /** Drug interaction check results */
    drugInteractions: DrugInteractionResult[];
    /** Note completeness check results */
    completenessResult: CompletenessResult | null;
    /** Referral detection results */
    referralResult: ReferralResult | null;

    /** Formatted pharmacy-ready prescription */
    formattedPrescription: FormattedPrescription[];
    /** Formatted lab order sheet */
    labOrderSheet: LabOrderItem[];

    /** Whether escalation was triggered (major drug interaction) */
    escalation: boolean;
    /** Whether the doctor acknowledged the escalation */
    escalationAcknowledged: boolean;

    /** Error message if the agent failed */
    error?: string;
}
