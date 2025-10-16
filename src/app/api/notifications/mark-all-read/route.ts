import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    createSuccessResponse,
    executeQuery,
    AuthenticatedUser
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
    const { error } = await executeQuery(
        supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false),
        "marking all notifications as read"
    );
    
    if (error) return error;
    
    return createSuccessResponse(null, "All notifications marked as read");
});
