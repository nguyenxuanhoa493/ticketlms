import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";

export const GET = withAuth(async (request: NextRequest, user, supabase) => {
    try {
        console.log("API called with user:", user);

        // Lấy query parameters
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "30"; // days
        const organizationId = searchParams.get("organizationId");

        console.log("Query params:", { period, organizationId });

        // Tính toán date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        console.log("Date range:", {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        });

        // Base query cho tickets
        let ticketsQuery = supabase
            .from("tickets")
            .select(
                `
                id,
                title,
                description,
                ticket_type,
                status,
                priority,
                platform,
                created_at,
                updated_at,
                deadline,
                organization_id,
                organizations:organization_id (
                    id,
                    name
                )
            `
            )
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());

        // Filter theo organization nếu không phải admin
        if (user.role !== "admin") {
            if (user.organization_id) {
                ticketsQuery = ticketsQuery.eq(
                    "organization_id",
                    user.organization_id
                );
            }
            ticketsQuery = ticketsQuery.eq("only_show_in_admin", false);
        } else if (organizationId) {
            ticketsQuery = ticketsQuery.eq("organization_id", organizationId);
        }

        console.log("Executing query...");
        const { data: tickets, error } = await ticketsQuery;

        if (error) {
            console.error("Supabase error:", error);
            return NextResponse.json(
                { error: "Không thể lấy dữ liệu tickets", details: error },
                { status: 500 }
            );
        }

        console.log("Query successful, tickets count:", tickets?.length || 0);

        // Tính toán thống kê
        const stats = calculateTicketStats(tickets || []);
        const trends = calculateTrends(tickets || [], period);
        const organizationStats = calculateOrganizationStats(tickets || []);
        const priorityStats = calculatePriorityStats(tickets || []);
        const platformStats = calculatePlatformStats(tickets || []);
        const typeStats = calculateTypeStats(tickets || []);

        return NextResponse.json({
            success: true,
            data: {
                stats,
                trends,
                organizationStats,
                priorityStats,
                platformStats,
                typeStats,
                period,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
        });
    } catch (error) {
        console.error("Error fetching ticket reports:", error);
        return NextResponse.json(
            { error: "Lỗi server khi lấy báo cáo", details: error },
            { status: 500 }
        );
    }
});

function calculateTicketStats(tickets: any[]) {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const closed = tickets.filter((t) => t.status === "closed").length;

    const avgResolutionTime = calculateAverageResolutionTime(tickets);
    const avgResponseTime = calculateAverageResponseTime(tickets);

    return {
        total,
        open,
        inProgress,
        closed,
        avgResolutionTime,
        avgResponseTime,
        completionRate: total > 0 ? (closed / total) * 100 : 0,
    };
}

function calculateTrends(tickets: any[], period: string) {
    const days = parseInt(period);
    const trends = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const dayTickets = tickets.filter((t) =>
            t.created_at.startsWith(dateStr)
        );

        trends.push({
            date: dateStr,
            created: dayTickets.length,
            closed: dayTickets.filter((t) => t.status === "closed").length,
        });
    }

    return trends;
}

function calculateOrganizationStats(tickets: any[]) {
    const orgMap = new Map();

    tickets.forEach((ticket) => {
        const orgName = ticket.organizations?.name || "Unknown";
        if (!orgMap.has(orgName)) {
            orgMap.set(orgName, {
                name: orgName,
                total: 0,
                open: 0,
                inProgress: 0,
                closed: 0,
            });
        }

        const stats = orgMap.get(orgName);
        stats.total++;
        stats[ticket.status]++;
    });

    return Array.from(orgMap.values());
}

function calculatePriorityStats(tickets: any[]) {
    const priorities = ["low", "medium", "high"];
    const stats = priorities.map((priority) => ({
        priority,
        count: tickets.filter((t) => t.priority === priority).length,
        percentage:
            tickets.length > 0
                ? (tickets.filter((t) => t.priority === priority).length /
                      tickets.length) *
                  100
                : 0,
    }));

    return stats;
}

function calculatePlatformStats(tickets: any[]) {
    const platforms = ["web", "app", "all"];
    const stats = platforms.map((platform) => ({
        platform,
        count: tickets.filter((t) => t.platform === platform).length,
        percentage:
            tickets.length > 0
                ? (tickets.filter((t) => t.platform === platform).length /
                      tickets.length) *
                  100
                : 0,
    }));

    return stats;
}

function calculateTypeStats(tickets: any[]) {
    const types = ["bug", "task"];
    const stats = types.map((type) => ({
        type,
        count: tickets.filter((t) => t.ticket_type === type).length,
        percentage:
            tickets.length > 0
                ? (tickets.filter((t) => t.ticket_type === type).length /
                      tickets.length) *
                  100
                : 0,
    }));

    return stats;
}

function calculateAverageResolutionTime(tickets: any[]) {
    const closedTickets = tickets.filter(
        (t) => t.status === "closed" && t.updated_at
    );

    if (closedTickets.length === 0) return 0;

    const totalTime = closedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const updated = new Date(ticket.updated_at);
        return sum + (updated.getTime() - created.getTime());
    }, 0);

    return Math.round(totalTime / closedTickets.length / (1000 * 60 * 60 * 24)); // days
}

function calculateAverageResponseTime(tickets: any[]) {
    // Giả sử response time là thời gian từ lúc tạo đến lúc cập nhật lần đầu
    const respondedTickets = tickets.filter(
        (t) => t.updated_at && t.updated_at !== t.created_at
    );

    if (respondedTickets.length === 0) return 0;

    const totalTime = respondedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const updated = new Date(ticket.updated_at);
        return sum + (updated.getTime() - created.getTime());
    }, 0);

    return Math.round(totalTime / respondedTickets.length / (1000 * 60 * 60)); // hours
}
