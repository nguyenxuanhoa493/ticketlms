import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    executeQuery,
    AuthenticatedUser,
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";
import { LmsClient } from "@/lib/lms-client";
import { decrypt } from "@/lib/encryption";

export const POST = withAdmin(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient
    ) => {
        try {
            const body = await request.json();
            const { 
                environmentId, 
                path, 
                method = "POST", 
                payload = {}, 
                dmn,
                userCode,
                password 
            } = body;

            console.log("[POST /api/tools/api-runner] Execute request:", {
                environmentId,
                path,
                method,
                dmn,
                userCode,
            });

            // Validate required fields
            const validation = validateRequiredFields(body, ["environmentId", "path", "dmn"]);
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
                return NextResponse.json({ error: "Environment not found" }, { status: 404 });
            }

            // Determine user_code and password
            const finalUserCode = userCode || dmn;
            let finalPassword = password;

            // If no password provided, use environment password
            if (!finalPassword) {
                try {
                    if (finalUserCode === "root" && environment.pass_root) {
                        finalPassword = decrypt(environment.pass_root);
                        console.log("[POST /api/tools/api-runner] Using pass_root for root user");
                    } else if (environment.pass_master) {
                        finalPassword = decrypt(environment.pass_master);
                        console.log("[POST /api/tools/api-runner] Using pass_master");
                    }
                } catch (error) {
                    console.error("[POST /api/tools/api-runner] Decryption failed:", error);
                    return NextResponse.json({ error: "Failed to decrypt credentials" }, { status: 500 });
                }
            }

            if (!finalPassword) {
                return NextResponse.json({ error: "No password provided or found in environment" }, { status: 400 });
            }

            // Create LMS client
            const lmsClient = new LmsClient({
                dmn,
                host: environment.host,
                headers: {},
                base_params: {},
                user_code: finalUserCode,
                pass_master: finalPassword,
            });

            // Parse payload if string
            let parsedPayload = payload;
            if (typeof payload === "string") {
                try {
                    parsedPayload = JSON.parse(payload);
                } catch (e) {
                    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
                }
            }

            // Execute API call
            const result = await lmsClient.send({
                path,
                method: method as "GET" | "POST" | "PUT" | "DELETE",
                payload: parsedPayload,
                dmn,
            });

            if (!result.success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: result.error || "API call failed",
                        requestHistory: result.requestHistory,
                    },
                    { status: 500 }
                );
            }

            // Save to history (optional - implement later)
            // await saveRequestHistory(supabase, {
            //     user_id: user.id,
            //     environment_id: environmentId,
            //     path,
            //     method,
            //     payload: parsedPayload,
            //     response: result.data,
            //     metadata: result.metadata,
            // });

            console.log("[POST /api/tools/api-runner] Request executed successfully");

            return createSuccessResponse(
                {
                    response: result.data,
                    requestHistory: result.requestHistory,
                    environment: {
                        name: environment.name,
                        host: environment.host,
                        dmn: dmn || environment.name.toLowerCase(),
                    },
                },
                "API call executed successfully"
            );
        } catch (error) {
            console.error("[POST /api/tools/api-runner] Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
);
