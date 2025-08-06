import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { convertToUTCISO } from "@/lib/utils";

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const { searchParams } = new URL(request.url);

        // Pagination parameters
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        // Filtering parameters
        const status = searchParams.get("status");
        const ticketType = searchParams.get("ticket_type");
        const search = searchParams.get("search");
        const organization =
            searchParams.get("organization_id") ||
            searchParams.get("organization");

        // Sorting parameters
        const sort = searchParams.get("sort") || "status_asc";

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

        // Lấy thông tin user hiện tại
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Lấy profile của user để biết role và organization
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // Debug log để kiểm tra role và organization
        console.log("🔍 Debug - User ID:", user.id);
        console.log("🔍 Debug - User Role:", profile.role);
        console.log(
            "🔍 Debug - User Organization ID:",
            profile.organization_id
        );

        // Build optimized query with basic JOINs
        let ticketsQuery = supabase.from("tickets").select(`
                id,
                title,
                description,
                status,
                priority,
                ticket_type,
                platform,
                created_at,
                updated_at,
                expected_completion_date,
                closed_at,
                jira_link,
                only_show_in_admin,
                organization_id,
                assigned_to,
                created_by,
                organizations(id, name)
            `);

        // Apply organization filter based on user role
        console.log(
            "🔍 Debug - Checking role:",
            profile.role,
            "Type:",
            typeof profile.role
        );
        console.log("🔍 Debug - Is admin?", profile.role === "admin");

        if (profile.role !== "admin") {
            console.log("🔍 Debug - Non-admin user detected, applying filters");
            if (profile.organization_id) {
                ticketsQuery = ticketsQuery.eq(
                    "organization_id",
                    profile.organization_id
                );
                // Non-admin users cannot see tickets marked as only_show_in_admin
                ticketsQuery = ticketsQuery.eq("only_show_in_admin", false);
                console.log(
                    "🔍 Debug - Applied organization filter:",
                    profile.organization_id
                );
                console.log(
                    "🔍 Debug - Applied only_show_in_admin filter: false"
                );
            } else {
                console.log(
                    "🔍 Debug - User has no organization_id, returning empty result"
                );
                return NextResponse.json({
                    tickets: [],
                    pagination: { page, limit, total: 0, totalPages: 0 },
                });
            }
        } else {
            console.log("🔍 Debug - Admin user detected, no filters applied");
        }

        // Apply filters
        if (status) {
            if (status === "not_closed") {
                // Filter for tickets that are not closed (open or in_progress)
                ticketsQuery = ticketsQuery.in("status", [
                    "open",
                    "in_progress",
                ]);
            } else {
                ticketsQuery = ticketsQuery.eq("status", status);
            }
        }
        if (ticketType) {
            ticketsQuery = ticketsQuery.eq("ticket_type", ticketType);
        }
        if (organization) {
            ticketsQuery = ticketsQuery.eq("organization_id", organization);
        }
        if (search) {
            ticketsQuery = ticketsQuery.or(
                `title.ilike.%${search}%,description.ilike.%${search}%`
            );
        }

        // Get total count for pagination (without JOINs)
        let countQuery = supabase
            .from("tickets")
            .select("*", { count: "exact", head: true });

        // Apply the same filters to count query
        console.log(
            "🔍 Debug - Count query role check:",
            profile.role,
            "Is admin?",
            profile.role === "admin"
        );

        if (profile.role !== "admin") {
            console.log(
                "🔍 Debug - Applying same filters to count query for non-admin"
            );
            if (profile.organization_id) {
                countQuery = countQuery.eq(
                    "organization_id",
                    profile.organization_id
                );
                // Non-admin users cannot see tickets marked as only_show_in_admin
                countQuery = countQuery.eq("only_show_in_admin", false);
            } else {
                return NextResponse.json({
                    tickets: [],
                    pagination: { page, limit, total: 0, totalPages: 0 },
                });
            }
        }

        if (status) {
            if (status === "not_closed") {
                // Filter for tickets that are not closed (open or in_progress)
                countQuery = countQuery.in("status", ["open", "in_progress"]);
            } else {
                countQuery = countQuery.eq("status", status);
            }
        }
        if (ticketType) {
            countQuery = countQuery.eq("ticket_type", ticketType);
        }
        if (organization) {
            countQuery = countQuery.eq("organization_id", organization);
        }
        if (search) {
            countQuery = countQuery.or(
                `title.ilike.%${search}%,description.ilike.%${search}%`
            );
        }

        const { count, error: countError } = await countQuery;
        if (countError) throw countError;
        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        // Apply sorting and pagination
        let sortedQuery = ticketsQuery;

        // Apply sorting based on sort parameter
        switch (sort) {
            case "status_asc":
                // Sort by status: open -> in_progress -> closed, then by created_at desc
                // Use custom ordering with CASE statement to get desired order
                sortedQuery = sortedQuery
                    .order("status", { ascending: true })
                    .order("created_at", { ascending: false });
                break;
            case "created_at_desc":
                sortedQuery = sortedQuery.order("created_at", {
                    ascending: false,
                });
                break;
            case "created_at_asc":
                sortedQuery = sortedQuery.order("created_at", {
                    ascending: true,
                });
                break;
            case "title_asc":
                sortedQuery = sortedQuery.order("title", {
                    ascending: true,
                });
                break;
            case "title_desc":
                sortedQuery = sortedQuery.order("title", {
                    ascending: false,
                });
                break;
            case "expected_completion_date_asc":
                sortedQuery = sortedQuery.order("expected_completion_date", {
                    ascending: true,
                    nullsFirst: false,
                });
                break;
            case "expected_completion_date_desc":
                sortedQuery = sortedQuery.order("expected_completion_date", {
                    ascending: false,
                    nullsFirst: false,
                });
                break;
            default:
                // Default: sort by status ascending, then by created_at desc
                sortedQuery = sortedQuery
                    .order("status", { ascending: false })
                    .order("created_at", { ascending: false });
        }

        const { data: ticketsData, error: ticketsError } =
            await sortedQuery.range(offset, offset + limit - 1);

        if (ticketsError) throw ticketsError;

        if (ticketsError) throw ticketsError;

        // Get user data separately if needed
        const userIds = [
            ...new Set([
                ...(ticketsData?.map((t) => t.created_by) || []),
                ...(ticketsData?.map((t) => t.assigned_to).filter(Boolean) ||
                    []),
            ]),
        ];

        let userData: Record<string, any> = {};
        if (userIds.length > 0) {
            const { data: users } = await supabase
                .from("profiles")
                .select("id, full_name, avatar_url")
                .in("id", userIds);

            if (users) {
                userData = users.reduce(
                    (acc: Record<string, any>, user: any) => {
                        acc[user.id] = user;
                        return acc;
                    },
                    {}
                );
            }
        }

        // Combine data
        const ticketsWithUsers =
            ticketsData?.map((ticket) => ({
                ...ticket,
                created_user: userData[ticket.created_by] || null,
                assigned_user: ticket.assigned_to
                    ? userData[ticket.assigned_to] || null
                    : null,
            })) || [];

        // Debug log kết quả cuối cùng
        console.log("🔍 Debug - Final tickets count:", ticketsWithUsers.length);
        console.log(
            "🔍 Debug - Tickets with only_show_in_admin=true:",
            ticketsWithUsers.filter((t) => t.only_show_in_admin).length
        );
        console.log(
            "🔍 Debug - Sample tickets:",
            ticketsWithUsers.slice(0, 3).map((t) => ({
                id: t.id,
                title: t.title,
                only_show_in_admin: t.only_show_in_admin,
            }))
        );

        return NextResponse.json({
            tickets: ticketsWithUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        });
    } catch (error: unknown) {
        console.error("Error fetching tickets:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch tickets";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const body = await request.json();
        const {
            title,
            description,
            ticket_type,
            priority,
            platform,
            organization_id,
            expected_completion_date,
            closed_at,
            jira_link,
            only_show_in_admin,
        } = body;

        if (!title?.trim()) {
            return NextResponse.json(
                { error: "Ticket title is required" },
                { status: 400 }
            );
        }

        // Lấy thông tin user hiện tại để validate quyền
        const authSupabase = createServerClient(
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

        const {
            data: { user },
        } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Lấy profile của user để biết organization
        const { data: profile, error: profileError } = await authSupabase
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // Determine final organization_id
        let finalOrgId = organization_id;
        if (profile.role !== "admin") {
            // User và Manager chỉ có thể tạo ticket trong organization của mình
            finalOrgId = profile.organization_id;
        }

        // Only admin can set only_show_in_admin to true
        let finalOnlyShowInAdmin = false;
        if (profile.role === "admin") {
            finalOnlyShowInAdmin = only_show_in_admin || false;
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

        // Handle closed_at for new tickets using utility function
        let formattedClosedAt = null;
        if (closed_at && closed_at.trim() !== "") {
            try {
                formattedClosedAt = convertToUTCISO(closed_at);
                if (!formattedClosedAt) {
                    throw new Error(`Invalid datetime format: ${closed_at}`);
                }
            } catch (error) {
                console.error(
                    "Error formatting closed_at for new ticket:",
                    error
                );
                throw new Error(`Invalid closed_at value: ${closed_at}`);
            }
        }

        // Ensure organization_id is not null
        if (!finalOrgId) {
            return NextResponse.json(
                { error: "Organization ID is required" },
                { status: 400 }
            );
        }

        const { error } = await supabase.from("tickets").insert({
            title: title.trim(),
            description: description?.trim() || null,
            ticket_type: ticket_type || "task",
            priority: priority || "medium",
            platform: platform || "all",
            status: "open",
            organization_id: finalOrgId,
            expected_completion_date: expected_completion_date || null,
            closed_at: formattedClosedAt,
            jira_link: jira_link?.trim() || null,
            only_show_in_admin: finalOnlyShowInAdmin,
            created_by: user.id,
        });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Ticket created successfully",
        });
    } catch (error: unknown) {
        console.error("Error creating ticket:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to create ticket";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const body = await request.json();
        const {
            id,
            title,
            description,
            ticket_type,
            priority,
            platform,
            status,
            expected_completion_date,
            closed_at,
            jira_link,
        } = body;

        if (!id || !title?.trim()) {
            return NextResponse.json(
                { error: "Ticket ID and title are required" },
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

        // Prepare update data
        const updateData: {
            title: string;
            description: string | null;
            ticket_type: string;
            priority: string;
            platform: string;
            status: string;
            expected_completion_date: string | null;
            closed_at?: string;
            jira_link?: string | null;
        } = {
            title: title.trim(),
            description: description?.trim() || null,
            ticket_type: ticket_type || "task",
            priority: priority || "medium",
            platform: platform || "all",
            status: status || "open",
            expected_completion_date: expected_completion_date || null,
            jira_link: jira_link?.trim() || null,
        };

        // Handle closed_at logic using utility function
        if (closed_at && closed_at.trim() !== "") {
            try {
                const formattedClosedAt = convertToUTCISO(closed_at);
                if (!formattedClosedAt) {
                    throw new Error(`Invalid datetime format: ${closed_at}`);
                }
                updateData.closed_at = formattedClosedAt;
            } catch (error) {
                console.error("Error formatting closed_at for update:", error);
                throw new Error(`Invalid closed_at value: ${closed_at}`);
            }
        }
        // Nếu không có closed_at và status không phải closed, giữ nguyên giá trị cũ (không update field này)

        // Get old ticket data to check for status changes
        const { data: oldTicket, error: fetchError } = await supabase
            .from("tickets")
            .select("status, title, created_by, organization_id")
            .eq("id", id)
            .single();

        if (fetchError) throw fetchError;

        const { error } = await supabase
            .from("tickets")
            .update(updateData)
            .eq("id", id);

        if (error) throw error;

        // Check if status changed and send notification
        if (oldTicket && oldTicket.status !== status) {
            console.log(
                `Status changed for ticket ${id}: ${oldTicket.status} -> ${status}`
            );
            try {
                // Get current user
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                console.log(
                    `Current user: ${user?.id}, Ticket creator: ${oldTicket.created_by}`
                );

                if (user && oldTicket.created_by !== user.id) {
                    // Send notification to ticket creator
                    const statusLabels = {
                        open: "Mở",
                        in_progress: "Đang xử lý",
                        closed: "Đã đóng",
                    };

                    const notificationData = {
                        user_id: oldTicket.created_by,
                        type: "ticket_status_changed",
                        title: `${
                            statusLabels[
                                oldTicket.status as keyof typeof statusLabels
                            ]
                        } → ${
                            statusLabels[status as keyof typeof statusLabels]
                        }`,
                        message: `Trạng thái ticket "${oldTicket.title}" đã thay đổi`,
                        ticket_id: id,
                    };

                    console.log("Sending notification:", notificationData);

                    const response = await fetch(
                        `${request.nextUrl.origin}/api/notifications`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Cookie: request.headers.get("cookie") || "",
                            },
                            body: JSON.stringify(notificationData),
                        }
                    );

                    const result = await response.text();
                    console.log(
                        `Notification response status: ${response.status}, body: ${result}`
                    );

                    if (!response.ok) {
                        console.error("Failed to send notification:", result);
                    }
                } else {
                    console.log(
                        "Not sending notification - same user or no user"
                    );
                }
            } catch (notificationError) {
                console.error(
                    "Error sending status change notification:",
                    notificationError
                );
                // Don't fail the main request if notification fails
            }
        } else {
            console.log("Status not changed or no old ticket data");
        }

        return NextResponse.json({
            success: true,
            message: "Ticket updated successfully",
        });
    } catch (error: unknown) {
        console.error("Error updating ticket:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to update ticket";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Ticket ID is required" },
                { status: 400 }
            );
        }

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

        // Lấy thông tin user hiện tại
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Lấy profile của user để biết role và organization
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, organization_id")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        // Kiểm tra quyền xóa ticket
        if (profile.role !== "admin") {
            // User/Manager chỉ có thể xóa ticket của organization mình
            const { data: ticket, error: ticketError } = await supabase
                .from("tickets")
                .select("organization_id")
                .eq("id", id)
                .single();

            if (ticketError) {
                return NextResponse.json(
                    { error: "Ticket not found" },
                    { status: 404 }
                );
            }

            if (ticket.organization_id !== profile.organization_id) {
                return NextResponse.json(
                    { error: "Access denied" },
                    { status: 403 }
                );
            }
        }

        const { error } = await supabase.from("tickets").delete().eq("id", id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Ticket deleted successfully",
        });
    } catch (error: unknown) {
        console.error("Error deleting ticket:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to delete ticket";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
