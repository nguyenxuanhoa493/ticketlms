import { NextRequest, NextResponse } from "next/server";
import {
    withAuth,
    withRole,
    withAdmin,
    withManager,
    withOrganizationAccess,
    withFileUpload,
} from "./api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    parsePaginationParams,
    executeQuery,
    fetchUserData,
    buildTicketQuery,
    buildPaginatedResponse,
    validateFileUpload,
    generateUniqueFileName,
    createNotification,
    handleApiError,
    AuthenticatedUser,
} from "./api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

// Template cho CRUD API routes
export const createCRUDTemplate = (
    tableName: string,
    requiredFields: string[] = []
) => {
    return {
        // GET - List records with pagination and filtering
        GET: withAuth(
            async (
                request: NextRequest,
                user: AuthenticatedUser,
                supabase: TypedSupabaseClient
            ) => {
                const { searchParams } = new URL(request.url);
                const { page, limit, offset } =
                    parsePaginationParams(searchParams);

                // Build base query
                let query = supabase
                    .from(tableName)
                    .select("*", { count: "exact" });

                // Apply organization filter for non-admin users
                if (user.role !== "admin" && user.organization_id) {
                    query = query.eq("organization_id", user.organization_id);
                }

                // Apply filters from search params
                const filters = ["status", "priority", "type", "platform"];
                filters.forEach((filter) => {
                    const value = searchParams.get(filter);
                    if (value) {
                        query = query.eq(filter, value);
                    }
                });

                // Apply search
                const search = searchParams.get("search");
                if (search) {
                    query = query.or(
                        `title.ilike.%${search}%,description.ilike.%${search}%`
                    );
                }

                // Execute query with pagination
                const { data, error } = await executeQuery(
                    query.range(offset, offset + limit - 1),
                    `fetching ${tableName}`
                );

                if (error) return error;

                // Get total count
                const { count } = await query;

                return NextResponse.json(
                    buildPaginatedResponse(
                        (data as unknown[]) || [],
                        count || 0,
                        page,
                        limit
                    )
                );
            }
        ),

        // POST - Create new record
        POST: withAuth(
            async (
                request: NextRequest,
                user: AuthenticatedUser,
                supabase: TypedSupabaseClient
            ) => {
                const body = await request.json();

                // Validate required fields
                if (requiredFields.length > 0) {
                    const validation = validateRequiredFields(
                        body,
                        requiredFields
                    );
                    if (!validation.isValid) {
                        return validation.error!;
                    }
                }

                // Add created_by and organization_id
                const recordData = {
                    ...body,
                    created_by: user.id,
                    organization_id: user.organization_id,
                };

                const { data, error } = await executeQuery(
                    supabase
                        .from(tableName)
                        .insert(recordData)
                        .select()
                        .single(),
                    `creating ${tableName}`
                );

                if (error) return error;

                return createSuccessResponse(
                    data,
                    `${tableName} created successfully`
                );
            }
        ),

        // PUT - Update record
        PUT: withAuth(
            async (
                request: NextRequest,
                user: AuthenticatedUser,
                supabase: TypedSupabaseClient
            ) => {
                const body = await request.json();
                const { id, ...updateData } = body;

                if (!id) {
                    return NextResponse.json(
                        { error: "ID is required" },
                        { status: 400 }
                    );
                }

                // Check if user has permission to update this record
                const { data: existingRecord } = await supabase
                    .from(tableName)
                    .select("created_by, organization_id")
                    .eq("id", id)
                    .single();

                if (!existingRecord) {
                    return NextResponse.json(
                        { error: "Record not found" },
                        { status: 404 }
                    );
                }

                // Check permissions
                if (
                    user.role !== "admin" &&
                    existingRecord.created_by !== user.id
                ) {
                    return NextResponse.json(
                        { error: "Insufficient permissions" },
                        { status: 403 }
                    );
                }

                const { data, error } = await executeQuery(
                    supabase
                        .from(tableName)
                        .update(updateData)
                        .eq("id", id)
                        .select()
                        .single(),
                    `updating ${tableName}`
                );

                if (error) return error;

                return createSuccessResponse(
                    data,
                    `${tableName} updated successfully`
                );
            }
        ),

        // DELETE - Delete record
        DELETE: withAuth(
            async (
                request: NextRequest,
                user: AuthenticatedUser,
                supabase: TypedSupabaseClient
            ) => {
                const { searchParams } = new URL(request.url);
                const id = searchParams.get("id");

                if (!id) {
                    return NextResponse.json(
                        { error: "ID is required" },
                        { status: 400 }
                    );
                }

                // Check if user has permission to delete this record
                const { data: existingRecord } = await supabase
                    .from(tableName)
                    .select("created_by, organization_id")
                    .eq("id", id)
                    .single();

                if (!existingRecord) {
                    return NextResponse.json(
                        { error: "Record not found" },
                        { status: 404 }
                    );
                }

                // Check permissions
                if (
                    user.role !== "admin" &&
                    existingRecord.created_by !== user.id
                ) {
                    return NextResponse.json(
                        { error: "Insufficient permissions" },
                        { status: 403 }
                    );
                }

                const { error } = await executeQuery(
                    supabase.from(tableName).delete().eq("id", id),
                    `deleting ${tableName}`
                );

                if (error) return error;

                return createSuccessResponse(
                    null,
                    `${tableName} deleted successfully`
                );
            }
        ),
    };
};

