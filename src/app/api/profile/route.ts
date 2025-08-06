import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    executeQuery,
    AuthenticatedUser
} from "@/lib/api-utils";

export const PUT = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
    const body = await request.json();
    const { full_name, role, organization_id, avatar_url } = body;
    
    // Validate required fields
    if (full_name !== undefined && !full_name?.trim()) {
        return NextResponse.json({ error: "Full name cannot be empty" }, { status: 400 });
    }
    
    // Only admin can change role and organization
    const updateData: any = { full_name, avatar_url };
    if (user.role === "admin") {
        updateData.role = role;
        updateData.organization_id = organization_id;
    }
    
    const { data, error } = await executeQuery(
        supabase.from("profiles").update(updateData).eq("id", user.id).select().single(),
        "updating profile"
    );
    
    if (error) return error;
    
    return createSuccessResponse(data, "Profile updated successfully");
});
