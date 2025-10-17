import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/types/database";

/**
 * Tạo Supabase client cho middleware với cookie handling đặc biệt
 */
export const createMiddlewareClient = (
    request: NextRequest,
    response: NextResponse
) => {
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(
                    name: string,
                    value: string,
                    options: Record<string, unknown>
                ) {
                    // Override cookie options to ensure proper isolation
                    const cookieOptions = {
                        ...options,
                        sameSite: 'lax' as const,
                        secure: process.env.NODE_ENV === 'production',
                        httpOnly: true,
                        path: '/',
                    };
                    
                    request.cookies.set({
                        name,
                        value,
                        ...cookieOptions,
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...cookieOptions,
                    });
                },
                remove(name: string, options: Record<string, unknown>) {
                    const cookieOptions = {
                        ...options,
                        sameSite: 'lax' as const,
                        secure: process.env.NODE_ENV === 'production',
                        httpOnly: true,
                        path: '/',
                        maxAge: 0,
                    };
                    
                    request.cookies.set({
                        name,
                        value: "",
                        ...cookieOptions,
                    });
                    response.cookies.set({
                        name,
                        value: "",
                        ...cookieOptions,
                    });
                },
            },
        }
    );
};
