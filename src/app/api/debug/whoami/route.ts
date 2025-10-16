import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
    const { user, error, supabase } = await authenticateUser();

    if (error) {
        return error;
    }

    if (!user) {
        return NextResponse.json({
            authenticated: false,
            message: "No user found in session"
        });
    }

    // Return full user info for debugging
    return NextResponse.json({
        authenticated: true,
        user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            organization_id: user.organization_id,
            avatar_url: user.avatar_url
        },
        checks: {
            isAdmin: user.role === "admin",
            isManager: user.role === "manager",
            isUser: user.role === "user",
            canCreateUsers: user.role === "admin"
        }
    });
}
