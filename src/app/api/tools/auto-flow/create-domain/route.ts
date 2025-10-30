import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    executeQuery,
    AuthenticatedUser,
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";
import { decrypt } from "@/lib/encryption";
import { LmsClient, getDomainGroups, createDomain } from "@/lib/lms";
import { mapRequestHistory } from "@/lib/lms-history-utils";

// Server-side cache for LMS clients
// Key format: {userId}-{environmentId}-{dmn}-{userCode}
const lmsClientCache = new Map<string, { client: LmsClient; timestamp: number }>();
const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

function getCacheKey(userId: string, envId: string, dmn: string, userCode: string): string {
    return `${userId}-${envId}-${dmn}-${userCode}`;
}

function getCachedClient(userId: string, envId: string, dmn: string, userCode: string): LmsClient | null {
    const key = getCacheKey(userId, envId, dmn, userCode);
    const cached = lmsClientCache.get(key);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_MAX_AGE) {
        lmsClientCache.delete(key);
        return null;
    }
    
    console.log(`[LMS Cache HIT] ${key} (age: ${Math.round(age / 1000)}s)`);
    return cached.client;
}

function setCachedClient(userId: string, envId: string, dmn: string, userCode: string, client: LmsClient): void {
    const key = getCacheKey(userId, envId, dmn, userCode);
    lmsClientCache.set(key, {
        client,
        timestamp: Date.now(),
    });
    console.log(`[LMS Cache SET] ${key}`);
}

export const POST = withAdmin(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient
    ) => {
        try {
            const body = await request.json();
            const {
                action,
                environmentId,
                dmn,
                userCode,
                password,
                slug,
                domainGroup,
            } = body;

            console.log("[POST /api/tools/auto-flow/create-domain] Action:", action, {
                environmentId,
                dmn,
                userCode,
                hasPassword: !!password,
            });

            // Validate required fields
            const validation = validateRequiredFields(body, [
                "action",
                "environmentId",
                "dmn",
            ]);
            if (!validation.isValid) {
                return NextResponse.json({ error: validation.error }, { status: 400 });
            }

            // Fetch environment from database
            const envQuery = supabase
                .from("api_environments")
                .select("*")
                .eq("id", environmentId)
                .single();

            const { data: environment, error: envError } = await executeQuery(
                envQuery,
                "fetching environment"
            );

            if (envError) return envError;

            if (!environment) {
                return NextResponse.json(
                    { error: "Environment not found" },
                    { status: 404 }
                );
            }

            // Determine user_code and password
            const finalUserCode = userCode || dmn;
            let finalPassword = password;
            if (!finalPassword) {
                try {
                    if (finalUserCode === "root" && environment.pass_root) {
                        finalPassword = decrypt(environment.pass_root);
                    } else if (environment.pass_master) {
                        finalPassword = decrypt(environment.pass_master);
                    }
                } catch (error) {
                    console.error("[POST /api/tools/auto-flow/create-domain] Decryption failed:", error);
                    return NextResponse.json(
                        { error: "Failed to decrypt credentials" },
                        { status: 500 }
                    );
                }
            }

            if (!finalPassword) {
                return NextResponse.json(
                    { error: "No password provided or found in environment" },
                    { status: 400 }
                );
            }

            // Try to get cached client
            const cacheKey = getCacheKey(user.id, environmentId, dmn, finalUserCode);
            let lmsClient = getCachedClient(user.id, environmentId, dmn, finalUserCode);
            
            if (lmsClient) {
                console.log(`[create-domain] Using cached client for ${cacheKey}`);
            } else {
                console.log(`[create-domain] Creating new client for ${cacheKey}`);
                
                // Create new LMS client
                lmsClient = new LmsClient({
                    dmn,
                    host: environment.host,
                    headers: {},
                    base_params: {},
                    user_code: finalUserCode,
                    pass_master: finalPassword,
                });

                // Login and cache
                try {
                    await lmsClient.login();
                    setCachedClient(user.id, environmentId, dmn, finalUserCode, lmsClient);
                } catch (loginError: any) {
                    console.error(`[create-domain] Login failed:`, loginError);
                    return NextResponse.json(
                        { 
                            error: `Login failed: ${loginError.message}`,
                            requestHistory: mapRequestHistory(lmsClient),
                        },
                        { status: 401 }
                    );
                }
            }

            // Handle different actions
            if (action === "get_domain_groups") {
                // Clear history for new action
                lmsClient.clearHistory();
                
                // Action 1: Get domain groups
                const result = await getDomainGroups(lmsClient);

                const history = mapRequestHistory(lmsClient);

                if (!result.success) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: result.error,
                            requestHistory: history,
                        },
                        { status: 500 }
                    );
                }

                return createSuccessResponse(
                    {
                        groups: result.data || [],
                        requestHistory: history,
                    },
                    "Domain groups fetched successfully"
                );
            } else if (action === "create_domain") {
                // Action 2: Create domain
                if (!slug || !domainGroup) {
                    return NextResponse.json(
                        { error: "slug and domainGroup are required" },
                        { status: 400 }
                    );
                }

                // Clear history for new action
                lmsClient.clearHistory();

                const result = await createDomain(lmsClient, {
                    slug,
                    domainGroup,
                });

                const history = mapRequestHistory(lmsClient);

                // Always return success with request history
                // Let the UI decide based on /school/new status code
                return createSuccessResponse(
                    {
                        result: result.data,
                        requestHistory: history,
                        apiSuccess: result.success,
                        apiError: result.error,
                    },
                    result.success ? "Domain created successfully" : undefined
                );
            } else {
                return NextResponse.json(
                    { error: "Invalid action. Supported: get_domain_groups, create_domain" },
                    { status: 400 }
                );
            }
        } catch (error) {
            console.error("[POST /api/tools/auto-flow/create-domain] Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
);
