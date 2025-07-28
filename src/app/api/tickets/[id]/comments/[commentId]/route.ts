import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// PUT /api/tickets/[id]/comments/[commentId] - Update a comment
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; commentId: string }> }
) {
    try {
        const cookieStore = await cookies();
        const { id, commentId } = await params;
        const ticketId = id;
        const body = await request.json();
        const { content } = body;

        if (!ticketId || !commentId) {
            return NextResponse.json(
                { error: "Ticket ID and Comment ID are required" },
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

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, organization_id, full_name")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // Get the comment to check ownership and permissions
        const { data: comment, error: commentError } = await supabase
            .from("comments")
            .select("user_id, ticket_id")
            .eq("id", commentId)
            .single();

        if (commentError) {
            if (commentError.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Comment not found" },
                    { status: 404 }
                );
            }
            throw commentError;
        }

        // Check if user can edit this comment (owner or admin)
        if (comment.user_id !== user.id && profile.role !== "admin") {
            return NextResponse.json(
                { error: "Permission denied" },
                { status: 403 }
            );
        }

        // Verify ticket access
        const { data: ticket, error: ticketError } = await supabase
            .from("tickets")
            .select("organization_id")
            .eq("id", ticketId)
            .single();

        if (ticketError) throw ticketError;

        if (
            profile.role !== "admin" &&
            ticket.organization_id !== profile.organization_id
        ) {
            return NextResponse.json(
                { error: "Permission denied" },
                { status: 403 }
            );
        }

        // Update comment
        const { data: updatedComment, error: updateError } = await supabase
            .from("comments")
            .update({
                content: content.trim(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", commentId)
            .select("id, content, created_at, updated_at, user_id")
            .single();

        if (updateError) throw updateError;

        // Return updated comment with user info
        const commentWithUser = {
            ...updatedComment,
            user: {
                id: user.id,
                full_name: profile.full_name,
            },
        };

        return NextResponse.json({
            comment: commentWithUser,
            message: "Comment updated successfully",
        });
    } catch (error: unknown) {
        console.error("Error updating comment:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to update comment",
            },
            { status: 500 }
        );
    }
}

// DELETE /api/tickets/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; commentId: string }> }
) {
    try {
        const cookieStore = await cookies();
        const { id, commentId } = await params;
        const ticketId = id;

        if (!ticketId || !commentId) {
            return NextResponse.json(
                { error: "Ticket ID and Comment ID are required" },
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

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // Get the comment to check ownership and permissions
        const { data: comment, error: commentError } = await supabase
            .from("comments")
            .select("user_id, ticket_id")
            .eq("id", commentId)
            .single();

        if (commentError) {
            if (commentError.code === "PGRST116") {
                return NextResponse.json(
                    { error: "Comment not found" },
                    { status: 404 }
                );
            }
            throw commentError;
        }

        // Check if user can delete this comment (owner or admin)
        if (comment.user_id !== user.id && profile.role !== "admin") {
            return NextResponse.json(
                { error: "Permission denied" },
                { status: 403 }
            );
        }

        // Verify ticket access
        const { data: ticket, error: ticketError } = await supabase
            .from("tickets")
            .select("organization_id")
            .eq("id", ticketId)
            .single();

        if (ticketError) throw ticketError;

        if (
            profile.role !== "admin" &&
            ticket.organization_id !== profile.organization_id
        ) {
            return NextResponse.json(
                { error: "Permission denied" },
                { status: 403 }
            );
        }

        // Delete comment (cascade will handle replies)
        const { error: deleteError } = await supabase
            .from("comments")
            .delete()
            .eq("id", commentId);

        if (deleteError) throw deleteError;

        return NextResponse.json({
            message: "Comment deleted successfully",
        });
    } catch (error: unknown) {
        console.error("Error deleting comment:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to delete comment",
            },
            { status: 500 }
        );
    }
}
