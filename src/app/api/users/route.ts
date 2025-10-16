import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    parsePaginationParams,
    executeQuery,
    buildPaginatedResponse,
    AuthenticatedUser
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";
import { Database } from "@/types/database";

export const GET = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);
    
    let query = supabase
        .from("profiles")
        .select("*, organizations(id, name)", { count: "exact" })
        .order("created_at", { ascending: false });
    
    // Apply filters
    const organizationId = searchParams.get("organization_id");
    if (organizationId) {
        query = query.eq("organization_id", organizationId);
    }
    
    const role = searchParams.get("role");
    if (role) {
        query = query.eq("role", role);
    }
    
    const search = searchParams.get("search");
    if (search) {
        query = query.or(`full_name.ilike.%${search}%`);
    }
    
    const countResult = await query;
    const count = countResult.count;
    
    const queryWithRange = query.range(offset, offset + limit - 1);
    const { data, error } = await executeQuery(
        queryWithRange,
        "fetching users"
    );
    
    if (error) return error;
    
    // Get emails from auth.users using admin client
    const { getAdminClient } = await import("@/lib/supabase/server-client");
    const adminClient = getAdminClient();
    
    const usersWithEmails = await Promise.all(
        ((data as any[]) || []).map(async (profile) => {
            const { data: { user: authUser }, error: authError } = await adminClient.auth.admin.getUserById(profile.id);
            return {
                ...profile,
                email: authUser?.email || null
            };
        })
    );
    
    const response = NextResponse.json(buildPaginatedResponse(usersWithEmails, count || 0, page, limit));
    
    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
});

export const POST = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
    const body = await request.json();
    const { email, password, full_name, role, organization_id } = body;
    
    console.log("[POST /api/users] Creating user:", { email, full_name, role, organization_id });
    
    // Validate required fields
    const validation = validateRequiredFields(body, ["email", "password", "full_name", "role"]);
    if (!validation.isValid) {
        console.error("[POST /api/users] Validation failed:", validation.error);
        return validation.error!;
    }
    
    // IMPORTANT: Need admin client with service role for auth.admin operations
    const { getAdminClient } = await import("@/lib/supabase/server-client");
    const adminClient = getAdminClient();
    
    console.log("[POST /api/users] Using admin client for auth.admin.createUser");
    
    // Create user in auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });
    
    if (authError) {
        console.error("[POST /api/users] Auth creation failed:", authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    
    console.log("[POST /api/users] Auth user created:", authData.user.id);
    
    // Wait a bit for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Update profile (trigger already created it with default values)
    const profileData = {
        full_name,
        role,
        organization_id: organization_id || user.organization_id || null,
    };
    
    console.log("[POST /api/users] Updating profile:", profileData);
    
    // Use UPSERT to handle the case where trigger already created the profile
    const upsertQuery = adminClient
        .from("profiles")
        .upsert({
            id: authData.user.id,
            ...profileData
        })
        .select()
        .single();
    
    const { data, error } = await executeQuery(
        upsertQuery,
        "upserting user profile"
    );
    
    if (error) {
        console.error("[POST /api/users] Profile upsert failed:", error);
        return error;
    }
    
    console.log("[POST /api/users] Profile created/updated successfully:", data);
    return createSuccessResponse(data, "User created successfully");
});

export const PUT = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
    const body = await request.json();
    const { id, email, password, full_name, role, organization_id } = body;
    
    console.log("[PUT /api/users] Updating user:", { id, email, full_name, role, organization_id });
    
    // Validate required fields
    const validation = validateRequiredFields(body, ["id", "email", "full_name", "role"]);
    if (!validation.isValid) {
        console.error("[PUT /api/users] Validation failed:", validation.error);
        return validation.error!;
    }
    
    const { getAdminClient } = await import("@/lib/supabase/server-client");
    const adminClient = getAdminClient();
    
    // Update email if changed
    const { data: currentAuthUser } = await adminClient.auth.admin.getUserById(id);
    if (currentAuthUser.user && currentAuthUser.user.email !== email) {
        console.log("[PUT /api/users] Updating email in auth.users");
        const { error: emailError } = await adminClient.auth.admin.updateUserById(id, { email });
        if (emailError) {
            console.error("[PUT /api/users] Email update failed:", emailError);
            return NextResponse.json({ error: emailError.message }, { status: 400 });
        }
    }
    
    // Update password if provided
    if (password && password.trim()) {
        console.log("[PUT /api/users] Updating password");
        const { error: passwordError } = await adminClient.auth.admin.updateUserById(id, { password });
        if (passwordError) {
            console.error("[PUT /api/users] Password update failed:", passwordError);
            return NextResponse.json({ error: passwordError.message }, { status: 400 });
        }
    }
    
    // Update profile
    const profileData = {
        full_name,
        role,
        organization_id: organization_id || null,
    };
    
    console.log("[PUT /api/users] Updating profile:", profileData);
    
    const updateQuery = adminClient
        .from("profiles")
        .update(profileData)
        .eq("id", id)
        .select()
        .single();
    
    const { data, error } = await executeQuery(updateQuery, "updating user profile");
    
    if (error) {
        console.error("[PUT /api/users] Profile update failed:", error);
        return error;
    }
    
    console.log("[PUT /api/users] Profile updated successfully:", data);
    return createSuccessResponse(data, "User updated successfully");
});

export const DELETE = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    console.log("[DELETE /api/users] Deleting user:", id);
    
    if (!id) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    const { getAdminClient } = await import("@/lib/supabase/server-client");
    const adminClient = getAdminClient();
    
    // Delete profile first (due to foreign key constraints)
    const deleteProfileQuery = adminClient
        .from("profiles")
        .delete()
        .eq("id", id);
    
    const { error: profileError } = await executeQuery(deleteProfileQuery, "deleting user profile");
    
    if (profileError) {
        console.error("[DELETE /api/users] Profile deletion failed:", profileError);
        return profileError;
    }
    
    // Delete auth user
    const { error: authError } = await adminClient.auth.admin.deleteUser(id);
    
    if (authError) {
        console.error("[DELETE /api/users] Auth user deletion failed:", authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    
    console.log("[DELETE /api/users] User deleted successfully");
    return createSuccessResponse({ id }, "User deleted successfully");
});
