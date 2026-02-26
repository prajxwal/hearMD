"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { SearchBar } from "@/components/ui";
import { Button } from "@/components/ui";
import { Search, Plus } from "lucide-react";
import { generatePatientNumber } from "@/lib/utils";
import { toast } from "sonner";
import type { PatientSummary } from "@/lib/types";

interface PatientStepProps {
    onComplete: (patientId: string, patient: PatientSummary) => void;
    loading: boolean;
    setLoading: (v: boolean) => void;
    initialPatientId?: string | null;
}

export function PatientStep({ onComplete, loading, setLoading, initialPatientId }: PatientStepProps) {
    const [searchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<PatientSummary[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);

    // New patient form
    const [patientName, setPatientName] = useState("");
    const [patientAge, setPatientAge] = useState("");
    const [patientGender, setPatientGender] = useState("");
    const [patientPhone, setPatientPhone] = useState("");
    const [consent, setConsent] = useState(false);

    // Auto-select patient if ID was passed via URL
    useEffect(() => {
        if (!initialPatientId) return;

        const supabase = createClient();
        async function fetchPatient() {
            const { data } = await supabase
                .from("patients")
                .select("id, patient_number, name, age, gender")
                .eq("id", initialPatientId)
                .single();

            if (data) {
                setSelectedPatient(data);
                setSearchMode(true);
            }
        }
        fetchPatient();
    }, [initialPatientId]);

    // Search patients
    const searchPatients = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        const supabase = createClient();
        const { data } = await supabase
            .from("patients")
            .select("id, patient_number, name, age, gender")
            .or(`name.ilike.%${query}%,patient_number.ilike.%${query}%`)
            .limit(10);

        setSearchResults(data || []);
    }, []);

    useEffect(() => {
        searchPatients(searchQuery);
    }, [searchQuery, searchPatients]);

    const handleSubmit = async () => {
        if (!consent) {
            toast.error("Patient consent is required");
            return;
        }

        setLoading(true);

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

            let patientId = selectedPatient?.id;
            let patient = selectedPatient;

            // Create new patient if not selected
            if (!patientId) {
                if (!patientName || patientName.length < 2) {
                    toast.error("Patient name is required");
                    setLoading(false);
                    return;
                }
                if (!patientAge || parseInt(patientAge) < 0) {
                    toast.error("Patient age is required");
                    setLoading(false);
                    return;
                }
                if (!patientGender) {
                    toast.error("Patient gender is required");
                    setLoading(false);
                    return;
                }

                const patientNumber = await generatePatientNumber(supabase);

                const { data: newPatient, error } = await supabase
                    .from("patients")
                    .insert({
                        patient_number: patientNumber,
                        name: patientName,
                        age: parseInt(patientAge),
                        gender: patientGender,
                        phone: patientPhone || null,
                        created_by: doctor.id,
                    })
                    .select()
                    .single();

                if (error) throw error;
                patientId = newPatient.id;
                patient = {
                    id: newPatient.id,
                    patient_number: patientNumber,
                    name: patientName,
                    age: parseInt(patientAge),
                    gender: patientGender,
                };
            }

            onComplete(patientId!, patient!);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to start";
            toast.error(message);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 border-2 border-[var(--border)] p-6">
            <h2 className="text-xl font-bold">Patient Information</h2>

            {/* Toggle */}
            <div className="flex gap-4">
                <button
                    onClick={() => {
                        setSearchMode(false);
                        setSelectedPatient(null);
                    }}
                    className={`h-10 px-4 text-sm font-bold uppercase tracking-wide border-2 ${!searchMode
                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                        : "border-[var(--border)]"
                        }`}
                >
                    New Patient
                </button>
                <button
                    onClick={() => setSearchMode(true)}
                    className={`h-10 px-4 text-sm font-bold uppercase tracking-wide border-2 ${searchMode
                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                        : "border-[var(--border)]"
                        }`}
                >
                    Returning Patient
                </button>
            </div>

            {searchMode ? (
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
                        <input
                            type="text"
                            placeholder="Search by name or patient ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                        />
                    </div>

                    {selectedPatient ? (
                        <div className="p-4 border-2 border-[var(--foreground)] bg-[var(--surface)]">
                            <p className="font-bold">{selectedPatient.name}</p>
                            <p className="text-xs text-[var(--muted)]">
                                {selectedPatient.patient_number} • {selectedPatient.age} years • {selectedPatient.gender}
                            </p>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="text-xs font-bold mt-2 hover:underline"
                            >
                                Change Patient
                            </button>
                        </div>
                    ) : (
                        searchResults.length > 0 && (
                            <div className="border-2 border-[var(--border)] divide-y-2 divide-[var(--border)]">
                                {searchResults.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            setSelectedPatient(p);
                                            setSearchQuery("");
                                        }}
                                        className="w-full p-3 text-left hover:bg-[var(--foreground)]/5"
                                    >
                                        <p className="font-bold text-sm">{p.name}</p>
                                        <p className="text-xs text-[var(--muted)]">
                                            {p.patient_number} • {p.age} years • {p.gender}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wide">Patient Name *</label>
                            <input
                                type="text"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                placeholder="Full name"
                                className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wide">Age *</label>
                            <input
                                type="number"
                                value={patientAge}
                                onChange={(e) => setPatientAge(e.target.value)}
                                placeholder="Years"
                                className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wide">Gender *</label>
                            <select
                                value={patientGender}
                                onChange={(e) => setPatientGender(e.target.value)}
                                className="w-full h-12 px-4 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
                            >
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wide">Phone (Optional)</label>
                            <input
                                type="text"
                                value={patientPhone}
                                onChange={(e) => setPatientPhone(e.target.value)}
                                placeholder="+91 9876543210"
                                className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Consent */}
            <label className="flex items-center gap-3 p-4 border-2 border-[var(--border)] cursor-pointer">
                <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="w-5 h-5"
                />
                <span className="text-sm">
                    Patient has given verbal consent for audio recording of this consultation
                </span>
            </label>

            <Button onClick={handleSubmit} loading={loading} className="w-full h-14">
                Start Recording
            </Button>
        </div>
    );
}
