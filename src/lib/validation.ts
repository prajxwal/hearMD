/**
 * Shared validation utilities for hearMD.
 * Every write path should call the appropriate validator before persisting.
 */

// ── Result type ──────────────────────────────────────────────
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

function ok(): ValidationResult {
    return { valid: true, errors: [] };
}

function fail(...msgs: string[]): ValidationResult {
    return { valid: false, errors: msgs };
}

function merge(...results: ValidationResult[]): ValidationResult {
    const errors = results.flatMap((r) => r.errors);
    return { valid: errors.length === 0, errors };
}

// ── Primitives ───────────────────────────────────────────────

/** Non-empty trimmed string with optional max length */
export function requiredString(value: string | null | undefined, fieldLabel: string, maxLen = 500): ValidationResult {
    if (!value || !value.trim()) return fail(`${fieldLabel} is required`);
    if (value.trim().length > maxLen) return fail(`${fieldLabel} must be ${maxLen} characters or fewer`);
    return ok();
}

/** Optional string with max length */
export function optionalString(value: string | null | undefined, fieldLabel: string, maxLen = 500): ValidationResult {
    if (value && value.trim().length > maxLen) return fail(`${fieldLabel} must be ${maxLen} characters or fewer`);
    return ok();
}

/** Indian phone – optional, but if provided must be 10 digits */
export function optionalPhone(value: string | null | undefined): ValidationResult {
    if (!value || !value.trim()) return ok();
    const digits = value.replace(/[\s\-\+\(\)]/g, "");
    if (!/^\d{10,13}$/.test(digits)) return fail("Phone must be 10–13 digits");
    return ok();
}

/** Email format (basic) */
export function validEmail(value: string | null | undefined): ValidationResult {
    if (!value || !value.trim()) return fail("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return fail("Invalid email format");
    return ok();
}

/** Integer within range */
export function intInRange(value: number | string | null | undefined, fieldLabel: string, min: number, max: number): ValidationResult {
    const n = typeof value === "string" ? parseInt(value, 10) : value;
    if (n == null || isNaN(n)) return fail(`${fieldLabel} is required`);
    if (n < min || n > max) return fail(`${fieldLabel} must be between ${min} and ${max}`);
    return ok();
}

// ── Domain validators ────────────────────────────────────────

export function validatePatient(p: { name?: string; age?: number | string; gender?: string; phone?: string | null }): ValidationResult {
    return merge(
        requiredString(p.name, "Patient name", 200),
        intInRange(p.age, "Age", 0, 150),
        p.gender && ["Male", "Female", "Other"].includes(p.gender)
            ? ok()
            : fail("Gender must be Male, Female, or Other"),
        optionalPhone(p.phone),
    );
}

export function validateDoctorProfile(p: { full_name?: string; specialization?: string; clinic_name?: string | null; clinic_address?: string | null }): ValidationResult {
    return merge(
        requiredString(p.full_name, "Full name", 200),
        requiredString(p.specialization, "Specialization", 200),
        optionalString(p.clinic_name, "Clinic name", 300),
        optionalString(p.clinic_address, "Clinic address", 500),
    );
}

export function validatePrescriptionItem(p: { name?: string; morning?: string; noon?: string; night?: string; timing?: string; duration?: string }): ValidationResult {
    return merge(
        requiredString(p.name, "Medication name", 200),
        optionalString(p.duration, "Duration", 100),
    );
}

export function validateConsultationNotes(c: {
    chief_complaint?: string | null;
    diagnosis?: string | null;
    instructions?: string | null;
    prescription?: { name?: string; morning?: string; noon?: string; night?: string; timing?: string; duration?: string }[];
}): ValidationResult {
    const results: ValidationResult[] = [
        optionalString(c.chief_complaint, "Chief complaint", 500),
        optionalString(c.diagnosis, "Diagnosis", 500),
        optionalString(c.instructions, "Instructions", 2000),
    ];

    if (c.prescription) {
        c.prescription.forEach((med, i) => {
            const r = validatePrescriptionItem(med);
            if (!r.valid) {
                results.push(fail(...r.errors.map((e) => `Medication #${i + 1}: ${e}`)));
            }
        });
    }

    return merge(...results);
}
