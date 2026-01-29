import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Users, FileText, Clock, Plus, Settings, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight mb-1">Dashboard</h1>
                <p className="text-muted-foreground font-mono text-xs">
                    Welcome back, Dr. Demo. Here represents your clinic's operational status.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* LEFT ZONE - 70% */}
                <div className="lg:col-span-8 space-y-12">
                    {/* Stats Grid */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Operational Metrics</h2>
                            <span className="text-[0.65rem] font-mono text-muted-foreground/70">LIVE UPDATE</span>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                title="Today's Consultations"
                                value="0"
                                label="Scheduled"
                                icon={CalendarDays}
                            />
                            <StatCard
                                title="Total Patients"
                                value="0"
                                label="Registered"
                                icon={Users}
                            />
                            <StatCard
                                title="Pending Notes"
                                value="0"
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
                                <CardTitle>Getting Started</CardTitle>
                                <CardDescription>Complete setup to fully activate hearMD</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex gap-4 group cursor-pointer">
                                    <div className="h-6 w-6 shrink-0 rounded-full border border-foreground flex items-center justify-center text-xs font-bold group-hover:bg-foreground group-hover:text-background transition-colors">1</div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold group-hover:underline decoration-1 underline-offset-4">Configure clinic details</p>
                                        <p className="text-xs text-muted-foreground">Add your clinic name and branding</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 group cursor-pointer">
                                    <div className="h-6 w-6 shrink-0 rounded-full border border-border-light bg-sidebar-accent flex items-center justify-center text-xs font-bold text-muted-foreground">2</div>
                                    <div className="space-y-1 opacity-60">
                                        <p className="text-sm font-bold">Add your first patient</p>
                                        <p className="text-xs text-muted-foreground">Register patients in the system</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 group cursor-pointer">
                                    <div className="h-6 w-6 shrink-0 rounded-full border border-border-light bg-sidebar-accent flex items-center justify-center text-xs font-bold text-muted-foreground">3</div>
                                    <div className="space-y-1 opacity-60">
                                        <p className="text-sm font-bold">Start a consultation</p>
                                        <p className="text-xs text-muted-foreground">Record and document your first OPD visit</p>
                                    </div>
                                </div>
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

function StatCard({ title, value, label, icon: Icon }: { title: string, value: string, label: string, icon: any }) {
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
