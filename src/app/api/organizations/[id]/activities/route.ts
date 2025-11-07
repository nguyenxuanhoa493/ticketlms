import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { AuthenticatedUser, validateRequiredFields, createSuccessResponse } from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

export const GET = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        context?: unknown
    ) => {
        const params = context as { params: Promise<{ id: string }> };
        const { id } = await params.params;

        const { data: activities, error } = await supabase
            .from("organization_activities")
            .select(
                `
                *,
                user:profiles!organization_activities_created_by_fkey(
                    full_name,
                    avatar_url
                )
            `
            )
            .eq("organization_id", id)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ activities: activities || [] });
    }
);

export const POST = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        context?: unknown
    ) => {
        const params = context as { params: Promise<{ id: string }> };
        const { id } = await params.params;
        const body = await request.json();
        const { title, description, activity_type } = body;

        const validation = validateRequiredFields(body, ["title", "activity_type"]);
        if (!validation.isValid) {
            return validation.error!;
        }

        const { error } = await supabase.from("organization_activities").insert({
            organization_id: id,
            activity_type: activity_type || "custom",
            title: title.trim(),
            description: description?.trim() || null,
            created_by: user.id,
        });

        if (error) throw error;

        return createSuccessResponse(null, "Activity created successfully");
    }
);
