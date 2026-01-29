import { Button } from '@/components/ui/button'
import { Stethoscope } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex items-center gap-2">
                        <Stethoscope className="h-8 w-8" />
                        <span className="text-2xl font-black uppercase tracking-tight">hearMD</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                        Clinical intelligence for modern practice.
                    </p>
                </div>

                {/* Content */}
                <div className="bg-card border border-border p-8">
                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-[0.65rem] text-muted-foreground uppercase tracking-wider">
                    Secure Access • Encrypted Data
                </p>
            </div>
        </div>
    )
}
