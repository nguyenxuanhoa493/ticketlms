import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(
                        name: string,
                        value: string,
                        options: Record<string, unknown>
                    ) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: Record<string, unknown>) {
                        cookieStore.set({ name, value: "", ...options });
                    },
                },
            }
        );

        try {
            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (!error) {
                // Redirect with success message
                return NextResponse.redirect(
                    `${origin}/auth/confirmed?success=true`
                );
            }
        } catch (error) {
            console.error("Auth callback error:", error);
        }
    }

    // Redirect with error
    return NextResponse.redirect(`${origin}/auth/confirmed?error=true`);
}
