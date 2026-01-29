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
                "fixed top-0 left-0 z-50 h-full w-64 bg-background border-r border-foreground transform transition-transform duration-200 ease-in-out lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b-2 border-foreground">
                    <div className="flex items-center gap-2">
                        <Stethoscope className="h-6 w-6" />
                        <span className="text-lg font-bold uppercase tracking-tight">hearMD</span>
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
                                    "flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all border border-foreground",
                                    isActive
                                        ? "bg-foreground text-background"
                                        : "bg-[var(--background-alt)] text-foreground hover:bg-foreground hover:text-background"
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
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-foreground">
                    <Link href="/dashboard/consultations/new">
                        <Button variant="primary" className="w-full gap-2">
                            <Plus className="h-4 w-4" />
                            New Consultation
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 flex items-center h-16 px-6 border-b-2 border-foreground bg-background">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden mr-4"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs font-semibold uppercase tracking-wide">Dr. Demo</p>
                            <p className="text-[0.65rem] text-[var(--muted-foreground)]">Demo Clinic</p>
                        </div>
                        <div className="h-9 w-9 border border-foreground flex items-center justify-center">
                            <span className="text-xs font-bold">DD</span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6 max-w-5xl mx-auto">
                    {children}
                </main>

                {/* Footer */}
                <footer className="p-6 border-t border-[var(--border-light)] max-w-5xl mx-auto">
                    <div className="flex justify-between items-center text-[0.65rem] text-[var(--muted-foreground)]">
                        <p>hearMD — AI OPD Assistant</p>
                        <p>Educational/Research Use Only</p>
                    </div>
                </footer>
            </div>
        </div>
    )
}
