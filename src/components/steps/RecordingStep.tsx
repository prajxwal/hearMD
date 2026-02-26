"use client";

import { useState, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import type { PatientSummary } from "@/lib/types";

interface RecordingStepProps {
    patient: PatientSummary;
    isRecording: boolean;
    liveTranscript: string;
    isConnected: boolean;
    transcriptionError: string | null;
    onStopRecording: () => void;
}

export function RecordingStep({
    patient,
    isRecording,
    liveTranscript,
    isConnected,
    transcriptionError,
    onStopRecording,
}: RecordingStepProps) {
    const [duration, setDuration] = useState(0);

    // Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => setDuration((d) => d + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Warn before leaving during recording
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isRecording) e.preventDefault();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="space-y-6 border-2 border-[var(--border)] p-6">
            <h2 className="text-xl font-bold">Recording Consultation</h2>

            {/* Patient Info */}
            <div className="p-3 border-2 border-[var(--border)]">
                <p className="font-bold text-sm">{patient.name}</p>
                <p className="text-xs text-[var(--muted)]">
                    {patient.patient_number} • {patient.age} years • {patient.gender}
                </p>
            </div>

            {/* Recording Status */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                    {isRecording ? (
                        <>
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-bold uppercase">Recording</span>
                        </>
                    ) : (
                        <span className="text-sm font-bold uppercase text-[var(--muted)]">Stopped</span>
                    )}
                </div>
                <p className="text-4xl font-bold tracking-tight font-mono">{formatTime(duration)}</p>
                {isConnected && (
                    <p className="text-xs text-[var(--muted)]">Connected to transcription service</p>
                )}
                {transcriptionError && (
                    <p className="text-xs text-red-500">{transcriptionError}</p>
                )}
            </div>

            {/* Transcript */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                    Live Transcript
                </h3>
                <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 border-2 border-[var(--border)] font-mono text-sm whitespace-pre-wrap">
                    {liveTranscript || (
                        <span className="text-[var(--muted)] italic">
                            Start speaking — your transcript will appear here in real-time…
                        </span>
                    )}
                </div>
            </div>

            {/* Stop Button */}
            {isRecording && (
                <button
                    onClick={onStopRecording}
                    className="w-full h-14 flex items-center justify-center gap-3 bg-red-600 text-white text-sm font-bold uppercase tracking-wide hover:opacity-90"
                >
                    <Square className="h-5 w-5 fill-current" />
                    Stop Recording
                </button>
            )}
        </div>
    );
}
