/**
 * LangGraph StateGraph definition for the hearMD Post-Consultation Agent.
 *
 * Graph topology:
 *   START → fetchContext → [drugInteractionCheck, noteCompletenessCheck, referralDetection] (parallel)
 *         → assembleOutput → (escalation?) → formatArtifacts → END
 *
 * Uses PostgresSaver checkpointer for durable HITL on serverless (Vercel).
 */

import { StateGraph, START, END } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

import { AgentStateAnnotation, type AgentGraphState } from "./state";

import { fetchContextNode } from "./nodes/fetch-context";
import { drugInteractionCheckNode } from "./nodes/drug-interaction-check";
import { noteCompletenessCheckNode } from "./nodes/note-completeness-check";
import { referralDetectionNode } from "./nodes/referral-detection";
import { assembleOutputNode } from "./nodes/assemble-output";
import { escalationNode } from "./nodes/escalation";
import { formatArtifactsNode } from "./nodes/format-artifacts";

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
