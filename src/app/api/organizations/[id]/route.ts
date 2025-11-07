import { NextRequest, NextResponse } from "next/server";
import { withAuth, withAdmin } from "@/lib/api-middleware";
import { AuthenticatedUser } from "@/lib/api-utils";
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

        const { data: organization, error } = await supabase
            .from("organizations")
            .select(
                `
                *,
                assigned_admin:profiles!organizations_assigned_admin_id_fkey(
                    id,
                    full_name,
                    avatar_url
                )
            `
            )
            .eq("id", id)
            .single();

        if (error) throw error;

        return NextResponse.json({ organization });
    }
);
