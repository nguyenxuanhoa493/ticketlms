import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    executeQuery,
    fetchUserData,
    AuthenticatedUser,
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";
import { Database } from "@/types/database";

export const GET = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        ...args: unknown[]
    ) => {
        const { params } = args[0] as { params: Promise<{ id: string }> };
        const { id: ticketId } = await params;

        // Check if user has access to this ticket
        const { data: ticket } = await supabase
            .from("tickets")
            .select("organization_id")
            .eq("id", ticketId)
            .single();

        if (!ticket) {
            return NextResponse.json(
                { error: "Ticket not found" },
                { status: 404 }
            );
        }

        if (
            user.role !== "admin" &&
            ticket.organization_id !== user.organization_id
        ) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        const { data, error } = await executeQuery(
            supabase
                .from("comments")
                .select("*")
                .eq("ticket_id", ticketId)
                .order("created_at", { ascending: true }),
            "fetching comments"
        );

        if (error) return error;

        // Fetch user data for comments
        const comments = (data as Database["public"]["Tables"]["comments"]["Row"][]) || [];
        const userIds = new Set<string>();

        if (comments.length > 0) {
            comments.forEach((comment: Database["public"]["Tables"]["comments"]["Row"]) => {
                if (comment.user_id) userIds.add(comment.user_id);
            });
        }

        const userData = await fetchUserData(supabase, Array.from(userIds));

        // Merge user data into comments
        const commentsWithUsers =
            comments.length > 0
                ? comments.map((comment: Database["public"]["Tables"]["comments"]["Row"]) => ({
                      ...comment,
                      user: comment.user_id
                          ? userData[comment.user_id] || null
                          : null,
                  }))
                : [];

        return NextResponse.json({ comments: commentsWithUsers });
    }
);

export const POST = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        ...args: unknown[]
    ) => {
        const { params } = args[0] as { params: Promise<{ id: string }> };
        const { id: ticketId } = await params;
        const body = await request.json();
        const { content, parent_id } = body;

        // Validate required fields
        const validation = validateRequiredFields(body, ["content"]);
        if (!validation.isValid) {
            return validation.error!;
        }

        // Check if user has access to this ticket
        const { data: ticket } = await supabase
            .from("tickets")
            .select("organization_id, created_by")
            .eq("id", ticketId)
            .single();

        if (!ticket) {
            return NextResponse.json(
                { error: "Ticket not found" },
                { status: 404 }
            );
        }

        if (
            user.role !== "admin" &&
            ticket.organization_id !== user.organization_id
        ) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        const commentData = {
            content: content.trim(),
            ticket_id: ticketId,
            user_id: user.id,
            parent_id: parent_id || null,
        };

        const { data, error } = await executeQuery(
            supabase.from("comments").insert(commentData).select().single(),
            "creating comment"
        );

        if (error) return error;

        return createSuccessResponse(data, "Comment created successfully");
    }
);
