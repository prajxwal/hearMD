/**
 * POST /api/agent/run   — Invoke the LangGraph post-consultation agent
 * POST /api/agent/resume — Resume from an escalation interrupt
 *
 * The agent runs after a consultation is completed, performing:
 * - Drug interaction checks (RxNav)
 * - Note completeness validation (LLM)
 * - Referral detection + letter generation (LLM)
 * - Prescription formatting + lab order sheet (data transforms)
 */

import { NextResponse } from "next/server";
import { Command } from "@langchain/langgraph";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { getAgentGraph } from "@/lib/agent/graph";
import type { AgentOutput } from "@/lib/agent/types";

/**
 * POST /api/agent/run
 *
 * Body: { consultationId: string }
 * Returns: AgentOutput
 */
export async function POST(request: Request) {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request
    let consultationId: string;
    let action: string | undefined;
    let threadId: string | undefined;

    try {
        const body = await request.json();
        consultationId = body.consultationId;
        action = body.action; // "acknowledge" or "override" for resume
        threadId = body.threadId; // Required for resume
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!consultationId) {
        return NextResponse.json({ error: "consultationId is required" }, { status: 400 });
    }

    try {
        const agentGraph = await getAgentGraph();
        const runThreadId = threadId || `agent-${consultationId}-${Date.now()}`;

        // Supabase client with service role for writing agent output
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: "Server not configured" }, { status: 503 });
        }

        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

        // If this is a resume from escalation
        if (action && threadId) {
            const resumeResult = await agentGraph.invoke(
                new Command({ resume: action }),
                { configurable: { thread_id: threadId } }
            );

            const agentOutput = stateToAgentOutput(resumeResult, "completed");

            // Store output in DB
            await adminSupabase
                .from("consultations")
                .update({
                    agent_output: agentOutput,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", consultationId);

            return NextResponse.json(agentOutput);
        }

        // Fresh agent run
        // Store thread ID on consultation for potential resume later
        await adminSupabase
            .from("consultations")
            .update({
                agent_thread_id: runThreadId,
                agent_output: { status: "running", runAt: new Date().toISOString() },
                updated_at: new Date().toISOString(),
            })
            .eq("id", consultationId);

        let result;
        try {
            result = await agentGraph.invoke(
                { consultationId },
                { configurable: { thread_id: runThreadId } }
            );
        } catch (err: unknown) {
            // Check if this is a GraphInterrupt (escalation)
            const errorName = err instanceof Error ? err.constructor.name : "";
            if (errorName === "GraphInterrupt" || (err instanceof Error && err.message?.includes("interrupt"))) {
                // Graph was interrupted — escalation triggered
                const escalatedOutput: AgentOutput = {
                    status: "escalated",
                    runAt: new Date().toISOString(),
                    drugInteractions: [],
                    completenessResult: null,
                    referralResult: null,
                    formattedPrescription: [],
                    labOrderSheet: [],
                    escalation: true,
                    escalationAcknowledged: false,
                };

                // Try to get partial state from the checkpointer
                try {
                    const graphState = await agentGraph.getState({
                        configurable: { thread_id: runThreadId },
                    });
                    if (graphState?.values) {
                        escalatedOutput.drugInteractions = graphState.values.drugInteractions || [];
                        escalatedOutput.completenessResult = graphState.values.completenessResult || null;
                        escalatedOutput.referralResult = graphState.values.referralResult || null;
                    }
                } catch {
                    // Partial state retrieval failed — continue with empty
                }

                await adminSupabase
                    .from("consultations")
                    .update({
                        agent_output: escalatedOutput,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", consultationId);

                return NextResponse.json(escalatedOutput);
            }

            // Re-throw non-interrupt errors
            throw err;
        }

        // Successful completion — no escalation
        const agentOutput = stateToAgentOutput(result, "completed");

        // Store output in DB
        await adminSupabase
            .from("consultations")
            .update({
                agent_output: agentOutput,
                updated_at: new Date().toISOString(),
            })
            .eq("id", consultationId);

        return NextResponse.json(agentOutput);
    } catch (err) {
        console.error("Agent run error:", err);
        const errorMessage = err instanceof Error ? err.message : "Agent execution failed";

        return NextResponse.json(
            {
                status: "error",
                error: errorMessage,
                runAt: new Date().toISOString(),
                drugInteractions: [],
                completenessResult: null,
                referralResult: null,
                formattedPrescription: [],
                labOrderSheet: [],
                escalation: false,
                escalationAcknowledged: false,
            } as AgentOutput,
            { status: 500 }
        );
    }
}

/**
 * Convert the LangGraph state to a serializable AgentOutput.
 */
function stateToAgentOutput(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state: Record<string, any>,
    status: AgentOutput["status"]
): AgentOutput {
    return {
        status,
        runAt: new Date().toISOString(),
        drugInteractions: state.drugInteractions || [],
        completenessResult: state.completenessResult || null,
        referralResult: state.referralResult || null,
        formattedPrescription: state.formattedPrescription || [],
        labOrderSheet: state.labOrderSheet || [],
        escalation: state.escalation || false,
        escalationAcknowledged: state.escalationAcknowledged || false,
        error: state.error || undefined,
    };
}
