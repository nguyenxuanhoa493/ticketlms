import { NextRequest, NextResponse } from "next/server";
import { withAuth, withAdmin } from "@/lib/api-middleware";
import { AuthenticatedUser, validateRequiredFields, createSuccessResponse } from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

export const GET = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        context?: unknown
    ) => {
        const params = context as { params: Promise<{ id: string }> };
        const { id } = await params.params;

        const { data: notes, error } = await supabase
            .from("organization_notes")
            .select(
                `
                *,
                user:profiles!organization_notes_created_by_fkey(
                    full_name
                )
            `
            )
            .eq("organization_id", id)
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ notes: notes || [] });
    }
);

export const POST = withAdmin(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        context?: unknown
    ) => {
        const params = context as { params: Promise<{ id: string }> };
        const { id } = await params.params;
        const body = await request.json();
        const { content, is_pinned } = body;

        const validation = validateRequiredFields(body, ["content"]);
        if (!validation.isValid) {
            return validation.error!;
        }

        const { error } = await supabase.from("organization_notes").insert({
            organization_id: id,
            content: content.trim(),
            is_pinned: is_pinned || false,
            created_by: user.id,
        });

        if (error) throw error;

        return createSuccessResponse(null, "Note created successfully");
    }
);

export const PUT = withAdmin(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        context?: unknown
    ) => {
        const params = context as { params: Promise<{ id: string }> };
        const { id } = await params.params;
        const body = await request.json();
        const { id: noteId, content, is_pinned } = body;

        const validation = validateRequiredFields(body, ["id"]);
        if (!validation.isValid) {
            return validation.error!;
        }

        const updateData: Record<string, unknown> = {};
        if (content !== undefined) updateData.content = content.trim();
        if (is_pinned !== undefined) updateData.is_pinned = is_pinned;

        const { error } = await supabase
            .from("organization_notes")
            .update(updateData)
            .eq("id", noteId)
            .eq("organization_id", id);

        if (error) throw error;

        return createSuccessResponse(null, "Note updated successfully");
    }
);

export const DELETE = withAdmin(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient,
        context?: unknown
    ) => {
        const params = context as { params: Promise<{ id: string }> };
        const { id } = await params.params;
        const { searchParams } = new URL(request.url);
        const noteId = searchParams.get("id");

        if (!noteId) {
            return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
        }

        const { error } = await supabase
            .from("organization_notes")
            .delete()
            .eq("id", noteId)
            .eq("organization_id", id);

        if (error) throw error;

        return createSuccessResponse(null, "Note deleted successfully");
    }
);
