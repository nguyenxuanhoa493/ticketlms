import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
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

        // Get current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Mark all unread notifications as read
        const { data: notifications, error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false)
            .select("id");

        if (error) {
            console.error("Error marking notifications as read:", error);
            return NextResponse.json(
                { error: "Failed to mark notifications as read" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            updated_count: notifications?.length || 0,
            message: `Marked ${
                notifications?.length || 0
            } notifications as read`,
        });
    } catch (error) {
        console.error("Mark all read error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
