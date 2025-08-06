"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardData {
    userRole: string;
    organizationId: string | null;
    organizationName: string | null;
    recentTickets: any[];
    stats: {
        totalOrganizations: number;
        totalUsers: number;
        totalTickets: number;
        openTickets: number;
        inProgressTickets: number;
        closedTickets: number;
    };
}

export default function TestDashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Fetch current user
                const userResponse = await fetch("/api/current-user");
                if (!userResponse.ok) {
                    throw new Error("Failed to fetch user data");
                }
                const userData = await userResponse.json();

                // Fetch dashboard data
                const dashboardResponse = await fetch("/api/dashboard");
                if (!dashboardResponse.ok) {
                    throw new Error("Failed to fetch dashboard data");
                }
                const dashboardData = await dashboardResponse.json();

                setData({
                    userRole: userData.role || "unknown",
                    organizationId: userData.organization_id,
                    organizationName: userData.organizations?.name || "N/A",
                    recentTickets: dashboardData.recentTickets || [],
                    stats: dashboardData.stats || {
                        totalOrganizations: 0,
                        totalUsers: 0,
                        totalTickets: 0,
                        openTickets: 0,
                        inProgressTickets: 0,
                        closedTickets: 0,
                    },
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Có lỗi xảy ra
                    </h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Không có dữ liệu
                    </h1>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">
                    Dashboard Filtering Test
                </h1>

                {/* User Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Role</p>
                                <p className="font-semibold">{data.userRole}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Organization ID
                                </p>
                                <p className="font-semibold">
                                    {data.organizationId || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    Organization Name
                                </p>
                                <p className="font-semibold">
                                    {data.organizationName}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Dashboard Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                    {data.stats.totalOrganizations}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Organizations
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">
                                    {data.stats.totalUsers}
                                </p>
                                <p className="text-sm text-gray-600">Users</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">
                                    {data.stats.totalTickets}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Total Tickets
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600">
                                    {data.stats.openTickets}
                                </p>
                                <p className="text-sm text-gray-600">Open</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-orange-600">
                                    {data.stats.inProgressTickets}
                                </p>
                                <p className="text-sm text-gray-600">
                                    In Progress
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">
                                    {data.stats.closedTickets}
                                </p>
                                <p className="text-sm text-gray-600">Closed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Tickets */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Recent Tickets ({data.recentTickets.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.recentTickets.length > 0 ? (
                            <div className="space-y-3">
                                {data.recentTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-medium">
                                                {ticket.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <span>
                                                    {ticket.ticket_type}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {ticket.organizations
                                                        ?.name || "N/A"}
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
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                    ticket.status === "open"
                                                        ? "bg-green-100 text-green-800"
                                                        : ticket.status ===
                                                          "in_progress"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {ticket.status}
                                            </span>
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
                                                    ticket.priority === "high"
                                                        ? "bg-red-100 text-red-800"
                                                        : ticket.priority ===
                                                          "medium"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                                }`}
                                            >
                                                {ticket.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                Không có tickets nào
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <Button
                        onClick={() => (window.location.href = "/dashboard")}
                        variant="outline"
                        className="mr-4"
                    >
                        Back to Dashboard
                    </Button>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                    >
                        Refresh Data
                    </Button>
                </div>
            </div>
        </div>
    );
}
