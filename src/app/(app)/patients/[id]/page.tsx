"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, FileText, Calendar, Pencil, X, Check } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { validatePatient } from "@/lib/validation";
import { StatusBadge, Button, Card, LoadingState, EmptyState } from "@/components/ui";
import type { Patient, PatientConsultation } from "@/lib/types";

export default function PatientDetailPage() {
    const params = useParams();
    const router = useRouter();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [consultations, setConsultations] = useState<PatientConsultation[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", age: 0, gender: "", phone: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const supabase = createClient();

        async function fetchData() {
            try {
                const { data: patientData, error: patientError } = await supabase
                    .from("patients")
                    .select("id, patient_number, name, age, gender, phone, created_at")
                    .eq("id", params.id)
                    .single();

                if (patientError) throw patientError;
                setPatient(patientData);

                const { data: consultationData } = await supabase
                    .from("consultations")
                    .select("id, created_at, status, chief_complaint, diagnosis, prescription, instructions")
                    .eq("patient_id", params.id)
                    .order("created_at", { ascending: false });

                setConsultations(consultationData || []);
            } catch (error) {
                console.error("Error fetching patient:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [params.id]);

    const startEditing = () => {
        if (!patient) return;
        setEditForm({
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone || "",
        });
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
    };

    const savePatient = async () => {
        if (!patient) return;
        const validation = validatePatient(editForm);
        if (!validation.valid) {
            validation.errors.forEach((e) => toast.error(e));
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("patients")
                .update({
                    name: editForm.name.trim(),
                    age: editForm.age,
                    gender: editForm.gender,
                    phone: editForm.phone.trim() || null,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", patient.id);

            if (error) throw error;

            setPatient({
                ...patient,
                name: editForm.name.trim(),
                age: editForm.age,
                gender: editForm.gender,
                phone: editForm.phone.trim() || null,
            });
            setIsEditing(false);
            toast.success("Patient updated");
        } catch (err) {
            console.error("Update error:", err);
            toast.error("Failed to update patient");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingState />
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="space-y-6">
                <button
                    onClick={() => router.push("/patients")}
                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Patients
                </button>
                <Card>
                    <EmptyState message="Patient not found" />
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Back Button */}
            <button
                onClick={() => router.push("/patients")}
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide hover:underline"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Patients
            </button>

            {/* Patient Header */}
            <Card className="space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="text-2xl font-bold tracking-tight bg-transparent border-b-2 border-[var(--border)] focus:outline-none w-full"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
                        )}
                        <p className="text-sm text-[var(--muted)]">
                            {patient.patient_number} • {patient.age} years • {patient.gender}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="secondary" onClick={cancelEditing} icon={<X className="h-4 w-4" />}>
                                    Cancel
                                </Button>
                                <Button onClick={savePatient} loading={saving} icon={<Check className="h-4 w-4" />}>
                                    Save
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="secondary" onClick={startEditing} icon={<Pencil className="h-4 w-4" />}>
                                    Edit
                                </Button>
                                <Link href={`/consultations/new?patientId=${patient.id}`}>
                                    <Button icon={<Plus className="h-4 w-4" />}>
                                        New Consultation
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t-2 border-[var(--border)]">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Patient ID</p>
                            <p className="text-sm font-bold mt-1">{patient.patient_number}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Age</label>
                            <input
                                type="number"
                                value={editForm.age}
                                onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                                className="w-full h-10 px-3 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Gender</label>
                            <select
                                value={editForm.gender}
                                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                className="w-full h-10 px-3 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Phone</label>
                            <input
                                type="text"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                placeholder="Phone number"
                                className="w-full h-10 px-3 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t-2 border-[var(--border)]">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Patient ID</p>
                            <p className="text-sm font-bold mt-1">{patient.patient_number}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Age</p>
                            <p className="text-sm font-bold mt-1">{patient.age} years</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Gender</p>
                            <p className="text-sm font-bold mt-1">{patient.gender}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Phone</p>
                            <p className="text-sm font-bold mt-1">{patient.phone || "—"}</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <Calendar className="h-3 w-3" />
                    Registered {formatDate(patient.created_at)}
                </div>
            </Card>

            {/* Consultation History */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                        Consultation History ({consultations.length})
                    </h2>
                </div>

                <div className="border-2 border-[var(--border)]">
                    {consultations.length === 0 ? (
                        <EmptyState message="No consultations recorded yet" />
                    ) : (
                        <div className="divide-y-2 divide-[var(--border)]">
                            {consultations.map((consultation) => (
                                <Link
                                    key={consultation.id}
                                    href={`/consultations/${consultation.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-[var(--foreground)]/5 transition-colors"
                                >
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-[var(--muted)] flex-shrink-0" />
                                            <p className="font-bold">
                                                {consultation.chief_complaint || "No chief complaint"}
                                            </p>
                                        </div>
                                        {consultation.diagnosis && (
                                            <p className="text-sm pl-7">
                                                <span className="text-[var(--muted)]">Dx:</span> {consultation.diagnosis}
                                            </p>
                                        )}
                                        {consultation.prescription && consultation.prescription.length > 0 && (
                                            <p className="text-sm text-[var(--muted)] pl-7">
                                                Rx: {consultation.prescription.map(m => m.name).join(", ")}
                                            </p>
                                        )}
                                        {consultation.instructions && (
                                            <p className="text-sm text-[var(--muted)] pl-7 truncate">
                                                Advice: {consultation.instructions}
                                            </p>
                                        )}
                                        <p className="text-xs text-[var(--muted)] pl-7">
                                            {formatDateTime(consultation.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={consultation.status} />
                                        <span className="text-xs font-bold">→</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
