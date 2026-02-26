import { NextResponse } from "next/server";
import { resolveAlias, cleanDrugName } from "@/lib/medications";

interface MedicationResult {
    name: string;
    rxcui: string;
}

/**
 * GET /api/medications?q=parace
 *
 * Proxies RxNorm API with Indian alias resolution and name cleanup.
 * Returns clean, doctor-friendly medication names.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        // Resolve Indian alias to RxNorm-compatible name
        const resolved = resolveAlias(query);

        // Fetch from RxNorm approximateTerm (fuzzy matching)
        const approxUrl = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(resolved)}&maxEntries=15`;

        // Also try the drugs endpoint for exact concept matches
        const drugsUrl = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(resolved)}`;

        const [approxRes, drugsRes] = await Promise.all([
            fetch(approxUrl, { next: { revalidate: 3600 } }), // Cache for 1h
            fetch(drugsUrl, { next: { revalidate: 3600 } }),
        ]);

        const results: MedicationResult[] = [];
        const seen = new Set<string>();

        // Parse approximate term results
        if (approxRes.ok) {
            const approxData = await approxRes.json();
            const candidates = approxData?.approximateGroup?.candidate || [];

            for (const candidate of candidates) {
                if (candidate.name) {
                    const cleaned = cleanDrugName(candidate.name);
                    if (cleaned && !seen.has(cleaned.toLowerCase())) {
                        seen.add(cleaned.toLowerCase());
                        results.push({ name: cleaned, rxcui: candidate.rxcui });
                    }
                }
            }
        }

        // Parse drugs endpoint — get SCD (generic) entries only
        if (drugsRes.ok) {
            const drugsData = await drugsRes.json();
            const groups = drugsData?.drugGroup?.conceptGroup || [];

            for (const group of groups) {
                // SCD = Semantic Clinical Drug (generic), SBD = branded
                if (group.tty !== "SCD" && group.tty !== "SBD") continue;

                const concepts = group.conceptProperties || [];
                for (const concept of concepts.slice(0, 20)) { // Limit per group
                    const cleaned = cleanDrugName(concept.name);
                    if (cleaned && !seen.has(cleaned.toLowerCase())) {
                        seen.add(cleaned.toLowerCase());
                        results.push({ name: cleaned, rxcui: concept.rxcui });
                    }
                }
            }
        }

        // Sort: shorter names first (more relevant), limit to 10
        results.sort((a, b) => a.name.length - b.name.length);

        return NextResponse.json(results.slice(0, 10));
    } catch (error) {
        console.error("Medication search error:", error);
        return NextResponse.json([], { status: 500 });
    }
}
