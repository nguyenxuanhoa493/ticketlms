import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, role, organization_id, avatar_url")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // Get organization info separately if user has one
        let organizationData = null;
        if (profile?.organization_id) {
            const { data: orgData, error: orgError } = await supabase
                .from("organizations")
                .select("id, name")
                .eq("id", profile.organization_id)
                .single();

            if (!orgError) {
                organizationData = orgData;
            }
        }

        const responseData = {
            id: user.id,
            email: user.email,
            full_name: profile?.full_name,
            role: profile?.role,
            organization_id: profile?.organization_id,
            avatar_url: profile?.avatar_url,
            organizations: organizationData,
        };

        console.log("Current user API response:", {
            hasProfile: !!profile,
            avatar_url: profile?.avatar_url,
            userId: user.id,
        });

        return NextResponse.json(responseData);
    } catch (error: unknown) {
        console.error("Error getting current user:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Failed to get current user";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
