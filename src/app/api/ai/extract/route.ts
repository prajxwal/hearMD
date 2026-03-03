import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ResponseSchema } from "@google/generative-ai";

const EXTRACTION_SCHEMA: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        chief_complaint: {
            type: SchemaType.STRING,
            description: "The patient's main reason for the visit, in one concise sentence",
        },
        history_of_present_illness: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Key facts about the current illness as separate bullet points",
        },
        past_medical_history: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Relevant past medical conditions, surgeries, allergies mentioned",
        },
        examination: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Physical examination findings mentioned by the doctor",
        },
        diagnosis: {
            type: SchemaType.STRING,
            description: "The provisional/working diagnosis stated or implied by the doctor",
        },
        prescription: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: {
                        type: SchemaType.STRING,
                        description: "Medication name with strength if mentioned (e.g. 'Paracetamol 500mg')",
                    },
                    morning: {
                        type: SchemaType.STRING,
                        description: "Number of units to take in the morning, default '0'",
                    },
                    noon: {
                        type: SchemaType.STRING,
                        description: "Number of units to take at noon, default '0'",
                    },
                    night: {
                        type: SchemaType.STRING,
                        description: "Number of units to take at night, default '0'",
                    },
                    timing: {
                        type: SchemaType.STRING,
                        description: "When to take: 'Before Food', 'After Food', or 'With Food'",
                    },
                    duration: {
                        type: SchemaType.STRING,
                        description: "How long to take the medication (e.g. '5 days', '1 week')",
                    },
                },
                required: ["name", "morning", "noon", "night", "timing", "duration"],
            },
            description: "Medications prescribed during the consultation",
        },
        instructions: {
            type: SchemaType.STRING,
            description: "General advice and instructions given to the patient (diet, rest, follow-up, etc.)",
        },
    },
    required: [
        "chief_complaint",
        "history_of_present_illness",
        "past_medical_history",
        "examination",
        "diagnosis",
        "prescription",
        "instructions",
    ],
};

const SYSTEM_PROMPT = `You are a clinical documentation assistant for an Indian OPD (outpatient department) setting.

You will receive a transcript of a doctor-patient consultation. Extract structured clinical information from it.

Rules:
- Be accurate — only extract information that is explicitly mentioned or clearly implied in the transcript.
- Use standard medical terminology but keep it readable for a general practitioner.
- If a section has no relevant information in the transcript, return an empty string or empty array.
- For prescriptions, extract the dosage schedule (morning/noon/night counts), timing (Before Food, After Food, With Food), and duration if mentioned.
- If dosage details are unclear, use reasonable defaults (e.g., "1" for the relevant times of day).
- For the diagnosis, use the doctor's stated or implied diagnosis. If unclear, write "To be determined".
- Keep chief complaint to one concise sentence.
- Each HPI, PMH, and examination item should be a separate, complete bullet point.
- Instructions should summarize advice in a short paragraph.`;

/**
 * POST /api/ai/extract
 *
 * Accepts { transcript: string } and returns structured clinical notes
 * extracted by Gemini Flash.
 */
export async function POST(request: Request) {
    // Auth check
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate API key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "AI service not configured" },
            { status: 503 }
        );
    }

    // Parse request
    let transcript: string;
    try {
        const body = await request.json();
        transcript = body.transcript;
    } catch {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }

    if (!transcript || transcript.trim().length < 20) {
        return NextResponse.json(
            { error: "Transcript is too short to extract meaningful notes" },
            { status: 400 }
        );
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: EXTRACTION_SCHEMA,
                temperature: 0.2, // Low temperature for factual extraction
            },
            systemInstruction: SYSTEM_PROMPT,
        });

        const result = await model.generateContent(
            `Here is the consultation transcript:\n\n${transcript}`
        );

        const text = result.response.text();
        const extraction = JSON.parse(text);

        return NextResponse.json(extraction);
    } catch (error) {
        console.error("AI extraction error:", error);
        return NextResponse.json(
            { error: "AI extraction failed" },
            { status: 500 }
        );
    }
}
