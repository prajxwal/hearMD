'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Building2, User, Sun, Moon, Loader2 } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface DoctorProfile {
    id: string
    user_id: string
    full_name: string
    specialization: string
    clinic_name: string
    registration_number: string | null
}

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme()
    const supabase = createClient()

    // Loading states
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Doctor profile state
    const [doctor, setDoctor] = useState<DoctorProfile | null>(null)

    // Form fields
    const [fullName, setFullName] = useState('')
    const [specialization, setSpecialization] = useState('')
    const [clinicName, setClinicName] = useState('')
    const [registrationNumber, setRegistrationNumber] = useState('')

    // Fetch doctor profile on mount
    useEffect(() => {
        async function fetchDoctorProfile() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data, error } = await supabase
                    .from('doctors')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                if (error) throw error

                if (data) {
                    setDoctor(data)
                    setFullName(data.full_name || '')
                    setSpecialization(data.specialization || '')
                    setClinicName(data.clinic_name || '')
                    setRegistrationNumber(data.registration_number || '')
                }
            } catch (error) {
                console.error('Error fetching doctor profile:', error)
                toast.error('Failed to load profile')
            } finally {
                setLoading(false)
            }
        }

        fetchDoctorProfile()
    }, [supabase])

    // Save doctor profile
    const handleSaveProfile = async () => {
        if (!doctor) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('doctors')
                .update({
                    full_name: fullName,
                    specialization: specialization,
                    clinic_name: clinicName,
                    registration_number: registrationNumber || null,
                })
                .eq('id', doctor.id)

            if (error) throw error

            toast.success('Profile saved successfully!')
        } catch (error) {
            console.error('Error saving profile:', error)
            toast.error('Failed to save profile')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-foreground/70">
                    Manage your clinic and account settings
                </p>
            </div>

            {/* Theme Toggle */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        Appearance
                    </CardTitle>
                    <CardDescription>
                        Switch between light and dark theme
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Theme</p>
                            <p className="text-sm text-foreground/70">
                                Current: {theme === 'light' ? 'Light (Black on White)' : 'Dark (White on Black)'}
                            </p>
                        </div>
                        <Button onClick={toggleTheme} className="gap-2">
                            {theme === 'light' ? (
                                <>
                                    <Moon className="h-4 w-4" />
                                    Switch to Dark
                                </>
                            ) : (
                                <>
                                    <Sun className="h-4 w-4" />
                                    Switch to Light
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Doctor Profile */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Doctor Profile
                    </CardTitle>
                    <CardDescription>
                        Your professional details for prescriptions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="full-name">Full Name</Label>
                            <Input
                                id="full-name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Dr. Full Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="specialization">Specialization</Label>
                            <Input
                                id="specialization"
                                value={specialization}
                                onChange={(e) => setSpecialization(e.target.value)}
                                placeholder="Cardiology, General Medicine..."
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="clinic-name">Clinic Name</Label>
                            <Input
                                id="clinic-name"
                                value={clinicName}
                                onChange={(e) => setClinicName(e.target.value)}
                                placeholder="Your Clinic Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="registration">Registration Number</Label>
                            <Input
                                id="registration"
                                value={registrationNumber}
                                onChange={(e) => setRegistrationNumber(e.target.value)}
                                placeholder="MCI/State Registration No."
                            />
                        </div>
                    </div>
                    <Button onClick={handleSaveProfile} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Profile'
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Clinic Details - Display Only */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Clinic Details
                    </CardTitle>
                    <CardDescription>
                        Your clinic information (from your profile)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <p className="text-sm">
                            <span className="text-muted-foreground">Clinic: </span>
                            <span className="font-medium">{clinicName || 'Not set'}</span>
                        </p>
                        <p className="text-sm">
                            <span className="text-muted-foreground">Doctor: </span>
                            <span className="font-medium">{fullName || 'Not set'}</span>
                        </p>
                        <p className="text-sm">
                            <span className="text-muted-foreground">Specialization: </span>
                            <span className="font-medium">{specialization || 'Not set'}</span>
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-between items-center text-sm text-foreground/70">
                <p>hearMD v1.0.0 (MVP)</p>
                <p>© 2024 {clinicName || 'Your Clinic Name'}</p>
            </div>
        </div>
    )
}
