import { NextRequest, NextResponse } from "next/server";
import {
    authenticateUser,
    handleApiError,
    AuthenticatedUser,
    checkUserPermission,
    checkOrganizationAccess,
} from "./api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

// Middleware wrapper for API routes that require authentication
export const withAuth = (
    handler: (
        req: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        ...args: unknown[]
    ) => Promise<NextResponse>
) => {
    return async (request: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
        try {
            const { user, error, supabase } = await authenticateUser();

            if (error) return error;
            if (!user || !supabase) {
                return NextResponse.json(
                    { error: "User not authenticated" },
                    { status: 401 }
                );
            }

            return await handler(request, user, supabase, ...args);
        } catch (error) {
            return handleApiError(error, "API operation");
        }
    };
};

// Middleware wrapper for API routes that require specific roles
export const withRole = (
    requiredRoles: string | string[],
    handler: (
        req: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        ...args: unknown[]
    ) => Promise<NextResponse>
) => {
    return withAuth(
        async (
            request: NextRequest,
            user: AuthenticatedUser,
            supabase: TypedSupabaseClient,
            ...args: unknown[]
        ) => {
            if (!checkUserPermission(user, requiredRoles)) {
                return NextResponse.json(
                    { error: "Insufficient permissions" },
                    { status: 403 }
                );
            }

            return await handler(request, user, supabase, ...args);
        }
    );
};

// Middleware wrapper for admin-only routes
export const withAdmin = (
    handler: (
        req: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        ...args: unknown[]
    ) => Promise<NextResponse>
) => {
    return withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient, ...args: unknown[]) => {
        console.log("[withAdmin] User attempting access:", { id: user.id, email: user.email, role: user.role });
        
        if (!checkUserPermission(user, "admin")) {
            console.error("[withAdmin] Permission denied - user role:", user.role);
            return NextResponse.json(
                { error: "Insufficient permissions. Admin role required." },
                { status: 403 }
            );
        }
        
        return await handler(request, user, supabase, ...args);
    });
};

// Middleware wrapper for manager and admin routes
export const withManager = (
    handler: (
        req: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient
    ) => Promise<NextResponse>
) => {
    return withRole(["admin", "manager"], handler);
};

// Middleware wrapper for organization-scoped routes
export const withOrganizationAccess = (
    handler: (
        req: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        targetOrgId?: string
    ) => Promise<NextResponse>
) => {
    return withAuth(
        async (
            request: NextRequest,
            user: AuthenticatedUser,
            supabase: TypedSupabaseClient
        ) => {
            // Extract organization_id from request body or params
            const body = await request.json().catch(() => ({}));
            const targetOrgId =
                body.organization_id ||
                new URL(request.url).searchParams.get("organization_id");

            if (targetOrgId && !checkOrganizationAccess(user, targetOrgId)) {
                return NextResponse.json(
                    { error: "Access denied to this organization" },
                    { status: 403 }
                );
            }

            return await handler(request, user, supabase, targetOrgId);
        }
    );
};

// Middleware wrapper for file upload routes
export const withFileUpload = (
    handler: (
        req: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        file: File
    ) => Promise<NextResponse>
) => {
    return withAuth(
        async (
            request: NextRequest,
            user: AuthenticatedUser,
            supabase: TypedSupabaseClient
        ) => {
            try {
                const formData = await request.formData();
                const file = formData.get("file") as File;

                if (!file) {
                    return NextResponse.json(
                        { error: "No file uploaded" },
                        { status: 400 }
                    );
                }

                return await handler(request, user, supabase, file);
            } catch (error) {
                return handleApiError(error, "File upload");
            }
        }
    );
};
