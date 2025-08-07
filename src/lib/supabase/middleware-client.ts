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
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: Record<string, unknown>) {
                    request.cookies.set({
                        name,
                        value: "",
                        ...options,
                    });
                    response.cookies.set({
                        name,
                        value: "",
                        ...options,
                    });
                },
            },
        }
    );
};
