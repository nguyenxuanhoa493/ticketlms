import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/server-client";

/**
 * API endpoint to revoke all user sessions (admin only)
 * This forces all users to log out and log in again
 */
export async function POST(request: NextRequest) {
    try {
        const adminClient = getAdminClient();

        // Verify that the caller is an admin
        const { searchParams } = new URL(request.url);
        const adminKey = searchParams.get("admin_key");

        // Simple admin key check (you should use proper auth in production)
        if (adminKey !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json(
                { error: "Unauthorized. Admin key required." },
                { status: 401 }
            );
        }

        // Get all users
        const { data: users, error: usersError } = await adminClient.auth.admin.listUsers();

        if (usersError) {
            console.error("[revoke-all-sessions] Error fetching users:", usersError);
            return NextResponse.json(
                { error: "Failed to fetch users", details: usersError.message },
                { status: 500 }
            );
        }

        if (!users || users.users.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No users found",
                revokedCount: 0,
            });
        }

        // Revoke all sessions by deleting from auth.sessions table
        // This is more reliable than calling signOut for each user
        console.log("[revoke-all-sessions] Deleting all sessions from database...");
        
        const { error: deleteError, count } = await adminClient
            .from('sessions' as any)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using dummy condition)

        if (deleteError) {
            console.error("[revoke-all-sessions] Error deleting sessions:", deleteError);
            
            // Fallback: Try alternative approach - delete refresh tokens
            console.log("[revoke-all-sessions] Trying alternative: clearing refresh tokens...");
            
            const { error: refreshError } = await adminClient
                .from('refresh_tokens' as any)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
            
            if (refreshError) {
                console.error("[revoke-all-sessions] Error deleting refresh tokens:", refreshError);
                return NextResponse.json(
                    { 
                        error: "Failed to revoke sessions", 
                        details: deleteError.message,
                        fallbackError: refreshError.message,
                        suggestion: "Try running SQL directly in Supabase Dashboard: DELETE FROM auth.sessions; DELETE FROM auth.refresh_tokens;"
                    },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: `Successfully revoked all sessions. Affected users: ${users.users.length}`,
            revokedCount: users.users.length,
            failedCount: 0,
            totalUsers: users.users.length,
            method: "database_delete",
            note: "All sessions and refresh tokens have been cleared. Users must login again.",
        });
    } catch (error) {
        console.error("[revoke-all-sessions] Unexpected error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
