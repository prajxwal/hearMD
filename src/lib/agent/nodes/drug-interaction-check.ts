/**
 * drugInteractionCheck node — Resolves medications to RxCUIs and checks
 * for interactions via the RxNav Interaction API.
 *
 * Flow:
 * 1. Extract medication names from the consultation prescription
 * 2. Resolve each name → RxCUI via RxNav findRxcuiByString
 * 3. Call RxNav /REST/interaction/list.json with all RxCUIs
 * 4. Parse and return interaction results with severity
 */

import { resolveAlias } from "@/lib/medications";
import type { AgentGraphState } from "../graph";
import type { DrugInteractionResult, InteractionSeverity } from "../types";

interface RxCuiMapping {
    name: string;
    rxcui: string | null;
}

/**
 * Resolve a single drug name to its RxCUI identifier.
 * Uses the existing Indian alias resolution before querying RxNav.
 */
async function resolveRxCui(drugName: string): Promise<RxCuiMapping> {
    try {
        // Resolve Indian brand names / aliases first
        const resolved = resolveAlias(drugName);

        // Try exact match first
        const exactUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(resolved)}&search=1`;
        const exactRes = await fetch(exactUrl);

        if (exactRes.ok) {
            const data = await exactRes.json();
            const rxcui = data?.idGroup?.rxnormId?.[0];
            if (rxcui) {
                return { name: drugName, rxcui };
            }
        }

        // Fall back to approximate match
        const approxUrl = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(resolved)}&maxEntries=1`;
        const approxRes = await fetch(approxUrl);

        if (approxRes.ok) {
            const data = await approxRes.json();
            const candidate = data?.approximateGroup?.candidate?.[0];
            if (candidate?.rxcui) {
                return { name: drugName, rxcui: candidate.rxcui };
            }
        }

        return { name: drugName, rxcui: null };
    } catch {
        return { name: drugName, rxcui: null };
    }
}

/**
 * Check interactions for a list of RxCUIs using the RxNav Interaction API.
 */
async function checkRxNavInteractions(
    rxcuis: string[],
    nameMap: Map<string, string>
): Promise<DrugInteractionResult[]> {
    if (rxcuis.length < 2) return [];

    const results: DrugInteractionResult[] = [];

    try {
        // Use the interaction list endpoint with all RxCUIs
        const url = `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxcuis.join("+")}`;
        const res = await fetch(url);

        if (!res.ok) return [];

        const data = await res.json();
        const interactionPairs =
            data?.fullInteractionTypeGroup?.[0]?.fullInteractionType || [];

        for (const interaction of interactionPairs) {
            const pairs = interaction?.interactionPair || [];
            for (const pair of pairs) {
                const concepts = pair?.interactionConcept || [];
                if (concepts.length < 2) continue;

                const drug1Rxcui = concepts[0]?.minConceptItem?.rxcui;
                const drug2Rxcui = concepts[1]?.minConceptItem?.rxcui;
                const description = pair?.description || "Interaction detected";
                const severityRaw = pair?.severity?.toLowerCase() || "";

                // Map severity string to our enum
                let severity: InteractionSeverity = "minor";
                if (
                    severityRaw.includes("high") ||
                    severityRaw.includes("major") ||
                    severityRaw.includes("contraindicated")
                ) {
                    severity = "major";
                } else if (
                    severityRaw.includes("moderate") ||
                    severityRaw.includes("significant")
                ) {
                    severity = "moderate";
                }

                const drug1Name =
                    nameMap.get(drug1Rxcui) ||
                    concepts[0]?.minConceptItem?.name ||
                    drug1Rxcui;
                const drug2Name =
                    nameMap.get(drug2Rxcui) ||
                    concepts[1]?.minConceptItem?.name ||
                    drug2Rxcui;

                results.push({
                    drug1: drug1Name,
                    drug2: drug2Name,
                    severity,
                    description,
                });
            }
        }
    } catch {
        // Fail gracefully — interaction check is advisory
    }

    return results;
}

export async function drugInteractionCheckNode(
    state: AgentGraphState
): Promise<Partial<AgentGraphState>> {
    const prescription = state.consultation?.prescription;

    if (!prescription || !Array.isArray(prescription) || prescription.length < 2) {
        // Need at least 2 medications to check interactions
        return { drugInteractions: [] };
    }

    // Step 1: Resolve all drug names → RxCUIs in parallel
    const mappings = await Promise.all(
        prescription.map((med: { name: string }) => resolveRxCui(med.name))
    );

    const resolved = mappings.filter((m): m is { name: string; rxcui: string } => m.rxcui !== null);

    if (resolved.length < 2) {
        return { drugInteractions: [] };
    }

    // Build a reverse map: rxcui → original drug name
    const nameMap = new Map<string, string>();
    for (const r of resolved) {
        nameMap.set(r.rxcui, r.name);
    }

    // Step 2: Check interactions
    const rxcuis = resolved.map((r) => r.rxcui);
    const interactions = await checkRxNavInteractions(rxcuis, nameMap);

    return { drugInteractions: interactions };
}
