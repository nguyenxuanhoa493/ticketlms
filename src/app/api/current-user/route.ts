import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import { AuthenticatedUser } from "@/lib/api-utils";
import { NextRequest } from "next/server";

export const GET = withAuth(
    async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
        // Get organization info separately if user has one
        let organizationData = null;
        if (user.organization_id) {
            const { data: orgData, error: orgError } = await supabase
                .from("organizations")
                .select("id, name")
                .eq("id", user.organization_id)
                .single();

            if (!orgError) {
                organizationData = orgData;
            }
        }

        const responseData = {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            organization_id: user.organization_id,
            avatar_url: user.avatar_url,
            organizations: organizationData,
        };

        return NextResponse.json(responseData);
    }
);
