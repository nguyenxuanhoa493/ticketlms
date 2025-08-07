import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null =
    null;

/**
 * Browser client singleton - chỉ khởi tạo một lần cho client-side
 */
export const getBrowserClient = () => {
    if (!browserClient) {
        browserClient = createBrowserClient<Database>(
            supabaseUrl,
            supabaseAnonKey
        );
    }
    return browserClient;
};

/**
 * Reset browser client (useful for testing)
 */
export const resetBrowserClient = () => {
    browserClient = null;
};

// Legacy export for backward compatibility
export const supabase = getBrowserClient();
