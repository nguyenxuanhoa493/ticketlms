// Re-export từ browser client để tránh import next/headers trong client-side
export {
    getBrowserClient,
    resetBrowserClient,
    supabase,
} from "./browser-client";

// Legacy exports for backward compatibility
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseClient = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
);

// Combined reset function
export const resetClients = () => {
    const { resetBrowserClient } = require("./browser-client");
    const { resetServerClients } = require("./server-client");
    resetBrowserClient();
    resetServerClients();
};
