import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    parsePaginationParams,
    executeQuery,
    buildTicketQuery,
    buildPaginatedResponse,
    fetchUserData,
    handleApiError,
    AuthenticatedUser,
} from "@/lib/api-utils";

// Helper function to clean timestamp fields
const cleanTimestampFields = (data: any) => {
    const cleaned = { ...data };

    // Convert empty strings to null for timestamp fields that can be set during creation
    const timestampFields = ["expected_completion_date", "closed_at"];

    timestampFields.forEach((field) => {
        if (cleaned[field] === "" || cleaned[field] === undefined) {
            cleaned[field] = null;
        }
    });

    // Remove created_at and updated_at from insert data as they should be managed by database
    delete cleaned.created_at;
    delete cleaned.updated_at;

    return cleaned;
};

export const GET = withAuth(
    async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
        const { searchParams } = new URL(request.url);
        const { page, limit, offset } = parsePaginationParams(searchParams);

        // Build ticket query with filters
        const filters = {
            status: searchParams.get("status") || undefined,
            priority: searchParams.get("priority") || undefined,
            ticket_type: searchParams.get("ticket_type") || undefined,
            platform: searchParams.get("platform") || undefined,
            search: searchParams.get("search") || undefined,
            assigned_to: searchParams.get("assigned_to") || undefined,
            created_by: searchParams.get("created_by") || undefined,
            organization_id: searchParams.get("organization_id") || undefined,
            only_show_in_admin:
                searchParams.get("only_show_in_admin") === "true" || undefined,
        };

        let query = buildTicketQuery(supabase, user, filters);

        // Apply sorting
        const sortParam = searchParams.get("sort");
        let sortBy = "created_at";
        let sortOrder = "desc";

        if (sortParam) {
            // Parse sort parameter (e.g., "status_asc", "priority_desc")
            const [field, order] = sortParam.split("_");
            if (field && order) {
                sortBy = field;
                sortOrder = order;
            }
        }

        // Apply custom sorting for status_asc (Mở > Đang làm > Đóng)
        if (sortParam === "status_asc") {
            // Sort by status alphabetically: closed < in_progress < open
            // This gives us the desired order: open > in_progress > closed
            query = query.order("status", { ascending: true });
            // Add secondary sort by created_at for consistent ordering
            query = query.order("created_at", { ascending: false });
        } else {
            query = query.order(sortBy, { ascending: sortOrder === "asc" });
        }

        // Get total count first - create a separate count query without joins
        let countQuery = supabase.from("tickets").select("*", {
            count: "exact",
            head: true,
        });

        // Apply organization filter for non-admin users
        if (user.role !== "admin") {
            if (user.organization_id) {
                countQuery = countQuery.eq(
                    "organization_id",
                    user.organization_id
                );
            } else {
                // If user has no organization, only show tickets with no organization
                countQuery = countQuery.is("organization_id", null);
            }
        }

        // Apply filters to count query
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                if (key === "search") {
                    countQuery = countQuery.or(
                        `title.ilike.%${value}%,description.ilike.%${value}%`
                    );
                } else if (key === "only_show_in_admin") {
                    // Only show admin-only tickets to admins
                    if (user.role === "admin") {
                        countQuery = countQuery.eq(key, value);
                    } else {
                        countQuery = countQuery.eq(key, false);
                    }
                } else if (key === "organization_id") {
                    // Handle organization_id filter
                    if (value === "null" || value === "") {
                        countQuery = countQuery.is("organization_id", null);
                    } else {
                        countQuery = countQuery.eq(key, value);
                    }
                } else {
                    countQuery = countQuery.eq(key, value);
                }
            }
        });

        const { count, error: countError } = await countQuery;

        // Debug: Log count query result
        console.log("Count query result:", {
            count,
            countError,
            filters,
            userRole: user.role,
            userOrgId: user.organization_id,
        });

        if (countError) {
            return handleApiError(countError, "counting tickets");
        }

        const totalCount = count || 0;

        // Execute query with pagination
        const { data, error } = await executeQuery(
            query.range(offset, offset + limit - 1),
            "fetching tickets"
        );

        if (error) return error;

        // Fetch user data for created_by and assigned_to
        const tickets = (data as any[]) || [];
        const userIds = new Set<string>();

        if (tickets.length > 0) {
            tickets.forEach((ticket: any) => {
                if (ticket.created_by) userIds.add(ticket.created_by);
                if (ticket.assigned_to) userIds.add(ticket.assigned_to);
            });
        }

        const userData = await fetchUserData(supabase, Array.from(userIds));

        // Merge user data into tickets
        const ticketsWithUsers =
            tickets.length > 0
                ? tickets.map((ticket: any) => ({
                      ...ticket,
                      created_user: ticket.created_by
                          ? userData[ticket.created_by] || null
                          : null,
                      assigned_user: ticket.assigned_to
                          ? userData[ticket.assigned_to] || null
                          : null,
                  }))
                : [];

        const response = {
            tickets: ticketsWithUsers || [],
            pagination: {
                page: page || 1,
                limit: limit || 20,
                total: totalCount || 0,
                totalPages: totalCount > 0 ? Math.ceil(totalCount / limit) : 0,
                hasNext: page * limit < totalCount,
                hasPrev: page > 1,
            },
        };

        return NextResponse.json(response);
    }
);

export const POST = withAuth(
    async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
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

        // Validate required fields
        const validation = validateRequiredFields(body, ["title"]);
        if (!validation.isValid) {
            return validation.error!;
        }

        // Determine final values based on user role
        let finalOrgId = organization_id;
        let finalOnlyShowInAdmin = false;

        if (user.role !== "admin") {
            finalOrgId = user.organization_id || null;
            finalOnlyShowInAdmin = false;
        } else {
            finalOnlyShowInAdmin = only_show_in_admin || false;
        }

        const ticketData = {
            title: title.trim(),
            description,
            ticket_type,
            priority,
            platform,
            organization_id: finalOrgId,
            expected_completion_date,
            closed_at,
            jira_link,
            only_show_in_admin: finalOnlyShowInAdmin,
            created_by: user.id,
        };

        // Clean timestamp fields before sending to database
        const cleanedTicketData = cleanTimestampFields(ticketData);

        // Add timestamps for new ticket
        const now = new Date().toISOString();
        cleanedTicketData.created_at = now;
        cleanedTicketData.updated_at = now;

        const { data, error } = await executeQuery(
            supabase
                .from("tickets")
                .insert(cleanedTicketData)
                .select()
                .single(),
            "creating ticket"
        );

        if (error) return error;

        return createSuccessResponse(data, "Ticket created successfully");
    }
);
