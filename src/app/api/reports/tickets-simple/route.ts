import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server-client";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    try {
        console.log("Simple tickets API called");

        const supabase = await getServerClient();

        // Lấy query parameters
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "30"; // days
        const organizationId = searchParams.get("organizationId");

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
                status,
                priority,
                platform,
                ticket_type,
                created_at
            `
            )
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());

        // Filter theo organization nếu có
        if (organizationId && organizationId !== "") {
            ticketsQuery = ticketsQuery.eq("organization_id", organizationId);
        }

        ticketsQuery = ticketsQuery.limit(10); // Chỉ lấy 10 tickets để test

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

        // Tính toán thống kê đơn giản
        const total = tickets?.length || 0;
        const open =
            tickets?.filter((t: any) => t.status === "open").length || 0;
        const inProgress =
            tickets?.filter((t: any) => t.status === "in_progress").length || 0;
        const closed =
            tickets?.filter((t: any) => t.status === "closed").length || 0;

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    total,
                    open,
                    inProgress,
                    closed,
                    completionRate: total > 0 ? (closed / total) * 100 : 0,
                },
                period,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
        });
    } catch (error) {
        console.error("Error in simple tickets API:", error);
        return NextResponse.json(
            { error: "Lỗi server", details: error },
            { status: 500 }
        );
    }
}
