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
import {
    LmsClient,
    searchSyllabus,
    populateSyllabusSequential,
    changeStatusSyllabus,
} from "@/lib/lms";
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
                environment_id,
                dmn,
                user_code,
                pass,
                syllabusId,   // Database ID - for changeStatus
                syllabusIid,  // LMS internal ID - for populate
            } = body;

            console.log("[POST /api/tools/auto-flow/fix-syllabus-sequential] Action:", action, {
                environment_id,
                dmn,
                user_code,
            });

            // Validate required fields
            const validation = validateRequiredFields(body, [
                "action",
                "environment_id",
                "dmn",
            ]);
            if (!validation.isValid) {
                return NextResponse.json({ error: validation.error }, { status: 400 });
            }

            // Fetch environment from database
            const envQuery = supabase
                .from("api_environments")
                .select("*")
                .eq("id", environment_id)
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
            const finalUserCode = user_code || dmn;
            let finalPassword = pass;
            if (!finalPassword) {
                try {
                    if (finalUserCode === "root" && environment.pass_root) {
                        finalPassword = decrypt(environment.pass_root);
                    } else if (environment.pass_master) {
                        finalPassword = decrypt(environment.pass_master);
                    }
                } catch (error) {
                    console.error("[POST /api/tools/auto-flow/fix-syllabus-sequential] Decryption failed:", error);
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
            const cacheKey = getCacheKey(user.id, environment_id, dmn, finalUserCode);
            let lmsClient = getCachedClient(user.id, environment_id, dmn, finalUserCode);
            
            if (lmsClient) {
                console.log(`[fix-syllabus-sequential] Using cached client for ${cacheKey}`);
            } else {
                console.log(`[fix-syllabus-sequential] Creating new client for ${cacheKey}`);
                
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
                    setCachedClient(user.id, environment_id, dmn, finalUserCode, lmsClient);
                    console.log(`[LMS Cache SET] ${cacheKey}`);
                } catch (loginError: any) {
                    console.error(`[fix-syllabus-sequential] Login failed:`, loginError);
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
            if (action === "search_syllabuses") {
                // Clear history for new action
                lmsClient.clearHistory();
                
                // Action 1: Search syllabuses
                const result = await searchSyllabus(lmsClient);

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
                        syllabuses: result.data || [],
                        count: (result.data || []).length,
                        requestHistory: history,
                    },
                    "Syllabuses fetched successfully"
                );
            } else if (action === "fix_single") {
                // Clear history for new action
                lmsClient.clearHistory();
                
                // Action 2: Fix single syllabus (populate + change status)
                if (!syllabusId || !syllabusIid) {
                    return NextResponse.json(
                        { error: "syllabusId and syllabusIid are required" },
                        { status: 400 }
                    );
                }

                // Step 1: Populate sequential (needs iid)
                const populateResult = await populateSyllabusSequential(lmsClient, {
                    iid_syllabus: syllabusIid,
                });

                if (!populateResult.success) {
                    const history = mapRequestHistory(lmsClient);

                    return NextResponse.json(
                        {
                            success: false,
                            error: populateResult.error,
                            requestHistory: history,
                        },
                        { status: 500 }
                    );
                }

                // Step 2: Change status (refresh) - needs id
                const statusResult = await changeStatusSyllabus(lmsClient, {
                    id_syllabus: syllabusId,  // Use database ID
                    status: "approved",
                    step: "status",
                });

                const history = mapRequestHistory(lmsClient);

                if (!statusResult.success) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: statusResult.error,
                            requestHistory: history,
                        },
                        { status: 500 }
                    );
                }

                return createSuccessResponse(
                    {
                        syllabusId,
                        message: statusResult.message,
                        requestHistory: history,
                    },
                    `Syllabus #${syllabusId} fixed successfully`
                );
            } else {
                return NextResponse.json(
                    { error: "Invalid action. Supported: search_syllabuses, fix_single" },
                    { status: 400 }
                );
            }
        } catch (error) {
            console.error("[POST /api/tools/auto-flow/fix-syllabus-sequential] Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
);
