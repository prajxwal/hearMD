/**
 * noteCompletenessCheck node — Uses LLM (ChatGroq) to validate
 * the structured note against a clinical completeness checklist.
 *
 * Checks: chief complaint, examination findings, diagnosis,
 * medication with dosage, follow-up date, and instructions.
 */

import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import type { AgentGraphState } from "../graph";
import type { CompletenessResult } from "../types";

// Zod schema for structured LLM output
const CompletenessSchema = z.object({
    missingFields: z.array(
        z.object({
            field: z.string().describe("Name of the missing or incomplete field"),
            severity: z
                .enum(["required", "recommended"])
                .describe("Whether the field is strictly required or just recommended"),
            suggestion: z.string().describe("Specific suggestion for what should be added"),
        })
    ).describe("List of missing, incomplete, or ambiguous fields found in the clinical note"),
    overallComplete: z
        .boolean()
        .describe("True if the note has all required fields filled adequately"),
});

const COMPLETENESS_PROMPT = `You are a clinical documentation quality reviewer for an Indian OPD (outpatient department) setting.

You will receive a structured clinical note from a doctor-patient consultation. Your job is to check the note against a completeness checklist and identify any missing, incomplete, or ambiguous fields.

CHECKLIST (check each field):
1. Chief Complaint — Must be present and specific (not vague). REQUIRED.
2. History of Present Illness — Should have at least one relevant entry. REQUIRED.
3. Examination Findings — Should be present if the consultation is completed. RECOMMENDED.
4. Diagnosis — Must be present and explicit (not "pending"). REQUIRED.
5. Medication with Dosage — Each prescribed medication should have name, dosage schedule, and duration. REQUIRED if medications are prescribed.
6. Follow-up Date or Instructions — Should mention when to return or follow-up. RECOMMENDED.
7. Instructions/Advice — Should be present if medications are prescribed. RECOMMENDED.

RULES:
- Mark a field as "required" severity if it is clinically essential and missing.
- Mark a field as "recommended" severity if it would improve the note but is not critical.
- Be specific in suggestions — say exactly what is missing, not generic advice.
- If everything is adequate, return an empty missingFields array and overallComplete: true.
- Do NOT flag fields that are genuinely not applicable (e.g., no medications prescribed → don't flag medication dosage).`;

export async function noteCompletenessCheckNode(
    state: AgentGraphState
): Promise<Partial<AgentGraphState>> {
    const consultation = state.consultation;

    if (!consultation) {
        return {
            completenessResult: {
                missingFields: [{ field: "consultation", severity: "required", suggestion: "No consultation data available" }],
                overallComplete: false,
            },
        };
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return {
            completenessResult: {
                missingFields: [],
                overallComplete: true, // Don't block if LLM is unavailable
            },
        };
    }

    try {
        const llm = new ChatGroq({
            apiKey,
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
        });

        const structuredLlm = llm.withStructuredOutput(CompletenessSchema);

        // Build the note summary to evaluate
        const noteContent = `
CLINICAL NOTE TO EVALUATE:

Chief Complaint: ${consultation.chief_complaint || "(empty)"}

History of Present Illness: ${
            Array.isArray(consultation.history_of_present_illness) && consultation.history_of_present_illness.length > 0
                ? consultation.history_of_present_illness.join("; ")
                : "(empty)"
        }

Past Medical History: ${
            Array.isArray(consultation.past_medical_history) && consultation.past_medical_history.length > 0
                ? consultation.past_medical_history.join("; ")
                : "(none recorded)"
        }

Examination Findings: ${
            Array.isArray(consultation.examination) && consultation.examination.length > 0
                ? consultation.examination.join("; ")
                : "(empty)"
        }

Investigations Ordered: ${
            Array.isArray(consultation.investigations) && consultation.investigations.length > 0
                ? consultation.investigations.join("; ")
                : "(none)"
        }

Diagnosis: ${consultation.diagnosis || "(empty)"}

Prescription: ${
            Array.isArray(consultation.prescription) && consultation.prescription.length > 0
                ? consultation.prescription
                      .map(
                          (med: { name: string; morning?: string; noon?: string; night?: string; timing?: string; duration?: string }) =>
                              `${med.name} — ${med.morning || "0"}-${med.noon || "0"}-${med.night || "0"}, ${med.timing || "N/A"}, ${med.duration || "N/A"}`
                      )
                      .join("\n")
                : "(no medications prescribed)"
        }

Instructions / Advice: ${consultation.instructions || "(empty)"}`;

        const result = await structuredLlm.invoke([
            { role: "system", content: COMPLETENESS_PROMPT },
            { role: "user", content: noteContent },
        ]);

        return {
            completenessResult: result as CompletenessResult,
        };
    } catch (err) {
        console.error("Note completeness check failed:", err);
        return {
            completenessResult: {
                missingFields: [],
                overallComplete: true, // Don't block on LLM failure
            },
        };
    }
}
