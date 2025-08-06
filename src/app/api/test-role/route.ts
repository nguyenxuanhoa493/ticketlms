import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    executeQuery,
    AuthenticatedUser
} from "@/lib/api-utils";

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
    // Test role comparison
    const roleTests = {
        role: user.role,
        roleType: typeof user.role,
        isAdmin: user.role === "admin",
        isAdminStrict: user.role === "admin",
        isAdminLoose: user.role == "admin",
        roleLength: user.role?.length,
        roleCharCodes: user.role?.split("").map((c: string) => c.charCodeAt(0)),
    };

    // Test tickets query
    let ticketsQuery = supabase
        .from("tickets")
        .select("id, title, only_show_in_admin");

    if (user.role !== "admin") {
        ticketsQuery = ticketsQuery.eq("only_show_in_admin", false);
    }

    const { data: tickets, error: ticketsError } = await executeQuery(
        ticketsQuery.limit(5),
        "fetching test tickets"
    );

    if (ticketsError) {
        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                profile: {
                    full_name: user.full_name,
                    role: user.role,
                    organization_id: user.organization_id,
                },
            },
            roleTests,
            tickets: [],
            ticketsError: "Failed to fetch tickets",
            adminOnlyTickets: [],
        });
    }

    return NextResponse.json({
        user: {
            id: user.id,
            email: user.email,
            profile: {
                full_name: user.full_name,
                role: user.role,
                organization_id: user.organization_id,
            },
        },
        roleTests,
        tickets: tickets || [],
        ticketsError: null,
        adminOnlyTickets: (tickets as any[])?.filter((t: any) => t.only_show_in_admin) || [],
    });
});
