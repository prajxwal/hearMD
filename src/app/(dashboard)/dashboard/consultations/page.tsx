import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Clock, User } from 'lucide-react'
import Link from 'next/link'

export default function ConsultationsPage() {
    // Demo data - in production, fetch from Supabase
    const consultations: Array<{
        id: string
        patient_name: string
        date: string
        status: 'in_progress' | 'completed' | 'cancelled'
        chief_complaint: string
    }> = []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Consultations</h1>
                    <p className="text-muted-foreground">
                        View and manage all OPD consultations
                    </p>
                </div>
                <Link href="/dashboard/consultations/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Consultation
                    </Button>
                </Link>
            </div>

            {consultations.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No consultations yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Start your first consultation to see it listed here.
                        </p>
                        <Link href="/dashboard/consultations/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Start First Consultation
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {consultations.map((consultation) => (
                        <Card key={consultation.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        {consultation.patient_name}
                                    </CardTitle>
                                    <Badge
                                        variant={
                                            consultation.status === 'completed' ? 'default' :
                                                consultation.status === 'in_progress' ? 'secondary' : 'destructive'
                                        }
                                    >
                                        {consultation.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <CardDescription className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {consultation.date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        10:30 AM
                                    </span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    <strong>Chief Complaint:</strong> {consultation.chief_complaint}
                                </p>
                                <div className="flex gap-2 mt-4">
                                    <Link href={`/dashboard/consultations/${consultation.id}`}>
                                        <Button variant="outline" size="sm">View Details</Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
