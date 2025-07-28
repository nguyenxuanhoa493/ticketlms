import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get() {
                        return undefined;
                    },
                    set() {},
                    remove() {},
                },
            }
        );

        const { data, error } = await supabase
            .from("organizations")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Get open tickets count for each organization
        const organizationsWithCount = await Promise.all(
            (data || []).map(async (org) => {
                const { count, error: countError } = await supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", org.id)
                    .neq("status", "closed");

                if (countError) {
                    console.error(
                        "Error counting tickets for org",
                        org.id,
                        countError
                    );
                }

                return {
                    ...org,
                    openTicketsCount: count || 0,
                };
            })
        );

        return NextResponse.json({ organizations: organizationsWithCount });
    } catch (error: unknown) {
        console.error("Error fetching organizations:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Failed to fetch organizations";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description } = body;

        if (!name?.trim()) {
            return NextResponse.json(
                { error: "Organization name is required" },
                { status: 400 }
            );
        }

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get() {
                        return undefined;
                    },
                    set() {},
                    remove() {},
                },
            }
        );

        const { error } = await supabase.from("organizations").insert({
            name: name.trim(),
            description: description?.trim() || null,
        });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Organization created successfully",
        });
    } catch (error: unknown) {
        console.error("Error creating organization:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Failed to create organization";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, name, description } = body;

        if (!id || !name?.trim()) {
            return NextResponse.json(
                { error: "Organization ID and name are required" },
                { status: 400 }
            );
        }

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get() {
                        return undefined;
                    },
                    set() {},
                    remove() {},
                },
            }
        );

        const { error } = await supabase
            .from("organizations")
            .update({
                name: name.trim(),
                description: description?.trim() || null,
            })
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Organization updated successfully",
        });
    } catch (error: unknown) {
        console.error("Error updating organization:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update organization";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Organization ID is required" },
                { status: 400 }
            );
        }

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get() {
                        return undefined;
                    },
                    set() {},
                    remove() {},
                },
            }
        );

        const { error } = await supabase
            .from("organizations")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Organization deleted successfully",
        });
    } catch (error: unknown) {
        console.error("Error deleting organization:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete organization";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
