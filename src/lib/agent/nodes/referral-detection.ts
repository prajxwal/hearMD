/**
 * referralDetection node — Uses LLM (ChatGroq) to detect if a
 * specialist referral is mentioned in the consultation, and if so,
 * generates a structured referral letter.
 *
 * Scans: diagnosis, plan/instructions, and examination findings
 * for any mention of referral to another specialist.
 */

import { ChatGroq } from "@langchain/groq";
import { z } from "zod";
import type { AgentGraphState } from "../state";
import type { ReferralResult } from "../types";

const ReferralSchema = z.object({
    detected: z
        .boolean()
        .describe("Whether a specialist referral is mentioned anywhere in the note"),
    specialist: z
        .string()
        .optional()
        .describe("Type of specialist being referred to (e.g. Cardiologist, Orthopedic Surgeon)"),
    urgency: z
        .enum(["routine", "urgent", "emergency"])
        .optional()
        .describe("Urgency level of the referral based on clinical context"),
    referralLetter: z
        .string()
        .optional()
        .describe("A complete, professionally formatted referral letter ready to print"),
});

const REFERRAL_PROMPT = `You are a clinical documentation assistant for an Indian OPD setting.

You will receive a structured clinical note and the patient's past consultation history.

TASK:
1. Check if a specialist referral is mentioned ANYWHERE in the note — in the diagnosis, instructions/advice, examination findings, or investigations.
2. If a referral IS detected:
   - Identify the specialist type
   - Determine urgency (routine / urgent / emergency) based on clinical context
   - Generate a complete referral letter

REFERRAL LETTER FORMAT (if detected):
- Date
- "To: The [Specialist Type]"
- "Re: Referral of [Patient Name], [Age]/[Gender]"
- Patient ID
- Presenting Complaint (from chief complaint)
- Brief History (from HPI and past medical history)
- Relevant Examination Findings
- Investigations Done / Ordered
- Current Diagnosis
- Reason for Referral
- Current Medications (if any)
- Urgency note
- "From: Dr. [Referring Doctor Name], [Specialization]"

RULES:
- Only detect a referral if explicitly mentioned. Do NOT infer one.
- Keywords to look for: "refer", "referral", "consult with", "opinion from", "specialist", specific specialist names
- If no referral is detected, return detected: false with no other fields.
- The referral letter should be professional, concise, and ready to print.
- Use the patient's history context to enrich the letter.`;

export async function referralDetectionNode(
    state: AgentGraphState
): Promise<Partial<AgentGraphState>> {
    const consultation = state.consultation;

    if (!consultation) {
        return { referralResult: { detected: false } };
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return { referralResult: { detected: false } };
    }

    try {
        const llm = new ChatGroq({
            apiKey,
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
        });

        const structuredLlm = llm.withStructuredOutput(ReferralSchema);

        // Build context from consultation + patient history
        const patientInfo = consultation.patient
            ? `Patient: ${consultation.patient.name}, ${consultation.patient.age}/${consultation.patient.gender}, ID: ${consultation.patient.patient_number}`
            : "Patient: Unknown";

        const doctorInfo = consultation.doctor
            ? `Referring Doctor: Dr. ${consultation.doctor.full_name}, ${consultation.doctor.specialization}`
            : "Referring Doctor: Unknown";

        // Past consultation history for context
        const historyContext =
            state.patientHistory && state.patientHistory.length > 0
                ? state.patientHistory
                      .slice(0, 5) // Last 5 consultations
                      .map(
                          (h: { created_at: string; chief_complaint?: string | null; diagnosis?: string | null }) =>
                              `- ${new Date(h.created_at).toLocaleDateString("en-IN")}: ${h.chief_complaint || "N/A"} → ${h.diagnosis || "N/A"}`
                      )
                      .join("\n")
                : "No past consultations on record.";

        const noteContent = `
${patientInfo}
${doctorInfo}
Date: ${new Date(consultation.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}

Chief Complaint: ${consultation.chief_complaint || "(empty)"}

History of Present Illness: ${
            Array.isArray(consultation.history_of_present_illness) && consultation.history_of_present_illness.length > 0
                ? consultation.history_of_present_illness.join("; ")
                : "(empty)"
        }

Past Medical History: ${
            Array.isArray(consultation.past_medical_history) && consultation.past_medical_history.length > 0
                ? consultation.past_medical_history.join("; ")
                : "(none)"
        }

Examination Findings: ${
            Array.isArray(consultation.examination) && consultation.examination.length > 0
                ? consultation.examination.join("; ")
                : "(empty)"
        }

Investigations: ${
            Array.isArray(consultation.investigations) && consultation.investigations.length > 0
                ? consultation.investigations.join("; ")
                : "(none)"
        }

Diagnosis: ${consultation.diagnosis || "(empty)"}

Current Medications: ${
            Array.isArray(consultation.prescription) && consultation.prescription.length > 0
                ? consultation.prescription
                      .map((med: { name: string }) => med.name)
                      .join(", ")
                : "(none)"
        }

Instructions / Advice: ${consultation.instructions || "(empty)"}

--- PATIENT HISTORY (past consultations) ---
${historyContext}`;

        const result = await structuredLlm.invoke([
            { role: "system", content: REFERRAL_PROMPT },
            { role: "user", content: noteContent },
        ]);

        return {
            referralResult: result as ReferralResult,
        };
    } catch (err) {
        console.error("Referral detection failed:", err);
        return { referralResult: { detected: false } };
    }
}
