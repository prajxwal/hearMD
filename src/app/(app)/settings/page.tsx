"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface DoctorProfile {
    full_name: string;
    email: string;
    registration_number: string;
    specialization: string;
    clinic_name: string | null;
    clinic_address: string | null;
}

export default function SettingsPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<DoctorProfile>({
        full_name: "",
        email: "",
        registration_number: "",
        specialization: "",
        clinic_name: "",
        clinic_address: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("doctors")
                .select("full_name, email, registration_number, specialization, clinic_name, clinic_address")
                .eq("user_id", user.id)
                .single();

            if (data) {
                setProfile({
                    full_name: data.full_name || "",
                    email: data.email || user.email || "",
                    registration_number: data.registration_number || "",
                    specialization: data.specialization || "",
                    clinic_name: data.clinic_name || "",
                    clinic_address: data.clinic_address || "",
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("doctors")
                .update({
                    full_name: profile.full_name,
                    specialization: profile.specialization,
                    clinic_name: profile.clinic_name || null,
                    clinic_address: profile.clinic_address || null,
                })
                .eq("user_id", user.id);

            if (error) throw error;

            toast.success("Settings saved");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to save";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-[var(--muted)]">Loading...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-[var(--muted)]">
                    Manage your profile and clinic information
                </p>
            </div>

            {/* Profile Section */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                    Profile Information
                </h2>

                <div className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wide">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={profile.full_name}
                            onChange={(e) =>
                                setProfile({ ...profile, full_name: e.target.value })
                            }
                            className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                        />
                    </div>

                    {/* Email (readonly) */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wide">
                            Email
                        </label>
                        <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="w-full h-12 px-4 border-2 border-[var(--border)] bg-black/5 text-sm text-[var(--muted)]"
                        />
                    </div>

                    {/* Registration Number (readonly) */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wide">
                            Registration Number
                        </label>
                        <input
                            type="text"
                            value={profile.registration_number}
                            disabled
                            className="w-full h-12 px-4 border-2 border-[var(--border)] bg-black/5 text-sm text-[var(--muted)]"
                        />
                    </div>

                    {/* Specialization */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wide">
                            Specialization
                        </label>
                        <input
                            type="text"
                            value={profile.specialization}
                            onChange={(e) =>
                                setProfile({ ...profile, specialization: e.target.value })
                            }
                            className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                        />
                    </div>
                </div>
            </section>

            {/* Clinic Section */}
            <section className="space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                    Clinic Information
                </h2>

                <div className="space-y-4">
                    {/* Clinic Name */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wide">
                            Clinic Name
                        </label>
                        <input
                            type="text"
                            value={profile.clinic_name || ""}
                            onChange={(e) =>
                                setProfile({ ...profile, clinic_name: e.target.value })
                            }
                            placeholder="Enter clinic name"
                            className="w-full h-12 px-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none"
                        />
                    </div>

                    {/* Clinic Address */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wide">
                            Clinic Address
                        </label>
                        <textarea
                            value={profile.clinic_address || ""}
                            onChange={(e) =>
                                setProfile({ ...profile, clinic_address: e.target.value })
                            }
                            placeholder="Enter clinic address"
                            rows={3}
                            className="w-full p-4 border-2 border-[var(--border)] bg-transparent text-sm focus:outline-none resize-none"
                        />
                    </div>
                </div>
            </section>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-14 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
                {saving ? "Saving..." : "Save Settings"}
            </button>
        </div>
    );
}
