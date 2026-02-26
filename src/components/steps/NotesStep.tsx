"use client";

import { EditableList } from "@/components/EditableList";
import { Button } from "@/components/ui";
import { toast } from "sonner";

export interface ClinicalNotes {
    chiefComplaint: string;
    historyOfPresentIllness: string[];
    pastMedicalHistory: string[];
    examination: string[];
    diagnosis: string;
}

interface NotesStepProps {
    notes: ClinicalNotes;
    setNotes: (notes: ClinicalNotes) => void;
    transcript: string;
    onComplete: () => void;
}

export function NotesStep({ notes, setNotes, transcript, onComplete }: NotesStepProps) {
    const handleSave = () => {
        if (!notes.diagnosis) {
            toast.error("Please enter a diagnosis");
            return;
        }
        onComplete();
    };

    return (
        <div className="space-y-6 border-2 border-[var(--border)] p-6">
            <h2 className="text-xl font-bold">Clinical Notes</h2>

            {/* Transcript Reference */}
            {transcript && (
                <details className="border-2 border-[var(--border)]">
                    <summary className="p-3 cursor-pointer text-sm font-bold uppercase tracking-wide">
                        View Transcript
                    </summary>
                    <div className="p-4 border-t-2 border-[var(--border)] font-mono text-sm whitespace-pre-wrap max-h-48 overflow-auto">
                        {transcript}
                    </div>
                </details>
            )}

            {/* Chief Complaint */}
            <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wide">
                    Chief Complaint *
                </label>
                <input
                    type="text"
                    value={notes.chiefComplaint}
                    onChange={(e) => setNotes({ ...notes, chiefComplaint: e.target.value })}
                    placeholder="e.g. Fever and headache for 3 days"
                    className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                />
            </div>

            {/* HPI */}
            <EditableList
                label="History of Present Illness"
                items={notes.historyOfPresentIllness}
                onChange={(items) => setNotes({ ...notes, historyOfPresentIllness: items })}
            />

            {/* PMH */}
            <EditableList
                label="Past Medical History"
                items={notes.pastMedicalHistory}
                onChange={(items) => setNotes({ ...notes, pastMedicalHistory: items })}
            />

            {/* Examination */}
            <EditableList
                label="Examination"
                items={notes.examination}
                onChange={(items) => setNotes({ ...notes, examination: items })}
            />

            {/* Diagnosis */}
            <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wide">
                    Provisional Diagnosis *
                </label>
                <input
                    type="text"
                    value={notes.diagnosis}
                    onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })}
                    placeholder="e.g. Viral fever"
                    className="w-full h-12 px-4 border-2 border-[var(--foreground)] bg-transparent text-sm font-bold focus:outline-none"
                />
            </div>

            <Button onClick={handleSave} className="w-full h-14">
                Continue to Prescription
            </Button>
        </div>
    );
}
