import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRateLimiter, rateLimitResponse } from "@/lib/rate-limit";

// 10 requests per 15 minutes per user
const limiter = createRateLimiter(10, 15 * 60 * 1000);

const SYSTEM_PROMPT = `You are a clinical documentation assistant for an Indian OPD (outpatient department) setting.

You will receive a transcript of a doctor-patient consultation. Extract structured clinical information from it.

You MUST respond with a valid JSON object with these exact keys:
{
  "chief_complaint": "string - patient's main reason for visit in one concise sentence",
  "history_of_present_illness": ["string array - key facts about the current illness as separate bullet points"],
  "past_medical_history": ["string array - relevant past conditions, surgeries, allergies mentioned"],
  "examination": ["string array - physical examination findings mentioned by the doctor"],
  "diagnosis": "string - the provisional/working diagnosis stated or implied by the doctor",
  "prescription": [
    {
      "name": "string - medication name with strength if mentioned (e.g. Paracetamol 500mg)",
      "morning": "string - number of units in the morning, default 0",
      "noon": "string - number of units at noon, default 0",
      "night": "string - number of units at night, default 0",
      "timing": "string - Before Food, After Food, or With Food",
      "duration": "string - how long to take (e.g. 5 days, 1 week)"
    }
  ],
  "instructions": "string - general advice and instructions given to the patient"
}

Rules:
- Be accurate — only extract information explicitly mentioned or clearly implied in the transcript.
- Use standard medical terminology but keep it readable.
- If a section has no relevant information, return an empty string or empty array.
- For prescriptions, extract dosage schedule (morning/noon/night), timing, and duration if mentioned.
- If dosage details are unclear, use reasonable defaults (e.g., "1" for relevant times of day).
- If diagnosis is unclear, write "To be determined".
- Keep chief complaint to one concise sentence.
- Each HPI, PMH, and examination item should be a separate bullet point.
- Instructions should summarize advice in a short paragraph.
- ONLY respond with the JSON object, no other text.`;

/**
 * POST /api/ai/extract
 *
 * Accepts { transcript: string } and returns structured clinical notes
 * extracted by Groq (Llama 3.3 70B).
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

    // Rate limit
    const { allowed, remaining, resetIn } = limiter.check(user.id);
    if (!allowed) return rateLimitResponse(resetIn, 10);

    // Validate API key
    const apiKey = process.env.GROQ_API_KEY;
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
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `Here is the consultation transcript:\n\n${transcript}` },
                ],
                response_format: { type: "json_object" },
                temperature: 0.2,
                max_tokens: 2048,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Groq API error:", response.status, errText);
            return NextResponse.json(
                { error: "AI extraction failed" },
                { status: 500 }
            );
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return NextResponse.json(
                { error: "AI returned empty response" },
                { status: 500 }
            );
        }

        const extraction = JSON.parse(content);
        return NextResponse.json(extraction);
    } catch (error) {
        console.error("AI extraction error:", error);
        return NextResponse.json(
            { error: "AI extraction failed" },
            { status: 500 }
        );
    }
}
