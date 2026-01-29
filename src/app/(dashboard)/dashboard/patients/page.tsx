'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Users, Search, Phone, Mail, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import type { Patient } from '@/types'

export default function PatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // New patient form state
    const [newPatient, setNewPatient] = useState({
        name: '',
        phone: '',
        email: '',
        date_of_birth: '',
        gender: '',
        blood_group: ''
    })

    const handleAddPatient = () => {
        if (!newPatient.name.trim()) {
            toast.error('Patient name is required')
            return
        }

        const patient: Patient = {
            id: crypto.randomUUID(),
            clinic_id: 'demo-clinic',
            name: newPatient.name,
            phone: newPatient.phone || null,
            email: newPatient.email || null,
            date_of_birth: newPatient.date_of_birth || null,
            gender: newPatient.gender || null,
            blood_group: newPatient.blood_group || null,
            allergies: [],
            chronic_conditions: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        setPatients([...patients, patient])
        setNewPatient({ name: '', phone: '', email: '', date_of_birth: '', gender: '', blood_group: '' })
        setIsDialogOpen(false)
        toast.success('Patient added successfully!')
    }

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.includes(searchQuery) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
                    <p className="text-muted-foreground">
                        Manage your patient records
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Patient
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Patient</DialogTitle>
                            <DialogDescription>
                                Enter the patient&apos;s details below.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={newPatient.name}
                                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                                    placeholder="Patient's full name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={newPatient.phone}
                                        onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newPatient.email}
                                        onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                                        placeholder="patient@email.com"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={newPatient.date_of_birth}
                                        onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select
                                        value={newPatient.gender}
                                        onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="blood_group">Blood Group</Label>
                                <Select
                                    value={newPatient.blood_group}
                                    onValueChange={(value) => setNewPatient({ ...newPatient, blood_group: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select blood group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A+">A+</SelectItem>
                                        <SelectItem value="A-">A-</SelectItem>
                                        <SelectItem value="B+">B+</SelectItem>
                                        <SelectItem value="B-">B-</SelectItem>
                                        <SelectItem value="AB+">AB+</SelectItem>
                                        <SelectItem value="AB-">AB-</SelectItem>
                                        <SelectItem value="O+">O+</SelectItem>
                                        <SelectItem value="O-">O-</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddPatient}>
                                Add Patient
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search patients by name, phone, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Patient List */}
            {filteredPatients.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                            {searchQuery ? 'No patients found' : 'No patients yet'}
                        </h3>
                        <p className="text-muted-foreground text-center mb-4">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Add your first patient to get started.'
                            }
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Patient
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPatients.map((patient) => (
                        <Card key={patient.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{patient.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    {patient.gender && <span className="capitalize">{patient.gender}</span>}
                                    {patient.blood_group && <span>• {patient.blood_group}</span>}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {patient.phone && (
                                    <p className="text-sm flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-3 w-3" />
                                        {patient.phone}
                                    </p>
                                )}
                                {patient.email && (
                                    <p className="text-sm flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-3 w-3" />
                                        {patient.email}
                                    </p>
                                )}
                                {patient.date_of_birth && (
                                    <p className="text-sm flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(patient.date_of_birth).toLocaleDateString()}
                                    </p>
                                )}
                                <div className="pt-2">
                                    <Button variant="outline" size="sm" className="w-full">
                                        View Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
