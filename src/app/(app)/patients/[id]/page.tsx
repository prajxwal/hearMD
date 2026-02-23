"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, FileText, Calendar } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

interface Patient {
    id: string;
    patient_number: string;
    name: string;
    age: number;
    gender: string;
    phone: string | null;
    created_at: string;
}

interface Consultation {
    id: string;
    created_at: string;
    status: string;
    chief_complaint: string | null;
    diagnosis: string | null;
    prescription: { name: string }[] | null;
    instructions: string | null;
}

export default function PatientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [patient, setPatient] = useState<Patient | null>(null);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
    }, [params.id, supabase]);



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
                <div className="p-6 text-center border-2 border-[var(--border)]">
                    <p className="text-[var(--muted)]">Patient not found</p>
                </div>
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
            <div className="border-2 border-[var(--border)] p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
                        <p className="text-sm text-[var(--muted)]">
                            {patient.patient_number} • {patient.age} years • {patient.gender}
                        </p>
                    </div>
                    <Link href={`/consultations/new?patientId=${patient.id}`}>
                        <button className="h-10 px-4 flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity">
                            <Plus className="h-4 w-4" />
                            New Consultation
                        </button>
                    </Link>
                </div>

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

                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    <Calendar className="h-3 w-3" />
                    Registered {formatDate(patient.created_at)}
                </div>
            </div>

            {/* Consultation History */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                        Consultation History ({consultations.length})
                    </h2>
                </div>

                <div className="border-2 border-[var(--border)]">
                    {consultations.length === 0 ? (
                        <div className="p-6 text-center text-[var(--muted)]">
                            No consultations recorded yet
                        </div>
                    ) : (
                        <div className="divide-y-2 divide-[var(--border)]">
                            {consultations.map((consultation) => (
                                <Link
                                    key={consultation.id}
                                    href={`/consultations/${consultation.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-black/5 transition-colors"
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
                                        <span
                                            className={`px-3 py-1 text-xs font-bold uppercase ${getStatusStyle(
                                                consultation.status
                                            )}`}
                                        >
                                            {consultation.status}
                                        </span>
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
