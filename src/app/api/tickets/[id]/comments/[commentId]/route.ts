import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    executeQuery,
    AuthenticatedUser
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

export const PUT = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient, ...args: unknown[]) => {
    const { params } = args[0] as { params: Promise<{ id: string; commentId: string }> };
    const { id: ticketId, commentId } = await params;
    const body = await request.json();
    const { content } = body;
    
    // Validate required fields
    const validation = validateRequiredFields(body, ["content"]);
    if (!validation.isValid) {
        return validation.error!;
    }
    
    // Check if comment exists and user has permission
    const { data: comment } = await supabase
        .from("comments")
        .select("user_id, ticket_id")
        .eq("id", commentId)
        .single();
    
    if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    
    if (comment.ticket_id !== ticketId) {
        return NextResponse.json({ error: "Comment does not belong to this ticket" }, { status: 400 });
    }
    
    if (user.role !== "admin" && comment.user_id !== user.id) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    
    const { data, error } = await executeQuery(
        supabase.from("comments").update({ content: content.trim() }).eq("id", commentId).select().single(),
        "updating comment"
    );
    
    if (error) return error;
    
    return createSuccessResponse(data, "Comment updated successfully");
});

export const DELETE = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient, ...args: unknown[]) => {
    const { params } = args[0] as { params: Promise<{ id: string; commentId: string }> };
    const { id: ticketId, commentId } = await params;
    
    // Check if comment exists and user has permission
    const { data: comment } = await supabase
        .from("comments")
        .select("user_id, ticket_id")
        .eq("id", commentId)
        .single();
    
    if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }
    
    if (comment.ticket_id !== ticketId) {
        return NextResponse.json({ error: "Comment does not belong to this ticket" }, { status: 400 });
    }
    
    if (user.role !== "admin" && comment.user_id !== user.id) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    
    const { error } = await executeQuery(
        supabase.from("comments").delete().eq("id", commentId),
        "deleting comment"
    );
    
    if (error) return error;
    
    return createSuccessResponse(null, "Comment deleted successfully");
});
