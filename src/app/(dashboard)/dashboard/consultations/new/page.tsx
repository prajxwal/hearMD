'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { AudioRecorder } from '@/components/audio/AudioRecorder'
import {
    Mic,
    FileText,
    Pill,
    Download,
    Loader2,
    CheckCircle,
    Plus,
    X,
    Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import type { ChiefComplaint, Vitals, Medication } from '@/types'

export default function NewConsultationPage() {
    const [activeTab, setActiveTab] = useState('record')
    const [isProcessing, setIsProcessing] = useState(false)
    const [transcript, setTranscript] = useState('')

    // Clinical note state
    const [chiefComplaints, setChiefComplaints] = useState<ChiefComplaint[]>([])
    const [historyPresentIllness, setHistoryPresentIllness] = useState('')
    const [pastMedicalHistory, setPastMedicalHistory] = useState('')
    const [allergies, setAllergies] = useState<string[]>([])
    const [vitals, setVitals] = useState<Vitals>({
        bp: '', pulse: '', temp: '', weight: '', spo2: ''
    })
    const [examinationFindings, setExaminationFindings] = useState('')
    const [doctorObservations, setDoctorObservations] = useState('')
    const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('')
    const [advice, setAdvice] = useState('')
    const [followUpDate, setFollowUpDate] = useState('')

    // Prescription state
    const [medications, setMedications] = useState<Medication[]>([])
    const [medicineSearch, setMedicineSearch] = useState('')

    const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
        setIsProcessing(true)
        toast.info('Processing audio...')

        try {
            // For MVP, we'll use a placeholder for transcription
            // In production, this would call Whisper WASM or an API

            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Placeholder transcript for demo
            const demoTranscript = `Doctor: Good morning, what brings you here today?
Patient: Doctor, I've been having severe headache for the past 3 days. It's on the right side of my head.
Doctor: I see. Is it continuous or does it come and go?
Patient: It comes and goes, but it's worse in the morning.
Doctor: Any nausea or vomiting?
Patient: Yes, I felt nauseous yesterday.
Doctor: Do you have any history of migraine?
Patient: My mother has migraines.
Doctor: Let me check your vitals. BP is 120/80, pulse 78. Temperature normal.
Doctor: Based on my examination, this appears to be a tension-type headache with some migraine features.`

            setTranscript(demoTranscript)
            toast.success('Audio processed successfully!')

            // Now extract clinical info
            toast.info('Extracting clinical information...')

            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: demoTranscript })
            })

            if (response.ok) {
                const data = await response.json()

                // Populate form fields
                if (data.chief_complaints) setChiefComplaints(data.chief_complaints)
                if (data.history_present_illness) setHistoryPresentIllness(data.history_present_illness)
                if (data.past_medical_history) setPastMedicalHistory(data.past_medical_history)
                if (data.allergies) setAllergies(data.allergies)
                if (data.vitals) setVitals(data.vitals)
                if (data.examination_findings) setExaminationFindings(data.examination_findings)
                if (data.doctor_observations) setDoctorObservations(data.doctor_observations)

                toast.success('Clinical notes generated!')
                setActiveTab('notes')
            } else {
                toast.error('Failed to extract clinical information')
            }
        } catch (error) {
            console.error('Error processing audio:', error)
            toast.error('Error processing audio')
        } finally {
            setIsProcessing(false)
        }
    }

    const addComplaint = () => {
        setChiefComplaints([...chiefComplaints, { complaint: '', duration: '', severity: '' }])
    }

    const updateComplaint = (index: number, field: keyof ChiefComplaint, value: string) => {
        const updated = [...chiefComplaints]
        updated[index][field] = value
        setChiefComplaints(updated)
    }

    const removeComplaint = (index: number) => {
        setChiefComplaints(chiefComplaints.filter((_, i) => i !== index))
    }

    const addMedication = () => {
        setMedications([...medications, {
            medicine_id: crypto.randomUUID(),
            name: '',
            dosage: '',
            morning: false,
            afternoon: false,
            night: false,
            duration: '',
            instructions: ''
        }])
    }

    const updateMedication = (index: number, field: 'name' | 'dosage' | 'duration' | 'instructions', value: string) => {
        const updated = [...medications]
        updated[index][field] = value
        setMedications(updated)
    }

    const updateMedicationBool = (index: number, field: 'morning' | 'afternoon' | 'night', value: boolean) => {
        const updated = [...medications]
        updated[index][field] = value
        setMedications(updated)
    }

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index))
    }

    const handleExportPDF = () => {
        toast.info('PDF export coming soon!')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">New Consultation</h1>
                    <p className="text-muted-foreground">
                        Record the conversation and let AI assist with documentation
                    </p>
                </div>
                <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Assisted
                </Badge>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="record" className="gap-2">
                        <Mic className="h-4 w-4" />
                        Record
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Clinical Notes
                    </TabsTrigger>
                    <TabsTrigger value="prescription" className="gap-2">
                        <Pill className="h-4 w-4" />
                        Prescription
                    </TabsTrigger>
                </TabsList>

                {/* RECORD TAB */}
                <TabsContent value="record" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Record Consultation</CardTitle>
                            <CardDescription>
                                Record the doctor-patient conversation. The AI will help structure the clinical notes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AudioRecorder
                                onRecordingComplete={handleRecordingComplete}
                                disabled={isProcessing}
                            />

                            {isProcessing && (
                                <div className="flex items-center justify-center gap-2 p-4 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Processing audio and extracting clinical information...</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {transcript && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    Transcript
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                    rows={10}
                                    className="font-mono text-sm"
                                />
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* CLINICAL NOTES TAB */}
                <TabsContent value="notes" className="space-y-4">
                    {/* Chief Complaints */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Chief Complaints</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {chiefComplaints.map((complaint, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                        <Input
                                            placeholder="Complaint"
                                            value={complaint.complaint}
                                            onChange={(e) => updateComplaint(index, 'complaint', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Duration"
                                            value={complaint.duration}
                                            onChange={(e) => updateComplaint(index, 'duration', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Severity"
                                            value={complaint.severity}
                                            onChange={(e) => updateComplaint(index, 'severity', e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeComplaint(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addComplaint}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Complaint
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Vitals */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Vitals</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-4">
                                <div className="space-y-2">
                                    <Label>Blood Pressure</Label>
                                    <Input
                                        placeholder="120/80"
                                        value={vitals.bp}
                                        onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Pulse</Label>
                                    <Input
                                        placeholder="72 bpm"
                                        value={vitals.pulse}
                                        onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Temperature</Label>
                                    <Input
                                        placeholder="98.6°F"
                                        value={vitals.temp}
                                        onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Weight</Label>
                                    <Input
                                        placeholder="70 kg"
                                        value={vitals.weight}
                                        onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>SpO2</Label>
                                    <Input
                                        placeholder="98%"
                                        value={vitals.spo2}
                                        onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>History & Observations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>History of Present Illness</Label>
                                <Textarea
                                    value={historyPresentIllness}
                                    onChange={(e) => setHistoryPresentIllness(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Past Medical History</Label>
                                <Textarea
                                    value={pastMedicalHistory}
                                    onChange={(e) => setPastMedicalHistory(e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Examination Findings</Label>
                                <Textarea
                                    value={examinationFindings}
                                    onChange={(e) => setExaminationFindings(e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Doctor&apos;s Observations</Label>
                                <Textarea
                                    value={doctorObservations}
                                    onChange={(e) => setDoctorObservations(e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Diagnosis & Advice */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Diagnosis & Advice</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Provisional Diagnosis</Label>
                                <Input
                                    value={provisionalDiagnosis}
                                    onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                                    placeholder="Enter diagnosis"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Advice</Label>
                                <Textarea
                                    value={advice}
                                    onChange={(e) => setAdvice(e.target.value)}
                                    rows={2}
                                    placeholder="Additional advice for the patient"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Follow-up Date</Label>
                                <Input
                                    type="date"
                                    value={followUpDate}
                                    onChange={(e) => setFollowUpDate(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PRESCRIPTION TAB */}
                <TabsContent value="prescription" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Prescription</CardTitle>
                            <CardDescription>
                                Add medications manually. AI will NOT suggest medicines.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {medications.map((med, index) => (
                                <div key={med.medicine_id} className="p-4 border space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">Medicine {index + 1}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeMedication(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Medicine Name</Label>
                                            <Input
                                                value={med.name}
                                                onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                                placeholder="e.g., Dolo 650"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Dosage</Label>
                                            <Input
                                                value={med.dosage}
                                                onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                                placeholder="e.g., 650mg"
                                            />
                                        </div>
                                    </div>

                                    {/* Morning / Afternoon / Night */}
                                    <div className="space-y-2">
                                        <Label>Frequency</Label>
                                        <div className="flex gap-6 items-center">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`med-${index}-morning`}
                                                    checked={med.morning}
                                                    onCheckedChange={(checked) => updateMedicationBool(index, 'morning', checked as boolean)}
                                                />
                                                <label htmlFor={`med-${index}-morning`} className="text-sm cursor-pointer font-medium">Morning</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`med-${index}-afternoon`}
                                                    checked={med.afternoon}
                                                    onCheckedChange={(checked) => updateMedicationBool(index, 'afternoon', checked as boolean)}
                                                />
                                                <label htmlFor={`med-${index}-afternoon`} className="text-sm cursor-pointer font-medium">Afternoon</label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`med-${index}-night`}
                                                    checked={med.night}
                                                    onCheckedChange={(checked) => updateMedicationBool(index, 'night', checked as boolean)}
                                                />
                                                <label htmlFor={`med-${index}-night`} className="text-sm cursor-pointer font-medium">Night</label>
                                            </div>
                                            <span className="text-sm font-mono text-muted-foreground ml-auto bg-[var(--background-alt)] px-2 py-1 border border-[var(--border-light)]">
                                                {med.morning ? '1' : '0'}-{med.afternoon ? '1' : '0'}-{med.night ? '1' : '0'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label>Duration</Label>
                                            <Input
                                                value={med.duration}
                                                onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                                placeholder="e.g., 5 days"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Instructions</Label>
                                            <Input
                                                value={med.instructions}
                                                onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                                                placeholder="e.g., After meals"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Button variant="outline" onClick={addMedication} className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Medicine
                            </Button>
                        </CardContent>
                    </Card>

                    <Separator />

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleExportPDF}>
                            <Download className="h-4 w-4 mr-2" />
                            Export PDF
                        </Button>
                        <Button>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete Consultation
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
