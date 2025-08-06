import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
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

        // Lấy thông tin user hiện tại
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Lấy profile của user để biết role và organization
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, organization_id, full_name")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // Test role comparison
        const roleTests = {
            role: profile.role,
            roleType: typeof profile.role,
            isAdmin: profile.role === "admin",
            isAdminStrict: profile.role === "admin",
            isAdminLoose: profile.role == "admin",
            roleLength: profile.role?.length,
            roleCharCodes: profile.role?.split("").map((c: string) => c.charCodeAt(0)),
        };

        // Test tickets query
        let ticketsQuery = supabase
            .from("tickets")
            .select("id, title, only_show_in_admin");

        if (profile.role !== "admin") {
            ticketsQuery = ticketsQuery.eq("only_show_in_admin", false);
        }

        const { data: tickets, error: ticketsError } =
            await ticketsQuery.limit(5);

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                profile: {
                    full_name: profile.full_name,
                    role: profile.role,
                    organization_id: profile.organization_id,
                },
            },
            roleTests,
            tickets: tickets || [],
            ticketsError: ticketsError?.message || null,
            adminOnlyTickets:
                tickets?.filter((t) => t.only_show_in_admin) || [],
        });
    } catch (error: unknown) {
        console.error("Error in test-role:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to test role";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
