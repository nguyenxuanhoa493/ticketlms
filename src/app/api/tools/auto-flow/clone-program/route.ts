import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server-client";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/encryption";
import {
    LmsClient,
    LmsEnvironment,
    getListProgram,
    cloneProgram,
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
    
    return cached.client;
}

function setCachedClient(userId: string, envId: string, dmn: string, userCode: string, client: LmsClient): void {
    const key = getCacheKey(userId, envId, dmn, userCode);
    lmsClientCache.set(key, {
        client,
        timestamp: Date.now(),
    });
}

/**
 * POST /api/tools/auto-flow/clone-program
 * Execute Clone Program auto flow
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createApiClient(cookieStore);

        // Get current user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            environment_id,
            dmn,
            user_code,
            pass,
            step, // 'get_programs' or 'clone'
            program_iid, // For clone step
            statuses, // For get_programs step
        } = body;

        // Validate required fields
        if (!environment_id) {
            return NextResponse.json(
                { error: "environment_id is required" },
                { status: 400 }
            );
        }

        if (!step || !["get_programs", "clone"].includes(step)) {
            return NextResponse.json(
                { error: "step must be 'get_programs' or 'clone'" },
                { status: 400 }
            );
        }

        // Fetch environment from database
        const { data: environment, error: envError } = await supabase
            .from("api_environments")
            .select("*")
            .eq("id", environment_id)
            .single();

        if (envError || !environment) {
            return NextResponse.json(
                { error: "Environment not found" },
                { status: 404 }
            );
        }

        // Decrypt credentials
        let decryptedPassMaster: string;
        let decryptedPassRoot: string | undefined;

        try {
            decryptedPassMaster = decrypt(environment.pass_master);
            if (environment.pass_root) {
                decryptedPassRoot = decrypt(environment.pass_root);
            }
        } catch (error) {
            console.error("Decryption failed:", error);
            return NextResponse.json(
                { error: "Failed to decrypt credentials" },
                { status: 500 }
            );
        }

        // Determine credentials to use
        const finalUserCode = user_code || environment.user_code || dmn;
        const finalPass =
            pass ||
            (user_code === "root" ? decryptedPassRoot : decryptedPassMaster);

        // Build LMS environment
        const lmsEnv: LmsEnvironment = {
            host: environment.host,
            dmn: dmn || environment.dmn,
            user_code: finalUserCode,
            pass_master: finalPass || decryptedPassMaster,
            pass_root: decryptedPassRoot,
            headers: environment.headers || {},
            base_params: environment.base_params || {},
        };

        // Try to get cached client
        const cacheKey = getCacheKey(user.id, environment_id, lmsEnv.dmn, finalUserCode);
        let client = getCachedClient(user.id, environment_id, lmsEnv.dmn, finalUserCode);
        
        if (client) {
            console.log(`[LMS Cache HIT] ${cacheKey}`);
        } else {
            console.log(`[LMS Cache MISS] ${cacheKey} - Creating new client`);
            client = new LmsClient(lmsEnv);
            
            // Login to verify credentials
            try {
                await client.login();
                // Cache on successful login
                setCachedClient(user.id, environment_id, lmsEnv.dmn, finalUserCode, client);
                console.log(`[LMS Cache SET] ${cacheKey}`);
            } catch (loginError: any) {
                console.error("[LMS Login Failed]", loginError);
                return NextResponse.json(
                    { error: `Login failed: ${loginError.message}` },
                    { status: 401 }
                );
            }
        }

        const startTime = Date.now();

        // Execute based on step
        if (step === "get_programs") {
            // Clear history for fresh start (important for cached clients)
            client.clearHistory();
            
            // Step 1: Get list of programs
            const programStatuses = statuses && Array.isArray(statuses) && statuses.length > 0
                ? statuses
                : ["approved"];
            
            const result = await getListProgram(client, {
                status: programStatuses,
            });

            const executionTime = Date.now() - startTime;
            
            // Get request history from client
            const history = mapRequestHistory(client);

            if (!result.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: result.error,
                        executionTime,
                        requestHistory: history,
                    },
                    { status: 400 }
                );
            }

            const programs = result.programs || [];

            return NextResponse.json({
                success: true,
                data: {
                    programs,
                    total: programs.length,
                },
                executionTime,
                requestHistory: history,
                message: `Found ${programs.length} programs`,
            });
        } else if (step === "clone") {
            // Clear history for fresh start (important for cached clients)
            client.clearHistory();
            
            // Step 2: Clone selected program
            if (!program_iid) {
                return NextResponse.json(
                    { error: "program_iid is required for clone step" },
                    { status: 400 }
                );
            }

            const result = await cloneProgram(client, {
                program_iid: parseInt(program_iid),
            });

            const executionTime = Date.now() - startTime;
            
            // Get request history from client
            const history = mapRequestHistory(client);

            // Save to execution history
            try {
                await supabase.from("api_auto_execution_history").insert({
                    flow_id: null, // Can be linked to a flow if saved
                    user_id: user.id,
                    inputs: {
                        environment_id,
                        dmn,
                        user_code: finalUserCode,
                        program_iid,
                    },
                    outputs: result.data || {},
                    status: result.success ? "success" : "failed",
                    error_message: result.error || null,
                    execution_time: executionTime,
                    request_history: history,
                });
            } catch (historyError) {
                console.error("Failed to save execution history:", historyError);
            }

            if (!result.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: result.error,
                        executionTime,
                        requestHistory: history,
                    },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                data: result.data,
                executionTime,
                requestHistory: history,
                message: "Program cloned successfully",
            });
        }

        return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    } catch (error) {
        console.error("Auto flow error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
