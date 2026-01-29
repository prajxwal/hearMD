// Database types for hearMD

export interface Clinic {
    id: string
    name: string
    slug: string
    logo_url: string | null
    primary_color: string
    secondary_color: string
    address: string | null
    phone: string | null
    email: string | null
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    clinic_id: string
    email: string
    name: string
    role: 'doctor' | 'admin' | 'staff'
    qualification: string | null
    registration_no: string | null
    signature_url: string | null
    created_at: string
    updated_at: string
}

export interface Patient {
    id: string
    clinic_id: string
    name: string
    phone: string | null
    email: string | null
    date_of_birth: string | null
    gender: string | null
    blood_group: string | null
    allergies: string[]
    chronic_conditions: string[]
    created_at: string
    updated_at: string
}

export interface Consultation {
    id: string
    clinic_id: string
    patient_id: string
    doctor_id: string
    consultation_date: string
    status: 'in_progress' | 'completed' | 'cancelled'
    audio_url: string | null
    audio_duration_seconds: number | null
    raw_transcript: string | null
    created_at: string
    updated_at: string
}

export interface ChiefComplaint {
    complaint: string
    duration: string
    severity: string
}

export interface Vitals {
    bp: string
    pulse: string
    temp: string
    weight: string
    spo2: string
}

export interface ClinicalNote {
    id: string
    consultation_id: string
    chief_complaints: ChiefComplaint[]
    history_present_illness: string | null
    past_medical_history: string | null
    family_history: string | null
    allergies: string[]
    vitals: Vitals | null
    general_examination: string | null
    systemic_examination: Record<string, string> | null
    provisional_diagnosis: string[]
    differential_diagnosis: string[]
    investigations_advised: string[]
    advice: string | null
    follow_up_date: string | null
    ai_generated: boolean
    doctor_approved: boolean
    approved_at: string | null
    created_at: string
    updated_at: string
}

export interface Medication {
    medicine_id: string
    name: string
    dosage: string
    morning: boolean
    afternoon: boolean
    night: boolean
    duration: string
    instructions: string
}

// Helper to generate frequency string like "1-0-1"
export function getFrequencyString(med: Medication): string {
    const m = med.morning ? '1' : '0'
    const a = med.afternoon ? '1' : '0'
    const n = med.night ? '1' : '0'
    return `${m}-${a}-${n}`
}

export interface Prescription {
    id: string
    consultation_id: string
    medications: Medication[]
    pdf_url: string | null
    created_at: string
    updated_at: string
}

export interface Medicine {
    id: string
    name: string
    generic_name: string | null
    brand_names: string[]
    category: string | null
    form: string | null
    strengths: string[]
    common_dosages: string[]
    created_at: string
}

// Form/Input types
export interface ConsultationFormData {
    patient_id: string
    notes: string
}

export interface PatientFormData {
    name: string
    phone?: string
    email?: string
    date_of_birth?: string
    gender?: string
    blood_group?: string
}
