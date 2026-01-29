import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // 1. Unauthenticated users
    if (!user) {
        // Allow access to login, signup, and auth endpoints
        if (
            request.nextUrl.pathname.startsWith('/login') ||
            request.nextUrl.pathname.startsWith('/signup') ||
            request.nextUrl.pathname.startsWith('/auth')
        ) {
            return response
        }
        // Redirect all other requests to login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. Authenticated users
    if (user) {
        // Check if doctor profile exists
        const { data: doctor } = await supabase
            .from('doctors')
            .select('user_id')
            .eq('user_id', user.id)
            .single()

        const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
        const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')
        const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')
        const isRoot = request.nextUrl.pathname === '/'

        // Case A: No Doctor Profile -> Force Onboarding
        if (!doctor) {
            if (!isOnboarding) {
                const url = request.nextUrl.clone()
                url.pathname = '/onboarding'
                return NextResponse.redirect(url)
            }
            return response
        }

        // Case B: Has Doctor Profile -> Prevent Onboarding/Auth access
        if (doctor) {
            if (isOnboarding || isAuthPage || isRoot) {
                const url = request.nextUrl.clone()
                // Redirect to New Consultation as requested (First Action Flow)
                url.pathname = '/dashboard/consultations/new'
                return NextResponse.redirect(url)
            }
            // Allow Dashboard access
            return response
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes, if needed to be excluded from auth logic, though usually we want to protect them too. 
         *   But for now, sticking to standard matcher)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