// Template cho file upload API routes
export const createFileUploadTemplate = (
    bucketName: string,
    folder: string = ""
) => {
    return {
        POST: withFileUpload(
            async (
                request: NextRequest,
                user: AuthenticatedUser,
                supabase: TypedSupabaseClient,
                file: File
            ) => {
                // Validate file
                const validation = validateFileUpload(file);
                if (!validation.isValid) {
                    return NextResponse.json(
                        { error: validation.error },
                        { status: 400 }
                    );
                }

                // Generate unique filename
                const fileName = generateUniqueFileName(file, folder);

                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } =
                    await supabase.storage
                        .from(bucketName)
                        .upload(fileName, file);

                if (uploadError) {
                    return NextResponse.json(
                        { error: "Failed to upload file" },
                        { status: 500 }
                    );
                }

                // Get public URL
                const {
                    data: { publicUrl },
                } = supabase.storage.from(bucketName).getPublicUrl(fileName);

                return createSuccessResponse(
                    {
                        url: publicUrl,
                        filename: fileName,
                        size: file.size,
                        type: file.type,
                    },
                    "File uploaded successfully"
                );
            }
        ),
    };
};

// Template cho notification API routes
export const createNotificationTemplate = () => {
    return {
        GET: withAuth(
            async (
                request: NextRequest,
                user: AuthenticatedUser,
                supabase: TypedSupabaseClient
            ) => {
                const { searchParams } = new URL(request.url);
                const unreadOnly = searchParams.get("unread_only") === "true";
                const limit = parseInt(searchParams.get("limit") || "50");

                let query = supabase
                    .from("notifications")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(limit);

                if (unreadOnly) {
                    query = query.eq("is_read", false);
                }

                const { data, error } = await executeQuery(
                    query,
                    "fetching notifications"
                );
                if (error) return error;

                return NextResponse.json({
                    notifications: data || [],
                    unread_count: unreadOnly
                        ? (data as unknown[])?.length || 0
                        : null,
                });
            }
        ),

        POST: withAuth(
            async (
                request: NextRequest,
                user: AuthenticatedUser,
                supabase: TypedSupabaseClient
            ) => {
                const body = await request.json();
                const { user_id, type, title, message, ticket_id, comment_id } =
                    body;

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

                // Don't send notification to self
                if (user_id === user.id) {
                    return createSuccessResponse(
                        null,
                        "Notification not sent to self"
                    );
                }

                try {
                    const notification = await createNotification(supabase, {
                        user_id,
                        type,
                        title,
                        message,
                        ticket_id: ticket_id || null,
                        comment_id: comment_id || null,
                        created_by: user.id,
                    });

                    return createSuccessResponse(
                        notification,
                        "Notification created successfully"
                    );
                } catch (error) {
                    return handleApiError(error, "creating notification");
                }
            }
        ),
    };
};

// Template cho ticket-specific API routes
export const createTicketTemplate = () => {
    return {
        GET: withAuth(
            async (
                request: NextRequest,
                user: AuthenticatedUser,
                supabase: TypedSupabaseClient
            ) => {
                const { searchParams } = new URL(request.url);
                const { page, limit, offset } =
                    parsePaginationParams(searchParams);

                // Build ticket query with filters
                const filters = {
                    status: searchParams.get("status") || undefined,
                    priority: searchParams.get("priority") || undefined,
                    ticket_type: searchParams.get("ticket_type") || undefined,
                    platform: searchParams.get("platform") || undefined,
                    search: searchParams.get("search") || undefined,
                    assigned_to: searchParams.get("assigned_to") || undefined,
                    created_by: searchParams.get("created_by") || undefined,
                    only_show_in_admin:
                        searchParams.get("only_show_in_admin") === "true" ||
                        undefined,
                };

                let query = buildTicketQuery(supabase, user, filters);

                // Apply sorting
                const sortBy = searchParams.get("sort_by") || "created_at";
                const sortOrder = searchParams.get("sort_order") || "desc";
                query = query.order(sortBy, { ascending: sortOrder === "asc" });

                // Execute query with pagination
                const { data, error } = await executeQuery(
                    query.range(offset, offset + limit - 1),
                    "fetching tickets"
                );

                if (error) return error;

                // Get total count
                const { count } = await query;

                return NextResponse.json(
                    buildPaginatedResponse(
                        (data as unknown[]) || [],
                        count || 0,
                        page,
                        limit
                    )
                );
            }
        ),

        POST: withAuth(
            async (
                request: NextRequest,
                user: AuthenticatedUser,
                supabase: TypedSupabaseClient
            ) => {
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
                    finalOrgId = user.organization_id;
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

                const { data, error } = await executeQuery(
                    supabase
                        .from("tickets")
                        .insert(ticketData)
                        .select()
                        .single(),
                    "creating ticket"
                );

                if (error) return error;

                return createSuccessResponse(
                    data,
                    "Ticket created successfully"
                );
            }
        ),
    };
};
