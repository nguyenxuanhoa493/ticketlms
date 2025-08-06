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

export const GET = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = parsePaginationParams(searchParams);
    
    let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
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
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    const { data, error } = await executeQuery(
        query.range(offset, offset + limit - 1),
        "fetching users"
    );
    
    if (error) return error;
    
    const { count } = await query;
    
    return NextResponse.json(buildPaginatedResponse((data as any[]) || [], count || 0, page, limit));
});

export const POST = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
    const body = await request.json();
    const { email, password, full_name, role, organization_id } = body;
    
    // Validate required fields
    const validation = validateRequiredFields(body, ["email", "password", "full_name", "role"]);
    if (!validation.isValid) {
        return validation.error!;
    }
    
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });
    
    if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
    }
    
    // Create profile
    const profileData = {
        id: authData.user.id,
        full_name,
        role,
        organization_id: organization_id || user.organization_id,
    };
    
    const { data, error } = await executeQuery(
        supabase.from("profiles").insert(profileData).select().single(),
        "creating user profile"
    );
    
    if (error) return error;
    
    return createSuccessResponse(data, "User created successfully");
});
