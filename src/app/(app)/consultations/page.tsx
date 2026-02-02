"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search } from "lucide-react";

interface Consultation {
    id: string;
    created_at: string;
    status: string;
    diagnosis: string | null;
    patient: {
        name: string;
        age: number;
        gender: string;
    };
}

export default function ConsultationsPage() {
    const supabase = createClient();
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConsultations();
    }, []);

    const fetchConsultations = async () => {
        try {
            const { data, error } = await supabase
                .from("consultations")
                .select(`
          id,
          created_at,
          status,
          diagnosis,
          patient:patients(name, age, gender)
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Transform data to handle nested patient object
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
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-black text-white";
            case "recording":
                return "bg-black/20";
            default:
                return "border-2 border-[var(--border)]";
        }
    };

    const filteredConsultations = consultations.filter(
        (c) =>
            c.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.diagnosis?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Consultations</h1>
                    <p className="text-sm text-[var(--muted)]">
                        {consultations.length} consultation
                        {consultations.length !== 1 ? "s" : ""} recorded
                    </p>
                </div>
                <Link href="/consultations/new">
                    <button className="h-12 px-6 flex items-center gap-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity">
                        <Plus className="h-4 w-4" />
                        New Consultation
                    </button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                <input
                    type="text"
                    placeholder="Search by patient name or diagnosis..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                />
            </div>

            {/* Consultations List */}
            <div className="border-2 border-[var(--border)]">
                {loading ? (
                    <div className="p-6 text-center text-[var(--muted)]">Loading...</div>
                ) : filteredConsultations.length === 0 ? (
                    <div className="p-6 text-center text-[var(--muted)]">
                        {search
                            ? "No consultations match your search"
                            : "No consultations yet"}
                    </div>
                ) : (
                    <div className="divide-y-2 divide-[var(--border)]">
                        {filteredConsultations.map((consultation) => (
                            <Link
                                key={consultation.id}
                                href={`/consultations/${consultation.id}`}
                                className="flex items-center justify-between p-4 hover:bg-black/5 transition-colors"
                            >
                                <div className="space-y-1">
                                    <p className="font-bold">
                                        {consultation.patient?.name || "Unknown Patient"}
                                    </p>
                                    <p className="text-xs text-[var(--muted)]">
                                        {consultation.patient?.age} years •{" "}
                                        {consultation.patient?.gender}
                                    </p>
                                    {consultation.diagnosis && (
                                        <p className="text-sm">{consultation.diagnosis}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span
                                        className={`px-3 py-1 text-xs font-bold uppercase ${getStatusColor(
                                            consultation.status
                                        )}`}
                                    >
                                        {consultation.status}
                                    </span>
                                    <div className="text-right">
                                        <p className="text-xs text-[var(--muted)]">
                                            {formatDate(consultation.created_at)}
                                        </p>
                                    </div>
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
