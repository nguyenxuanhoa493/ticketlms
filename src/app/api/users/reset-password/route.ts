import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    AuthenticatedUser
} from "@/lib/api-utils";

export const POST = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
    const body = await request.json();
    const { user_id, new_password } = body;
    
    // Validate required fields
    const validation = validateRequiredFields(body, ["user_id", "new_password"]);
    if (!validation.isValid) {
        return validation.error!;
    }
    
    // Reset password for user
    const { error } = await supabase.auth.admin.updateUserById(user_id, {
        password: new_password
    });
    
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return createSuccessResponse(null, "Password reset successfully");
});
