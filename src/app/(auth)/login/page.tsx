'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Signed in successfully')
            router.refresh()
            router.push('/dashboard/consultations/new')
        } catch (error) {
            console.error('Login error:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-xl font-bold uppercase tracking-tight">Login</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Enter your credentials to access the system
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="doctor@clinic.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-10"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10"
                    />
                </div>
                <Button type="submit" className="w-full h-10 font-bold uppercase" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </Button>
            </form>

            <div className="text-center text-xs">
                <span className="text-muted-foreground">Don&apos;t have an account? </span>
                <Link href="/signup" className="font-bold hover:underline">
                    Sign Up
                </Link>
            </div>
        </div>
    )
}
