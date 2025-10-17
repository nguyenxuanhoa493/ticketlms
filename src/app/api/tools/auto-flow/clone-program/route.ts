import { NextRequest, NextResponse } from "next/server";
import { createApiClient } from "@/lib/supabase/server-client";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/encryption";
import { LmsClient } from "@/lib/lms";
import { LmsEnvironment } from "@/lib/lms/base-client";

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

        // Create LMS client
        const lmsClient = new LmsClient(lmsEnv);

        const startTime = Date.now();

        // Execute based on step
        if (step === "get_programs") {
            // Step 1: Get list of programs
            const programStatuses = statuses && Array.isArray(statuses) && statuses.length > 0
                ? statuses
                : ["approved"];
            
            const result = await lmsClient.getListProgram({
                status: programStatuses,
            });

            const executionTime = Date.now() - startTime;

            if (!result.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: result.error,
                        executionTime,
                        requestHistory: result.requestHistory,
                    },
                    { status: 400 }
                );
            }

            const programs = result.data?.result || [];

            return NextResponse.json({
                success: true,
                data: {
                    programs,
                    total: programs.length,
                },
                executionTime,
                requestHistory: result.requestHistory,
                message: `Found ${programs.length} programs`,
            });
        } else if (step === "clone") {
            // Step 2: Clone selected program
            if (!program_iid) {
                return NextResponse.json(
                    { error: "program_iid is required for clone step" },
                    { status: 400 }
                );
            }

            const result = await lmsClient.cloneProgram({
                program_iid: parseInt(program_iid),
            });

            const executionTime = Date.now() - startTime;

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
                    request_history: result.requestHistory || [],
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
                        requestHistory: result.requestHistory,
                    },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                data: result.data,
                executionTime,
                requestHistory: result.requestHistory,
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
