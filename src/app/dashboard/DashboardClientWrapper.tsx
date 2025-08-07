"use client";

import {
    DashboardHeader,
    DashboardStats,
    RecentTickets,
    RecentNotifications,
} from "@/components/dashboard";
import { useProfileUpdate } from "@/hooks/useProfileUpdate";

interface DashboardClientWrapperProps {
    stats: any;
    recentTickets: any[];
    recentNotifications: any[];
    profile: any;
    user: any;
}

export function DashboardClientWrapper({
    stats,
    recentTickets,
    recentNotifications,
    profile,
    user,
}: DashboardClientWrapperProps) {
    // Hook để lắng nghe profile update events
    useProfileUpdate();

    return (
        <div className="space-y-8">
            {/* Header */}
            <DashboardHeader
                userName={profile?.full_name}
                userEmail={user.email}
            />

            {/* Stats Cards */}
            <DashboardStats stats={stats} userRole={profile?.role} />

            {/* Recent Activity - 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Recent Tickets */}
                <RecentTickets tickets={recentTickets} />

                {/* Right Column - Recent Notifications */}
                <RecentNotifications notifications={recentNotifications} />
            </div>
        </div>
    );
}
