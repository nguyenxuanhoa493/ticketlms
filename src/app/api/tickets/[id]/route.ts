import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies();
        const ticketId = params.id;

        if (!ticketId) {
            return NextResponse.json(
                { error: "Ticket ID is required" },
                { status: 400 }
            );
        }

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

        // Get current user
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Get user profile to check permissions
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // Fetch ticket with related data
        const { data: ticket, error: ticketError } = await supabase
            .from("tickets")
            .select(
                `
                *,
                organizations:organization_id (
                    id,
                    name
                )
            `
            )
            .eq("id", ticketId)
            .single();

        if (ticketError) {
            if (ticketError.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Ticket not found" },
                    { status: 404 }
                );
            }
            throw ticketError;
        }

        // Fetch created user separately from profiles table
        let created_user = null;
        if (ticket.created_by) {
            const { data: userProfile, error: userError } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url")
                .eq("id", ticket.created_by)
                .single();

            if (!userError) {
                created_user = userProfile;
            }
        }

        // Add created_user to ticket object
        const ticketWithUser = {
            ...ticket,
            created_user,
        };

        // Check permissions - users can only see tickets from their organization
        if (profile.role !== "admin") {
            if (ticketWithUser.organization_id !== profile.organization_id) {
                return NextResponse.json(
                    { error: "Permission denied" },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json({ ticket: ticketWithUser });
    } catch (error: unknown) {
        console.error("Error fetching ticket:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch ticket" },
            { status: 500 }
        );
    }
}
