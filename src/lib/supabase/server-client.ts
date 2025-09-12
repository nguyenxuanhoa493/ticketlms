import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Singleton instances
let serverClient: ReturnType<typeof createServerClient<Database>> | null = null;
let adminClient: ReturnType<typeof createServerClient<Database>> | null = null;

/**
 * Server client singleton - chỉ khởi tạo một lần cho server-side
 */
export const getServerClient = async () => {
    if (!serverClient) {
        const cookieStore = await cookies();
        serverClient = createServerClient<Database>(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: any) {
                        cookieStore.set(name, value, options);
                    },
                    remove(name: string, options: any) {
                        cookieStore.delete(name);
                    },
                },
            }
        );
    }
    return serverClient;
};

/**
 * Admin client singleton - chỉ khởi tạo một lần cho admin operations
 */
export const getAdminClient = () => {
    if (!adminClient) {
        adminClient = createServerClient<Database>(
            supabaseUrl,
            supabaseServiceKey,
            {
                cookies: {
                    get(name: string) {
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
    }
    return adminClient;
};

/**
 * API client factory - tạo client cho API routes với cookie store
 */
export const createApiClient = (cookieStore: any) => {
    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: any) {
                cookieStore.set(name, value, options);
            },
            remove(name: string, options: any) {
                cookieStore.delete(name);
            },
        },
    });
};

/**
 * Admin API client factory - tạo admin client cho API routes
 */
export const createAdminApiClient = (cookieStore: any) => {
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

/**
 * Reset all server clients (useful for testing)
 */
export const resetServerClients = () => {
    serverClient = null;
    adminClient = null;
};
