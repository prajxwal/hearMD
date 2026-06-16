/**
 * LangGraph Agent State schema definition.
 *
 * Extracted into its own file to avoid circular dependencies between
 * graph.ts (which imports nodes) and node files (which need the state type).
 */

import { Annotation } from "@langchain/langgraph";

import type {
    DrugInteractionResult,
    CompletenessResult,
    ReferralResult,
    FormattedPrescription,
    LabOrderItem,
} from "./types";

// ── State Schema ────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
export const AgentStateAnnotation = Annotation.Root({
    // Input
    consultationId: Annotation<string>,

    // Context (set by fetchContext)
    consultation: Annotation<any>({
        reducer: (_prev: any, next: any) => next ?? _prev,
        default: () => null,
    }),
    patientHistory: Annotation<any[]>({
        reducer: (_prev: any[], next: any[]) => next ?? _prev,
        default: () => [],
    }),

    // Parallel node outputs — reducers to handle fan-in merge
    drugInteractions: Annotation<DrugInteractionResult[]>({
        reducer: (prev: DrugInteractionResult[], next: DrugInteractionResult[]) => {
            if (prev.length === 0) return next;
            if (next.length === 0) return prev;
            return [...next];
        },
        default: () => [],
    }),
    completenessResult: Annotation<CompletenessResult | null>({
        reducer: (_prev: CompletenessResult | null, next: CompletenessResult | null) =>
            next ?? _prev,
        default: () => null,
    }),
    referralResult: Annotation<ReferralResult | null>({
        reducer: (_prev: ReferralResult | null, next: ReferralResult | null) =>
            next ?? _prev,
        default: () => null,
    }),

    // Formatted outputs (set by formatArtifacts)
    formattedPrescription: Annotation<FormattedPrescription[]>({
        reducer: (_prev: FormattedPrescription[], next: FormattedPrescription[]) =>
            next ?? _prev,
        default: () => [],
    }),
    labOrderSheet: Annotation<LabOrderItem[]>({
        reducer: (_prev: LabOrderItem[], next: LabOrderItem[]) => next ?? _prev,
        default: () => [],
    }),

    // Escalation
    escalation: Annotation<boolean>({
        reducer: (_prev: boolean, next: boolean) => next ?? _prev,
        default: () => false,
    }),
    escalationAcknowledged: Annotation<boolean>({
        reducer: (_prev: boolean, next: boolean) => next ?? _prev,
        default: () => false,
    }),

    // Error
    error: Annotation<string | null>({
        reducer: (_prev: string | null, next: string | null) => next ?? _prev,
        default: () => null,
    }),
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export type AgentGraphState = typeof AgentStateAnnotation.State;
