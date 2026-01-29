'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Settings, Building2, Palette, User, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme()

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

            {/* Clinic Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Clinic Details
                    </CardTitle>
                    <CardDescription>
                        Configure your clinic information for prescriptions and reports
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="clinic-name">Clinic Name</Label>
                            <Input id="clinic-name" placeholder="Enter clinic name" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clinic-phone">Phone</Label>
                            <Input id="clinic-phone" placeholder="+91 98765 43210" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clinic-address">Address</Label>
                        <Input id="clinic-address" placeholder="Enter clinic address" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clinic-email">Email</Label>
                        <Input id="clinic-email" type="email" placeholder="clinic@example.com" />
                    </div>
                    <Button>Save Clinic Details</Button>
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
                            <Label htmlFor="doctor-name">Full Name</Label>
                            <Input id="doctor-name" placeholder="Dr. Full Name" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="qualification">Qualification</Label>
                            <Input id="qualification" placeholder="MBBS, MD" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="registration">Registration Number</Label>
                            <Input id="registration" placeholder="MCI/State Registration No." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="specialization">Specialization</Label>
                            <Input id="specialization" placeholder="General Medicine" />
                        </div>
                    </div>
                    <Button>Save Profile</Button>
                </CardContent>
            </Card>

            {/* White Label / Branding */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Branding
                    </CardTitle>
                    <CardDescription>
                        Customize the appearance for patient-facing documents
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="primary-color">Primary Color</Label>
                            <div className="flex gap-2">
                                <Input id="primary-color" type="color" defaultValue="#000000" className="w-16 h-10 p-1" />
                                <Input placeholder="#000000" className="flex-1" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="secondary-color">Secondary Color</Label>
                            <div className="flex gap-2">
                                <Input id="secondary-color" type="color" defaultValue="#FFFFFF" className="w-16 h-10 p-1" />
                                <Input placeholder="#FFFFFF" className="flex-1" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Clinic Logo</Label>
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 border border-foreground flex items-center justify-center text-foreground/70">
                                Logo
                            </div>
                            <Button>Upload Logo</Button>
                        </div>
                        <p className="text-xs text-foreground/70">
                            Recommended: 200x200px, PNG or JPG
                        </p>
                    </div>
                    <Button>Save Branding</Button>
                </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-between items-center text-sm text-foreground/70">
                <p>hearMD v1.0.0 (MVP)</p>
                <p>© 2024 Your Clinic Name</p>
            </div>
        </div>
    )
}
