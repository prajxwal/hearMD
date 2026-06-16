/**
 * escalation node — Uses LangGraph interrupt() to pause the graph
 * when a major drug interaction is detected.
 *
 * The graph halts here until the doctor reviews the interaction
 * and resumes via the /api/agent/resume endpoint with a Command.
 */

import { interrupt } from "@langchain/langgraph";
import type { AgentGraphState } from "../state";

export async function escalationNode(
    state: AgentGraphState
): Promise<Partial<AgentGraphState>> {
    const majorInteractions = state.drugInteractions.filter(
        (i) => i.severity === "major"
    );

    // Pause the graph — this value is surfaced to the caller
    // and the graph will not proceed until resumed via Command({ resume: ... })
    const doctorResponse = interrupt({
        type: "major_drug_interaction",
        interactions: majorInteractions.map((i) => ({
            drug1: i.drug1,
            drug2: i.drug2,
            description: i.description,
        })),
        message: `⚠️ ${majorInteractions.length} major drug interaction(s) detected. Review required before finalizing artifacts.`,
    });

    // This code runs AFTER the doctor resumes the graph
    return {
        escalationAcknowledged: doctorResponse === "acknowledged" || doctorResponse === "override",
    };
}
