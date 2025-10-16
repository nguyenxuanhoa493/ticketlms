// Re-export từ singleton client để backward compatibility
export {
    getBrowserClient,
    supabase,
    supabaseClient,
    resetClients,
} from "./supabase/client";

export {
    getServerClient,
    getAdminClient,
    createApiClient,
    createAdminApiClient,
    resetServerClients,
} from "./supabase/server-client";

// Legacy function - deprecated, sử dụng getAdminClient thay thế
export const createServerClient = () => {
    console.warn(
        "createServerClient is deprecated. Use getAdminClient instead."
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAdminClient } = require("./supabase/client");
    return getAdminClient();
};
