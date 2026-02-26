"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, Pencil, X, Check, Printer } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { validateConsultationNotes } from "@/lib/validation";
import { StatusBadge, Button, Card, EmptyState, ConsultationDetailSkeleton } from "@/components/ui";
import { EditableList } from "@/components/EditableList";
import { MedicationForm } from "@/components/MedicationForm";
import { Sun, CloudSun, Moon } from "lucide-react";
import type { ConsultationDetail, ConsultationEditForm, Prescription } from "@/lib/types";

export default function ConsultationDetailPage() {
    const params = useParams();
    const router = useRouter();

    const [consultation, setConsultation] = useState<ConsultationDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<ConsultationEditForm | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const supabase = createClient();

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
    }, [params.id]);

    const startEditing = () => {
        if (!consultation) return;
        setEditForm({
            chief_complaint: consultation.chief_complaint || "",
            history_of_present_illness: consultation.history_of_present_illness.length > 0
                ? [...consultation.history_of_present_illness]
                : [""],
            past_medical_history: consultation.past_medical_history.length > 0
                ? [...consultation.past_medical_history]
                : [],
            examination: consultation.examination.length > 0
                ? [...consultation.examination]
                : [],
            diagnosis: consultation.diagnosis || "",
            prescription: consultation.prescription.length > 0
                ? consultation.prescription.map((p) => ({ ...p }))
                : [],
            instructions: consultation.instructions || "",
        });
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditForm(null);
    };

    const saveConsultation = async () => {
        if (!consultation || !editForm) return;

        const validation = validateConsultationNotes(editForm);
        if (!validation.valid) {
            validation.errors.forEach((e) => toast.error(e));
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();

            const cleanHPI = editForm.history_of_present_illness.filter((s) => s.trim());
            const cleanPMH = editForm.past_medical_history.filter((s) => s.trim());
            const cleanExam = editForm.examination.filter((s) => s.trim());
            const cleanRx = editForm.prescription.filter((p) => p.name.trim());

            const { error } = await supabase
                .from("consultations")
                .update({
                    chief_complaint: editForm.chief_complaint.trim() || null,
                    history_of_present_illness: cleanHPI,
                    past_medical_history: cleanPMH,
                    examination: cleanExam,
                    diagnosis: editForm.diagnosis.trim() || null,
                    prescription: cleanRx,
                    instructions: editForm.instructions.trim() || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", consultation.id);

            if (error) throw error;

            setConsultation({
                ...consultation,
                chief_complaint: editForm.chief_complaint.trim() || null,
                history_of_present_illness: cleanHPI,
                past_medical_history: cleanPMH,
                examination: cleanExam,
                diagnosis: editForm.diagnosis.trim() || null,
                prescription: cleanRx,
                instructions: editForm.instructions.trim() || null,
            });
            setIsEditing(false);
            setEditForm(null);
            toast.success("Consultation updated");
        } catch (err) {
            console.error("Update error:", err);
            toast.error("Failed to update consultation");
        } finally {
            setSaving(false);
        }
    };

    // View-only list section renderer
    const renderViewList = (label: string, items: string[]) => {
        if (items.length === 0) return null;
        return (
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</h3>
                <ul className="space-y-1 p-3 border-2 border-[var(--border)]">
                    {items.map((item: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-[var(--muted)] mt-0.5">•</span>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    if (loading) {
        return <ConsultationDetailSkeleton />;
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
                <Card>
                    <EmptyState message="Consultation not found" />
                </Card>
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
            <Card className="space-y-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">Consultation Record</h1>
                        <p className="text-sm text-[var(--muted)]">
                            {formatDateTime(consultation.created_at)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={consultation.status} />
                        {!isEditing ? (
                            <>
                                <Link
                                    href={`/consultations/${consultation.id}/prescription`}
                                    target="_blank"
                                    className="h-10 px-4 flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity"
                                >
                                    <Printer className="h-4 w-4" />
                                    Print Rx
                                </Link>
                                <Button variant="secondary" onClick={startEditing} icon={<Pencil className="h-4 w-4" />}>
                                    Edit
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="secondary" onClick={cancelEditing} icon={<X className="h-4 w-4" />}>
                                    Cancel
                                </Button>
                                <Button onClick={saveConsultation} loading={saving} icon={<Check className="h-4 w-4" />}>
                                    Save
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Patient Info */}
                {consultation.patient && (
                    <Link
                        href={`/patients/${consultation.patient.id}`}
                        className="flex items-center gap-3 p-3 border-2 border-[var(--border)] hover:bg-[var(--foreground)]/5 transition-colors"
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
            </Card>

            {/* Clinical Notes */}
            <Card className="space-y-6">
                <h2 className="text-lg font-bold">Clinical Notes</h2>

                {isEditing && editForm ? (
                    <>
                        {/* Chief Complaint */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Chief Complaint</h3>
                            <input
                                type="text"
                                value={editForm.chief_complaint}
                                onChange={(e) => setEditForm({ ...editForm, chief_complaint: e.target.value })}
                                className="w-full h-10 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                                placeholder="e.g. Fever and headache for 3 days"
                            />
                        </div>

                        <EditableList
                            label="History of Present Illness"
                            items={editForm.history_of_present_illness}
                            onChange={(items) => setEditForm({ ...editForm, history_of_present_illness: items })}
                        />
                        <EditableList
                            label="Past Medical History"
                            items={editForm.past_medical_history}
                            onChange={(items) => setEditForm({ ...editForm, past_medical_history: items })}
                        />
                        <EditableList
                            label="Examination"
                            items={editForm.examination}
                            onChange={(items) => setEditForm({ ...editForm, examination: items })}
                        />

                        {/* Diagnosis */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Provisional Diagnosis</h3>
                            <input
                                type="text"
                                value={editForm.diagnosis}
                                onChange={(e) => setEditForm({ ...editForm, diagnosis: e.target.value })}
                                className="w-full h-10 px-4 border-2 border-[var(--foreground)] bg-transparent text-sm font-bold focus:outline-none"
                                placeholder="e.g. Viral fever"
                            />
                        </div>
                    </>
                ) : (
                    <>
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
                                {consultation.chief_complaint && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Chief Complaint</h3>
                                        <p className="text-sm p-3 border-2 border-[var(--border)]">{consultation.chief_complaint}</p>
                                    </div>
                                )}
                                {renderViewList("History of Present Illness", consultation.history_of_present_illness)}
                                {renderViewList("Past Medical History", consultation.past_medical_history)}
                                {renderViewList("Examination", consultation.examination)}
                                {consultation.diagnosis && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Provisional Diagnosis</h3>
                                        <p className="text-sm font-bold p-3 border-2 border-[var(--foreground)]">{consultation.diagnosis}</p>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </Card>

            {/* Prescription */}
            <Card className="space-y-4">
                <h2 className="text-lg font-bold">Prescription</h2>

                {isEditing && editForm ? (
                    <MedicationForm
                        medications={editForm.prescription}
                        onChange={(meds) => setEditForm({ ...editForm, prescription: meds })}
                    />
                ) : consultation.prescription.length > 0 ? (
                    <div className="space-y-3">
                        {consultation.prescription.map((med: Prescription, i: number) => (
                            <div key={i} className="p-4 border-2 border-[var(--border)] space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-bold">{med.name}</p>
                                        <p className="text-xs text-[var(--muted)] mt-1">
                                            {med.timing} • {med.duration}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold uppercase text-[var(--muted)]">#{i + 1}</span>
                                </div>
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
                ) : (
                    <p className="text-sm text-[var(--muted)] text-center py-2">No medications prescribed</p>
                )}
            </Card>

            {/* Instructions */}
            <Card className="space-y-2">
                <h2 className="text-lg font-bold">Advice / Instructions</h2>
                {isEditing && editForm ? (
                    <textarea
                        value={editForm.instructions}
                        onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none resize-none"
                        placeholder="e.g. Rest for 2 days, drink plenty of fluids..."
                    />
                ) : consultation.instructions ? (
                    <p className="text-sm whitespace-pre-wrap">{consultation.instructions}</p>
                ) : (
                    <p className="text-sm text-[var(--muted)] text-center py-2">No instructions</p>
                )}
            </Card>

            {/* Transcript */}
            {consultation.transcript && (
                <Card className="space-y-2">
                    <h2 className="text-lg font-bold">Transcript</h2>
                    <div className="p-4 border-2 border-[var(--border)] font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto">
                        {consultation.transcript}
                    </div>
                </Card>
            )}
        </div>
    );
}
