import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    executeQuery,
    AuthenticatedUser,
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

export const GET = withAuth(
    async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
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
    async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
        const body = await request.json();
        const { full_name, role, organization_id, avatar_url } = body;

        // Validate required fields
        const validation = validateRequiredFields(body, ["full_name"]);
        if (!validation.isValid) {
            return validation.error!;
        }

        // Only admin can change role and organization
        const updateData: Record<string, string | null> = {
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
