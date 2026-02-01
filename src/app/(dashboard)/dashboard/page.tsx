'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Users, FileText, Clock, Plus, Settings, ChevronRight, Loader2, CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface DoctorProfile {
    full_name: string
    clinic_name: string | null
}

interface DashboardStats {
    todaysConsultations: number
    totalPatients: number
    pendingNotes: number
}

interface GettingStartedStatus {
    clinicConfigured: boolean
    hasPatients: boolean
    hasConsultations: boolean
}

export default function DashboardPage() {
    const [doctor, setDoctor] = useState<DoctorProfile | null>(null)
    const [stats, setStats] = useState<DashboardStats>({
        todaysConsultations: 0,
        totalPatients: 0,
        pendingNotes: 0
    })
    const [gettingStarted, setGettingStarted] = useState<GettingStartedStatus>({
        clinicConfigured: false,
        hasPatients: false,
        hasConsultations: false
    })
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // Fetch doctor profile
                const { data: doctorData } = await supabase
                    .from('doctors')
                    .select('full_name, clinic_name')
                    .eq('user_id', user.id)
                    .single()

                if (doctorData) {
                    setDoctor(doctorData)

                    // Check if clinic is configured (has name)
                    setGettingStarted(prev => ({
                        ...prev,
                        clinicConfigured: !!doctorData.clinic_name && doctorData.clinic_name.trim() !== ''
                    }))
                }

                // Fetch total patients count
                const { count: patientCount } = await supabase
                    .from('patients')
                    .select('*', { count: 'exact', head: true })

                const totalPatients = patientCount || 0
                setStats(prev => ({ ...prev, totalPatients }))
                setGettingStarted(prev => ({ ...prev, hasPatients: totalPatients > 0 }))

                // Fetch today's consultations count
                const today = new Date().toISOString().split('T')[0]
                const { count: todayCount } = await supabase
                    .from('consultations')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', today)

                setStats(prev => ({ ...prev, todaysConsultations: todayCount || 0 }))

                // Fetch total consultations (for getting started)
                const { count: totalConsultations } = await supabase
                    .from('consultations')
                    .select('*', { count: 'exact', head: true })

                setGettingStarted(prev => ({ ...prev, hasConsultations: (totalConsultations || 0) > 0 }))

                // Fetch pending notes (consultations without completed clinical notes)
                const { count: pendingCount } = await supabase
                    .from('consultations')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'in_progress')

                setStats(prev => ({ ...prev, pendingNotes: pendingCount || 0 }))

            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [supabase])

    const displayName = doctor?.full_name || 'Doctor'

    // Calculate completion percentage
    const completedSteps = [
        gettingStarted.clinicConfigured,
        gettingStarted.hasPatients,
        gettingStarted.hasConsultations
    ].filter(Boolean).length
    const allComplete = completedSteps === 3

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight mb-1">Dashboard</h1>
                <p className="text-muted-foreground font-mono text-xs">
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading...
                        </span>
                    ) : (
                        `Welcome back, ${displayName}. Here's your clinic's operational status.`
                    )}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* LEFT ZONE - 70% */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Stats Grid */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Operational Metrics</h2>
                            <span className="text-[0.65rem] font-mono text-muted-foreground/70">
                                {loading ? 'LOADING...' : 'LIVE'}
                            </span>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Today's Consultations"
                                value={loading ? '--' : stats.todaysConsultations.toString()}
                                label="Scheduled"
                                icon={CalendarDays}
                            />
                            <StatCard
                                title="Total Patients"
                                value={loading ? '--' : stats.totalPatients.toString()}
                                label="Registered"
                                icon={Users}
                            />
                            <StatCard
                                title="Pending Notes"
                                value={loading ? '--' : stats.pendingNotes.toString()}
                                label="Action Required"
                                icon={FileText}
                            />
                            <StatCard
                                title="Avg. Time"
                                value="--"
                                label="Per Patient"
                                icon={Clock}
                            />
                        </div>
                    </section>

                    {/* Quick Actions */}
                    <section className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Actions</h2>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <Link href="/dashboard/consultations/new" className="block">
                                <Button className="w-full h-12 text-sm font-bold gap-2 shadow-none border-2 border-foreground hover:bg-foreground hover:text-background transition-all" variant="default">
                                    <Plus className="h-4 w-4" />
                                    Start New Consultation
                                </Button>
                            </Link>
                            <Link href="/dashboard/patients" className="block">
                                <Button className="w-full h-12 text-sm font-medium gap-2 shadow-none border-2 border-border-light bg-transparent hover:border-foreground transition-all" variant="outline">
                                    <Users className="h-4 w-4" />
                                    Add New Patient
                                </Button>
                            </Link>
                        </div>
                    </section>
                </div>

                {/* RIGHT ZONE - 30% */}
                <div className="lg:col-span-4 space-y-12">
                    {/* Getting Started */}
                    <section className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">System Status</h2>
                        <Card className="border-border-light bg-card/50">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle>Getting Started</CardTitle>
                                    {allComplete && (
                                        <span className="text-xs text-green-500 font-bold uppercase">✓ Complete</span>
                                    )}
                                </div>
                                <CardDescription>
                                    {allComplete
                                        ? 'hearMD is fully activated!'
                                        : `${completedSteps}/3 steps completed`
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Step 1: Configure Clinic */}
                                <Link href="/dashboard/settings" className="block">
                                    <div className={`flex gap-4 group cursor-pointer ${gettingStarted.clinicConfigured ? 'opacity-60' : ''}`}>
                                        <div className={`h-6 w-6 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${gettingStarted.clinicConfigured
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-foreground group-hover:bg-foreground group-hover:text-background'
                                            }`}>
                                            {gettingStarted.clinicConfigured ? <CheckCircle2 className="h-4 w-4" /> : '1'}
                                        </div>
                                        <div className="space-y-1">
                                            <p className={`text-sm font-bold ${!gettingStarted.clinicConfigured ? 'group-hover:underline decoration-1 underline-offset-4' : ''}`}>
                                                Configure clinic details
                                                {gettingStarted.clinicConfigured && <span className="text-green-500 ml-2">✓</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Add your clinic name and branding</p>
                                        </div>
                                    </div>
                                </Link>

                                {/* Step 2: Add Patient */}
                                <Link href="/dashboard/patients" className="block">
                                    <div className={`flex gap-4 group cursor-pointer ${gettingStarted.hasPatients ? 'opacity-60' : ''}`}>
                                        <div className={`h-6 w-6 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${gettingStarted.hasPatients
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : !gettingStarted.clinicConfigured
                                                    ? 'border-border-light bg-sidebar-accent text-muted-foreground'
                                                    : 'border-foreground group-hover:bg-foreground group-hover:text-background'
                                            }`}>
                                            {gettingStarted.hasPatients ? <CheckCircle2 className="h-4 w-4" /> : '2'}
                                        </div>
                                        <div className={`space-y-1 ${!gettingStarted.clinicConfigured && !gettingStarted.hasPatients ? 'opacity-60' : ''}`}>
                                            <p className={`text-sm font-bold ${gettingStarted.clinicConfigured && !gettingStarted.hasPatients ? 'group-hover:underline decoration-1 underline-offset-4' : ''}`}>
                                                Add your first patient
                                                {gettingStarted.hasPatients && <span className="text-green-500 ml-2">✓</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Register patients in the system</p>
                                        </div>
                                    </div>
                                </Link>

                                {/* Step 3: Start Consultation */}
                                <Link href="/dashboard/consultations/new" className="block">
                                    <div className={`flex gap-4 group cursor-pointer ${gettingStarted.hasConsultations ? 'opacity-60' : ''}`}>
                                        <div className={`h-6 w-6 shrink-0 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${gettingStarted.hasConsultations
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : !gettingStarted.hasPatients
                                                    ? 'border-border-light bg-sidebar-accent text-muted-foreground'
                                                    : 'border-foreground group-hover:bg-foreground group-hover:text-background'
                                            }`}>
                                            {gettingStarted.hasConsultations ? <CheckCircle2 className="h-4 w-4" /> : '3'}
                                        </div>
                                        <div className={`space-y-1 ${!gettingStarted.hasPatients && !gettingStarted.hasConsultations ? 'opacity-60' : ''}`}>
                                            <p className={`text-sm font-bold ${gettingStarted.hasPatients && !gettingStarted.hasConsultations ? 'group-hover:underline decoration-1 underline-offset-4' : ''}`}>
                                                Start a consultation
                                                {gettingStarted.hasConsultations && <span className="text-green-500 ml-2">✓</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Record and document your first OPD visit</p>
                                        </div>
                                    </div>
                                </Link>
                            </CardContent>
                        </Card>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Shortcuts</h2>
                        <div className="space-y-2">
                            <Link href="/dashboard/settings">
                                <Button variant="ghost" className="w-full justify-between h-auto py-3 px-4 hover:bg-sidebar-accent border border-transparent hover:border-border-light">
                                    <span className="flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        <span className="font-mono text-xs">Clinic Settings</span>
                                    </span>
                                    <ChevronRight className="h-3 w-3 opacity-50" />
                                </Button>
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, label, icon: Icon }: { title: string, value: string, label: string, icon: React.ComponentType<{ className?: string }> }) {
    return (
        <Card className="border border-border-light bg-sidebar/50 shadow-none hover:border-foreground transition-colors group">
            <CardContent className="p-6 flex flex-col items-start gap-4 h-full justify-between">
                <div className="flex items-center justify-between w-full">
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="space-y-1">
                    <div className="text-3xl font-mono font-bold tracking-tighter">{value}</div>
                    <div className="flex flex-col">
                        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{title}</p>
                        <p className="text-[0.60rem] text-muted-foreground/70">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
