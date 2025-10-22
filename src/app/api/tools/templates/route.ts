import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    AuthenticatedUser,
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

// GET - Get all templates
export const GET = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient
    ) => {
        try {
            // Fetch all templates (public for all admins) with folder info
            const { data: templates, error } = await supabase
                .from("api_request_templates")
                .select(`
                    *,
                    folder:api_template_folders(id, name, description, parent_id)
                `)
                .order("name", { ascending: true });

            if (error) {
                console.error("[GET /api/tools/templates] Error:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return createSuccessResponse(templates || [], "Templates fetched successfully");
        } catch (error) {
            console.error("[GET /api/tools/templates] Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
);

// POST - Create new template
export const POST = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient
    ) => {
        try {
            const body = await request.json();
            const {
                name,
                description,
                folder_id,
                environment_id,
                path,
                method,
                payload,
                dmn,
                user_code,
                password,
            } = body;

            // Validate required fields
            const validation = validateRequiredFields(body, ["name", "path", "method"]);
            if (!validation.isValid) {
                return NextResponse.json({ error: validation.error }, { status: 400 });
            }

            console.log("[POST /api/tools/templates] Inserting template:", {
                name,
                folder_id,
                created_by: user.id,
            });

            // Insert template
            const { data: template, error: insertError } = await supabase
                .from("api_request_templates")
                .insert({
                    name,
                    description: description || null,
                    folder_id: folder_id || null,
                    environment_id: environment_id || null,
                    path,
                    method,
                    payload: payload || {},
                    dmn: dmn || null,
                    user_code: user_code || null,
                    password: password || null,
                    created_by: user.id,
                })
                .select()
                .single();

            if (insertError) {
                console.error("[POST /api/tools/templates] Insert error:", insertError);
                return NextResponse.json(
                    { error: insertError.message || "Failed to create template" },
                    { status: 500 }
                );
            }

            return createSuccessResponse(template, "Template created successfully");
        } catch (error) {
            console.error("[POST /api/tools/templates] Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
);

// PUT - Update template
export const PUT = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient
    ) => {
        try {
            const body = await request.json();
            const { id, ...updates } = body;

            if (!id) {
                return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
            }

            console.log("[PUT /api/tools/templates] Updating template:", {
                id,
                userId: user.id,
                userRole: user.role,
                updates,
            });

            // First check if template exists
            const { data: existingTemplate, error: fetchError } = await supabase
                .from("api_request_templates")
                .select("*")
                .eq("id", id)
                .single();

            console.log("[PUT /api/tools/templates] Existing template:", {
                found: !!existingTemplate,
                createdBy: existingTemplate?.created_by,
                error: fetchError,
            });

            if (fetchError || !existingTemplate) {
                return NextResponse.json(
                    { error: "Template not found" },
                    { status: 404 }
                );
            }

            // Update template (any admin can update)
            const { data: templates, error: updateError } = await supabase
                .from("api_request_templates")
                .update(updates)
                .eq("id", id)
                .select();

            if (updateError) {
                console.error("[PUT /api/tools/templates] Update error:", updateError);
                return NextResponse.json(
                    { error: updateError.message || "Failed to update template" },
                    { status: 500 }
                );
            }

            if (!templates || templates.length === 0) {
                return NextResponse.json(
                    { error: "Template not found or access denied" },
                    { status: 404 }
                );
            }

            const template = templates[0];

            return createSuccessResponse(template, "Template updated successfully");
        } catch (error) {
            console.error("[PUT /api/tools/templates] Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
);

// DELETE - Delete template
export const DELETE = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient
    ) => {
        try {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get("id");

            if (!id) {
                return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
            }

            // Delete template (any admin can delete)
            const { error: deleteError } = await supabase
                .from("api_request_templates")
                .delete()
                .eq("id", id);

            if (deleteError) {
                console.error("[DELETE /api/tools/templates] Delete error:", deleteError);
                return NextResponse.json(
                    { error: deleteError.message },
                    { status: 500 }
                );
            }

            return createSuccessResponse(null, "Template deleted successfully");
        } catch (error) {
            console.error("[DELETE /api/tools/templates] Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
);
