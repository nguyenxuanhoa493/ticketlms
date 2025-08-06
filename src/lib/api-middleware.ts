import { NextRequest, NextResponse } from "next/server";
import {
    authenticateUser,
    handleApiError,
    AuthenticatedUser,
} from "./api-utils";

// Middleware wrapper for API routes that require authentication
export const withAuth = (
    handler: (
        req: NextRequest,
        user: AuthenticatedUser,
        supabase: any
    ) => Promise<NextResponse>
) => {
    return async (request: NextRequest): Promise<NextResponse> => {
        try {
            const { user, error, supabase } = await authenticateUser();

            if (error) return error;
            if (!user) {
                return NextResponse.json(
                    { error: "User not authenticated" },
                    { status: 401 }
                );
            }

            return await handler(request, user, supabase);
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
        supabase: any
    ) => Promise<NextResponse>
) => {
    return withAuth(
        async (
            request: NextRequest,
            user: AuthenticatedUser,
            supabase: any
        ) => {
            const roles = Array.isArray(requiredRoles)
                ? requiredRoles
                : [requiredRoles];

            if (!roles.includes(user.role)) {
                return NextResponse.json(
                    { error: "Insufficient permissions" },
                    { status: 403 }
                );
            }

            return await handler(request, user, supabase);
        }
    );
};

// Middleware wrapper for admin-only routes
export const withAdmin = (
    handler: (
        req: NextRequest,
        user: AuthenticatedUser,
        supabase: any
    ) => Promise<NextResponse>
) => {
    return withRole("admin", handler);
};

// Middleware wrapper for manager and admin routes
export const withManager = (
    handler: (
        req: NextRequest,
        user: AuthenticatedUser,
        supabase: any
    ) => Promise<NextResponse>
) => {
    return withRole(["admin", "manager"], handler);
};
