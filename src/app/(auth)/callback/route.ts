import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const origin = requestUrl.origin;

    if (code) {
        // Exchange the OAuth code for a session — this creates the auth cookies.
        // Without this step, the user would be redirected to /dashboard with no
        // valid session, and the middleware would bounce them back to /login.
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("Auth callback error:", error.message);
            // Redirect to login with an error hint rather than a blank failure
            return NextResponse.redirect(`${origin}/login?error=callback_failed`);
        }

        return NextResponse.redirect(`${origin}/dashboard`);
    }

    return NextResponse.redirect(`${origin}/login`);
}
