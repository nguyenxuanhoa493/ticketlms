import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

// Types
export interface AuthenticatedUser {
    id: string;
    email: string;
    full_name?: string;
    role: string;
    organization_id: string | null;
    avatar_url?: string | null;
}

export interface ApiResponse<T = any> {
    success?: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Supabase client factory
export const createApiSupabaseClient = (cookieStore: any) => {
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );
};

// Admin Supabase client factory
export const createAdminSupabaseClient = (cookieStore: any) => {
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
};

// Authentication middleware
export const authenticateUser = async (): Promise<{
    user: AuthenticatedUser | null;
    error: NextResponse | null;
    supabase: any;
}> => {
    try {
        const cookieStore = await cookies();
        const supabase = createApiSupabaseClient(cookieStore);

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return {
                user: null,
                error: NextResponse.json(
                    { error: "User not authenticated" },
                    { status: 401 }
                ),
                supabase,
            };
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, organization_id, full_name, avatar_url")
            .eq("id", user.id)
            .single();

        if (profileError) {
            return {
                user: null,
                error: NextResponse.json(
                    { error: "Failed to get user profile" },
                    { status: 500 }
                ),
                supabase,
            };
        }

        const authenticatedUser: AuthenticatedUser = {
            id: user.id,
            email: user.email || "",
            full_name: profile.full_name,
            role: profile.role,
            organization_id: profile.organization_id,
            avatar_url: profile.avatar_url,
        };

        return {
            user: authenticatedUser,
            error: null,
            supabase,
        };
    } catch (error) {
        return {
            user: null,
            error: NextResponse.json(
                { error: "Authentication failed" },
                { status: 500 }
            ),
            supabase: null,
        };
    }
};

// Error handler
export const handleApiError = (
    error: unknown,
    context: string
): NextResponse => {
    console.error(`Error in ${context}:`, error);
    const errorMessage =
        error instanceof Error ? error.message : `Failed to ${context}`;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
};

// Success response helper
export const createSuccessResponse = <T>(
    data?: T,
    message?: string
): NextResponse => {
    return NextResponse.json({
        success: true,
        ...(data && { data }),
        ...(message && { message }),
    });
};

// Validation helpers
export const validateRequiredFields = (
    body: any,
    requiredFields: string[]
): { isValid: boolean; error?: NextResponse } => {
    for (const field of requiredFields) {
        if (
            !body[field] ||
            (typeof body[field] === "string" && !body[field].trim())
        ) {
            return {
                isValid: false,
                error: NextResponse.json(
                    { error: `${field} is required` },
                    { status: 400 }
                ),
            };
        }
    }
    return { isValid: true };
};

// Permission helpers
export const checkUserPermission = (
    user: AuthenticatedUser,
    requiredRole: string | string[]
): boolean => {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
};

export const checkOrganizationAccess = (
    user: AuthenticatedUser,
    targetOrgId: string | null
): boolean => {
    if (user.role === "admin") return true;
    return user.organization_id === targetOrgId;
};

// Pagination helpers
export const parsePaginationParams = (searchParams: URLSearchParams) => {
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

// Common query builders
export const buildBaseQuery = (
    supabase: any,
    table: string,
    user: AuthenticatedUser
) => {
    let query = supabase.from(table).select("*");

    // Apply organization filter for non-admin users
    if (user.role !== "admin" && user.organization_id) {
        query = query.eq("organization_id", user.organization_id);
    }

    return query;
};
