import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, newPassword } = body;

        if (!userId || !newPassword) {
            return NextResponse.json(
                { error: "User ID and new password are required" },
                { status: 400 }
            );
        }

        // Create server client with service role key
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get() {
                        return undefined;
                    },
                    set() {},
                    remove() {},
                },
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Reset password
        const { error } = await supabase.auth.admin.updateUserById(userId, {
            password: newPassword,
        });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error: unknown) {
        console.error("Error resetting password:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to reset password" },
            { status: 500 }
        );
    }
}
