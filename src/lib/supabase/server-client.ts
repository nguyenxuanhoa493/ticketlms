import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";
import { CookieStore } from "@/types/supabase";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server client factory - tạo mới client cho mỗi request để tránh session sharing
 * CRITICAL: Không dùng singleton để tránh session bị share giữa các users
 */
export const getServerClient = async () => {
    const cookieStore = await cookies();
    return createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    // Ensure proper cookie isolation
                    cookieStore.set(name, value, {
                        ...options,
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                        httpOnly: true,
                        path: '/',
                    });
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set(name, '', {
                        ...options,
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                        httpOnly: true,
                        path: '/',
                        maxAge: 0,
                    });
                },
            },
        }
    );
};

/**
 * Admin client factory - tạo mới client cho admin operations
 * NOTE: Admin client không cần cookies vì dùng service role key
 */
export const getAdminClient = () => {
    return createServerClient<Database>(
        supabaseUrl,
        supabaseServiceKey,
        {
            cookies: {
                get() {
                    return undefined;
                },
                set() {
                    // No-op for admin client
                },
                remove() {
                    // No-op for admin client
                },
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
};

/**
 * API client factory - tạo client cho API routes với cookie store
 */
export const createApiClient = (cookieStore: CookieStore) => {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options?: Record<string, unknown>) {
                // Ensure proper cookie isolation
                cookieStore.set(name, value, {
                    ...options,
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production',
                    httpOnly: true,
                    path: '/',
                });
            },
            remove(name: string) {
                cookieStore.set(name, '', {
                    sameSite: 'lax',
                    secure: process.env.NODE_ENV === 'production',
                    httpOnly: true,
                    path: '/',
                    maxAge: 0,
                });
            },
        },
    });
};

/**
 * Admin API client factory - tạo admin client cho API routes
 */
export const createAdminApiClient = (cookieStore: CookieStore) => {
    return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set() {
                // No-op for admin client
            },
            remove() {
                // No-op for admin client
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};


