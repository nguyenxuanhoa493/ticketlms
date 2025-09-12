// Export browser client functions
export {
    getBrowserClient,
    supabase,
    supabaseClient,
    resetClients,
} from "./client";

// Export server client functions
export {
    getServerClient,
    getAdminClient,
    createApiClient,
    createAdminApiClient,
    resetServerClients,
} from "./server-client";

// Export middleware client
export { createMiddlewareClient } from "./middleware-client";
