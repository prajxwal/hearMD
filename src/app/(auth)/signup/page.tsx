"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const specializations = [
    "General Medicine",
    "Pediatrics",
    "Cardiology",
    "Dermatology",
    "Orthopedics",
    "ENT",
    "Gynecology",
    "Other",
];

export default function SignupPage() {
    const router = useRouter();
    const supabase = createClient();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [customSpecialization, setCustomSpecialization] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const validateForm = (): boolean => {
        if (!fullName || fullName.length < 3) {
            toast.error("Full name must be at least 3 characters");
            return false;
        }

        if (!email) {
            toast.error("Email is required");
            return false;
        }

        if (!password || password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return false;
        }

        // Password strength check
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        if (!hasUpper || !hasLower || !hasNumber) {
            toast.error("Password must contain uppercase, lowercase, and a number");
            return false;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return false;
        }

        if (!registrationNumber) {
            toast.error("Medical registration number is required");
            return false;
        }

        if (!specialization) {
            toast.error("Please select a specialization");
            return false;
        }

        if (specialization === "Other" && !customSpecialization) {
            toast.error("Please enter your specialization");
            return false;
        }

        return true;
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Failed to create account");

            // Create doctor profile
            const { error: profileError } = await supabase.from("doctors").insert({
                user_id: authData.user.id,
                full_name: fullName,
                email: email,
                registration_number: registrationNumber,
                specialization: specialization === "Other" ? customSpecialization : specialization,
            });

            if (profileError) throw profileError;

            toast.success(`Welcome, Dr. ${fullName}!`);
            router.push("/dashboard");
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Signup failed";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">hearMD</h1>
                    <p className="text-sm text-[var(--muted)]">Create your account</p>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSignup} className="space-y-6">
                    <div className="space-y-4">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wide">
                                Full Name *
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Dr. Rajesh Kumar"
                                className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-0"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wide">
                                Email *
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="doctor@clinic.com"
                                className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-0"
                                autoComplete="email"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wide">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Min 8 chars, 1 upper, 1 lower, 1 number"
                                    className="w-full h-12 px-4 pr-12 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-0"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase text-[var(--muted)] hover:text-[var(--foreground)]"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wide">
                                Confirm Password *
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-0"
                            />
                        </div>

                        {/* Registration Number */}
                        <div className="space-y-2">
                            <label htmlFor="registrationNumber" className="block text-xs font-bold uppercase tracking-wide">
                                Medical Registration Number *
                            </label>
                            <input
                                id="registrationNumber"
                                type="text"
                                value={registrationNumber}
                                onChange={(e) => setRegistrationNumber(e.target.value)}
                                placeholder="MH-2012-12345"
                                className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-0"
                            />
                        </div>

                        {/* Specialization */}
                        <div className="space-y-2">
                            <label htmlFor="specialization" className="block text-xs font-bold uppercase tracking-wide">
                                Specialization *
                            </label>
                            <select
                                id="specialization"
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                                className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-0"
                            >
                                <option value="">Select specialization</option>
                                {specializations.map((spec) => (
                                    <option key={spec} value={spec}>
                                        {spec}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Custom Specialization */}
                        {specialization === "Other" && (
                            <div className="space-y-2">
                                <label htmlFor="customSpecialization" className="block text-xs font-bold uppercase tracking-wide">
                                    Your Specialization *
                                </label>
                                <input
                                    id="customSpecialization"
                                    type="text"
                                    value={customSpecialization}
                                    onChange={(e) => setCustomSpecialization(e.target.value)}
                                    placeholder="Enter your specialization"
                                    className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none focus:ring-0"
                                />
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-sm text-[var(--muted)]">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[var(--foreground)] font-bold hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
