"use client";

import React, { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser-client";
import { useTicketReports, useOrganizations } from "@/hooks/useTicketReports";
import { useProfileUpdate } from "@/hooks/useProfileUpdate";
import {
    ReportHeader,
    ReportFilters,
    ReportCharts,
    ReportTrends,
    ReportTable,
} from "@/components/reports";

export default function ReportsPage() {
    // Hook để lắng nghe profile update events
    useProfileUpdate();

    const [period, setPeriod] = useState("30");
    const [organizationId, setOrganizationId] = useState<string | undefined>(
        ""
    );
    const [userRole, setUserRole] = useState<string>("");
    const [userOrganizationId, setUserOrganizationId] = useState<string>("");

    // Lấy thông tin user
    React.useEffect(() => {
        const getUserInfo = async () => {
            const supabase = getBrowserClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    setUserRole(profile.role || "");
                    setUserOrganizationId(profile.organization_id || "");

                    // Nếu không phải admin, chỉ hiển thị data của organization mình
                    if (profile.role !== "admin") {
                        setOrganizationId(profile.organization_id || "");
                    }
                }
            }
        };

        getUserInfo();
    }, []);

    // Lấy dữ liệu báo cáo
    const {
        data: reportData,
        isLoading,
        error,
        refetch,
    } = useTicketReports({
        period,
        organizationId: organizationId || undefined,
        enabled: true,
    });

    // Lấy danh sách organizations (chỉ cho admin)
    const { data: organizations = [] } = useOrganizations();

    const handlePeriodChange = (newPeriod: string) => {
        setPeriod(newPeriod);
    };

    const handleOrganizationChange = (newOrganizationId: string) => {
        // Nếu chọn "all", set về undefined để lấy tất cả organizations
        setOrganizationId(
            newOrganizationId === "all" ? undefined : newOrganizationId
        );
    };

    const handleRefresh = () => {
        refetch();
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Có lỗi xảy ra
                    </h1>
                    <p className="text-gray-600 mb-4">
                        {error instanceof Error
                            ? error.message
                            : "Không thể tải dữ liệu báo cáo"}
                    </p>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading || !reportData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải báo cáo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header với thống kê tổng quan */}
            <ReportHeader
                stats={reportData.stats}
                period={reportData.period}
                startDate={reportData.startDate}
                endDate={reportData.endDate}
            />

            {/* Filters */}
            <ReportFilters
                period={period}
                organizationId={organizationId}
                organizations={organizations}
                userRole={userRole}
                onPeriodChange={handlePeriodChange}
                onOrganizationChange={handleOrganizationChange}
                onRefresh={handleRefresh}
                isLoading={isLoading}
            />

            {/* Charts - Tạm thời ẩn vì API đơn giản chưa có data */}
            {/* <ReportCharts
                priorityStats={reportData.priorityStats}
                platformStats={reportData.platformStats}
                typeStats={reportData.typeStats}
            />

            <ReportTrends trends={reportData.trends} />

            <ReportTable organizationStats={reportData.organizationStats} /> */}
        </div>
    );
}
