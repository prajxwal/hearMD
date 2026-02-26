"use client";

import { MedicationForm } from "@/components/MedicationForm";
import { Button } from "@/components/ui";
import { CheckCircle } from "lucide-react";
import type { Prescription } from "@/lib/types";

interface PrescriptionStepProps {
    medications: Prescription[];
    setMedications: (meds: Prescription[]) => void;
    instructions: string;
    setInstructions: (v: string) => void;
    loading: boolean;
    onComplete: () => void;
}

export function PrescriptionStep({
    medications,
    setMedications,
    instructions,
    setInstructions,
    loading,
    onComplete,
}: PrescriptionStepProps) {
    return (
        <div className="space-y-6 border-2 border-[var(--border)] p-6">
            <h2 className="text-xl font-bold">Prescription</h2>

            <MedicationForm medications={medications} onChange={setMedications} />

            {/* Instructions */}
            <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wide">
                    Advice / Instructions (Optional)
                </label>
                <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                    placeholder="e.g., Rest, drink plenty of fluids, avoid cold foods"
                    className="w-full p-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none resize-none"
                />
            </div>

            <Button
                onClick={onComplete}
                loading={loading}
                className="w-full h-14"
                icon={<CheckCircle className="h-5 w-5" />}
            >
                Complete Consultation
            </Button>
        </div>
    );
}
