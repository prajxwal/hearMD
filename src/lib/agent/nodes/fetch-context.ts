/**
 * fetchContext node — Loads consultation data + patient history from Supabase.
 *
 * This is the first node in the agent graph. It hydrates the state
 * with the full consultation record and all past consultations for
 * the same patient (used as context for referral letters and drug checks).
 */

import { createClient } from "@supabase/supabase-js";

import type { AgentGraphState } from "../graph";

export async function fetchContextNode(
    state: AgentGraphState
): Promise<Partial<AgentGraphState>> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return { error: "Supabase not configured" };
    }

    // Use service role key for server-side agent operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // Fetch the consultation with patient and doctor info
        const { data: consultation, error: consultationError } = await supabase
            .from("consultations")
            .select(`
                id,
                created_at,
                status,
                transcript,
                chief_complaint,
                history_of_present_illness,
                past_medical_history,
                examination,
                investigations,
                diagnosis,
                prescription,
                instructions,
                patient_id,
                patient:patients(id, patient_number, name, age, gender, dob),
                doctor:doctors(full_name, specialization, registration_number, clinic_name, clinic_address)
            `)
            .eq("id", state.consultationId)
            .single();

        if (consultationError || !consultation) {
            return { error: `Consultation not found: ${consultationError?.message}` };
        }

        // Normalize nested relations (Supabase can return arrays for single relations)
        const normalizedConsultation = {
            ...consultation,
            patient: Array.isArray(consultation.patient)
                ? consultation.patient[0]
                : consultation.patient,
            doctor: Array.isArray(consultation.doctor)
                ? consultation.doctor[0]
                : consultation.doctor,
            history_of_present_illness: consultation.history_of_present_illness || [],
            past_medical_history: consultation.past_medical_history || [],
            examination: consultation.examination || [],
            investigations: consultation.investigations || [],
            prescription: consultation.prescription || [],
        };

        // Fetch patient history — all past consultations for context
        const { data: patientHistory } = await supabase
            .from("consultations")
            .select(`
                id,
                created_at,
                chief_complaint,
                diagnosis,
                prescription,
                instructions,
                past_medical_history
            `)
            .eq("patient_id", consultation.patient_id)
            .neq("id", state.consultationId) // exclude current consultation
            .order("created_at", { ascending: false })
            .limit(10);

        return {
            consultation: normalizedConsultation,
            patientHistory: patientHistory || [],
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error fetching context";
        return { error: message };
    }
}
