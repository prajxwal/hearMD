/**
 * LangGraph StateGraph definition for the hearMD Post-Consultation Agent.
 *
 * Graph topology:
 *   START → fetchContext → [drugInteractionCheck, noteCompletenessCheck, referralDetection] (parallel)
 *         → assembleOutput → (escalation?) → formatArtifacts → END
 *
 * Uses PostgresSaver checkpointer for durable HITL on serverless (Vercel).
 */

import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

import type {
    DrugInteractionResult,
    CompletenessResult,
    ReferralResult,
    FormattedPrescription,
    LabOrderItem,
} from "./types";

import { fetchContextNode } from "./nodes/fetch-context";
import { drugInteractionCheckNode } from "./nodes/drug-interaction-check";
import { noteCompletenessCheckNode } from "./nodes/note-completeness-check";
import { referralDetectionNode } from "./nodes/referral-detection";
import { assembleOutputNode } from "./nodes/assemble-output";
import { escalationNode } from "./nodes/escalation";
import { formatArtifactsNode } from "./nodes/format-artifacts";

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
            // If next is a fresh array from the node, use it; otherwise merge
            if (prev.length === 0) return next;
            if (next.length === 0) return prev;
            return [...next]; // Latest wins for this node
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

// ── Conditional Edge: should escalate? ──────────────────────

function shouldEscalate(state: AgentGraphState): string[] {
    if (state.escalation) {
        return ["escalationNode"];
    }
    return ["formatArtifacts"];
}

// ── Graph Builder ───────────────────────────────────────────

const graph = new StateGraph(AgentStateAnnotation)
    // Nodes
    .addNode("fetchContext", fetchContextNode)
    .addNode("drugInteractionCheck", drugInteractionCheckNode)
    .addNode("noteCompletenessCheck", noteCompletenessCheckNode)
    .addNode("referralDetection", referralDetectionNode)
    .addNode("assembleOutput", assembleOutputNode)
    .addNode("escalationNode", escalationNode)
    .addNode("formatArtifacts", formatArtifactsNode)

    // Edges: START → fetchContext
    .addEdge(START, "fetchContext")

    // Fan-out: fetchContext → 3 parallel nodes
    .addConditionalEdges("fetchContext", (_state: AgentGraphState) => [
        "drugInteractionCheck",
        "noteCompletenessCheck",
        "referralDetection",
    ])

    // Fan-in: all 3 parallel nodes → assembleOutput
    .addEdge("drugInteractionCheck", "assembleOutput")
    .addEdge("noteCompletenessCheck", "assembleOutput")
    .addEdge("referralDetection", "assembleOutput")

    // Conditional: assembleOutput → escalation OR formatArtifacts
    .addConditionalEdges("assembleOutput", shouldEscalate)

    // escalationNode → formatArtifacts (after doctor resumes)
    .addEdge("escalationNode", "formatArtifacts")

    // formatArtifacts → END
    .addEdge("formatArtifacts", END);

// ── Compile with Postgres Checkpointer ──────────────────────

let _compiledGraph: ReturnType<typeof graph.compile> | null = null;

/**
 * Get the compiled agent graph with PostgresSaver checkpointer.
 * Uses lazy initialization to avoid connecting to Postgres at import time.
 */
export async function getAgentGraph() {
    if (_compiledGraph) return _compiledGraph;

    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
        const checkpointer = PostgresSaver.fromConnString(databaseUrl);
        await checkpointer.setup(); // Creates langgraph_checkpoints table if needed
        _compiledGraph = graph.compile({ checkpointer });
    } else {
        // Fallback: compile without checkpointer (HITL won't persist across requests)
        console.warn(
            "DATABASE_URL not set — agent compiled without checkpointer. HITL escalation will not work across serverless invocations."
        );
        _compiledGraph = graph.compile();
    }

    return _compiledGraph;
}
