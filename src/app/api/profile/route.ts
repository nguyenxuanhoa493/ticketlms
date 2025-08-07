import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    executeQuery,
    AuthenticatedUser,
} from "@/lib/api-utils";

export const GET = withAuth(
    async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
        const { data, error } = await executeQuery(
            supabase
                .from("profiles")
                .select(
                    `
                    id,
                    full_name,
                    role,
                    organization_id,
                    avatar_url,
                    created_at,
                    updated_at,
                    organizations(id, name, description)
                `
                )
                .eq("id", user.id)
                .single(),
            "fetching profile"
        );

        if (error) return error;

        return createSuccessResponse(data, "Profile fetched successfully");
    }
);

export const PUT = withAuth(
    async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
        const body = await request.json();
        const { full_name, role, organization_id, avatar_url } = body;

        // Validate required fields
        const validation = validateRequiredFields(body, ["full_name"]);
        if (!validation.isValid) {
            return validation.error!;
        }

        // Only admin can change role and organization
        const updateData: any = {
            full_name: full_name?.trim(),
            avatar_url: avatar_url || null,
        };

        if (user.role === "admin") {
            updateData.role = role;
            updateData.organization_id = organization_id || null;
        }

        // Add updated_at timestamp
        updateData.updated_at = new Date().toISOString();

        const { data, error } = await executeQuery(
            supabase
                .from("profiles")
                .update(updateData)
                .eq("id", user.id)
                .select(
                    `
                    id,
                    full_name,
                    role,
                    organization_id,
                    avatar_url,
                    created_at,
                    updated_at,
                    organizations(id, name, description)
                `
                )
                .single(),
            "updating profile"
        );

        if (error) return error;

        return createSuccessResponse(data, "Profile updated successfully");
    }
);
