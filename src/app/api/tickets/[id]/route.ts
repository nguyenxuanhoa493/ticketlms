import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    createSuccessResponse,
    executeQuery,
    fetchUserData,
    AuthenticatedUser
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";
import { Database } from "@/types/database";

// Helper function to clean timestamp fields
const cleanTimestampFields = (data: Record<string, unknown>) => {
    const cleaned = { ...data };
    
    console.log("[cleanTimestampFields] Input data:", JSON.stringify(data, null, 2));
    
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
    
    console.log("[cleanTimestampFields] Output data:", JSON.stringify(cleaned, null, 2));
    
    return cleaned;
};

export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient, ...args: unknown[]) => {
    const { params } = args[0] as { params: Promise<{ id: string }> };
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
    if (user.role !== "admin" && data && (data as Database["public"]["Tables"]["tickets"]["Row"]).organization_id !== user.organization_id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Fetch user data for created_by and assigned_to
    const ticket = data as Database["public"]["Tables"]["tickets"]["Row"] | null;
    if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
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

export const PUT = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient, ...args: unknown[]) => {
    const { params } = args[0] as { params: Promise<{ id: string }> };
    const { id } = await params;
    
    try {
        let body;
        try {
            body = await request.json();
        } catch (jsonError) {
            console.error("[PUT /api/tickets/[id]] JSON parse error:", jsonError);
            return NextResponse.json(
                { error: "Invalid JSON in request body", details: jsonError instanceof Error ? jsonError.message : String(jsonError) },
                { status: 400 }
            );
        }
        console.log("[PUT /api/tickets/[id]] Request body:", JSON.stringify(body, null, 2));
        
        // Check if user has permission to update this ticket
        const { data: existingTicket, error: fetchError } = await supabase
            .from("tickets")
            .select("created_by, organization_id")
            .eq("id", id)
            .single();
        
        if (fetchError) {
            console.error("[PUT /api/tickets/[id]] Fetch error:", fetchError);
            return NextResponse.json({ error: "Database error", details: fetchError.message }, { status: 500 });
        }
        
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
            // Only set organization_id if it's explicitly provided in the request
            if ('organization_id' in body) {
                finalBody.organization_id = user.organization_id;
            }
            // Non-admin users cannot set only_show_in_admin to true
            if ('only_show_in_admin' in body) {
                finalBody.only_show_in_admin = false;
            }
        }
        
        // Ensure organization_id is never undefined - use existing value if not provided
        if ('organization_id' in finalBody && (finalBody.organization_id === undefined || finalBody.organization_id === "")) {
            // If organization_id is being set to empty/undefined, preserve the existing value
            delete finalBody.organization_id;
        }
        
        // Remove fields that shouldn't be in the update payload
        const fieldsToRemove = ['id', 'created_by', 'organizations', 'created_user', 'assigned_user', 'response'];
        fieldsToRemove.forEach(field => delete finalBody[field]);
        
        // Clean timestamp fields before sending to database
        finalBody = cleanTimestampFields(finalBody);
        
        // Add updated_at timestamp
        finalBody.updated_at = new Date().toISOString();
        
        console.log("[PUT /api/tickets/[id]] Final body for update:", JSON.stringify(finalBody, null, 2));
        console.log("[PUT /api/tickets/[id]] Final body keys:", Object.keys(finalBody));
        console.log("[PUT /api/tickets/[id]] Final body status:", finalBody.status);
        console.log("[PUT /api/tickets/[id]] Final body status type:", typeof finalBody.status);
        
        // Create a clean copy with only valid fields
        const updatePayload: Record<string, unknown> = {};
        const validFields = [
            'title', 'description', 'ticket_type', 'status', 'priority', 'platform',
            'organization_id', 'expected_completion_date', 'closed_at', 'jira_link',
            'only_show_in_admin', 'updated_at'
        ];
        
        validFields.forEach(field => {
            if (field in finalBody) {
                updatePayload[field] = finalBody[field];
            }
        });
        
        console.log("[PUT /api/tickets/[id]] Update payload:", JSON.stringify(updatePayload, null, 2));
        
        // Use explicit type casting for enum fields to ensure PostgreSQL receives correct values
        const typeCastedPayload = {
            ...updatePayload,
            status: updatePayload.status as Database["public"]["Enums"]["ticket_status"],
            ticket_type: updatePayload.ticket_type as Database["public"]["Enums"]["ticket_type"],
            priority: updatePayload.priority as Database["public"]["Enums"]["ticket_priority"],
        };
        
        console.log("[PUT /api/tickets/[id]] Type-casted payload:", JSON.stringify(typeCastedPayload, null, 2));
        
        const { data, error } = await supabase
            .from("tickets")
            .update(typeCastedPayload)
            .eq("id", id)
            .select()
            .single();
        
        if (error) {
            console.error("[PUT /api/tickets/[id]] Update error:", error);
            return NextResponse.json(
                { error: "Database update failed", details: error.message },
                { status: 500 }
            );
        }
        
        console.log("[PUT /api/tickets/[id]] Update successful");
        return createSuccessResponse(data, "Ticket updated successfully");
    } catch (err) {
        console.error("[PUT /api/tickets/[id]] Unexpected error:", err);
        return NextResponse.json(
            { error: "Internal server error", details: err instanceof Error ? err.message : String(err) },
            { status: 500 }
        );
    }
});

export const DELETE = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient, ...args: unknown[]) => {
    const { params } = args[0] as { params: Promise<{ id: string }> };
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
