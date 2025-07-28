import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Helper function to strip HTML and limit text length
function stripHtmlAndLimit(
    htmlContent: string,
    maxLength: number = 100
): string {
    // Remove HTML tags
    const textOnly = htmlContent.replace(/<[^>]*>/g, "");
    // Decode HTML entities
    const decoded = textOnly
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    // Trim and limit length
    const trimmed = decoded.trim();
    if (trimmed.length <= maxLength) {
        return trimmed;
    }
    return trimmed.substring(0, maxLength - 3) + "...";
}

// GET /api/tickets/[id]/comments - Get comments for a ticket
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies();
        const ticketId = params.id;

        if (!ticketId) {
            return NextResponse.json(
                { error: "Ticket ID is required" },
                { status: 400 }
            );
        }

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
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Get user profile to check permissions
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // Check if user has access to this ticket
        const { data: ticket, error: ticketError } = await supabase
            .from("tickets")
            .select("organization_id")
            .eq("id", ticketId)
            .single();

        if (ticketError) {
            if (ticketError.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Ticket not found" },
                    { status: 404 }
                );
            }
            throw ticketError;
        }

        // Check permissions
        if (
            profile.role !== "admin" &&
            ticket.organization_id !== profile.organization_id
        ) {
            return NextResponse.json(
                { error: "Permission denied" },
                { status: 403 }
            );
        }

        // Fetch comments with user profiles (including parent_id for nested comments)
        const { data: comments, error: commentsError } = await supabase
            .from("comments")
            .select(
                `
                id,
                content,
                created_at,
                updated_at,
                user_id,
                parent_id
            `
            )
            .eq("ticket_id", ticketId)
            .order("created_at", { ascending: true });

        if (commentsError) throw commentsError;

        // Fetch user profiles for comments
        const userIds = [...new Set(comments.map((c) => c.user_id))];
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

        if (profilesError) throw profilesError;

        // Combine comments with user info
        const commentsWithUsers = comments.map((comment) => ({
            ...comment,
            user: profiles.find((p) => p.id === comment.user_id) || {
                id: comment.user_id,
                full_name: "Unknown User",
            },
        }));

        return NextResponse.json({ comments: commentsWithUsers });
    } catch (error: unknown) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch comments" },
            { status: 500 }
        );
    }
}

