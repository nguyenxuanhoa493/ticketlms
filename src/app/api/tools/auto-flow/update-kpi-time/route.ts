import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server-client";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/encryption";
import {
    LmsClient,
    LmsEnvironment,
    searchQuestionBank,
    getQuestionByTag,
    updateInfo,
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
            search_name,
            multiplier,
            question_bank_iid,
        } = body;

        console.log("[POST /api/tools/auto-flow/update-kpi-time] Action:", action);

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
                console.error("[update-kpi-time] Decryption failed:", error);
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
            console.log(`[update-kpi-time] Using cached client for ${cacheKey}`);
        } else {
            console.log(`[update-kpi-time] Creating new client for ${cacheKey}`);
            client = new LmsClient(lmsEnv);
            
            try {
                await client.login();
                setCachedClient(user.id, environment_id, lmsEnv.dmn, finalUserCode, client);
                console.log(`[update-kpi-time] Client cached for ${cacheKey}`);
            } catch (loginError: any) {
                console.error("[update-kpi-time] Login failed:", loginError);
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
        if (action === "search_question_banks") {
            client.clearHistory();
            
            const result = await searchQuestionBank(client, {
                name: search_name || "",
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
                data: {
                    questionBanks: result.data || [],
                    total: result.data?.length || 0,
                },
                requestHistory: history,
            });
        } else if (action === "update_single_question_bank") {
            // Clear history before processing this bank
            client.clearHistory();
            
            console.log(`[update-kpi-time] Processing question bank: ${question_bank_iid}`);
            
            // Get questions from this question bank
            const questionsResult = await getQuestionByTag(client, {
                iid_question_banks: [question_bank_iid],
            });

            if (!questionsResult.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: questionsResult.error,
                        requestHistory: mapRequestHistory(client),
                    },
                    { status: 400 }
                );
            }

            const questions = questionsResult.data || [];
            console.log(`[update-kpi-time] Found ${questions.length} questions in bank ${question_bank_iid}`);
            
            const kpiTimeData = getKpiTimeData(); // Static data array
            const mult = parseFloat(multiplier) || 1;
            let updatedCount = 0;
            let errors: string[] = [];

            // Update each question
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                console.log(`[update-kpi-time] Processing question ${i + 1}/${questions.length}: ${question.id}`);
                try {
                    // Extract idx from filename
                    const fileName = question.mark_video_question_files?.[0]?.name;
                    if (!fileName) {
                        errors.push(`Question ${question.id}: No video file`);
                        continue;
                    }

                    const idx = parseInt(fileName.split("-").pop() || "0");
                    if (idx < 1 || idx > kpiTimeData.length) {
                        errors.push(`Question ${question.id}: Invalid idx ${idx}`);
                        continue;
                    }

                    // Calculate new kpi_time
                    const newKpiTime = Math.round((kpiTimeData[idx - 1] / 1000) * mult);

                    // Update question
                    const updateResult = await updateInfo(client, {
                        ntype: "question",
                        id: [question.id],
                        data_set: { kpi_time: newKpiTime },
                    });

                    if (updateResult.success) {
                        updatedCount++;
                    } else {
                        errors.push(`Question ${question.id}: ${updateResult.error}`);
                    }
                } catch (error) {
                    errors.push(`Question ${question.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
                }
            }

            const history = mapRequestHistory(client);

            console.log(`[update-kpi-time] Bank ${question_bank_iid} complete: ${updatedCount}/${questions.length} updated, ${errors.length} errors`);

            return NextResponse.json({
                success: true,
                data: {
                    totalQuestions: questions.length,
                    updatedCount,
                    errors,
                },
                requestHistory: history,
            });
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("[POST /api/tools/auto-flow/update-kpi-time] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

// Static KPI time data
function getKpiTimeData(): number[] {
    return [
        27000, 39500, 34050, 34433, 33467, 30850, 33067, 34167, 23400, 31333,
        32650, 36883, 30083, 34117, 33200, 30233, 29000, 31300, 28900, 37250,
        39367, 32800, 32650, 34200, 45133, 43200, 34733, 35900, 33933, 37100,
        37567, 29433, 33367, 27000, 27567, 34367, 35433, 32633, 31883, 34833,
        33500, 31917, 35517, 27050, 29217, 37000, 35967, 33617, 33200, 35233,
        36017, 34917, 35600, 31367, 36100, 27333, 59633, 46900, 38683, 33717,
        37367, 36867, 30100, 33233, 42800, 28033, 38883, 32917, 37650, 58000,
        36100, 36917, 37067, 38733, 29717, 32450, 32033, 30600, 34200, 26433,
        34000, 35167, 30367, 31567, 39367, 30800, 34167, 31233, 30500, 29033,
        30950, 25150, 36817, 40833, 28567, 33117, 46267, 39000, 38000, 30617,
        36200, 31083, 36300, 40000, 30467, 40633, 41500, 36750, 31033, 32700,
        24733, 27200, 32867, 37050, 30500, 30017, 25633, 29650, 36267, 40017,
    ];
}
