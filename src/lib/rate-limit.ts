import { NextResponse } from "next/server";

interface RateLimitEntry {
    timestamps: number[];
}

/**
 * Creates an in-memory sliding-window rate limiter.
 *
 * @param limit  Max requests allowed within the window.
 * @param windowMs  Window size in milliseconds.
 */
export function createRateLimiter(limit: number, windowMs: number) {
    const store = new Map<string, RateLimitEntry>();

    // Clean expired entries every 5 minutes to prevent memory leaks
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
            if (entry.timestamps.length === 0) store.delete(key);
        }
    }, 5 * 60 * 1000).unref?.();

    return {
        check(key: string): { allowed: boolean; remaining: number; resetIn: number } {
            const now = Date.now();
            const entry = store.get(key) || { timestamps: [] };

            // Remove timestamps outside the window
            entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

            if (entry.timestamps.length >= limit) {
                const oldestInWindow = entry.timestamps[0];
                const resetIn = Math.ceil((oldestInWindow + windowMs - now) / 1000);
                return { allowed: false, remaining: 0, resetIn };
            }

            entry.timestamps.push(now);
            store.set(key, entry);

            return {
                allowed: true,
                remaining: limit - entry.timestamps.length,
                resetIn: Math.ceil(windowMs / 1000),
            };
        },
    };
}

/**
 * Returns a 429 response with rate limit headers.
 */
export function rateLimitResponse(resetIn: number, limit: number) {
    return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${resetIn} seconds.` },
        {
            status: 429,
            headers: {
                "X-RateLimit-Limit": String(limit),
                "X-RateLimit-Remaining": "0",
                "Retry-After": String(resetIn),
            },
        }
    );
}
