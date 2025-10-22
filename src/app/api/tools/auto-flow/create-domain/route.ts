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
import { getDomainGroups, createDomain } from "@/lib/lms/admin";

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

            // Create LMS client
            const lmsClient = new LmsClient({
                dmn,
                host: environment.host,
                headers: {},
                base_params: {},
                user_code: finalUserCode,
                pass_master: finalPassword,
            });

            // Handle different actions
            if (action === "get_domain_groups") {
                // Action 1: Get domain groups
                const result = await getDomainGroups(lmsClient);

                const history = lmsClient.getRequestHistory().map((item, index) => ({
                    ...item,
                    id: Date.now() + index,
                    isLoading: false,
                    isComplete: true,
                    hasError: item.statusCode !== 200,
                }));

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

                const result = await createDomain(lmsClient, {
                    slug,
                    domainGroup,
                });

                const history = (result.requestHistory || []).map((item: any, index: number) => ({
                    ...item,
                    id: Date.now() + index,
                    isLoading: false,
                    isComplete: true,
                    hasError: item.statusCode !== 200,
                }));

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
                        result: result.data,
                        requestHistory: history,
                    },
                    "Domain created successfully"
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
