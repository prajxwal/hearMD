"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, EmptyState, LoadingState, SearchBar, StatusBadge, Button } from "@/components/ui";
import type { Consultation } from "@/lib/types";

export default function ConsultationsPage() {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        async function fetchConsultations() {
            try {
                const { data, error } = await supabase
                    .from("consultations")
                    .select(`
                        id,
                        created_at,
                        status,
                        diagnosis,
                        patient:patients(patient_number, name, age, gender)
                    `)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                const transformed = (data || []).map((c) => ({
                    ...c,
                    patient: Array.isArray(c.patient) ? c.patient[0] : c.patient,
                }));

                setConsultations(transformed as Consultation[]);
            } catch (error) {
                console.error("Error fetching consultations:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchConsultations();
    }, []);

    const deleteConsultation = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Delete this abandoned consultation?")) return;

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("consultations")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setConsultations((prev) => prev.filter((c) => c.id !== id));
            toast.success("Consultation deleted");
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Failed to delete consultation");
        }
    };

    const filteredConsultations = consultations.filter(
        (c) =>
            c.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.patient?.patient_number?.toLowerCase().includes(search.toLowerCase()) ||
            c.diagnosis?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Consultations"
                subtitle={`${consultations.length} consultation${consultations.length !== 1 ? "s" : ""} recorded`}
                actions={
                    <Link href="/consultations/new">
                        <Button icon={<Plus className="h-4 w-4" />}>
                            New Consultation
                        </Button>
                    </Link>
                }
            />

            <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by patient name, patient ID, or diagnosis..."
            />

            {/* Consultations List */}
            <div className="border-2 border-[var(--border)]">
                {loading ? (
                    <LoadingState />
                ) : filteredConsultations.length === 0 ? (
                    <EmptyState
                        message={search ? "No consultations match your search" : "No consultations yet"}
                    />
                ) : (
                    <div className="divide-y-2 divide-[var(--border)]">
                        {filteredConsultations.map((consultation) => (
                            <Link
                                key={consultation.id}
                                href={`/consultations/${consultation.id}`}
                                className="flex items-center justify-between p-4 hover:bg-[var(--foreground)]/5 transition-colors"
                            >
                                <div className="space-y-1">
                                    <p className="font-bold">
                                        {consultation.patient?.name || "Unknown Patient"}
                                    </p>
                                    <p className="text-xs text-[var(--muted)]">
                                        {consultation.patient?.patient_number} • {consultation.patient?.age} years •{" "}
                                        {consultation.patient?.gender}
                                    </p>
                                    {consultation.diagnosis && (
                                        <p className="text-sm">{consultation.diagnosis}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <StatusBadge status={consultation.status} />
                                    <div className="text-right">
                                        <p className="text-xs text-[var(--muted)]">
                                            {formatDateTime(consultation.created_at)}
                                        </p>
                                    </div>
                                    {(consultation.status === "recording" || consultation.status === "draft") && (
                                        <button
                                            onClick={(e) => deleteConsultation(consultation.id, e)}
                                            className="p-2 hover:opacity-70 text-[var(--muted)] hover:text-red-500 transition-colors"
                                            title="Delete abandoned consultation"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                    <span className="text-xs font-bold">→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
