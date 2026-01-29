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

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            })

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Account created successfully! You can now sign in.')
            // Auto login logic or redirect to login? 
            // Supabase auto signs in on signup if confirm not required, 
            // but usually best to just let them login or handle session.
            // For simplicity/speed -> redirect to login or dashboard.
            // If email confirm is on, they need to check email.
            // Assuming default Supabase setup, email confirm might be on.
            // But user said "no extra fields", implying fast access.

            router.push('/login')
        } catch (error) {
            console.error('Signup error:', error)
            toast.error('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-xl font-bold uppercase tracking-tight">Create Account</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Join hearMD to streamline your OPD
                </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
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
                    <Label htmlFor="password">Password</Label>
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
                            Creating Account...
                        </>
                    ) : (
                        'Sign Up'
                    )}
                </Button>
            </form>

            <div className="text-center text-xs">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="font-bold hover:underline">
                    Login
                </Link>
            </div>
        </div>
    )
}
