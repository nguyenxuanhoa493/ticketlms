import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    AuthenticatedUser
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
    const body = await request.json();
    const { new_password } = body;
    
    // Validate required fields
    const validation = validateRequiredFields(body, ["current_password", "new_password"]);
    if (!validation.isValid) {
        return validation.error!;
    }
    
    // Change password
    const { error } = await supabase.auth.updateUser({
        password: new_password
    });
    
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return createSuccessResponse(null, "Password changed successfully");
});
