"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAssemblyAI } from "@/hooks/useAssemblyAI";
import { PatientStep } from "@/components/steps/PatientStep";
import { RecordingStep } from "@/components/steps/RecordingStep";
import { NotesStep, type ClinicalNotes } from "@/components/steps/NotesStep";
import { PrescriptionStep } from "@/components/steps/PrescriptionStep";
import type { PatientSummary, Prescription } from "@/lib/types";

type Step = "patient" | "recording" | "notes" | "prescription";

const STEPS: Step[] = ["patient", "recording", "notes", "prescription"];

export default function NewConsultationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [step, setStep] = useState<Step>("patient");
    const [loading, setLoading] = useState(false);
    const [consultationId, setConsultationId] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);

    // Recording hook
    const {
        transcript: liveTranscript,
        isConnected,
        error: transcriptionError,
        startRecording: startTranscription,
        stopRecording: stopTranscription,
    } = useAssemblyAI();
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");

    // Notes
    const [notes, setNotes] = useState<ClinicalNotes>({
        chiefComplaint: "",
        historyOfPresentIllness: [],
        pastMedicalHistory: [],
        examination: [],
        diagnosis: "",
    });

    // Prescription
    const [medications, setMedications] = useState<Prescription[]>([]);
    const [instructions, setInstructions] = useState("");

    // ── Step transitions ────────────────────────────────────

    const handlePatientComplete = async (patientId: string, patient: PatientSummary) => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data: doctor } = await supabase
                .from("doctors")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!doctor) throw new Error("Doctor profile not found");

            // Create consultation record
            const { data: consultationData, error } = await supabase
                .from("consultations")
                .insert({
                    patient_id: patientId,
                    doctor_id: doctor.id,
                    consent_logged: true,
                    status: "recording",
                })
                .select("id")
                .single();

            if (error) throw error;
            setConsultationId(consultationData.id);
            setSelectedPatient(patient);

            setStep("recording");
            setIsRecording(true);

            // Start real-time transcription
            try {
                await startTranscription();
                toast.success("Recording started — speak into your microphone");
            } catch {
                toast.error("Microphone access failed. Please allow mic permission and try again.");
                setIsRecording(false);
                return;
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to start";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleStopRecording = async () => {
        setIsRecording(false);
        await stopTranscription();
        setTranscript(liveTranscript);
        setStep("notes");
        setNotes({
            chiefComplaint: "",
            historyOfPresentIllness: [],
            pastMedicalHistory: [],
            examination: [],
            diagnosis: "",
        });
        toast.success("Recording stopped. Review transcript and fill in notes.");
    };

    const handleNotesComplete = () => {
        setStep("prescription");
        toast.success("Notes saved");
    };

    const handleComplete = async () => {
        if (medications.length === 0) {
            toast.error("Please add at least one medication");
            return;
        }
        if (!consultationId) {
            toast.error("Consultation not found. Please start over.");
            return;
        }

        setLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("consultations")
                .update({
                    transcript,
                    chief_complaint: notes.chiefComplaint,
                    history_of_present_illness: notes.historyOfPresentIllness,
                    past_medical_history: notes.pastMedicalHistory,
                    examination: notes.examination,
                    diagnosis: notes.diagnosis,
                    prescription: medications,
                    instructions: instructions || null,
                    status: "completed",
                })
                .eq("id", consultationId);

            if (error) throw error;

            toast.success("Consultation completed!", {
                action: {
                    label: "View & Print Rx",
                    onClick: () => window.open(`/consultations/${consultationId}/prescription`, "_blank"),
                },
                duration: 8000,
            });

            setTimeout(() => router.push("/dashboard"), 3000);
        } catch (error) {
            console.error("Error saving consultation:", error);
            toast.error("Failed to save consultation");
        } finally {
            setLoading(false);
        }
    };

    // ── Render ───────────────────────────────────────────────

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
                {STEPS.map((s, i) => (
                    <div
                        key={s}
                        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${step === s ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                            }`}
                    >
                        <div
                            className={`w-6 h-6 flex items-center justify-center border-2 ${step === s
                                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                                : "border-[var(--muted)]"
                                }`}
                        >
                            {i + 1}
                        </div>
                        <span className="hidden sm:inline">{s}</span>
                    </div>
                ))}
            </div>

            {/* Active Step */}
            {step === "patient" && (
                <PatientStep
                    onComplete={handlePatientComplete}
                    loading={loading}
                    setLoading={setLoading}
                    initialPatientId={searchParams.get("patientId")}
                />
            )}

            {step === "recording" && selectedPatient && (
                <RecordingStep
                    patient={selectedPatient}
                    isRecording={isRecording}
                    liveTranscript={liveTranscript}
                    isConnected={isConnected}
                    transcriptionError={transcriptionError}
                    onStopRecording={handleStopRecording}
                />
            )}

            {step === "notes" && (
                <NotesStep
                    notes={notes}
                    setNotes={setNotes}
                    transcript={transcript}
                    onComplete={handleNotesComplete}
                />
            )}

            {step === "prescription" && (
                <PrescriptionStep
                    medications={medications}
                    setMedications={setMedications}
                    instructions={instructions}
                    setInstructions={setInstructions}
                    loading={loading}
                    onComplete={handleComplete}
                />
            )}
        </div>
    );
}
