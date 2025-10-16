import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    createSuccessResponse,
    executeQuery,
    AuthenticatedUser
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

export const PUT = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient, ...args: unknown[]) => {
    const { params } = args[0] as { params: Promise<{ id: string }> };
    const { id } = await params;
    const body = await request.json();
    const { is_read } = body;
    
    // Check if notification belongs to user
    const { data: notification } = await supabase
        .from("notifications")
        .select("user_id")
        .eq("id", id)
        .single();
    
    if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    
    if (notification.user_id !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const { data, error } = await executeQuery(
        supabase.from("notifications").update({ is_read }).eq("id", id).select().single(),
        "updating notification"
    );
    
    if (error) return error;
    
    return createSuccessResponse(data, "Notification updated successfully");
});

export const DELETE = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient, ...args: unknown[]) => {
    const { params } = args[0] as { params: Promise<{ id: string }> };
    const { id } = await params;
    
    // Check if notification belongs to user
    const { data: notification } = await supabase
        .from("notifications")
        .select("user_id")
        .eq("id", id)
        .single();
    
    if (!notification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }
    
    if (notification.user_id !== user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const { error } = await executeQuery(
        supabase.from("notifications").delete().eq("id", id),
        "deleting notification"
    );
    
    if (error) return error;
    
    return createSuccessResponse(null, "Notification deleted successfully");
});
