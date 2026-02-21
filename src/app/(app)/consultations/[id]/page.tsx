"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, Sun, CloudSun, Moon } from "lucide-react";

interface ConsultationDetail {
    id: string;
    created_at: string;
    status: string;
    transcript: string | null;
    chief_complaint: string | null;
    history_of_present_illness: string[];
    past_medical_history: string[];
    examination: string[];
    diagnosis: string | null;
    prescription: {
        name: string;
        morning: string;
        noon: string;
        night: string;
        timing: string;
        duration: string;
    }[];
    instructions: string | null;
    patient: {
        id: string;
        patient_number: string;
        name: string;
        age: number;
        gender: string;
    };
}

export default function ConsultationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [consultation, setConsultation] = useState<ConsultationDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data, error } = await supabase
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
                        diagnosis,
                        prescription,
                        instructions,
                        patient:patients(id, patient_number, name, age, gender)
                    `)
                    .eq("id", params.id)
                    .single();

                if (error) throw error;

                // Handle Supabase nested relation (could be array or object)
                const transformed = {
                    ...data,
                    patient: Array.isArray(data.patient) ? data.patient[0] : data.patient,
                    history_of_present_illness: data.history_of_present_illness || [],
                    past_medical_history: data.past_medical_history || [],
                    examination: data.examination || [],
                    prescription: data.prescription || [],
                };

                setConsultation(transformed as ConsultationDetail);
            } catch (error) {
                console.error("Error fetching consultation:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [params.id, supabase]);

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-[var(--foreground)] text-[var(--background)]";
            case "recording":
                return "bg-[var(--foreground)]/20";
            default:
                return "border-2 border-[var(--border)]";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-[var(--muted)]">Loading...</p>
            </div>
        );
    }

    if (!consultation) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => router.push("/consultations")}
                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Consultations
                </button>
                <div className="p-6 text-center border-2 border-[var(--border)]">
                    <p className="text-[var(--muted)]">Consultation not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Back Button */}
            <button
                onClick={() => router.push("/consultations")}
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Consultations
            </button>

            {/* Header */}
            <div className="border-2 border-[var(--border)] p-6 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Consultation Record</h1>
                        <p className="text-sm text-[var(--muted)]">
                            {formatDateTime(consultation.created_at)}
                        </p>
                    </div>
                    <span
                        className={`px-3 py-1 text-xs font-bold uppercase ${getStatusStyle(
                            consultation.status
                        )}`}
                    >
                        {consultation.status}
                    </span>
                </div>

                {/* Patient Info */}
                {consultation.patient && (
                    <Link
                        href={`/patients/${consultation.patient.id}`}
                        className="flex items-center gap-3 p-3 border-2 border-[var(--border)] hover:bg-black/5 transition-colors"
                    >
                        <User className="h-4 w-4 text-[var(--muted)]" />
                        <div>
                            <p className="font-bold text-sm">{consultation.patient.name}</p>
                            <p className="text-xs text-[var(--muted)]">
                                {consultation.patient.patient_number} • {consultation.patient.age} years • {consultation.patient.gender}
                            </p>
                        </div>
                        <span className="ml-auto text-xs font-bold">→</span>
                    </Link>
                )}
            </div>

            {/* Clinical Notes */}
            <div className="border-2 border-[var(--border)] p-6 space-y-6">
                <h2 className="text-lg font-bold">Clinical Notes</h2>

                {!consultation.chief_complaint &&
                    consultation.history_of_present_illness.length === 0 &&
                    consultation.past_medical_history.length === 0 &&
                    consultation.examination.length === 0 &&
                    !consultation.diagnosis ? (
                    <p className="text-sm text-[var(--muted)] py-4 text-center">
                        {consultation.status === "completed"
                            ? "No clinical notes recorded for this consultation."
                            : "Clinical notes will appear here once the consultation is completed."}
                    </p>
                ) : (
                    <>
                        {/* Chief Complaint */}
                        {consultation.chief_complaint && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                                    Chief Complaint
                                </h3>
                                <p className="text-sm p-3 border-2 border-[var(--border)]">
                                    {consultation.chief_complaint}
                                </p>
                            </div>
                        )}

                        {/* History of Present Illness */}
                        {consultation.history_of_present_illness.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                                    History of Present Illness
                                </h3>
                                <ul className="space-y-1 p-3 border-2 border-[var(--border)]">
                                    {consultation.history_of_present_illness.map((item: string, i: number) => (
                                        <li key={i} className="text-sm flex items-start gap-2">
                                            <span className="text-[var(--muted)] mt-0.5">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Past Medical History */}
                        {consultation.past_medical_history.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                                    Past Medical History
                                </h3>
                                <ul className="space-y-1 p-3 border-2 border-[var(--border)]">
                                    {consultation.past_medical_history.map((item: string, i: number) => (
                                        <li key={i} className="text-sm flex items-start gap-2">
                                            <span className="text-[var(--muted)] mt-0.5">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Examination */}
                        {consultation.examination.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                                    Examination
                                </h3>
                                <ul className="space-y-1 p-3 border-2 border-[var(--border)]">
                                    {consultation.examination.map((item: string, i: number) => (
                                        <li key={i} className="text-sm flex items-start gap-2">
                                            <span className="text-[var(--muted)] mt-0.5">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Diagnosis */}
                        {consultation.diagnosis && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                                    Provisional Diagnosis
                                </h3>
                                <p className="text-sm font-bold p-3 border-2 border-[var(--foreground)]">
                                    {consultation.diagnosis}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Prescription */}
            {consultation.prescription.length > 0 && (
                <div className="border-2 border-[var(--border)] p-6 space-y-4">
                    <h2 className="text-lg font-bold">Prescription</h2>

                    <div className="space-y-3">
                        {consultation.prescription.map((med, i) => (
                            <div key={i} className="p-4 border-2 border-[var(--border)] space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-bold">{med.name}</p>
                                        <p className="text-xs text-[var(--muted)] mt-1">
                                            {med.timing} • {med.duration}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold uppercase text-[var(--muted)]">
                                        #{i + 1}
                                    </span>
                                </div>

                                {/* Dosage display */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 text-sm">
                                        <Sun className="h-3 w-3 text-[var(--muted)]" />
                                        <span className="font-bold">{med.morning || "0"}</span>
                                    </div>
                                    <span className="text-[var(--muted)]">-</span>
                                    <div className="flex items-center gap-1 text-sm">
                                        <CloudSun className="h-3 w-3 text-[var(--muted)]" />
                                        <span className="font-bold">{med.noon || "0"}</span>
                                    </div>
                                    <span className="text-[var(--muted)]">-</span>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Moon className="h-3 w-3 text-[var(--muted)]" />
                                        <span className="font-bold">{med.night || "0"}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Instructions */}
            {consultation.instructions && (
                <div className="border-2 border-[var(--border)] p-6 space-y-2">
                    <h2 className="text-lg font-bold">Advice / Instructions</h2>
                    <p className="text-sm whitespace-pre-wrap">{consultation.instructions}</p>
                </div>
            )}

            {/* Transcript */}
            {consultation.transcript && (
                <div className="border-2 border-[var(--border)] p-6 space-y-2">
                    <h2 className="text-lg font-bold">Transcript</h2>
                    <div className="p-4 border-2 border-[var(--border)] font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto">
                        {consultation.transcript}
                    </div>
                </div>
            )}
        </div>
    );
}
