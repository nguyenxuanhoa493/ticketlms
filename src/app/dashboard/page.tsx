import { Suspense } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { 
    getStatusBadgeVariant,
    getPriorityBadgeVariant,
    getTicketTypeBadgeVariant,
    getStatusLabel,
    getPriorityLabel,
    getTicketTypeLabel,
    getTicketTypeIcon,
    getStatusBadgeClasses,
    getPriorityBadgeClasses
} from "@/lib/utils";

export const metadata: Metadata = {
    title: "Tổng quan - TicketLMS",
    description: "Bảng điều khiển hệ thống quản lý ticket",
    icons: {
        icon: "/favicon.png",
        shortcut: "/favicon.png",
        apple: "/favicon.png",
    },
};

interface Ticket {
    id: string;
    title: string;
    ticket_type: "bug" | "task";
    status: "open" | "in_progress" | "closed";
    priority: "low" | "medium" | "high";
    platform: "web" | "app" | "all";
    created_at: string;
    organizations?: {
        name: string;
    };
}

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "ticket_status_changed" | "ticket_commented" | "comment_replied";
    is_read: boolean;
    created_at: string;
}

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );
}

async function DashboardContent() {
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

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Access Denied
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Vui lòng đăng nhập để tiếp tục.
                    </p>
                </div>
            </div>
        );
    }

    // Get user profile
    let profile = null;
    try {
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
        profile = data;
    } catch {
        console.log("Profile not found, will create during next operation");
    }

    // Get basic stats with error handling and organization filtering
    let stats = {
        totalOrganizations: 0,
        totalUsers: 0,
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        closedTickets: 0,
    };

    try {
        // Admin thấy tất cả, user/manager chỉ thấy của organization mình
        if (profile?.role === "admin") {
            const [
                { count: totalOrganizations },
                { count: totalUsers },
                { count: totalTickets },
                { count: openTickets },
                { count: inProgressTickets },
                { count: closedTickets },
            ] = await Promise.all([
                supabase
                    .from("organizations")
                    .select("*", { count: "exact", head: true }),
                supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true }),
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true }),
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "open"),
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "in_progress"),
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("status", "closed"),
            ]);

            stats = {
                totalOrganizations: totalOrganizations || 0,
                totalUsers: totalUsers || 0,
                totalTickets: totalTickets || 0,
                openTickets: openTickets || 0,
                inProgressTickets: inProgressTickets || 0,
                closedTickets: closedTickets || 0,
            };
        } else {
            // User và Manager chỉ thấy data của organization mình
            const orgFilter = profile?.organization_id;

            const [
                { count: totalUsers },
                { count: totalTickets },
                { count: openTickets },
                { count: inProgressTickets },
                { count: closedTickets },
            ] = await Promise.all([
                supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", orgFilter),
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", orgFilter),
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", orgFilter)
                    .eq("status", "open"),
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", orgFilter)
                    .eq("status", "in_progress"),
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", orgFilter)
                    .eq("status", "closed"),
            ]);

            stats = {
                totalOrganizations: 1, // Chỉ có organization của mình
                totalUsers: totalUsers || 0,
                totalTickets: totalTickets || 0,
                openTickets: openTickets || 0,
                inProgressTickets: inProgressTickets || 0,
                closedTickets: closedTickets || 0,
            };
        }
    } catch (error) {
        console.log("Stats loading error:", error);
    }

    // Recent tickets with error handling and organization filtering
    let recentTickets: Ticket[] = [];
    try {
        let ticketsQuery = supabase.from("tickets").select(
            `
        id,
        title,
        ticket_type,
        status,
        priority,
        platform,
        created_at,
        organizations:organization_id (name)
      `
        );

        // Nếu không phải admin, filter theo organization
        if (profile?.role !== "admin" && profile?.organization_id) {
            ticketsQuery = ticketsQuery.eq(
                "organization_id",
                profile.organization_id
            );
        }

        const { data } = await ticketsQuery
            .order("created_at", { ascending: false })
            .limit(5);

        recentTickets = (data || []).map((ticket: Record<string, unknown>) => ({
            ...ticket,
            organizations: Array.isArray(ticket.organizations)
                ? ticket.organizations[0]
                : ticket.organizations,
        })) as Ticket[];
    } catch (error) {
        console.log("Recent tickets loading error:", error);
    }

    // Recent notifications
    let recentNotifications: Notification[] = [];
    try {
        const { data } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);

        recentNotifications = data || [];
    } catch (error) {
        console.log("Recent notifications loading error:", error);
    }

    // Using utility functions for badges and labels

    const getNotificationType = (type: string) => {
        switch (type) {
            case "ticket_status_changed":
                return "Trạng thái thay đổi";
            case "ticket_commented":
                return "Bình luận mới";
            case "comment_replied":
                return "Trả lời bình luận";
            default:
                return type;
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
                <p className="text-gray-600 mt-2">
                    Xin chào, {profile?.full_name || user.email}! Đây là tổng
                    quan hệ thống của bạn.
                </p>
            </div>

            {/* Stats Cards */}
            <div
                className={`grid grid-cols-3 md:grid-cols-${
                    profile?.role === "admin" ? "5" : "4"
                } gap-4`}
            >
                {/* Chỉ hiển thị thống kê đơn vị cho admin */}
                {profile?.role === "admin" && (
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Tổng Đơn vị
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.totalOrganizations}
                                </p>
                            </div>
                            <svg
                                className="h-8 w-8 text-muted-foreground"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                    </Card>
                )}

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Tổng Users
                            </p>
                            <p className="text-2xl font-bold">
                                {stats.totalUsers}
                            </p>
                        </div>
                        <svg
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                            />
                            <circle cx="9" cy="7" r="4" />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M23 21v-2a4 4 0 00-3-3.87"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 3.13a4 4 0 010 7.75"
                            />
                        </svg>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Tổng Tickets
                            </p>
                            <p className="text-2xl font-bold">
                                {stats.totalTickets}
                            </p>
                        </div>
                        <svg
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Tickets Mở
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {stats.openTickets}
                            </p>
                        </div>
                        <svg
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Đang Làm
                            </p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {stats.inProgressTickets}
                            </p>
                        </div>
                        <svg
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                Đã Đóng
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.closedTickets}
                            </p>
                        </div>
                        <svg
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                </Card>
            </div>

            {/* Recent Activity - 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Recent Tickets */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tasks Gần Đây</CardTitle>
                        <CardDescription>
                            5 tickets được tạo mới nhất trong hệ thống
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentTickets && recentTickets.length > 0 ? (
                            <div className="space-y-2">
                                {recentTickets.map((ticket) => (
                                    <Link
                                        key={ticket.id}
                                        href={`/tickets/${ticket.id}`}
                                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 px-2 -mx-2 rounded transition-colors cursor-pointer"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="mb-1">
                                                <span className="text-sm font-medium text-gray-900 truncate block">
                                                    {ticket.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Badge
                                                    variant={getTicketTypeBadgeVariant(
                                                        ticket.ticket_type
                                                    ) as any}
                                                    className={`text-xs flex items-center gap-1 ${
                                                        ticket.ticket_type ===
                                                        "task"
                                                            ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
                                                            : ""
                                                    }`}
                                                >
                                                    {getTicketTypeIcon(
                                                        ticket.ticket_type
                                                    )}
                                                    {getTicketTypeLabel(
                                                        ticket.ticket_type
                                                    )}
                                                </Badge>
                                                <span>•</span>
                                                <span>
                                                    {ticket.organizations
                                                        ?.name ||
                                                        "Chưa xác định"}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {new Date(
                                                        ticket.created_at
                                                    ).toLocaleDateString(
                                                        "vi-VN"
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 ml-3">
                                            <Badge
                                                variant={getPriorityBadgeVariant(
                                                    ticket.priority
                                                ) as any}
                                                className="text-xs"
                                            >
                                                {getPriorityLabel(
                                                    ticket.priority
                                                )}
                                            </Badge>
                                            <Badge
                                                variant={getStatusBadgeVariant(
                                                    ticket.status
                                                ) as any}
                                                className={`text-xs ${getStatusBadgeClasses(ticket.status)}`}
                                            >
                                                {getStatusLabel(ticket.status)}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    Chưa có tickets
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Bắt đầu bằng cách tạo ticket đầu tiên.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column - Recent Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle>Thông Báo Gần Đây</CardTitle>
                        <CardDescription>
                            5 thông báo mới nhất của bạn
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentNotifications &&
                        recentNotifications.length > 0 ? (
                            <div className="space-y-2">
                                {recentNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 px-2 -mx-2 rounded transition-colors ${
                                            notification.is_read
                                                ? "hover:bg-gray-50"
                                                : "bg-blue-50 hover:bg-blue-100"
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {notification.title}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {getNotificationType(
                                                        notification.type
                                                    )}
                                                </Badge>
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="truncate">
                                                    {notification.message}
                                                </span>
                                                <span>•</span>
                                                <span className="flex-shrink-0">
                                                    {new Date(
                                                        notification.created_at
                                                    ).toLocaleDateString(
                                                        "vi-VN"
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    Chưa có thông báo
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Thông báo sẽ xuất hiện ở đây.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <DashboardContent />
        </Suspense>
    );
}
