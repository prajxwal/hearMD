import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    // Authenticate: only logged-in users can request a streaming token
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!apiKey) {
        console.error("ASSEMBLYAI_API_KEY is not set in environment variables");
        return NextResponse.json(
            { error: "AssemblyAI API key not configured" },
            { status: 500 }
        );
    }

    try {
        // Use v3 Universal Streaming token endpoint
        const response = await fetch(
            "https://streaming.assemblyai.com/v3/token?expires_in_seconds=480",
            {
                method: "GET",
                headers: {
                    "Authorization": apiKey,
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`AssemblyAI token error (${response.status}):`, errorText);
            return NextResponse.json(
                { error: `AssemblyAI returned ${response.status}: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ token: data.token });
    } catch (error) {
        console.error("Token generation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
