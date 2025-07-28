import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const notificationId = id;
        const body = await request.json();
        const { is_read } = body;

        // Update notification (RLS will ensure user can only update their own)
        const { data: notification, error } = await supabase
            .from("notifications")
            .update({ is_read: is_read ?? true })
            .eq("id", notificationId)
            .eq("user_id", user.id) // Extra security check
            .select()
            .single();

        if (error) {
            console.error("Error updating notification:", error);
            return NextResponse.json(
                { error: "Failed to update notification" },
                { status: 500 }
            );
        }

        if (!notification) {
            return NextResponse.json(
                { error: "Notification not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            notification,
        });
    } catch (error) {
        console.error("Update notification error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const notificationId = id;

        // Delete notification (RLS will ensure user can only delete their own)
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", notificationId)
            .eq("user_id", user.id); // Extra security check

        if (error) {
            console.error("Error deleting notification:", error);
            return NextResponse.json(
                { error: "Failed to delete notification" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Notification deleted",
        });
    } catch (error) {
        console.error("Delete notification error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
