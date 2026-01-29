-- hearMD Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clinics (Tenants)
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- White-label branding
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#0066CC',
    secondary_color VARCHAR(7) DEFAULT '#F5F5F5',
    
    -- Contact
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (Doctors, Staff) - extends Supabase Auth
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('doctor', 'admin', 'staff')),
    qualification VARCHAR(255),
    registration_no VARCHAR(100),
    signature_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    
    -- Persistent medical info
    allergies TEXT[] DEFAULT '{}',
    chronic_conditions TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultations (OPD Visits)
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) NOT NULL,
    doctor_id UUID REFERENCES users(id) NOT NULL,
    
    consultation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    
    -- Audio
    audio_url TEXT,
    audio_duration_seconds INTEGER,
    
    -- Raw transcript (internal use)
    raw_transcript TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical Notes (Structured)
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
    
    -- Structured fields
    chief_complaints JSONB DEFAULT '[]',
    history_present_illness TEXT,
    past_medical_history TEXT,
    family_history TEXT,
    allergies TEXT[] DEFAULT '{}',
    
    -- Vitals
    vitals JSONB,
    
    -- Examination
    general_examination TEXT,
    systemic_examination JSONB,
    
    -- Assessment
    provisional_diagnosis TEXT[] DEFAULT '{}',
    differential_diagnosis TEXT[] DEFAULT '{}',
    
    -- Plan
    investigations_advised TEXT[] DEFAULT '{}',
    advice TEXT,
    follow_up_date DATE,
    
    -- AI metadata
    ai_generated BOOLEAN DEFAULT TRUE,
    doctor_approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
    
    medications JSONB NOT NULL DEFAULT '[]',
    
    pdf_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medicine Database
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_names TEXT[] DEFAULT '{}',
    
    category VARCHAR(100),
    form VARCHAR(50),
    strengths TEXT[] DEFAULT '{}',
    
    common_dosages TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_users_clinic ON users(clinic_id);
CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_consultations_clinic ON consultations(clinic_id);
CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_consultations_date ON consultations(consultation_date DESC);
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_generic ON medicines(generic_name);

-- Enable Row Level Security
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their clinic's data

-- Clinics: Users can read their own clinic
CREATE POLICY "Users can view their clinic" ON clinics
    FOR SELECT USING (
        id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    );

-- Users: Users can view users in their clinic
CREATE POLICY "Users can view clinic members" ON users
    FOR SELECT USING (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    );

-- Patients: Users can CRUD patients in their clinic
CREATE POLICY "Users can view clinic patients" ON patients
    FOR SELECT USING (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert clinic patients" ON patients
    FOR INSERT WITH CHECK (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update clinic patients" ON patients
    FOR UPDATE USING (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    );

-- Consultations: Users can CRUD consultations in their clinic
CREATE POLICY "Users can view clinic consultations" ON consultations
    FOR SELECT USING (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert clinic consultations" ON consultations
    FOR INSERT WITH CHECK (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update clinic consultations" ON consultations
    FOR UPDATE USING (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    );

-- Clinical Notes: Access through consultation's clinic
CREATE POLICY "Users can view clinic clinical notes" ON clinical_notes
    FOR SELECT USING (
        consultation_id IN (
            SELECT id FROM consultations 
            WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can insert clinical notes" ON clinical_notes
    FOR INSERT WITH CHECK (
        consultation_id IN (
            SELECT id FROM consultations 
            WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can update clinical notes" ON clinical_notes
    FOR UPDATE USING (
        consultation_id IN (
            SELECT id FROM consultations 
            WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        )
    );

-- Prescriptions: Access through consultation's clinic
CREATE POLICY "Users can view clinic prescriptions" ON prescriptions
    FOR SELECT USING (
        consultation_id IN (
            SELECT id FROM consultations 
            WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can insert prescriptions" ON prescriptions
    FOR INSERT WITH CHECK (
        consultation_id IN (
            SELECT id FROM consultations 
            WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can update prescriptions" ON prescriptions
    FOR UPDATE USING (
        consultation_id IN (
            SELECT id FROM consultations 
            WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        )
    );

-- Medicines: Public read access (no RLS needed for read)
CREATE POLICY "Anyone can view medicines" ON medicines
    FOR SELECT USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clinical_notes_updated_at BEFORE UPDATE ON clinical_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
