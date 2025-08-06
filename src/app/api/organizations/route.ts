import { NextRequest, NextResponse } from "next/server";
import { withAuth, withAdmin } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    AuthenticatedUser,
} from "@/lib/api-utils";
import { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

// GET - Filter organizations based on user role
export const GET = withAuth(
    async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
        let query = supabase.from("organizations").select("*");

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
                const { count, error: countError } = await supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", org.id)
                    .neq("status", "closed");

                if (countError) {
                    console.error(
                        "Error counting tickets for org",
                        org.id,
                        countError
                    );
                }

                return {
                    ...org,
                    openTicketsCount: count || 0,
                };
            })
        );

        return NextResponse.json({ organizations: organizationsWithCount });
    }
);

// POST - Chỉ admin mới có thể tạo organization
export const POST = withAdmin(
    async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
        const body = await request.json();
        const { name, description } = body;

        const validation = validateRequiredFields(body, ["name"]);
        if (!validation.isValid) {
            return validation.error!;
        }

        const { error } = await supabase.from("organizations").insert({
            name: name.trim(),
            description: description?.trim() || null,
        });

        if (error) throw error;

        return createSuccessResponse(null, "Organization created successfully");
    }
);

// PUT - Chỉ admin mới có thể cập nhật organization
export const PUT = withAdmin(
    async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
        const body = await request.json();
        const { id, name, description } = body;

        const validation = validateRequiredFields(body, ["id", "name"]);
        if (!validation.isValid) {
            return validation.error!;
        }

        const { error } = await supabase
            .from("organizations")
            .update({
                name: name.trim(),
                description: description?.trim() || null,
            })
            .eq("id", id);

        if (error) throw error;

        return createSuccessResponse(null, "Organization updated successfully");
    }
);

// DELETE - Chỉ admin mới có thể xóa organization
export const DELETE = withAdmin(
    async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
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
