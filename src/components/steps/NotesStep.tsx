"use client";

import { EditableList } from "@/components/EditableList";
import { Button } from "@/components/ui";
import { Sparkles, Loader2, Stethoscope } from "lucide-react";

export interface ClinicalNotes {
    chiefComplaint: string;
    historyOfPresentIllness: string[];
    pastMedicalHistory: string[];
    examination: string[];
    investigations: string[];
    diagnosis: string;
}

type ConsultationPhase = "history" | "examination";

interface NotesStepProps {
    notes: ClinicalNotes;
    setNotes: (notes: ClinicalNotes) => void;
    transcript: string;
    onComplete: () => void;
    aiLoading?: boolean;
    aiPrefilled?: boolean;
    phase?: ConsultationPhase;
    onResumeExamination?: () => void;
}

export function NotesStep({ notes, setNotes, transcript, onComplete, aiLoading, aiPrefilled, phase = "examination", onResumeExamination }: NotesStepProps) {
    const isHistoryPhase = phase === "history";

    const handleSave = () => {
        onComplete();
    };

    if (aiLoading) {
        return (
            <div className="space-y-6 border-2 border-[var(--border)] p-6">
                <h2 className="text-xl font-bold">Clinical Notes</h2>
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--muted)]" />
                    <p className="text-sm font-bold uppercase tracking-wide">AI is analyzing the transcript…</p>
                    <p className="text-xs text-[var(--muted)]">This usually takes 3–5 seconds</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 border-2 border-[var(--border)] p-6">
            <h2 className="text-xl font-bold">Clinical Notes</h2>

            {/* AI Prefilled Banner */}
            {aiPrefilled && (
                <div className="flex items-center gap-2 p-3 border-2 border-[var(--foreground)] bg-[var(--foreground)]/5">
                    <Sparkles className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">
                        <strong>AI-generated</strong> — review and edit before saving
                    </p>
                </div>
            )}

            {/* Phase Banner */}
            {isHistoryPhase && (
                <div className="flex items-center gap-2 p-3 border-2 border-amber-500 bg-amber-500/10">
                    <Stethoscope className="h-4 w-4 flex-shrink-0 text-amber-600" />
                    <p className="text-sm">
                        <strong>Phase 1 — History Only</strong> — examination, investigations, and diagnosis will be filled after you resume recording
                    </p>
                </div>
            )}

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
                    Chief Complaint
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

            {/* Examination — disabled in history phase */}
            {isHistoryPhase ? (
                <div className="space-y-2 opacity-50">
                    <label className="block text-xs font-bold uppercase tracking-wide">Examination</label>
                    <div className="w-full px-4 py-3 border-2 border-dashed border-[var(--border)] text-sm text-[var(--muted)] italic">
                        Pending — resume after examination
                    </div>
                </div>
            ) : (
                <EditableList
                    label="Examination"
                    items={notes.examination}
                    onChange={(items) => setNotes({ ...notes, examination: items })}
                />
            )}

            {/* Investigations — disabled in history phase */}
            {isHistoryPhase ? (
                <div className="space-y-2 opacity-50">
                    <label className="block text-xs font-bold uppercase tracking-wide">Investigations Ordered</label>
                    <div className="w-full px-4 py-3 border-2 border-dashed border-[var(--border)] text-sm text-[var(--muted)] italic">
                        Pending — resume after examination
                    </div>
                </div>
            ) : (
                <EditableList
                    label="Investigations Ordered"
                    items={notes.investigations}
                    onChange={(items) => setNotes({ ...notes, investigations: items })}
                />
            )}

            {/* Diagnosis — disabled in history phase */}
            {isHistoryPhase ? (
                <div className="space-y-2 opacity-50">
                    <label className="block text-xs font-bold uppercase tracking-wide">Provisional Diagnosis</label>
                    <div className="w-full px-4 py-3 border-2 border-dashed border-[var(--foreground)] text-sm text-[var(--muted)] italic">
                        Pending — resume after examination
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wide">
                        Provisional Diagnosis
                    </label>
                    <input
                        type="text"
                        value={notes.diagnosis}
                        onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })}
                        placeholder="e.g. Viral fever"
                        className="w-full h-12 px-4 border-2 border-[var(--foreground)] bg-transparent text-sm font-bold focus:outline-none"
                    />
                </div>
            )}

            {/* Action buttons */}
            {isHistoryPhase && onResumeExamination ? (
                <Button onClick={onResumeExamination} className="w-full h-14">
                    Resume — Examination Complete
                </Button>
            ) : (
                <Button onClick={handleSave} className="w-full h-14">
                    Continue to Prescription
                </Button>
            )}
        </div>
    );
}
