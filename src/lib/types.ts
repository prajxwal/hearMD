/**
 * Shared TypeScript interfaces for hearMD.
 *
 * Centralises types that were previously duplicated across multiple page files.
 */

// ── Patient ─────────────────────────────────────────────────

export interface Patient {
    id: string;
    patient_number: string;
    name: string;
    age: number;
    gender: string;
    phone: string | null;
    created_at: string;
}

/** Lighter version returned by search / select queries. */
export type PatientSummary = Pick<Patient, "id" | "patient_number" | "name" | "age" | "gender">;

// ── Doctor ──────────────────────────────────────────────────

export interface DoctorProfile {
    full_name: string;
    specialization: string;
    email?: string;
    registration_number?: string;
    clinic_name?: string | null;
    clinic_address?: string | null;
}

// ── Prescription ────────────────────────────────────────────

export interface Prescription {
    name: string;
    morning: string;
    noon: string;
    night: string;
    timing: string;
    duration: string;
}

// ── Consultation ────────────────────────────────────────────

export interface Consultation {
    id: string;
    created_at: string;
    status: ConsultationStatus;
    diagnosis: string | null;
    patient: PatientSummary;
}

export interface ConsultationDetail {
    id: string;
    created_at: string;
    status: ConsultationStatus;
    transcript: string | null;
    chief_complaint: string | null;
    history_of_present_illness: string[];
    past_medical_history: string[];
    examination: string[];
    diagnosis: string | null;
    prescription: Prescription[];
    instructions: string | null;
    patient: PatientSummary;
}

export interface ConsultationEditForm {
    chief_complaint: string;
    history_of_present_illness: string[];
    past_medical_history: string[];
    examination: string[];
    diagnosis: string;
    prescription: Prescription[];
    instructions: string;
}

export type ConsultationStatus = "draft" | "recording" | "completed";

// ── Consultation for Patient Detail ─────────────────────────

export interface PatientConsultation {
    id: string;
    created_at: string;
    status: string;
    chief_complaint: string | null;
    diagnosis: string | null;
    prescription: { name: string }[] | null;
    instructions: string | null;
}

// ── Prescription page (includes doctor info) ────────────────

export interface PrescriptionPageData {
    created_at: string;
    chief_complaint: string | null;
    history_of_present_illness: string[];
    diagnosis: string | null;
    prescription: Prescription[];
    instructions: string | null;
    patient: Pick<Patient, "name" | "age" | "gender" | "patient_number">;
    doctor: Required<Pick<DoctorProfile, "full_name" | "registration_number" | "specialization">> &
    Pick<DoctorProfile, "clinic_name" | "clinic_address">;
}

// ── Dashboard ───────────────────────────────────────────────

export interface DashboardStats {
    todaysConsultations: number;
    totalPatients: number;
    totalConsultations: number;
}

export interface RecentPatient {
    id: string;
    patient_number: string;
    name: string;
    created_at: string;
}

// ── Status styling helper ───────────────────────────────────

/**
 * Returns Tailwind classes for a consultation status badge.
 * Consolidated from 3 duplicate implementations.
 */
export function getStatusStyle(status: string): string {
    switch (status) {
        case "completed":
            return "bg-[var(--foreground)] text-[var(--background)]";
        case "recording":
            return "bg-[var(--foreground)]/20";
        default:
            return "border-2 border-[var(--border)]";
    }
}
