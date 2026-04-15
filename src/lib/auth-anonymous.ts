import { cookies } from "next/headers";
import { crypto } from "next/dist/compiled/@edge-runtime/primitives";

const COOKIE_NAME = "signal_arena_sid";

/**
 * Retrieves the current anonymous ID from cookies or generates a new one.
 * Should be called in Server Components or API routes.
 */
export async function getAnonymousId(): Promise<string> {
    const cookieStore = await cookies();
    const existingId = cookieStore.get(COOKIE_NAME)?.value;

    if (existingId) {
        return existingId;
    }

    // Fallback if not set (though middleware should ideally handle this)
    return "global";
}

/**
 * Ensures a session ID is present. Returns the ID.
 */
export async function ensureAnonymousId(): Promise<string> {
    const cookieStore = await cookies();
    let id = cookieStore.get(COOKIE_NAME)?.value;

    if (!id) {
        id = (globalThis as any).crypto?.randomUUID?.() || Math.random().toString(36).substring(2, 15);
        cookieStore.set(COOKIE_NAME, id, {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 365, // 1 year
        });
    }

    return id;
}
