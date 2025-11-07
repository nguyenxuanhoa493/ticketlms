import { NextRequest, NextResponse } from "next/server";
import { withAuth, withAdmin } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    AuthenticatedUser,
} from "@/lib/api-utils";
import { Database } from "@/types/database";
import { TypedSupabaseClient } from "@/types/supabase";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

// GET - Filter organizations based on user role
export const GET = withAuth(
    async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
        let query = supabase.from("organizations").select(`
            *,
            assigned_admin:profiles!organizations_assigned_admin_id_fkey(
                id,
                full_name,
                avatar_url
            )
        `);

        // Apply organization filter for non-admin users
        if (user.role !== "admin" && user.organization_id) {
            query = query.eq("id", user.organization_id);
        }

        const { data, error } = await query.order("created_at", {
            ascending: false,
        });

        if (error) throw error;

        // Get open tickets count for each organization
        const organizationsWithCount = await Promise.all(
            (data || []).map(async (org: Organization) => {
                try {
                    const { count, error: countError } = await supabase
                        .from("tickets")
                        .select("*", { count: "exact", head: true })
                        .eq("organization_id", org.id)
                        .neq("status", "closed");

                    if (countError) {
                        console.error(
                            "Error getting open tickets count:",
                            countError
                        );
                    }

                    return {
                        ...org,
                        openTicketsCount: count || 0,
                    };
                } catch (error) {
                    console.error(
                        "Error processing organization:",
                        org.id,
                        error
                    );
                    return {
                        ...org,
                        openTicketsCount: 0,
                    };
                }
            })
        );

        return NextResponse.json({ organizations: organizationsWithCount });
    }
);

// POST - Chỉ admin mới có thể tạo organization
export const POST = withAdmin(
    async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
        const body = await request.json();
        const { name, description, status, assigned_admin_id } = body;

        console.log("[POST /api/organizations] Creating organization:", {
            name,
            status,
            assigned_admin_id,
            hasDescription: !!description,
        });

        const validation = validateRequiredFields(body, ["name"]);
        if (!validation.isValid) {
            return validation.error!;
        }

        const insertData: Record<string, unknown> = {
            name: name.trim(),
            description: description?.trim() || null,
            created_by: user.id,
        };

        // Add status if provided, otherwise use default 'active'
        if (status) {
            insertData.status = status;
        }

        // Add assigned_admin_id if provided
        if (assigned_admin_id) {
            insertData.assigned_admin_id = assigned_admin_id;
        }

        const { error } = await supabase.from("organizations").insert(insertData);

        if (error) {
            console.error("[POST /api/organizations] Insert failed:", error);
            throw error;
        }

        console.log("[POST /api/organizations] Insert successful");
        return createSuccessResponse(null, "Organization created successfully");
    }
);

// PUT - Chỉ admin mới có thể cập nhật organization
export const PUT = withAdmin(
    async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
        const body = await request.json();
        const { id, name, description, status, assigned_admin_id } = body;

        console.log("[PUT /api/organizations] Updating organization:", {
            id,
            name,
            status,
            assigned_admin_id,
            hasDescription: !!description,
        });

        const validation = validateRequiredFields(body, ["id", "name"]);
        if (!validation.isValid) {
            return validation.error!;
        }

        const updateData: Record<string, unknown> = {
            name: name.trim(),
            description: description?.trim() || null,
        };

        // Only update status if provided
        if (status !== undefined) {
            updateData.status = status;
        }

        // Only update assigned_admin_id if provided (can be null to unassign)
        if (assigned_admin_id !== undefined) {
            updateData.assigned_admin_id = assigned_admin_id;
        }

        console.log("[PUT /api/organizations] Update data:", updateData);

        const { error } = await supabase
            .from("organizations")
            .update(updateData)
            .eq("id", id);

        if (error) {
            console.error("[PUT /api/organizations] Update failed:", error);
            throw error;
        }

        console.log("[PUT /api/organizations] Update successful");
        return createSuccessResponse(null, "Organization updated successfully");
    }
);

// DELETE - Chỉ admin mới có thể xóa organization
export const DELETE = withAdmin(
    async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Organization ID is required" },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from("organizations")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return createSuccessResponse(null, "Organization deleted successfully");
    }
);
