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
type ConsultationPhase = "history" | "examination";

const STEPS: Step[] = ["patient", "recording", "notes", "prescription"];

export default function NewConsultationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [step, setStep] = useState<Step>("patient");
    const [loading, setLoading] = useState(false);
    const [consultationId, setConsultationId] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);

    // Phase state
    const [phase, setPhase] = useState<ConsultationPhase>("history");

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

    // Store Phase 1 transcript separately for merging
    const [phase1Transcript, setPhase1Transcript] = useState("");

    // Notes
    const [notes, setNotes] = useState<ClinicalNotes>({
        chiefComplaint: "",
        historyOfPresentIllness: [],
        pastMedicalHistory: [],
        examination: [],
        investigations: [],
        diagnosis: "",
    });
    const [aiPrefilled, setAiPrefilled] = useState(false);

    // Prescription
    const [medications, setMedications] = useState<Prescription[]>([]);
    const [instructions, setInstructions] = useState("");

    // AI extraction loading
    const [aiLoading, setAiLoading] = useState(false);

    // ── Step transitions ────────────────────────────────────

    const handlePatientComplete = async (patientId: string, patient: PatientSummary, consentGiven: boolean) => {
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
                    consent_logged: consentGiven,
                    status: consentGiven ? "recording" : "draft",
                })
                .select("id")
                .single();

            if (error) throw error;
            setConsultationId(consultationData.id);
            setSelectedPatient(patient);

            if (!consentGiven) {
                // Skip recording — go straight to manual notes
                setPhase("examination"); // all fields editable
                setStep("notes");
                setAiPrefilled(false);
                toast.success("Manual entry mode — type your clinical notes below");
                return;
            }

            // Start in Phase 1 (History)
            setPhase("history");
            setStep("recording");
            setIsRecording(true);

            // Start real-time transcription
            try {
                await startTranscription();
                toast.success("Recording started — Phase 1: History Taking");
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

    /**
     * Phase 1 → Pause for examination.
     * Stops recording, sends transcript with phase="history", shows notes with pending fields.
     */
    const handlePauseForExamination = async () => {
        setIsRecording(false);
        await stopTranscription();
        const finalTranscript = liveTranscript;
        setPhase1Transcript(finalTranscript);
        setTranscript(finalTranscript);

        // AI extraction — Phase 1 (history only)
        if (finalTranscript && finalTranscript.trim().length >= 20) {
            setAiLoading(true);
            setStep("notes");
            try {
                const res = await fetch("/api/ai/extract", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        transcript: finalTranscript,
                        phase: "history",
                    }),
                });

                if (res.ok) {
                    const ai = await res.json();
                    setNotes({
                        chiefComplaint: ai.chief_complaint || "",
                        historyOfPresentIllness: ai.history_of_present_illness || [],
                        pastMedicalHistory: ai.past_medical_history || [],
                        examination: [],
                        investigations: [],
                        diagnosis: "",
                    });
                    setAiPrefilled(true);
                    toast.success("Phase 1 notes generated — review history, then resume for examination");
                } else {
                    toast.error("AI extraction failed — fill in notes manually");
                }
            } catch {
                toast.error("AI extraction failed — fill in notes manually");
            } finally {
                setAiLoading(false);
            }
        } else {
            setStep("notes");
            toast.success("Recording paused. Fill in history notes, then resume for examination.");
        }
    };

    /**
     * Resume from NotesStep → Phase 2 recording.
     * Starts a fresh recording session for examination findings.
     */
    const handleResumeExamination = async () => {
        setPhase("examination");
        setStep("recording");
        setIsRecording(true);

        try {
            await startTranscription();
            toast.success("Recording resumed — Phase 2: Examination");
        } catch {
            toast.error("Microphone access failed. Please allow mic permission and try again.");
            setIsRecording(false);
        }
    };

    /**
     * Phase 2 → Stop recording.
     * Sends Phase 2 transcript with existing notes, AI fills examination/investigations/diagnosis.
     */
    const handleStopRecording = async () => {
        setIsRecording(false);
        await stopTranscription();
        const phase2Transcript = liveTranscript;

        // Merge transcripts
        const mergedTranscript = phase1Transcript
            ? `${phase1Transcript}\n\n--- Examination ---\n\n${phase2Transcript}`
            : phase2Transcript;
        setTranscript(mergedTranscript);

        // AI extraction — Phase 2 (examination, with existing notes context)
        if (phase2Transcript && phase2Transcript.trim().length >= 20) {
            setAiLoading(true);
            setStep("notes");
            try {
                const res = await fetch("/api/ai/extract", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        transcript: phase2Transcript,
                        phase: "examination",
                        existingNote: {
                            chief_complaint: notes.chiefComplaint,
                            history_of_present_illness: notes.historyOfPresentIllness,
                        },
                    }),
                });

                if (res.ok) {
                    const ai = await res.json();
                    setNotes((prev) => ({
                        ...prev,
                        examination: ai.examination || [],
                        investigations: ai.investigations || [],
                        diagnosis: ai.diagnosis || "",
                    }));
                    setMedications(
                        (ai.prescription || []).map((p: { name?: string; morning?: string; noon?: string; night?: string; timing?: string; duration?: string }) => ({
                            name: p.name || "",
                            morning: p.morning || "0",
                            noon: p.noon || "0",
                            night: p.night || "0",
                            timing: p.timing || "After Food",
                            duration: p.duration || "",
                        }))
                    );
                    setInstructions(ai.instructions || "");
                    setAiPrefilled(true);
                    toast.success("Full notes generated — review all fields before saving");
                } else {
                    toast.error("AI extraction failed — fill in notes manually");
                }
            } catch {
                toast.error("AI extraction failed — fill in notes manually");
            } finally {
                setAiLoading(false);
            }
        } else {
            setStep("notes");
            toast.success("Recording stopped. Fill in examination notes.");
        }
    };

    const handleNotesComplete = () => {
        setStep("prescription");
        toast.success("Notes saved");
    };

    const handleComplete = async () => {
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
                    investigations: notes.investigations,
                    diagnosis: notes.diagnosis,
                    prescription: medications,
                    instructions: instructions || null,
                    status: "completed",
                })
                .eq("id", consultationId);

            if (error) throw error;

            toast.success("Consultation completed! Opening prescription…");

            // Auto-open prescription in a new tab
            window.open(`/prescription/${consultationId}`, "_blank");

            setTimeout(() => router.push("/dashboard"), 1500);
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
                    phase={phase}
                    onPauseForExamination={handlePauseForExamination}
                />
            )}

            {step === "notes" && (
                <NotesStep
                    notes={notes}
                    setNotes={setNotes}
                    transcript={transcript}
                    onComplete={handleNotesComplete}
                    aiLoading={aiLoading}
                    aiPrefilled={aiPrefilled}
                    phase={phase}
                    onResumeExamination={handleResumeExamination}
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