// POST /api/tickets/[id]/comments - Create a new comment
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies();
        const ticketId = params.id;
        const body = await request.json();
        const { content, parent_id } = body;

        if (!ticketId) {
            return NextResponse.json(
                { error: "Ticket ID is required" },
                { status: 400 }
            );
        }

        if (!content?.trim()) {
            return NextResponse.json(
                { error: "Comment content is required" },
                { status: 400 }
            );
        }

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
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Get user profile to check permissions
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, organization_id, full_name")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // Check if user has access to this ticket
        const { data: ticket, error: ticketError } = await supabase
            .from("tickets")
            .select("organization_id")
            .eq("id", ticketId)
            .single();

        if (ticketError) {
            if (ticketError.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Ticket not found" },
                    { status: 404 }
                );
            }
            throw ticketError;
        }

        // Check permissions
        if (
            profile.role !== "admin" &&
            ticket.organization_id !== profile.organization_id
        ) {
            return NextResponse.json(
                { error: "Permission denied" },
                { status: 403 }
            );
        }

        // Create comment
        console.log(
            `Creating comment for ticket ${ticketId} by user ${user.id}`
        );
        const { data: comment, error: commentError } = await supabase
            .from("comments")
            .insert({
                ticket_id: ticketId,
                user_id: user.id,
                content: content.trim(),
                parent_id: parent_id || null,
            })
            .select("id, content, created_at, updated_at, user_id, parent_id")
            .single();

        if (commentError) {
            console.error("Error creating comment:", commentError);
            throw commentError;
        }

        console.log("Comment created successfully:", comment.id);
        console.log("About to start notification process...");

        // Send notifications after creating comment
        console.log("Starting notification process for comment:", comment.id);
        try {
            // Get ticket details for notifications
            const { data: ticketDetail, error: ticketDetailError } =
                await supabase
                    .from("tickets")
                    .select("title, created_by, organization_id")
                    .eq("id", ticketId)
                    .single();

            console.log("Ticket detail for notification:", {
                ticketDetail,
                error: ticketDetailError,
                ticketId,
            });

            if (!ticketDetailError && ticketDetail) {
                console.log(
                    `Ticket found: "${ticketDetail.title}", created by: ${ticketDetail.created_by}, current user: ${user.id}`
                );
                const notificationPromises = [];

                if (parent_id) {
                    console.log("This is a reply to comment:", parent_id);
                    // This is a reply - notify the parent comment author
                    const { data: parentComment, error: parentError } =
                        await supabase
                            .from("comments")
                            .select("user_id")
                            .eq("id", parent_id)
                            .single();

                    console.log("Parent comment data:", {
                        parentComment,
                        parentError,
                    });

                    if (
                        !parentError &&
                        parentComment &&
                        parentComment.user_id !== user.id
                    ) {
                        console.log(
                            "Adding reply notification for user:",
                            parentComment.user_id
                        );
                        notificationPromises.push(
                            fetch(
                                `${request.nextUrl.origin}/api/notifications`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Cookie:
                                            request.headers.get("cookie") || "",
                                    },
                                    body: JSON.stringify({
                                        user_id: parentComment.user_id,
                                        type: "comment_replied",
                                        title: stripHtmlAndLimit(content),
                                        message: `${profile.full_name} trả lời comment ở ticket "${ticketDetail.title}"`,
                                        ticket_id: ticketId,
                                        comment_id: comment.id,
                                    }),
                                }
                            )
                        );
                    } else {
                        console.log(
                            "Not sending reply notification - either parent comment not found or replying to own comment"
                        );
                    }
                } else {
                    console.log("This is a new comment on ticket");
                    // This is a new comment on ticket - notify ticket creator
                    if (ticketDetail.created_by !== user.id) {
                        console.log(
                            "Adding ticket comment notification for ticket creator:",
                            ticketDetail.created_by
                        );
                        notificationPromises.push(
                            fetch(
                                `${request.nextUrl.origin}/api/notifications`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Cookie:
                                            request.headers.get("cookie") || "",
                                    },
                                    body: JSON.stringify({
                                        user_id: ticketDetail.created_by,
                                        type: "ticket_commented",
                                        title: stripHtmlAndLimit(content),
                                        message: `${profile.full_name} comment ở ticket "${ticketDetail.title}"`,
                                        ticket_id: ticketId,
                                        comment_id: comment.id,
                                    }),
                                }
                            )
                        );
                    } else {
                        console.log(
                            "Not sending notification - ticket creator is the same as comment author"
                        );
                    }
                }

                // Execute all notifications (don't wait for them to complete)
                if (notificationPromises.length > 0) {
                    console.log(
                        `Sending ${notificationPromises.length} notifications for comment ${comment.id}`
                    );
                    Promise.all(notificationPromises)
                        .then(() => {
                            console.log(
                                "All comment notifications sent successfully"
                            );
                        })
                        .catch((error) => {
                            console.error(
                                "Error sending comment notifications:",
                                error
                            );
                        });
                } else {
                    console.log("No notifications to send for this comment");
                }
            } else {
                console.log(
                    "Cannot send notifications - ticket detail not found or error:",
                    ticketDetailError
                );
            }
        } catch (notificationError) {
            console.error(
                "Error preparing comment notifications:",
                notificationError
            );
            // Don't fail the main request if notification fails
        }

        // Return comment with user info
        const commentWithUser = {
            ...comment,
            user: {
                id: user.id,
                full_name: profile.full_name,
            },
        };

        return NextResponse.json({
            comment: commentWithUser,
            message: "Comment created successfully",
        });
    } catch (error: unknown) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create comment" },
            { status: 500 }
        );
    }
}
