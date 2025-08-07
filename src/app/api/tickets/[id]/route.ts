import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    executeQuery,
    fetchUserData,
    AuthenticatedUser
} from "@/lib/api-utils";

// Helper function to clean timestamp fields
const cleanTimestampFields = (data: any) => {
    const cleaned = { ...data };
    
    // Convert empty strings to null for timestamp fields that can be updated
    const timestampFields = ['expected_completion_date', 'closed_at'];
    
    timestampFields.forEach(field => {
        if (cleaned[field] === "" || cleaned[field] === undefined) {
            cleaned[field] = null;
        }
    });
    
    // Remove created_at and updated_at from update data as they should be managed by database
    delete cleaned.created_at;
    delete cleaned.updated_at;
    
    return cleaned;
};

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: any, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    
    const { data, error } = await executeQuery(
        supabase
            .from("tickets")
            .select(`
                *,
                organizations(id, name, description)
            `)
            .eq("id", id)
            .single(),
        "fetching ticket"
    );
    
    if (error) return error;
    
    // Check organization access
    if (user.role !== "admin" && (data as any).organization_id !== user.organization_id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Fetch user data for created_by and assigned_to
    const ticket = data as any;
    const userIds = new Set<string>();
    
    if (ticket.created_by) userIds.add(ticket.created_by);
    if (ticket.assigned_to) userIds.add(ticket.assigned_to);
    
    const userData = await fetchUserData(supabase, Array.from(userIds));
    
    // Merge user data into ticket
    const ticketWithUsers = {
        ...ticket,
        created_user: ticket.created_by ? userData[ticket.created_by] || null : null,
        assigned_user: ticket.assigned_to ? userData[ticket.assigned_to] || null : null,
    };
    
    return NextResponse.json(ticketWithUsers);
});

export const PUT = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: any, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const body = await request.json();
    
    // Check if user has permission to update this ticket
    const { data: existingTicket } = await supabase
        .from("tickets")
        .select("created_by, organization_id")
        .eq("id", id)
        .single();
    
    if (!existingTicket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    
    // Check permissions
    if (user.role !== "admin" && existingTicket.created_by !== user.id) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    
    // Validate organization_id based on user role
    let finalBody = { ...body };
    
    if (user.role !== "admin") {
        // Non-admin users cannot change organization_id
        finalBody.organization_id = user.organization_id;
        // Non-admin users cannot set only_show_in_admin to true
        finalBody.only_show_in_admin = false;
    }
    
    // Clean timestamp fields before sending to database
    finalBody = cleanTimestampFields(finalBody);
    
    // Add updated_at timestamp
    finalBody.updated_at = new Date().toISOString();
    
    const { data, error } = await executeQuery(
        supabase.from("tickets").update(finalBody).eq("id", id).select().single(),
        "updating ticket"
    );
    
    if (error) {
        return error;
    }
    return createSuccessResponse(data, "Ticket updated successfully");
});

export const DELETE = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: any, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    
    // Check if user has permission to delete this ticket
    const { data: existingTicket } = await supabase
        .from("tickets")
        .select("created_by, organization_id")
        .eq("id", id)
        .single();
    
    if (!existingTicket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    
    // Check permissions
    if (user.role !== "admin" && existingTicket.created_by !== user.id) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    
    const { error } = await executeQuery(
        supabase.from("tickets").delete().eq("id", id),
        "deleting ticket"
    );
    
    if (error) return error;
    
    return createSuccessResponse(null, "Ticket deleted successfully");
});
