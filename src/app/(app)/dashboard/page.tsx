"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Users, CalendarDays, FileText, Clock } from "lucide-react";

interface DoctorProfile {
    full_name: string;
}

interface DashboardStats {
    todaysConsultations: number;
    totalPatients: number;
    totalConsultations: number;
}

interface RecentPatient {
    id: string;
    patient_number: string;
    name: string;
    created_at: string;
}

export default function DashboardPage() {
    const supabase = createClient();
    const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        todaysConsultations: 0,
        totalPatients: 0,
        totalConsultations: 0,
    });
    const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch doctor
                const { data: doctorData } = await supabase
                    .from("doctors")
                    .select("full_name")
                    .eq("user_id", user.id)
                    .single();

                if (doctorData) setDoctor(doctorData);

                // Fetch stats
                const today = new Date().toISOString().split("T")[0];

                const { count: patientCount } = await supabase
                    .from("patients")
                    .select("*", { count: "exact", head: true });

                const { count: consultationCount } = await supabase
                    .from("consultations")
                    .select("*", { count: "exact", head: true });

                const { count: todayCount } = await supabase
                    .from("consultations")
                    .select("*", { count: "exact", head: true })
                    .gte("created_at", today);

                setStats({
                    totalPatients: patientCount || 0,
                    totalConsultations: consultationCount || 0,
                    todaysConsultations: todayCount || 0,
                });

                // Fetch recent patients
                const { data: patients } = await supabase
                    .from("patients")
                    .select("id, patient_number, name, created_at")
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (patients) setRecentPatients(patients);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [supabase]);

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        return d.toLocaleDateString();
    };

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-sm text-[var(--muted)]">
                    {loading
                        ? "Loading..."
                        : `Welcome back, ${doctor?.full_name || "Doctor"}`}
                </p>
            </div>

            {/* Quick Actions */}
            <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/consultations/new">
                        <button className="w-full h-14 flex items-center justify-center gap-3 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity">
                            <Plus className="h-5 w-5" />
                            Start New Consultation
                        </button>
                    </Link>
                    <Link href="/patients">
                        <button className="w-full h-14 flex items-center justify-center gap-3 border-2 border-[var(--border)] text-sm font-bold uppercase tracking-wide hover:bg-black/5 transition-colors">
                            <Users className="h-5 w-5" />
                            View All Patients
                        </button>
                    </Link>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                    Statistics
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Today"
                        value={loading ? "--" : stats.todaysConsultations.toString()}
                        label="Consultations"
                        icon={CalendarDays}
                    />
                    <StatCard
                        title="Total"
                        value={loading ? "--" : stats.totalPatients.toString()}
                        label="Patients"
                        icon={Users}
                    />
                    <StatCard
                        title="Total"
                        value={loading ? "--" : stats.totalConsultations.toString()}
                        label="Consultations"
                        icon={FileText}
                    />
                    <StatCard
                        title="Avg Time"
                        value="--"
                        label="Per Patient"
                        icon={Clock}
                    />
                </div>
            </section>

            {/* Recent Patients */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                        Recent Patients
                    </h2>
                    <Link
                        href="/patients"
                        className="text-xs font-bold uppercase tracking-wide hover:underline"
                    >
                        View All →
                    </Link>
                </div>
                <div className="border-2 border-[var(--border)]">
                    {loading ? (
                        <div className="p-6 text-center text-[var(--muted)]">Loading...</div>
                    ) : recentPatients.length === 0 ? (
                        <div className="p-6 text-center text-[var(--muted)]">
                            No patients yet. Start your first consultation!
                        </div>
                    ) : (
                        <div className="divide-y-2 divide-[var(--border)]">
                            {recentPatients.map((patient) => (
                                <Link
                                    key={patient.id}
                                    href={`/patients/${patient.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-black/5 transition-colors"
                                >
                                    <div>
                                        <p className="font-bold">{patient.name}</p>
                                        <p className="text-xs text-[var(--muted)]">
                                            {patient.patient_number} • Added {formatDate(patient.created_at)}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold">→</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function StatCard({
    title,
    value,
    label,
    icon: Icon,
}: {
    title: string;
    value: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <div className="p-6 border-2 border-[var(--border)] space-y-4">
            <Icon className="h-5 w-5 text-[var(--muted)]" />
            <div>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                <p className="text-xs text-[var(--muted)] uppercase tracking-wide">
                    {title} {label}
                </p>
            </div>
        </div>
    );
}
