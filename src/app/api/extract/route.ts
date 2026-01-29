import { NextRequest, NextResponse } from 'next/server'
import { extractClinicalInfo } from '@/lib/gemini'

export async function POST(request: NextRequest) {
    try {
        const { transcript } = await request.json()

        if (!transcript) {
            return NextResponse.json(
                { error: 'Transcript is required' },
                { status: 400 }
            )
        }

        // Check if Gemini API key is configured
        if (!process.env.GEMINI_API_KEY) {
            // Return demo data if no API key
            return NextResponse.json({
                chief_complaints: [
                    { complaint: 'Severe headache', duration: '3 days', severity: 'Moderate to severe' }
                ],
                history_present_illness: 'Patient reports severe headache for the past 3 days, located on the right side. The pain is intermittent but worse in the morning. Associated with nausea.',
                past_medical_history: 'Family history of migraines (mother)',
                allergies: [],
                vitals: { bp: '120/80', pulse: '78', temp: 'Normal', weight: '', spo2: '' },
                examination_findings: 'Vitals within normal limits. No focal neurological deficits.',
                doctor_observations: 'Appears to be tension-type headache with some migraine features.'
            })
        }

        const clinicalInfo = await extractClinicalInfo(transcript)
        return NextResponse.json(clinicalInfo)
    } catch (error) {
        console.error('Error extracting clinical info:', error)
        return NextResponse.json(
            { error: 'Failed to extract clinical information' },
            { status: 500 }
        )
    }
}
