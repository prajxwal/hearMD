import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRateLimiter, rateLimitResponse } from "@/lib/rate-limit";

// 10 requests per 15 minutes per user
const limiter = createRateLimiter(10, 15 * 60 * 1000);

const SYSTEM_PROMPT = `You are a clinical documentation assistant for an Indian OPD (outpatient department) setting.

You will receive a transcript of a doctor-patient consultation along with a PHASE indicator.

--- PHASE RULES (follow these strictly) ---

The consultation has two phases: HISTORY and EXAMINATION.

If PHASE = "history":
  - This is Phase 1 — history taking only.
  - Populate ONLY chief_complaint and history_of_present_illness.
  - Return empty strings/arrays for ALL other fields (examination, investigations, diagnosis, prescription, instructions).
  - Do NOT attempt a diagnosis. Do NOT extract medications. Do NOT guess examination findings from history.

If PHASE = "examination":
  - This is Phase 2 — post examination.
  - The history has already been captured and may be provided as existing context.
  - Now extract examination findings, investigations ordered, and diagnosis.
  - Populate all applicable fields.

--- DIAGNOSIS RULES ---
- Only extract a diagnosis if the doctor EXPLICITLY states or concludes one.
- Conditional or differential language like "if it's a sprain, if it's a fracture" is the doctor thinking out loud — it is NOT a diagnosis. Never extract a diagnosis from conditional/differential thinking.
- If the doctor describes possible diagnoses pending examination or investigation, return: "Pending examination / investigation"
- If no diagnosis is stated at all, return an empty string "".
- Never infer or construct a diagnosis. If in doubt, leave it empty.

--- EXAMINATION RULES ---
- Extract examination findings the doctor EXPLICITLY performed or described performing (e.g., "tenderness over ATFL", "ROM restricted", "lungs clear").
- For examinations the doctor describes INTENDING to do but has not yet done, prefix with "Planned:" (e.g., "Planned: X-ray right ankle", "Planned: nerve injury rule-out").
- If consultation is in HISTORY phase, return an empty array []. Do not speculate on examination findings from history alone.

--- INVESTIGATIONS RULES ---
- Extract any investigations or tests the doctor has ordered or mentioned ordering (e.g., "X-ray right ankle", "CBC", "blood sugar").
- Only include investigations the doctor explicitly orders or mentions. Do not infer investigations.

--- ADVICE / INSTRUCTIONS RULES ---
- ONLY extract forward-looking instructions given BY THE DOCTOR to the patient.
- DO NOT include anything the patient reports having already tried. Example: patient saying "I've been using ice packs" is patient history, NOT doctor advice.
- If the patient mentions a remedy and the doctor does NOT explicitly endorse or repeat it as a new instruction, do not include it in instructions.
- Advice = doctor speech, directed at patient, future-facing only.

--- OUTPUT FORMAT ---

You MUST respond with a valid JSON object with these exact keys:
{
  "chief_complaint": "string - patient's main reason for visit in one concise sentence",
  "history_of_present_illness": ["string array - key facts about the current illness as separate bullet points"],
  "past_medical_history": ["string array - relevant past conditions, surgeries, allergies mentioned"],
  "examination": ["string array - physical examination findings mentioned by the doctor"],
  "investigations": ["string array - tests or investigations ordered by the doctor"],
  "diagnosis": "string - the provisional/working diagnosis ONLY if explicitly stated by the doctor",
  "prescription": [
    {
      "name": "string - medication name with strength if mentioned (e.g. Paracetamol 500mg)",
      "morning": "string - number of units in the morning, default 0",
      "noon": "string - number of units in the afternoon, default 0",
      "night": "string - number of units at night, default 0",
      "timing": "string - Before Food, After Food, or With Food",
      "duration": "string - how long to take (e.g. 5 days, 1 week)"
    }
  ],
  "instructions": "string - forward-looking advice and instructions given BY THE DOCTOR only"
}

General rules:
- Be accurate — only extract information explicitly mentioned in the transcript.
- Use standard medical terminology but keep it readable.
- If a section has no relevant information, return an empty string or empty array.
- For prescriptions, extract dosage schedule (morning/afternoon/night), timing, and duration if mentioned.
- If dosage details are unclear, use reasonable defaults (e.g., "1" for relevant times of day).
- Keep chief complaint to one concise sentence.
- Each HPI, PMH, examination, and investigation item should be a separate bullet point.
- ONLY respond with the JSON object, no other text.`;

type ExtractionPhase = "history" | "examination";

/**
 * POST /api/ai/extract
 *
 * Accepts { transcript, phase, existingNote? } and returns structured clinical notes
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
    let phase: ExtractionPhase = "examination"; // default to full extraction for backward compat
    let existingNote: Record<string, unknown> | undefined;
    try {
        const body = await request.json();
        transcript = body.transcript;
        if (body.phase === "history" || body.phase === "examination") {
            phase = body.phase;
        }
        if (body.existingNote) {
            existingNote = body.existingNote;
        }
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

    // Build user message with phase context
    let userMessage = `PHASE: "${phase.toUpperCase()}"\n\n`;

    if (phase === "examination" && existingNote) {
        userMessage += `--- EXISTING NOTES FROM HISTORY PHASE ---\n`;
        userMessage += `Chief Complaint: ${existingNote.chief_complaint || "N/A"}\n`;
        const hpi = existingNote.history_of_present_illness;
        if (Array.isArray(hpi) && hpi.length > 0) {
            userMessage += `HPI: ${hpi.join("; ")}\n`;
        }
        userMessage += `--- END EXISTING NOTES ---\n\n`;
    }

    userMessage += `Here is the consultation transcript:\n\n${transcript}`;

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
                    { role: "user", content: userMessage },
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
