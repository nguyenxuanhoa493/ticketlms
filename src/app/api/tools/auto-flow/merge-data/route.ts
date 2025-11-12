import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server-client";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/encryption";
import {
    LmsClient,
    LmsEnvironment,
    getUserByCode,
    mergeDataLearningUser,
} from "@/lib/lms";
import { mapRequestHistory } from "@/lib/lms-history-utils";

// Server-side cache for LMS clients
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            action,
            environment_id,
            dmn,
            user_code,
            pass,
            from_user_code,
            to_user_code,
            from_user_iid,
            to_user_iid,
        } = body;

        console.log("[POST /api/tools/auto-flow/merge-data] Action:", action);

        // Verify authentication
        const cookieStore = await cookies();
        const supabase = createApiClient(cookieStore);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        // Get environment
        const { data: environment, error: envError } = await supabase
            .from("api_environments")
            .select("*")
            .eq("id", environment_id)
            .single();

        if (envError || !environment) {
            return NextResponse.json({ error: "Environment not found" }, { status: 404 });
        }

        // Determine credentials
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
                console.error("[merge-data] Decryption failed:", error);
                return NextResponse.json({ error: "Failed to decrypt credentials" }, { status: 500 });
            }
        }

        if (!finalPassword) {
            return NextResponse.json({ error: "No password provided or found" }, { status: 400 });
        }

        // Build LMS environment
        const lmsEnv: LmsEnvironment = {
            host: environment.host,
            dmn: dmn || environment.dmn,
            user_code: finalUserCode,
            pass_master: finalPassword,
            pass_root: environment.pass_root ? decrypt(environment.pass_root) : undefined,
            headers: environment.headers || {},
            base_params: environment.base_params || {},
        };

        // Try to get cached client
        const cacheKey = getCacheKey(user.id, environment_id, lmsEnv.dmn, finalUserCode);
        let client = getCachedClient(user.id, environment_id, lmsEnv.dmn, finalUserCode);
        
        if (client) {
            console.log(`[merge-data] Using cached client for ${cacheKey}`);
        } else {
            console.log(`[merge-data] Creating new client for ${cacheKey}`);
            client = new LmsClient(lmsEnv);
            
            try {
                await client.login();
                setCachedClient(user.id, environment_id, lmsEnv.dmn, finalUserCode, client);
                console.log(`[merge-data] Client cached for ${cacheKey}`);
            } catch (loginError: any) {
                console.error("[merge-data] Login failed:", loginError);
                return NextResponse.json(
                    { 
                        error: `Login failed: ${loginError.message}`,
                        requestHistory: mapRequestHistory(client),
                    },
                    { status: 401 }
                );
            }
        }

        // Handle actions
        if (action === "search_users") {
            client.clearHistory();
            
            let fromUser = null;
            let toUser = null;

            // Search from user
            if (from_user_code) {
                const fromResult = await getUserByCode(client, {
                    userCode: from_user_code,
                });

                if (!fromResult.success) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: `From user: ${fromResult.error}`,
                            requestHistory: mapRequestHistory(client),
                        },
                        { status: 400 }
                    );
                }

                const user = fromResult.data;
                if (user) {
                    fromUser = {
                        iid: user.iid,
                        code: user.code,
                        name: user.name,
                        mail: user.mail,
                        phone: user.phone,
                        name_org: user.__expand?.user_organizations?.[0]?.name,
                        ep_count: user.assigned_enrolment_plans?.length || 0,
                    };
                }
            }

            // Search to user
            if (to_user_code) {
                const toResult = await getUserByCode(client, {
                    userCode: to_user_code,
                });

                if (!toResult.success) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: `To user: ${toResult.error}`,
                            requestHistory: mapRequestHistory(client),
                        },
                        { status: 400 }
                    );
                }

                const user = toResult.data;
                if (user) {
                    toUser = {
                        iid: user.iid,
                        code: user.code,
                        name: user.name,
                        mail: user.mail,
                        phone: user.phone,
                        name_org: user.__expand?.user_organizations?.[0]?.name,
                        ep_count: user.assigned_enrolment_plans?.length || 0,
                    };
                }
            }

            const history = mapRequestHistory(client);

            return NextResponse.json({
                success: true,
                data: {
                    fromUser,
                    toUser,
                },
                requestHistory: history,
            });
        } else if (action === "merge_data") {
            client.clearHistory();
            
            console.log(`[merge-data] Merging data from ${from_user_iid} to ${to_user_iid}`);
            
            const result = await mergeDataLearningUser(client, {
                fromUserIid: from_user_iid,
                toUserIid: to_user_iid,
            });

            const history = mapRequestHistory(client);

            if (!result.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: result.error,
                        requestHistory: history,
                    },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                message: result.message,
                data: result.data,
                requestHistory: history,
            });
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("[POST /api/tools/auto-flow/merge-data] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
