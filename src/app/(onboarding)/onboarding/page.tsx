'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Stethoscope, Briefcase, Building2, FileBadge } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OnboardingPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const fullName = formData.get('full_name') as string
        const specialization = formData.get('specialization') as string
        const clinicName = formData.get('clinic_name') as string
        const registrationNumber = formData.get('registration_number') as string

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError || !user) {
                throw new Error('User not authenticated')
            }

            const { error } = await supabase.from('doctors').insert({
                user_id: user.id,
                full_name: fullName,
                specialization: specialization,
                clinic_name: clinicName,
                registration_number: registrationNumber || null,
            })

            if (error) throw error

            toast.success('Profile completed successfully')
            router.refresh()
            router.replace('/dashboard/consultations/new')

        } catch (error) {
            console.error('Onboarding error:', error)
            toast.error('Failed to create profile. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-black uppercase tracking-tight">Complete your profile</h1>
                    <p className="text-muted-foreground font-mono text-sm">
                        This helps us prepare your consultation workspace
                    </p>
                </div>

                <Card className="border-border">
                    <CardHeader className="pb-4">
                        <CardTitle>Doctor Details</CardTitle>
                        <CardDescription>Enter your professional information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name *</Label>
                                <div className="relative">
                                    <Stethoscope className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="full_name" name="full_name" required className="pl-9" placeholder="Dr. John Doe" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="specialization">Specialization *</Label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="specialization" name="specialization" required className="pl-9" placeholder="Cardiologist, General Physician..." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="clinic_name">Clinic Name *</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="clinic_name" name="clinic_name" required className="pl-9" placeholder="City Health Clinic" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="registration_number">Registration Number <span className="text-muted-foreground font-normal ml-1">(Optional)</span></Label>
                                <div className="relative">
                                    <FileBadge className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="registration_number" name="registration_number" className="pl-9" placeholder="Medical Council Reg. No." />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 font-bold uppercase mt-2" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Setting up Workspace...
                                    </>
                                ) : (
                                    'Continue to Start Consultation'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
