"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mic, Square, Search, Plus, CheckCircle, Sun, CloudSun, Moon } from "lucide-react";
import { useAssemblyAI } from "@/hooks/useAssemblyAI";

interface Patient {
    id: string;
    patient_number: string;
    name: string;
    age: number;
    gender: string;
}

type Step = "patient" | "recording" | "notes" | "prescription";

export default function NewConsultationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [step, setStep] = useState<Step>("patient");
    const [loading, setLoading] = useState(false);
    const [consultationId, setConsultationId] = useState<string | null>(null);

    // Patient step state
    const [searchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientName, setPatientName] = useState("");
    const [patientAge, setPatientAge] = useState("");
    const [patientGender, setPatientGender] = useState("");
    const [patientPhone, setPatientPhone] = useState("");
    const [consent, setConsent] = useState(false);

    // Recording step state (AssemblyAI hook)
    const {
        transcript: liveTranscript,
        isConnected,
        error: transcriptionError,
        startRecording: startTranscription,
        stopRecording: stopTranscription,
    } = useAssemblyAI();
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [duration, setDuration] = useState(0);

    // Notes step state
    const [notes, setNotes] = useState({
        chiefComplaint: "",
        historyOfPresentIllness: [] as string[],
        pastMedicalHistory: [] as string[],
        examination: [] as string[],
        diagnosis: "",
    });

    // Prescription step state
    const [medications, setMedications] = useState<
        { name: string; morning: string; noon: string; night: string; timing: string; duration: string }[]
    >([]);
    const [instructions, setInstructions] = useState("");

    // Auto-select patient if patientId is in URL
    useEffect(() => {
        const patientId = searchParams.get("patientId");
        if (patientId) {
            async function fetchPatient() {
                const { data } = await supabase
                    .from("patients")
                    .select("id, patient_number, name, age, gender")
                    .eq("id", patientId)
                    .single();

                if (data) {
                    setSelectedPatient(data);
                    setSearchMode(true);
                }
            }
            fetchPatient();
        }
    }, [searchParams, supabase]);

    // Search patients
    useEffect(() => {
        if (searchQuery.length >= 2) {
            searchPatients();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const searchPatients = async () => {
        const { data } = await supabase
            .from("patients")
            .select("id, patient_number, name, age, gender")
            .or(`name.ilike.%${searchQuery}%,patient_number.ilike.%${searchQuery}%`)
            .limit(10);

        setSearchResults(data || []);
    };

    // Timer for recording
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setDuration((d) => d + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Create or select patient and start consultation
    const handleStartRecording = async () => {
        if (!consent) {
            toast.error("Patient consent is required");
            return;
        }

        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data: doctor } = await supabase
                .from("doctors")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!doctor) throw new Error("Doctor profile not found");

            let patientId = selectedPatient?.id;

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

                // Generate next patient number
                const { data: lastPatient } = await supabase
                    .from("patients")
                    .select("patient_number")
                    .not("patient_number", "is", null)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();

                const nextNum = lastPatient?.patient_number
                    ? parseInt(lastPatient.patient_number.replace("P-", "")) + 1
                    : 1;
                const patientNumber = `P-${nextNum.toString().padStart(4, "0")}`;

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
                setSelectedPatient({
                    id: newPatient.id,
                    patient_number: patientNumber,
                    name: patientName,
                    age: parseInt(patientAge),
                    gender: patientGender,
                });
            }

            // Create consultation
            const { data: consultationData, error: consultationError } = await supabase
                .from("consultations")
                .insert({
                    patient_id: patientId,
                    doctor_id: doctor.id,
                    consent_logged: true,
                    status: "recording",
                })
                .select("id")
                .single();

            if (consultationError) throw consultationError;
            setConsultationId(consultationData.id);

            setStep("recording");
            setIsRecording(true);

            // Start real-time transcription
            try {
                await startTranscription();
                toast.success("Recording started — speak into your microphone");
            } catch {
                toast.error("Microphone access failed. Please allow mic permission and try again.");
                setIsRecording(false);
                return;
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to start";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleStopRecording = async () => {
        setIsRecording(false);
        await stopTranscription();

        // Use the real transcript from AssemblyAI
        setTranscript(liveTranscript);

        setStep("notes");
        // Notes start empty — doctor fills them after reading transcript
        setNotes({
            chiefComplaint: "",
            historyOfPresentIllness: [],
            pastMedicalHistory: [],
            examination: [],
            diagnosis: "",
        });
        toast.success("Recording stopped. Review transcript and fill in notes.");
    };

    const handleSaveNotes = () => {
        if (!notes.diagnosis) {
            toast.error("Please enter a diagnosis");
            return;
        }
        setStep("prescription");
        toast.success("Notes saved");
    };

    const addMedication = () => {
        setMedications([
            ...medications,
            { name: "", morning: "0", noon: "0", night: "0", timing: "After food", duration: "" },
        ]);
    };

    const updateMedication = (index: number, field: string, value: string) => {
        const updated = [...medications];
        updated[index] = { ...updated[index], [field]: value };
        setMedications(updated);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const handleComplete = async () => {
        if (medications.length === 0) {
            toast.error("Please add at least one medication");
            return;
        }

        if (!consultationId) {
            toast.error("Consultation not found. Please start over.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from("consultations")
                .update({
                    transcript,
                    chief_complaint: notes.chiefComplaint,
                    history_of_present_illness: notes.historyOfPresentIllness,
                    past_medical_history: notes.pastMedicalHistory,
                    examination: notes.examination,
                    diagnosis: notes.diagnosis,
                    prescription: medications,
                    instructions: instructions || null,
                    status: "completed",
                })
                .eq("id", consultationId);

            if (error) throw error;

            toast.success("Consultation completed!");
            router.push("/dashboard");
        } catch (error) {
            console.error("Error saving consultation:", error);
            toast.error("Failed to save consultation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-between">
                {["patient", "recording", "notes", "prescription"].map((s, i) => (
                    <div
                        key={s}
                        className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${step === s ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                            }`}
                    >
                        <div
                            className={`w-6 h-6 flex items-center justify-center border-2 ${step === s
                                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                                : "border-[var(--muted)]"
                                }`}
                        >
                            {i + 1}
                        </div>
                        <span className="hidden sm:inline">{s}</span>
                    </div>
                ))}
            </div>

            {/* Step 1: Patient */}
            {step === "patient" && (
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
                        /* Search existing patient */
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
                                    <p className="text-sm text-[var(--muted)]">
                                        {selectedPatient.patient_number} • {selectedPatient.age} years • {selectedPatient.gender}
                                    </p>
                                </div>
                            ) : (
                                searchResults.length > 0 && (
                                    <div className="border-2 border-[var(--border)] divide-y-2 divide-[var(--border)]">
                                        {searchResults.map((patient) => (
                                            <button
                                                key={patient.id}
                                                onClick={() => setSelectedPatient(patient)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface)] text-left"
                                            >
                                                <div>
                                                    <p className="font-bold">{patient.name}</p>
                                                    <p className="text-xs text-[var(--muted)]">
                                                        {patient.patient_number} • {patient.age} years • {patient.gender}
                                                    </p>
                                                </div>
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        /* New patient form */
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wide">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={patientName}
                                    onChange={(e) => setPatientName(e.target.value)}
                                    placeholder="Patient full name"
                                    className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wide">
                                        Age *
                                    </label>
                                    <input
                                        type="number"
                                        value={patientAge}
                                        onChange={(e) => setPatientAge(e.target.value)}
                                        placeholder="Years"
                                        className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold uppercase tracking-wide">
                                        Gender *
                                    </label>
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
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wide">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={patientPhone}
                                    onChange={(e) => setPatientPhone(e.target.value)}
                                    placeholder="Phone number (optional)"
                                    className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Consent */}
                    <label className="flex items-start gap-3 p-4 border-2 border-[var(--border)] cursor-pointer hover:bg-[var(--surface)]">
                        <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="w-5 h-5 mt-0.5"
                        />
                        <span className="text-sm">
                            Patient has consented to audio recording for medical documentation purposes
                        </span>
                    </label>

                    {/* Start Button */}
                    <button
                        onClick={handleStartRecording}
                        disabled={loading || !consent}
                        className="w-full h-14 flex items-center justify-center gap-3 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        <Mic className="h-5 w-5" />
                        {loading ? "Starting..." : "Start Recording"}
                    </button>
                </div>
            )}

            {/* Step 2: Recording */}
            {step === "recording" && (
                <div className="space-y-6 border-2 border-[var(--border)] p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Recording</h2>
                            <p className="text-sm text-[var(--muted)]">
                                {selectedPatient?.name || patientName}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="font-mono font-bold">{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Live Transcript Area */}
                    <div className="h-80 p-4 border-2 border-[var(--border)] overflow-auto font-mono text-sm whitespace-pre-wrap">
                        {transcriptionError && (
                            <p className="text-red-400 mb-2">⚠ {transcriptionError}</p>
                        )}
                        {liveTranscript || (
                            <p className="text-[var(--muted)]">
                                {isConnected
                                    ? "Listening... start speaking."
                                    : "Connecting to transcription service..."}
                            </p>
                        )}
                    </div>

                    {/* Stop Button */}
                    <button
                        onClick={handleStopRecording}
                        className="w-full h-14 flex items-center justify-center gap-3 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90"
                    >
                        <Square className="h-5 w-5" />
                        Stop & Generate Notes
                    </button>
                </div>
            )}

            {/* Step 3: Notes */}
            {step === "notes" && (
                <div className="space-y-6 border-2 border-[var(--border)] p-6">
                    <h2 className="text-xl font-bold">Clinical Notes</h2>

                    {/* Chief Complaint */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wide">
                            Chief Complaint
                        </label>
                        <textarea
                            value={notes.chiefComplaint}
                            onChange={(e) =>
                                setNotes({ ...notes, chiefComplaint: e.target.value })
                            }
                            rows={2}
                            className="w-full p-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none resize-none"
                        />
                    </div>

                    {/* History */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wide">
                            History of Present Illness
                        </label>
                        <div className="space-y-2">
                            {notes.historyOfPresentIllness.map((item, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                            const updated = [...notes.historyOfPresentIllness];
                                            updated[i] = e.target.value;
                                            setNotes({ ...notes, historyOfPresentIllness: updated });
                                        }}
                                        className="flex-1 h-10 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            const updated = notes.historyOfPresentIllness.filter(
                                                (_, idx) => idx !== i
                                            );
                                            setNotes({ ...notes, historyOfPresentIllness: updated });
                                        }}
                                        className="px-3 border-2 border-[var(--border)] hover:opacity-70"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() =>
                                    setNotes({
                                        ...notes,
                                        historyOfPresentIllness: [
                                            ...notes.historyOfPresentIllness,
                                            "",
                                        ],
                                    })
                                }
                                className="text-xs font-bold uppercase tracking-wide hover:underline"
                            >
                                + Add item
                            </button>
                        </div>
                    </div>

                    {/* Examination */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wide">
                            Examination
                        </label>
                        <div className="space-y-2">
                            {notes.examination.map((item, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                            const updated = [...notes.examination];
                                            updated[i] = e.target.value;
                                            setNotes({ ...notes, examination: updated });
                                        }}
                                        className="flex-1 h-10 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            const updated = notes.examination.filter(
                                                (_, idx) => idx !== i
                                            );
                                            setNotes({ ...notes, examination: updated });
                                        }}
                                        className="px-3 border-2 border-[var(--border)] hover:opacity-70"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() =>
                                    setNotes({
                                        ...notes,
                                        examination: [...notes.examination, ""],
                                    })
                                }
                                className="text-xs font-bold uppercase tracking-wide hover:underline"
                            >
                                + Add item
                            </button>
                        </div>
                    </div>

                    {/* Diagnosis */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wide">
                            Provisional Diagnosis *
                        </label>
                        <input
                            type="text"
                            value={notes.diagnosis}
                            onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })}
                            placeholder="Enter diagnosis"
                            className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveNotes}
                        className="w-full h-14 flex items-center justify-center gap-3 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90"
                    >
                        Save Notes & Create Prescription
                    </button>
                </div>
            )}

            {/* Step 4: Prescription */}
            {step === "prescription" && (
                <div className="space-y-6 border-2 border-[var(--border)] p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Prescription</h2>
                        <button
                            onClick={addMedication}
                            className="h-10 px-4 flex items-center gap-2 border-2 border-[var(--border)] text-sm font-bold uppercase tracking-wide hover:opacity-80"
                        >
                            <Plus className="h-4 w-4" />
                            Add Medication
                        </button>
                    </div>

                    {/* Medications */}
                    <div className="space-y-4">
                        {medications.length === 0 ? (
                            <p className="text-center text-[var(--muted)] py-8">
                                No medications added yet
                            </p>
                        ) : (
                            medications.map((med, i) => (
                                <div
                                    key={i}
                                    className="p-4 border-2 border-[var(--border)] space-y-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <span className="text-xs font-bold uppercase text-[var(--muted)]">
                                            Medication {i + 1}
                                        </span>
                                        <button
                                            onClick={() => removeMedication(i)}
                                            className="text-sm hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wide">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                value={med.name}
                                                onChange={(e) =>
                                                    updateMedication(i, "name", e.target.value)
                                                }
                                                placeholder="e.g., Paracetamol 650mg"
                                                className="w-full h-10 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                                            />
                                        </div>

                                        {/* Dosage and Timing Row */}
                                        <div className="flex items-start gap-8">
                                            {/* Dosage */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wide mb-2">
                                                    Dosage
                                                </label>
                                                <div className="flex items-end gap-2">
                                                    {/* Morning */}
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-1 text-xs text-[var(--muted)] mb-1">
                                                            <Sun className="h-3 w-3" />
                                                            <span>AM</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="2"
                                                            value={med.morning || "0"}
                                                            onChange={(e) => {
                                                                const val = Math.min(2, Math.max(0, parseInt(e.target.value) || 0)).toString();
                                                                updateMedication(i, "morning", val);
                                                            }}
                                                            className="w-12 h-10 text-center border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
                                                        />
                                                    </div>

                                                    <span className="text-[var(--muted)] h-10 flex items-center">-</span>

                                                    {/* Noon */}
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-1 text-xs text-[var(--muted)] mb-1">
                                                            <CloudSun className="h-3 w-3" />
                                                            <span>Noon</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="2"
                                                            value={med.noon || "0"}
                                                            onChange={(e) => {
                                                                const val = Math.min(2, Math.max(0, parseInt(e.target.value) || 0)).toString();
                                                                updateMedication(i, "noon", val);
                                                            }}
                                                            className="w-12 h-10 text-center border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
                                                        />
                                                    </div>

                                                    <span className="text-[var(--muted)] h-10 flex items-center">-</span>

                                                    {/* Night */}
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-1 text-xs text-[var(--muted)] mb-1">
                                                            <Moon className="h-3 w-3" />
                                                            <span>PM</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="2"
                                                            value={med.night || "0"}
                                                            onChange={(e) => {
                                                                const val = Math.min(2, Math.max(0, parseInt(e.target.value) || 0)).toString();
                                                                updateMedication(i, "night", val);
                                                            }}
                                                            className="w-12 h-10 text-center border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Computed dosage string */}
                                                <p className="text-xs text-[var(--muted)] mt-2">
                                                    Dosage: {med.morning || "0"}-{med.noon || "0"}-{med.night || "0"}
                                                </p>
                                            </div>

                                            {/* Timing */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wide mb-2">
                                                    Timing
                                                </label>
                                                {/* Spacer to match AM/Noon/PM row */}
                                                <div className="text-xs text-transparent mb-1">spacer</div>
                                                <select
                                                    value={med.timing}
                                                    onChange={(e) =>
                                                        updateMedication(i, "timing", e.target.value)
                                                    }
                                                    className="w-[160px] h-10 px-4 border-2 border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none"
                                                >
                                                    <option value="After food">After food</option>
                                                    <option value="Before food">Before food</option>
                                                    <option value="Empty stomach">Empty stomach</option>
                                                    <option value="Anytime">Anytime</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wide">
                                                Duration
                                            </label>
                                            <input
                                                type="text"
                                                value={med.duration}
                                                onChange={(e) =>
                                                    updateMedication(i, "duration", e.target.value)
                                                }
                                                placeholder="e.g., 5 days"
                                                className="w-full h-10 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

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

                    {/* Complete Button */}
                    <button
                        onClick={handleComplete}
                        disabled={loading}
                        className="w-full h-14 flex items-center justify-center gap-3 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-50"
                    >
                        <CheckCircle className="h-5 w-5" />
                        {loading ? "Saving..." : "Complete Consultation"}
                    </button>
                </div>
            )}
        </div>
    );
}
