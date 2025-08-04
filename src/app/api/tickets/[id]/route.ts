import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const { id } = await params;
        const ticketId = id;

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
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to fetch ticket",
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const { id } = await params;
        const ticketId = id;

        console.log("PUT request for ticket ID:", ticketId);

        let body;
        try {
            body = await request.json();
            console.log("Request body:", body);
        } catch (parseError) {
            console.error("Error parsing request body:", parseError);
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

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
            error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
            console.error("Auth error:", authError);
            return NextResponse.json(
                { error: "Authentication error" },
                { status: 401 }
            );
        }

        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        console.log("User authenticated:", user.id);

        // Get user profile to check permissions
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .single();

        if (profileError) {
            console.error("Profile error:", profileError);
            throw profileError;
        }

        console.log("User profile:", profile);

        // First, get the existing ticket to check permissions
        const { data: existingTicket, error: ticketError } = await supabase
            .from("tickets")
            .select("organization_id, created_by")
            .eq("id", ticketId)
            .single();

        if (ticketError) {
            console.error("Ticket fetch error:", ticketError);
            if (ticketError.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Ticket not found" },
                    { status: 404 }
                );
            }
            throw ticketError;
        }

        console.log("Existing ticket:", existingTicket);

        // Check permissions - users can only update tickets from their organization
        if (profile.role !== "admin") {
            if (existingTicket.organization_id !== profile.organization_id) {
                return NextResponse.json(
                    { error: "Permission denied" },
                    { status: 403 }
                );
            }
        }

        // Prepare update data - only allow specific fields to be updated
        const allowedFields = [
            "title",
            "description",
            "ticket_type",
            "status",
            "priority",
            "platform",
            "assigned_to",
            "expected_completion_date",
            "closed_at",
            "response",
            "jira_link",
        ];

        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        // Only include fields that are allowed and present in the request
        for (const field of allowedFields) {
            if (body.hasOwnProperty(field)) {
                let value = body[field];

                // Handle timestamp fields - convert empty strings to null
                if (
                    field === "closed_at" ||
                    field === "expected_completion_date"
                ) {
                    if (value === "" || value === null || value === undefined) {
                        value = null;
                    } else if (
                        typeof value === "string" &&
                        value.trim() === ""
                    ) {
                        value = null;
                    }
                }

                updateData[field] = value;
            }
        }

        console.log("Update data:", updateData);

        // Update the ticket
        const { data: updatedTicket, error: updateError } = await supabase
            .from("tickets")
            .update(updateData)
            .eq("id", ticketId)
            .select(
                `
                *,
                organizations:organization_id (
                    id,
                    name
                )
            `
            )
            .single();

        if (updateError) {
            console.error("Error updating ticket:", updateError);
            return NextResponse.json(
                { error: `Failed to update ticket: ${updateError.message}` },
                { status: 500 }
            );
        }

        console.log("Ticket updated successfully:", updatedTicket);

        // Fetch created user separately from profiles table
        let created_user = null;
        if (updatedTicket.created_by) {
            const { data: userProfile, error: userError } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url")
                .eq("id", updatedTicket.created_by)
                .single();

            if (!userError) {
                created_user = userProfile;
            }
        }

        // Add created_user to ticket object
        const ticketWithUser = {
            ...updatedTicket,
            created_user,
        };

        console.log("Ticket with user data:", ticketWithUser);

        return NextResponse.json({ ticket: ticketWithUser });
    } catch (error: unknown) {
        console.error("Error updating ticket:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to update ticket",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const { id } = await params;
        const ticketId = id;

        console.log("DELETE request for ticket ID:", ticketId);

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
            error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
            console.error("Auth error:", authError);
            return NextResponse.json(
                { error: "Authentication error" },
                { status: 401 }
            );
        }

        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        console.log("User authenticated:", user.id);

        // Get user profile to check permissions
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .single();

        if (profileError) {
            console.error("Profile error:", profileError);
            throw profileError;
        }

        console.log("User profile:", profile);

        // Check if user is admin
        if (profile.role !== "admin") {
            return NextResponse.json(
                { error: "Only admins can delete tickets" },
                { status: 403 }
            );
        }

        // First, get the existing ticket to check if it exists
        const { data: existingTicket, error: ticketError } = await supabase
            .from("tickets")
            .select("id, title, organization_id")
            .eq("id", ticketId)
            .single();

        if (ticketError) {
            console.error("Ticket fetch error:", ticketError);
            if (ticketError.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Ticket not found" },
                    { status: 404 }
                );
            }
            throw ticketError;
        }

        console.log("Existing ticket:", existingTicket);

        // Delete the ticket
        const { error: deleteError } = await supabase
            .from("tickets")
            .delete()
            .eq("id", ticketId);

        if (deleteError) {
            console.error("Error deleting ticket:", deleteError);
            return NextResponse.json(
                { error: `Failed to delete ticket: ${deleteError.message}` },
                { status: 500 }
            );
        }

        console.log("Ticket deleted successfully:", ticketId);

        return NextResponse.json({
            success: true,
            message: "Ticket deleted successfully",
            deletedTicketId: ticketId,
        });
    } catch (error: unknown) {
        console.error("Error deleting ticket:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete ticket",
            },
            { status: 500 }
        );
    }
}
