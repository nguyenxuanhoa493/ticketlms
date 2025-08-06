import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Temporary: Get current user from /api/current-user instead
        const currentUserResponse = await fetch(
            `${request.nextUrl.origin}/api/current-user`,
            {
                headers: {
                    cookie: request.headers.get("cookie") || "",
                },
            }
        );

        if (!currentUserResponse.ok) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const currentUserData = await currentUserResponse.json();
        const user = { id: currentUserData.id, email: currentUserData.email };

        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "New password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Verify current password by trying to sign in with it
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: currentPassword,
        });

        if (signInError) {
            return NextResponse.json(
                { error: "Mật khẩu hiện tại không đúng" },
                { status: 400 }
            );
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            console.error("Password update error:", updateError);
            return NextResponse.json(
                { error: "Đổi mật khẩu thất bại" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
