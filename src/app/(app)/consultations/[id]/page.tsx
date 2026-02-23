"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, Sun, CloudSun, Moon, Pencil, X, Check, Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface Prescription {
    name: string;
    morning: string;
    noon: string;
    night: string;
    timing: string;
    duration: string;
}

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
    prescription: Prescription[];
    instructions: string | null;
    patient: {
        id: string;
        patient_number: string;
        name: string;
        age: number;
        gender: string;
    };
}

interface EditForm {
    chief_complaint: string;
    history_of_present_illness: string[];
    past_medical_history: string[];
    examination: string[];
    diagnosis: string;
    prescription: Prescription[];
    instructions: string;
}

export default function ConsultationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [consultation, setConsultation] = useState<ConsultationDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<EditForm | null>(null);
    const [saving, setSaving] = useState(false);

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

        setSaving(true);
        try {
            // Filter out empty strings from arrays
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

    // Helper to update a list item in editForm
    const updateListItem = (field: "history_of_present_illness" | "past_medical_history" | "examination", index: number, value: string) => {
        if (!editForm) return;
        const updated = [...editForm[field]];
        updated[index] = value;
        setEditForm({ ...editForm, [field]: updated });
    };

    const removeListItem = (field: "history_of_present_illness" | "past_medical_history" | "examination", index: number) => {
        if (!editForm) return;
        setEditForm({ ...editForm, [field]: editForm[field].filter((_, i) => i !== index) });
    };

    const addListItem = (field: "history_of_present_illness" | "past_medical_history" | "examination") => {
        if (!editForm) return;
        setEditForm({ ...editForm, [field]: [...editForm[field], ""] });
    };

    const updatePrescription = (index: number, key: keyof Prescription, value: string) => {
        if (!editForm) return;
        const updated = [...editForm.prescription];
        updated[index] = { ...updated[index], [key]: value };
        setEditForm({ ...editForm, prescription: updated });
    };

    const removePrescription = (index: number) => {
        if (!editForm) return;
        setEditForm({ ...editForm, prescription: editForm.prescription.filter((_, i) => i !== index) });
    };

    const addPrescription = () => {
        if (!editForm) return;
        setEditForm({
            ...editForm,
            prescription: [...editForm.prescription, { name: "", morning: "", noon: "", night: "", timing: "After food", duration: "" }],
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

    // Editable list section renderer
    const renderEditableList = (
        label: string,
        field: "history_of_present_illness" | "past_medical_history" | "examination",
        items: string[]
    ) => (
        <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{label}</h3>
            <div className="space-y-2">
                {items.map((item, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => updateListItem(field, i, e.target.value)}
                            className="flex-1 h-10 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                        />
                        <button
                            onClick={() => removeListItem(field, i)}
                            className="px-3 border-2 border-[var(--border)] hover:opacity-70"
                        >
                            ×
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => addListItem(field)}
                    className="text-xs font-bold uppercase tracking-wide hover:underline"
                >
                    + Add item
                </button>
            </div>
        </div>
    );

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
                    <div className="flex items-center gap-2">
                        <span
                            className={`px-3 py-1 text-xs font-bold uppercase ${getStatusStyle(
                                consultation.status
                            )}`}
                        >
                            {consultation.status}
                        </span>
                        {!isEditing ? (
                            <button
                                onClick={startEditing}
                                className="h-10 px-4 flex items-center gap-2 border-2 border-[var(--border)] text-sm font-bold uppercase tracking-wide hover:opacity-70 transition-opacity"
                            >
                                <Pencil className="h-4 w-4" />
                                Edit
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={cancelEditing}
                                    className="h-10 px-4 flex items-center gap-2 border-2 border-[var(--border)] text-sm font-bold uppercase tracking-wide hover:opacity-70 transition-opacity"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </button>
                                <button
                                    onClick={saveConsultation}
                                    disabled={saving}
                                    className="h-10 px-4 flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    <Check className="h-4 w-4" />
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            </>
                        )}
                    </div>
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

                        {renderEditableList("History of Present Illness", "history_of_present_illness", editForm.history_of_present_illness)}
                        {renderEditableList("Past Medical History", "past_medical_history", editForm.past_medical_history)}
                        {renderEditableList("Examination", "examination", editForm.examination)}

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
            </div>

            {/* Prescription */}
            <div className="border-2 border-[var(--border)] p-6 space-y-4">
                <h2 className="text-lg font-bold">Prescription</h2>

                {isEditing && editForm ? (
                    <div className="space-y-4">
                        {editForm.prescription.map((med, i) => (
                            <div key={i} className="p-4 border-2 border-[var(--border)] space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase text-[var(--muted)]">#{i + 1}</span>
                                    <button
                                        onClick={() => removePrescription(i)}
                                        className="text-xs font-bold uppercase text-[var(--muted)] hover:opacity-70"
                                    >
                                        × Remove
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={med.name}
                                    onChange={(e) => updatePrescription(i, "name", e.target.value)}
                                    placeholder="Medication name"
                                    className="w-full h-10 px-4 border-2 border-[var(--border)] bg-transparent text-sm font-bold focus:outline-none"
                                />
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs text-[var(--muted)] flex items-center gap-1">
                                            <Sun className="h-3 w-3" /> Morning
                                        </label>
                                        <input
                                            type="text"
                                            value={med.morning}
                                            onChange={(e) => updatePrescription(i, "morning", e.target.value)}
                                            className="w-full h-10 px-3 border-2 border-[var(--border)] bg-transparent text-sm text-center focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-[var(--muted)] flex items-center gap-1">
                                            <CloudSun className="h-3 w-3" /> Noon
                                        </label>
                                        <input
                                            type="text"
                                            value={med.noon}
                                            onChange={(e) => updatePrescription(i, "noon", e.target.value)}
                                            className="w-full h-10 px-3 border-2 border-[var(--border)] bg-transparent text-sm text-center focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-[var(--muted)] flex items-center gap-1">
                                            <Moon className="h-3 w-3" /> Night
                                        </label>
                                        <input
                                            type="text"
                                            value={med.night}
                                            onChange={(e) => updatePrescription(i, "night", e.target.value)}
                                            className="w-full h-10 px-3 border-2 border-[var(--border)] bg-transparent text-sm text-center focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs text-[var(--muted)]">Timing</label>
                                        <select
                                            value={med.timing}
                                            onChange={(e) => updatePrescription(i, "timing", e.target.value)}
                                            className="w-full h-10 px-3 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                                        >
                                            <option value="Before food">Before food</option>
                                            <option value="After food">After food</option>
                                            <option value="With food">With food</option>
                                            <option value="Empty stomach">Empty stomach</option>
                                            <option value="As needed">As needed</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-[var(--muted)]">Duration</label>
                                        <input
                                            type="text"
                                            value={med.duration}
                                            onChange={(e) => updatePrescription(i, "duration", e.target.value)}
                                            placeholder="e.g. 5 days"
                                            className="w-full h-10 px-3 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={addPrescription}
                            className="w-full h-10 flex items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] text-sm font-bold uppercase tracking-wide hover:opacity-70"
                        >
                            <Plus className="h-4 w-4" />
                            Add Medication
                        </button>
                    </div>
                ) : consultation.prescription.length > 0 ? (
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
            </div>

            {/* Instructions */}
            <div className="border-2 border-[var(--border)] p-6 space-y-2">
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
            </div>

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
