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

// File upload utilities
export const validateFileUpload = (
    file: File,
    options: {
        maxSize?: number;
        allowedTypes?: string[];
        maxSizeMB?: number;
    } = {}
): { isValid: boolean; error?: string } => {
    const {
        maxSize = 5 * 1024 * 1024, // 5MB default
        allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
        ],
        maxSizeMB = 5,
    } = options;

    if (!file) {
        return { isValid: false, error: "No file uploaded" };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: `Invalid file type. Allowed types: ${allowedTypes.join(
                ", "
            )}`,
        };
    }

    if (file.size > maxSize) {
        return {
            isValid: false,
            error: `File too large. Maximum size is ${maxSizeMB}MB`,
        };
    }

    return { isValid: true };
};

export const generateUniqueFileName = (
    file: File,
    prefix: string = ""
): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split(".").pop();
    return `${prefix}${timestamp}_${randomString}.${fileExt}`;
};

// Database operation utilities
export const executeQuery = async <T>(
    query: Promise<{ data: T | null; error: any }>,
    context: string
): Promise<{ data: T | null; error: NextResponse | null }> => {
    try {
        const { data, error } = await query;

        if (error) {
            console.error(`Database error in ${context}:`, error);
            return {
                data: null,
                error: NextResponse.json(
                    { error: `Database operation failed: ${error.message}` },
                    { status: 500 }
                ),
            };
        }

        return { data, error: null };
    } catch (error) {
        console.error(`Unexpected error in ${context}:`, error);
        return {
            data: null,
            error: NextResponse.json(
                { error: `Unexpected error in ${context}` },
                { status: 500 }
            ),
        };
    }
};

// User data fetching utilities
export const fetchUserData = async (
    supabase: any,
    userIds: string[]
): Promise<Record<string, any>> => {
    if (userIds.length === 0) return {};

    const { data: users, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, organization_id")
        .in("id", userIds);

    if (error) {
        console.error("Error fetching user data:", error);
        return {};
    }

    return (
        users?.reduce((acc: Record<string, any>, user: any) => {
            acc[user.id] = user;
            return acc;
        }, {}) || {}
    );
};

// Ticket-specific utilities
export const buildTicketQuery = (
    supabase: any,
    user: AuthenticatedUser,
    filters: {
        status?: string;
        priority?: string;
        ticket_type?: string;
        platform?: string;
        search?: string;
        assigned_to?: string;
        created_by?: string;
        organization_id?: string;
        only_show_in_admin?: boolean;
    } = {}
) => {
    let query = supabase.from("tickets").select(`
            *,
            organizations(id, name, description)
        `);

    // Apply organization filter for non-admin users
    if (user.role !== "admin") {
        if (user.organization_id) {
            query = query.eq("organization_id", user.organization_id);
        } else {
            // If user has no organization, only show tickets with no organization
            query = query.is("organization_id", null);
        }
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            if (key === "search") {
                query = query.or(
                    `title.ilike.%${value}%,description.ilike.%${value}%`
                );
            } else if (key === "only_show_in_admin") {
                // Only show admin-only tickets to admins
                if (user.role === "admin") {
                    query = query.eq(key, value);
                } else {
                    query = query.eq(key, false);
                }
            } else if (key === "organization_id") {
                // Handle organization_id filter
                if (value === "null" || value === "") {
                    query = query.is("organization_id", null);
                } else {
                    query = query.eq(key, value);
                }
            } else {
                query = query.eq(key, value);
            }
        }
    });

    return query;
};

// Notification utilities
export const createNotification = async (
    supabase: any,
    notification: {
        user_id: string;
        type: string;
        title: string;
        message: string;
        ticket_id?: string;
        comment_id?: string;
        created_by: string;
    }
) => {
    const { data, error } = await supabase
        .from("notifications")
        .insert(notification)
        .select()
        .single();

    if (error) {
        console.error("Error creating notification:", error);
        throw error;
    }

    return data;
};

// Common response builders
export const buildPaginatedResponse = <T>(
    data: T[],
    total: number,
    page: number,
    limit: number
) => {
    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    };
};

export const buildTicketResponse = (
    ticket: any,
    userData: Record<string, any>
) => {
    return {
        ...ticket,
        created_user: userData[ticket.created_by] || null,
        assigned_user: ticket.assigned_to
            ? userData[ticket.assigned_to] || null
            : null,
    };
};
