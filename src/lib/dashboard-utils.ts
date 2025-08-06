import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface DashboardStats {
    totalOrganizations: number;
    totalUsers: number;
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    closedTickets: number;
}

export interface Ticket {
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

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: "ticket_status_changed" | "ticket_commented" | "comment_replied";
    is_read: boolean;
    created_at: string;
}

export async function getDashboardStats(
    userId: string,
    userRole?: string,
    organizationId?: string
): Promise<DashboardStats> {
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

    let stats: DashboardStats = {
        totalOrganizations: 0,
        totalUsers: 0,
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        closedTickets: 0,
    };

    try {
        // Admin thấy tất cả, user/manager chỉ thấy của organization mình
        if (userRole === "admin") {
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
            const orgFilter = organizationId;

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
                    .eq("organization_id", orgFilter)
                    .eq("only_show_in_admin", false),
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", orgFilter)
                    .eq("only_show_in_admin", false)
                    .eq("status", "open"),
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", orgFilter)
                    .eq("only_show_in_admin", false)
                    .eq("status", "in_progress"),
                supabase
                    .from("tickets")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", orgFilter)
                    .eq("only_show_in_admin", false)
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

    return stats;
}

export async function getRecentTickets(
    userRole?: string,
    organizationId?: string
): Promise<Ticket[]> {
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

        // Nếu không phải admin, filter theo organization và only_show_in_admin
        if (userRole !== "admin") {
            if (organizationId) {
                ticketsQuery = ticketsQuery.eq(
                    "organization_id",
                    organizationId
                );
            }
            // Non-admin users không thể thấy tickets marked as only_show_in_admin
            ticketsQuery = ticketsQuery.eq("only_show_in_admin", false);
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

    return recentTickets;
}

export async function getRecentNotifications(
    userId: string
): Promise<Notification[]> {
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

    let recentNotifications: Notification[] = [];
    try {
        const { data } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5);

        recentNotifications = data || [];
    } catch (error) {
        console.log("Recent notifications loading error:", error);
    }

    return recentNotifications;
}
