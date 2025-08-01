import { Card } from "@/components/ui/card";

interface DashboardStatsProps {
    stats: {
        totalOrganizations: number;
        totalUsers: number;
        totalTickets: number;
        openTickets: number;
        inProgressTickets: number;
        closedTickets: number;
    };
    userRole?: string;
}

export function DashboardStats({ stats, userRole }: DashboardStatsProps) {
    return (
        <div
            className={`grid grid-cols-3 md:grid-cols-${
                userRole === "admin" ? "5" : "4"
            } gap-4`}
        >
            {/* Chỉ hiển thị thống kê đơn vị cho admin */}
            {userRole === "admin" && (
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
    );
} 