"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DoctorProvider, useDoctor } from "@/lib/doctor-context";
import {
    LayoutDashboard,
    Users,
    Stethoscope,
    Settings,
    Plus,
    LogOut,
    Menu,
    X,
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Consultations", href: "/consultations", icon: Stethoscope },
    { name: "Settings", href: "/settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <DoctorProvider>
            <AppShell>{children}</AppShell>
        </DoctorProvider>
    );
}

function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { doctor } = useDoctor();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            const supabase = createClient();
            await supabase.auth.signOut();
            toast.success("Logged out successfully");
            router.push("/login");
        } catch {
            toast.error("Failed to log out");
        } finally {
            setLoggingOut(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .filter((part) => part.length > 0)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join("");
    };

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-[var(--background)] border-r-2 border-[var(--border)] flex flex-col transform transition-transform lg:transform-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b-2 border-[var(--border)]">
                    <Link href="/dashboard" className="text-xl font-bold tracking-tight">
                        hearMD
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 hover:opacity-70"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 h-12 px-4 text-sm font-bold uppercase tracking-wide border-2 transition-all ${isActive
                                    ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                                    : "bg-transparent text-[var(--foreground)] border-transparent hover:border-[var(--border)]"
                                    }`}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t-2 border-[var(--border)] space-y-4">
                    <Link href="/consultations/new">
                        <button className="w-full h-12 flex items-center justify-center gap-2 bg-[var(--foreground)] text-[var(--background)] text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity">
                            <Plus className="h-4 w-4" />
                            New Consultation
                        </button>
                    </Link>
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full h-12 flex items-center justify-center gap-2 border-2 border-[var(--border)] text-sm font-bold uppercase tracking-wide hover:opacity-80 disabled:opacity-50 transition-opacity"
                    >
                        <LogOut className="h-4 w-4" />
                        {loggingOut ? "Logging out..." : "Logout"}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-6 border-b-2 border-[var(--border)]">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 hover:opacity-70"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold">{doctor?.full_name || "Loading..."}</p>
                            <p className="text-xs text-[var(--muted)]">{doctor?.specialization || ""}</p>
                        </div>
                        <div className="h-10 w-10 flex items-center justify-center border-2 border-[var(--border)] text-sm font-bold">
                            {doctor?.full_name ? getInitials(doctor.full_name) : "--"}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-auto">
                    <div className="max-w-6xl mx-auto">{children}</div>
                </main>

                {/* Footer */}
                <footer className="h-12 flex items-center justify-between px-6 border-t-2 border-[var(--border)] text-xs text-[var(--muted)]">
                    <p>hearMD — AI OPD Assistant</p>
                    <p>Research Use Only</p>
                </footer>
            </div>
        </div>
    );
}
