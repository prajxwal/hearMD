-- hearMD Database Schema
-- Run these commands in Supabase SQL Editor

-- Enable Row Level Security
ALTER TABLE IF EXISTS doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS consultations ENABLE ROW LEVEL SECURITY;

-- Drop existing tables (be careful in production!)
DROP TABLE IF EXISTS consultations CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

-- Doctors Table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) > 0 AND char_length(full_name) <= 200),
    email TEXT,
    registration_number TEXT NOT NULL CHECK (char_length(trim(registration_number)) > 0 AND char_length(registration_number) <= 100),
    specialization TEXT NOT NULL CHECK (char_length(trim(specialization)) > 0 AND char_length(specialization) <= 200),
    clinic_name TEXT CHECK (clinic_name IS NULL OR char_length(clinic_name) <= 300),
    clinic_address TEXT CHECK (clinic_address IS NULL OR char_length(clinic_address) <= 500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(registration_number)
);

-- Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number TEXT UNIQUE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 200),
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 15),
    created_by UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultations Table
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    consent_logged BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'recording', 'completed')),
    transcript TEXT,
    chief_complaint TEXT CHECK (chief_complaint IS NULL OR char_length(chief_complaint) <= 500),
    history_of_present_illness JSONB DEFAULT '[]'::jsonb,
    past_medical_history JSONB DEFAULT '[]'::jsonb,
    examination JSONB DEFAULT '[]'::jsonb,
    diagnosis TEXT CHECK (diagnosis IS NULL OR char_length(diagnosis) <= 500),
    prescription JSONB DEFAULT '[]'::jsonb,
    instructions TEXT CHECK (instructions IS NULL OR char_length(instructions) <= 2000),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctors
CREATE POLICY "Users can view own doctor profile"
    ON doctors FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own doctor profile"
    ON doctors FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own doctor profile"
    ON doctors FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for patients
-- Allow doctors to manage their own patients
CREATE POLICY "Doctors can view own patients"
    ON patients FOR SELECT
    USING (created_by IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can insert patients"
    ON patients FOR INSERT
    WITH CHECK (created_by IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update own patients"
    ON patients FOR UPDATE
    USING (created_by IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can delete own patients"
    ON patients FOR DELETE
    USING (created_by IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- RLS Policies for consultations
CREATE POLICY "Doctors can view own consultations"
    ON consultations FOR SELECT
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can insert consultations"
    ON consultations FOR INSERT
    WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can update own consultations"
    ON consultations FOR UPDATE
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Doctors can delete own consultations"
    ON consultations FOR DELETE
    USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_patients_created_by ON patients(created_by);
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_patient_number ON patients(patient_number);
CREATE INDEX idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_created_at ON consultations(created_at DESC);
