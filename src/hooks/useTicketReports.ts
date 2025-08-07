import { useQuery } from "@tanstack/react-query";
import { getBrowserClient } from "@/lib/supabase/browser-client";

interface TicketReportData {
    stats: {
        total: number;
        open: number;
        inProgress: number;
        closed: number;
        completionRate: number;
    };
    period: string;
    startDate: string;
    endDate: string;
}

interface UseTicketReportsOptions {
    period?: string;
    organizationId?: string;
    enabled?: boolean;
}

async function fetchTicketReports(
    period: string,
    organizationId?: string
): Promise<TicketReportData> {
    const supabase = getBrowserClient();

    // Kiểm tra authentication
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    // Lấy user profile để kiểm tra role
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Xây dựng URL với query parameters
    const url = new URL("/api/reports/tickets-simple", window.location.origin);
    url.searchParams.set("period", period);
    if (organizationId && organizationId !== "") {
        url.searchParams.set("organizationId", organizationId);
    }

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch ticket reports");
    }

    const result = await response.json();
    return result.data;
}

export function useTicketReports(options: UseTicketReportsOptions = {}) {
    const { period = "30", organizationId, enabled = true } = options;

    return useQuery({
        queryKey: ["ticket-reports", period, organizationId],
        queryFn: () => fetchTicketReports(period, organizationId),
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}

// Hook để lấy danh sách organizations (cho admin)
export function useOrganizations() {
    return useQuery({
        queryKey: ["organizations"],
        queryFn: async () => {
            const supabase = getBrowserClient();
            const { data, error } = await supabase
                .from("organizations")
                .select("id, name")
                .order("name");

            if (error) throw error;
            return data || [];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}
