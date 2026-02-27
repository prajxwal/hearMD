"use client";

import React from "react";
import { Sun, CloudSun, Moon, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { MedicationAutocomplete } from "@/components/MedicationAutocomplete";
import type { Prescription } from "@/lib/types";

interface MedicationFormProps {
    medications: Prescription[];
    onChange: (medications: Prescription[]) => void;
}

const EMPTY_MED: Prescription = {
    name: "",
    morning: "0",
    noon: "0",
    night: "0",
    timing: "After food",
    duration: "",
};

/**
 * Reusable medication/prescription form.
 * Used in both the new consultation flow and the consultation detail edit mode.
 */
export function MedicationForm({ medications, onChange }: MedicationFormProps) {
    const updateMedication = (index: number, field: keyof Prescription, value: string) => {
        const updated = [...medications];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const incrementDose = (index: number, field: "morning" | "noon" | "night") => {
        const current = parseInt(medications[index][field] || "0", 10);
        updateMedication(index, field, String(current + 1));
    };

    const decrementDose = (index: number, field: "morning" | "noon" | "night") => {
        const current = parseInt(medications[index][field] || "0", 10);
        if (current > 0) updateMedication(index, field, String(current - 1));
    };

    const removeMedication = (index: number) => {
        onChange(medications.filter((_, i) => i !== index));
    };

    const addMedication = () => {
        onChange([...medications, { ...EMPTY_MED }]);
    };

    return (
        <div className="space-y-4">
            {medications.map((med, i) => (
                <div key={i} className="p-4 border-2 border-[var(--border)] space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-[var(--muted)]">
                            #{i + 1}
                        </span>
                        <button
                            onClick={() => removeMedication(i)}
                            className="text-xs font-bold uppercase text-[var(--muted)] hover:opacity-70"
                        >
                            × Remove
                        </button>
                    </div>

                    <MedicationAutocomplete
                        value={med.name}
                        onChange={(val) => updateMedication(i, "name", val)}
                    />

                    <div className="grid grid-cols-3 gap-2">
                        {([
                            { field: "morning" as const, label: "Morning", icon: <Sun className="h-3 w-3" /> },
                            { field: "noon" as const, label: "Noon", icon: <CloudSun className="h-3 w-3" /> },
                            { field: "night" as const, label: "Night", icon: <Moon className="h-3 w-3" /> },
                        ]).map(({ field, label, icon }) => (
                            <div key={field} className="space-y-1">
                                <label className="text-xs text-[var(--muted)] flex items-center gap-1">
                                    {icon} {label}
                                </label>
                                <div className="flex items-center border-2 border-[var(--border)] h-10">
                                    <button
                                        type="button"
                                        onClick={() => decrementDose(i, field)}
                                        className="h-full px-2 flex items-center justify-center hover:bg-[var(--foreground)]/10 transition-colors"
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                    <span className="flex-1 text-center text-sm font-bold tabular-nums">
                                        {med[field]}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => incrementDose(i, field)}
                                        className="h-full px-2 flex items-center justify-center hover:bg-[var(--foreground)]/10 transition-colors"
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-[var(--muted)]">Timing</label>
                            <select
                                value={med.timing}
                                onChange={(e) => updateMedication(i, "timing", e.target.value)}
                                className="w-full h-10 px-3 border-2 border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none appearance-none cursor-pointer"
                                style={{ colorScheme: "dark" }}
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
                                onChange={(e) => updateMedication(i, "duration", e.target.value)}
                                placeholder="e.g. 5 days"
                                className="w-full h-10 px-3 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={addMedication}
                className="w-full h-10 flex items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] text-sm font-bold uppercase tracking-wide hover:opacity-70"
            >
                <Plus className="h-4 w-4" />
                Add Medication
            </button>
        </div>
    );
}
