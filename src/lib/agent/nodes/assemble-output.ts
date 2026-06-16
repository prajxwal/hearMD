/**
 * assembleOutput node — Fan-in node that receives merged results from
 * the parallel drug interaction, completeness, and referral detection nodes.
 *
 * Determines if escalation is needed based on major drug interactions.
 */

import type { AgentGraphState } from "../state";

export async function assembleOutputNode(
    state: AgentGraphState
): Promise<Partial<AgentGraphState>> {
    // Check if any drug interaction has "major" severity
    const hasMajorInteraction = state.drugInteractions.some(
        (interaction) => interaction.severity === "major"
    );

    return {
        escalation: hasMajorInteraction,
    };
}
