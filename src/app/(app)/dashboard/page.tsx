"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Users, CalendarDays, FileText, Clock } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { useDoctor } from "@/lib/doctor-context";
import { PageHeader, SectionLabel, EmptyState, DashboardSkeleton } from "@/components/ui";
import { Button } from "@/components/ui";
import type { DashboardStats, RecentPatient } from "@/lib/types";

export default function DashboardPage() {
    const { doctor, loading: doctorLoading } = useDoctor();
    const [stats, setStats] = useState<DashboardStats>({
        todaysConsultations: 0,
        totalPatients: 0,
        totalConsultations: 0,
    });
    const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        async function fetchData() {
            try {
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
    }, []);

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="space-y-12">
            <PageHeader
                title="Dashboard"
                subtitle={
                    doctorLoading
                        ? "Loading..."
                        : `Welcome back, ${doctor?.full_name || "Doctor"}`
                }
            />

            {/* Quick Actions */}
            <section className="space-y-4">
                <SectionLabel>Quick Actions</SectionLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link href="/consultations/new">
                        <Button className="w-full h-14" icon={<Plus className="h-5 w-5" />}>
                            Start New Consultation
                        </Button>
                    </Link>
                    <Link href="/patients">
                        <Button variant="secondary" className="w-full h-14" icon={<Users className="h-5 w-5" />}>
                            View All Patients
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Stats Grid */}
            <section className="space-y-4">
                <SectionLabel>Statistics</SectionLabel>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Today" value={stats.todaysConsultations.toString()} label="Consultations" icon={CalendarDays} />
                    <StatCard title="Total" value={stats.totalPatients.toString()} label="Patients" icon={Users} />
                    <StatCard title="Total" value={stats.totalConsultations.toString()} label="Consultations" icon={FileText} />
                    <StatCard title="Avg Time" value="--" label="Per Patient" icon={Clock} />
                </div>
            </section>

            {/* Recent Patients */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <SectionLabel>Recent Patients</SectionLabel>
                    <Link href="/patients" className="text-xs font-bold uppercase tracking-wide hover:underline">
                        View All →
                    </Link>
                </div>
                <div className="border-2 border-[var(--border)]">
                    {recentPatients.length === 0 ? (
                        <EmptyState message="No patients yet. Start your first consultation!" />
                    ) : (
                        <div className="divide-y-2 divide-[var(--border)]">
                            {recentPatients.map((patient) => (
                                <Link
                                    key={patient.id}
                                    href={`/patients/${patient.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-[var(--foreground)]/5 transition-colors"
                                >
                                    <div>
                                        <p className="font-bold">{patient.name}</p>
                                        <p className="text-xs text-[var(--muted)]">
                                            {patient.patient_number} • Added {formatRelativeDate(patient.created_at)}
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
    title, value, label, icon: Icon,
}: {
    title: string; value: string; label: string; icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <div className="p-6 border-2 border-[var(--border)] space-y-4">
            <Icon className="h-5 w-5 text-[var(--muted)]" />
            <div>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                <p className="text-xs text-[var(--muted)] uppercase tracking-wide">{title} {label}</p>
            </div>
        </div>
    );
}
