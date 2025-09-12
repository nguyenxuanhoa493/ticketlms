import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser client factory - tạo client mới mỗi lần để tránh session issues
 */
export const getBrowserClient = () => {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Legacy export for backward compatibility
export const supabase = getBrowserClient();
