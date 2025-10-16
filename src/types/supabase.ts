import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database";

// Type for Supabase client used in API routes
export type TypedSupabaseClient = SupabaseClient<Database>;

// Type for cookie store
export interface CookieStore {
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    delete(name: string): void;
}
