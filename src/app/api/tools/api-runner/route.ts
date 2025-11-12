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

// Helper function to replace @item variables in an object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function replaceItemVariablesInObject(obj: any, item: any): any {
    if (typeof obj === 'string') {
        const fullMatch = obj.match(/^@item(\.[a-zA-Z0-9_]+|\[[0-9]+\](\.[a-zA-Z0-9_]+)*)*$/);
        if (fullMatch) {
            const path = fullMatch[0].slice(5);
            if (!path) return item;
            
            let value = item;
            const parts = path.match(/(\.[a-zA-Z0-9_]+|\[[0-9]+\])/g) || [];
            for (const part of parts) {
                if (part.startsWith('.')) {
                    value = value?.[part.slice(1)];
                } else if (part.startsWith('[')) {
                    const index = parseInt(part.slice(1, -1));
                    value = value?.[index];
                }
            }
            return value !== undefined ? value : obj;
        }
        return obj;
    } else if (Array.isArray(obj)) {
        return obj.map(v => replaceItemVariablesInObject(v, item));
    } else if (obj !== null && typeof obj === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = {};
        for (const key in obj) {
            result[key] = replaceItemVariablesInObject(obj[key], item);
        }
        return result;
    }
    return obj;
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
                environmentId, 
                path, 
                method = "POST", 
                payload = {}, 
                dmn,
                userCode,
                password,
                loopMode = false,
                loopData = []
            } = body;

            console.log("[POST /api/tools/api-runner] Execute request:", {
                environmentId,
                path,
                method,
                dmn,
                userCode,
                loopMode,
                loopDataLength: loopData.length,
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
                } catch {
                    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
                }
            }

            // Handle loop mode
            if (loopMode && Array.isArray(loopData) && loopData.length > 0) {
                console.log("[POST /api/tools/api-runner] Loop mode: executing", loopData.length, "requests");
                
                const loginStartTime = Date.now();
                
                // Login once before loop
                try {
                    await lmsClient.login(finalUserCode, finalPassword);
                } catch (error) {
                    console.error("[POST /api/tools/api-runner] Login failed:", error);
                    return NextResponse.json(
                        {
                            success: false,
                            error: "Login failed: " + (error instanceof Error ? error.message : "Unknown error"),
                        },
                        { status: 500 }
                    );
                }

                const loginTime = Date.now() - loginStartTime;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const allResponses: any[] = [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const allHistory: any[] = [];

                // Add login entry to history (once for the entire loop)
                allHistory.push({
                    method: "POST",
                    url: `${environment.host}/user/login`,
                    payload: { lname: finalUserCode },
                    statusCode: 200,
                    responseTime: loginTime,
                    response: { message: "Login successful" },
                    timestamp: new Date().toISOString(),
                    step: "Login (shared for all loop requests)",
                });
                
                for (let i = 0; i < loopData.length; i++) {
                    const item = loopData[i];
                    
                    // Replace @item variables in payload
                    const loopPayload = replaceItemVariablesInObject(parsedPayload, item);
                    
                    const iterationStartTime = Date.now();
                    
                    try {
                        // Send request using existing token (send won't login again because token exists)
                        const result = await lmsClient.send({
                            path,
                            method: method as "GET" | "POST" | "PUT" | "DELETE",
                            payload: loopPayload,
                            dmn,
                        });

                        const iterationTime = Date.now() - iterationStartTime;

                        if (result.success) {
                            allResponses.push({
                                index: i,
                                item,
                                response: result.data,
                                success: true,
                            });

                            // Add simplified history entry for this iteration
                            allHistory.push({
                                method,
                                url: `${environment.host}${path}`,
                                payload: loopPayload,
                                statusCode: 200,
                                responseTime: iterationTime,
                                response: result.data,
                                timestamp: new Date().toISOString(),
                                step: `[${i + 1}/${loopData.length}] Request`,
                                loopIndex: i,
                                loopItem: item,
                            });
                        } else {
                            allResponses.push({
                                index: i,
                                item,
                                error: result.error,
                                success: false,
                            });

                            allHistory.push({
                                method,
                                url: `${environment.host}${path}`,
                                payload: loopPayload,
                                statusCode: result.requestHistory?.[0]?.statusCode || 500,
                                responseTime: iterationTime,
                                response: { error: result.error },
                                timestamp: new Date().toISOString(),
                                step: `[${i + 1}/${loopData.length}] Request (Failed)`,
                                loopIndex: i,
                                loopItem: item,
                                hasError: true,
                            });
                        }
                    } catch (error) {
                        const iterationTime = Date.now() - iterationStartTime;
                        
                        allResponses.push({
                            index: i,
                            item,
                            error: error instanceof Error ? error.message : "Request failed",
                            success: false,
                        });

                        allHistory.push({
                            method,
                            url: `${environment.host}${path}`,
                            payload: loopPayload,
                            statusCode: 0,
                            responseTime: iterationTime,
                            response: { error: error instanceof Error ? error.message : "Request failed" },
                            timestamp: new Date().toISOString(),
                            step: `[${i + 1}/${loopData.length}] Request (Error)`,
                            loopIndex: i,
                            loopItem: item,
                            hasError: true,
                        });
                    }
                }

                console.log("[POST /api/tools/api-runner] Loop mode completed");

                return createSuccessResponse(
                    {
                        response: {
                            loopMode: true,
                            totalItems: loopData.length,
                            results: allResponses,
                        },
                        requestHistory: allHistory,
                        environment: {
                            name: environment.name,
                            host: environment.host,
                            dmn: dmn || environment.name.toLowerCase(),
                        },
                    },
                    "Loop mode executed successfully"
                );
            }

            // Normal mode - Execute single API call
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
