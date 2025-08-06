import { NextRequest, NextResponse } from "next/server";
import { withAuth, withManager } from "@/lib/api-middleware";
import {
    parsePaginationParams,
    validateRequiredFields,
    createSuccessResponse,
    AuthenticatedUser,
} from "@/lib/api-utils";

export const GET = withAuth(
    async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unread_only") === "true";
        const limit = parseInt(searchParams.get("limit") || "50");

        let query = supabase
            .from("notifications")
            .select(
                `
            id,
            type,
            title,
            message,
            is_read,
            ticket_id,
            comment_id,
            created_by,
            created_at
        `
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (unreadOnly) {
            query = query.eq("is_read", false);
        }

        console.log("Executing notifications query for user:", user.id);
        const { data: notifications, error } = await query;

        if (error) {
            console.error("Error fetching notifications:", error);
            console.error(
                "Full error details:",
                JSON.stringify(error, null, 2)
            );
            return NextResponse.json(
                {
                    error: "Failed to fetch notifications",
                    details: error.message,
                },
                { status: 500 }
            );
        }

        console.log(
            "Successfully fetched notifications:",
            notifications?.length || 0
        );

        return NextResponse.json({
            notifications: notifications || [],
            unread_count: unreadOnly ? notifications?.length || 0 : null,
        });
    }
);

export const POST = withAuth(
    async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
        const body = await request.json();
        const { user_id, type, title, message, ticket_id, comment_id } = body;

        // Validate required fields
        const validation = validateRequiredFields(body, [
            "user_id",
            "type",
            "title",
            "message",
        ]);
        if (!validation.isValid) {
            return validation.error!;
        }

        // Validate notification type
        const validTypes = [
            "ticket_status_changed",
            "ticket_commented",
            "comment_replied",
        ];
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: "Invalid notification type" },
                { status: 400 }
            );
        }

        // Don't send notification to self
        if (user_id === user.id) {
            return NextResponse.json({
                message: "Notification not sent to self",
            });
        }

        // Create notification
        console.log("Creating notification:", {
            user_id,
            type,
            title,
            ticket_id,
            comment_id,
        });

        const { data: notification, error: insertError } = await supabase
            .from("notifications")
            .insert({
                user_id,
                type,
                title,
                message,
                ticket_id: ticket_id || null,
                comment_id: comment_id || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (insertError) {
            console.error("Error creating notification:", insertError);
            console.error(
                "Full insert error details:",
                JSON.stringify(insertError, null, 2)
            );
            return NextResponse.json(
                {
                    error: "Failed to create notification",
                    details: insertError.message,
                },
                { status: 500 }
            );
        }

        console.log("Successfully created notification:", notification?.id);

        return createSuccessResponse(
            notification,
            "Notification created successfully"
        );
    }
);
