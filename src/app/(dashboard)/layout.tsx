'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Stethoscope,
    Users,
    CalendarDays,
    Settings,
    Plus,
    Menu,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: CalendarDays },
    { name: 'Consultations', href: '/dashboard/consultations', icon: Stethoscope },
    { name: 'Patients', href: '/dashboard/patients', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border bg-sidebar">
                    <div className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        <span className="text-lg font-black uppercase tracking-tight">hearMD</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {navigation.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 h-10 text-xs font-bold uppercase tracking-wide transition-all duration-200 shadow-none border-2 hover:translate-x-1",
                                    isActive
                                        ? "bg-foreground text-background border-foreground translate-x-1"
                                        : "bg-transparent text-foreground border-sidebar-border hover:border-foreground"
                                )}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* New Consultation Button */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-sidebar-border">
                    <Link href="/dashboard/consultations/new">
                        <Button variant="default" className="w-full h-10 text-xs gap-2 font-bold uppercase tracking-wide border-2 border-foreground hover:bg-background hover:text-foreground shadow-none transition-all duration-200 hover:translate-y-[-2px]">
                            <Plus className="h-4 w-4" />
                            New Consultation
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64 flex flex-col h-screen overflow-hidden">
                {/* Top bar */}
                <header className="shrink-0 flex items-center h-16 px-8 border-b border-border-light bg-background">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden mr-4"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-wide">Dr. Demo</p>
                            <p className="text-[0.65rem] text-muted-foreground font-mono">Demo Clinic</p>
                        </div>
                        <div className="h-9 w-9 border border-border flex items-center justify-center bg-muted">
                            <span className="text-xs font-bold">DD</span>
                        </div>
                    </div>
                </header>

                {/* Scrollable Page content */}
                <main className="flex-1 overflow-y-auto p-8 w-full">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>

                {/* Fixed Footer */}
                <footer className="shrink-0 h-[88px] flex items-center border-t border-sidebar-border w-full bg-background px-8">
                    <div className="flex justify-between items-center w-full max-w-[1600px] mx-auto text-[0.65rem] text-muted-foreground uppercase tracking-wider">
                        <p>hearMD — AI OPD Assistant</p>
                        <p>Educational/Research Use Only</p>
                    </div>
                </footer>
            </div>
        </div>
    )
}
