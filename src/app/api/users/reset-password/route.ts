import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    AuthenticatedUser
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

export const POST = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
    const body = await request.json();
    // Support both camelCase (from frontend) and snake_case
    const userId = body.userId || body.user_id;
    const newPassword = body.newPassword || body.new_password;
    
    console.log("[POST /api/users/reset-password] Resetting password for user:", userId);
    
    // Validate required fields
    if (!userId || !newPassword) {
        console.error("[POST /api/users/reset-password] Missing required fields");
        return NextResponse.json({ error: "userId and newPassword are required" }, { status: 400 });
    }
    
    // Need admin client for auth.admin operations
    const { getAdminClient } = await import("@/lib/supabase/server-client");
    const adminClient = getAdminClient();
    
    // Reset password for user
    const { error } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword
    });
    
    if (error) {
        console.error("[POST /api/users/reset-password] Password reset failed:", error);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    console.log("[POST /api/users/reset-password] Password reset successfully");
    return createSuccessResponse(null, "Password reset successfully");
});
