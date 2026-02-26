"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { generatePatientNumber } from "@/lib/utils";
import { PageHeader, EmptyState, LoadingState, SearchBar, Button } from "@/components/ui";
import { Input } from "@/components/ui";
import type { Patient } from "@/lib/types";

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("patients")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setPatients(data || []);
        } catch (error) {
            console.error("Error fetching patients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPatient = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || name.length < 2) {
            toast.error("Name must be at least 2 characters");
            return;
        }

        if (!age || parseInt(age) < 0 || parseInt(age) > 150) {
            toast.error("Age must be between 0 and 150");
            return;
        }

        if (!gender) {
            toast.error("Please select a gender");
            return;
        }

        setSaving(true);

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

            const patientNumber = await generatePatientNumber(supabase);

            const { error } = await supabase.from("patients").insert({
                patient_number: patientNumber,
                name,
                age: parseInt(age),
                gender,
                phone: phone || null,
                created_by: doctor.id,
            });

            if (error) throw error;

            toast.success("Patient added successfully");
            setShowAddModal(false);
            resetForm();
            fetchPatients();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to add patient";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setName("");
        setAge("");
        setGender("");
        setPhone("");
    };

    const filteredPatients = patients.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.patient_number && p.patient_number.toLowerCase().includes(search.toLowerCase())) ||
            (p.phone && p.phone.includes(search))
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Patients"
                subtitle={`${patients.length} patient${patients.length !== 1 ? "s" : ""} registered`}
                actions={
                    <Button
                        onClick={() => setShowAddModal(true)}
                        icon={<Plus className="h-4 w-4" />}
                    >
                        Add Patient
                    </Button>
                }
            />

            <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name, patient ID, or phone..."
            />

            {/* Patient List */}
            <div className="border-2 border-[var(--border)]">
                {loading ? (
                    <LoadingState />
                ) : filteredPatients.length === 0 ? (
                    <EmptyState
                        message={search ? "No patients match your search" : "No patients yet"}
                    />
                ) : (
                    <div className="divide-y-2 divide-[var(--border)]">
                        {filteredPatients.map((patient) => (
                            <Link
                                key={patient.id}
                                href={`/patients/${patient.id}`}
                                className="flex items-center justify-between p-4 hover:bg-[var(--foreground)]/5 transition-colors"
                            >
                                <div className="space-y-1">
                                    <p className="font-bold">{patient.name}</p>
                                    <p className="text-xs text-[var(--muted)]">
                                        {patient.patient_number} • {patient.age} years • {patient.gender}
                                        {patient.phone && ` • ${patient.phone}`}
                                    </p>
                                </div>
                                <span className="text-xs font-bold">→</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Patient Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--background)] border-2 border-[var(--border)] w-full max-w-md">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b-2 border-[var(--border)]">
                            <h2 className="text-lg font-bold">Add New Patient</h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-[var(--foreground)]/5"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <form onSubmit={handleAddPatient} className="p-4 space-y-4">
                            <Input
                                label="Patient Name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full name"
                            />
                            <Input
                                label="Age"
                                required
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="Years"
                                min={0}
                                max={150}
                            />

                            {/* Gender */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wide">
                                    Gender *
                                </label>
                                <div className="flex gap-4">
                                    {["Male", "Female", "Other"].map((g) => (
                                        <label key={g} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value={g}
                                                checked={gender === g}
                                                onChange={(e) => setGender(e.target.value)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">{g}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Input
                                label="Phone (Optional)"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91 9876543210"
                            />

                            <Button type="submit" loading={saving} className="w-full">
                                Add Patient
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
