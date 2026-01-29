import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface ClinicalExtraction {
    chief_complaints: Array<{
        complaint: string
        duration: string
        severity: string
    }>
    history_present_illness: string
    past_medical_history: string
    allergies: string[]
    vitals: {
        bp: string
        pulse: string
        temp: string
        weight: string
        spo2: string
    }
    examination_findings: string
    doctor_observations: string
}

const EXTRACTION_SYSTEM_PROMPT = `You are a medical transcription assistant. Your job is to extract structured clinical information from doctor-patient conversation transcripts.

CRITICAL RULES:
1. Extract ONLY what is explicitly mentioned in the transcript
2. Do NOT infer, assume, or hallucinate any medical information
3. If something is not mentioned, leave the field as empty string or empty array
4. Do NOT suggest diagnoses or treatments
5. Use exact quotes where possible

OUTPUT FORMAT: Valid JSON matching the schema provided. No markdown, no code blocks, just pure JSON.`

export async function extractClinicalInfo(transcript: string): Promise<ClinicalExtraction> {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `Extract clinical information from this OPD consultation transcript:

<transcript>
${transcript}
</transcript>

Return a JSON object with these fields:
{
  "chief_complaints": [{"complaint": "", "duration": "", "severity": ""}],
  "history_present_illness": "",
  "past_medical_history": "",
  "allergies": [],
  "vitals": {"bp": "", "pulse": "", "temp": "", "weight": "", "spo2": ""},
  "examination_findings": "",
  "doctor_observations": ""
}

Only include information EXPLICITLY stated in the transcript. Return ONLY valid JSON, no markdown.`

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
        generationConfig: {
            responseMimeType: 'application/json',
        },
    })

    const response = result.response.text()

    try {
        return JSON.parse(response) as ClinicalExtraction
    } catch {
        // Return empty structure if parsing fails
        return {
            chief_complaints: [],
            history_present_illness: '',
            past_medical_history: '',
            allergies: [],
            vitals: { bp: '', pulse: '', temp: '', weight: '', spo2: '' },
            examination_findings: '',
            doctor_observations: '',
        }
    }
}
