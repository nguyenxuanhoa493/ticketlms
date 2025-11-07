"use client";

import {
    DashboardHeader,
    DashboardStats,
    RecentTickets,
    RecentNotifications,
} from "@/components/dashboard";
import { useProfileUpdate } from "@/hooks/useProfileUpdate";
import { ClientOnly } from "@/components/common/ClientOnly";
import type { DashboardStats as Stats, Ticket, Notification } from "@/lib/dashboard-utils";
import type { Database } from "@/types/database";
import type { User } from "@supabase/supabase-js";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] | null;

interface DashboardClientWrapperProps {
    stats: Stats;
    recentTickets: Ticket[];
    recentNotifications: Notification[];
    profile: Profile;
    user: User;
}

export function DashboardClientWrapper({
    stats,
    recentTickets,
    recentNotifications,
    profile,
    user,
}: DashboardClientWrapperProps) {
    return (
        <ClientOnly
            fallback={
                <div className="space-y-8">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="bg-white p-6 rounded-lg shadow animate-pulse"
                            >
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                </div>
            }
        >
            <DashboardContent
                stats={stats}
                recentTickets={recentTickets}
                recentNotifications={recentNotifications}
                profile={profile}
                user={user}
            />
        </ClientOnly>
    );
}

function DashboardContent({
    stats,
    recentTickets,
    recentNotifications,
    profile,
    user,
}: DashboardClientWrapperProps) {
    // Hook để lắng nghe profile update events
    useProfileUpdate();

    return (
        <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <DashboardHeader
                userName={profile?.full_name || undefined}
                userEmail={user.email || undefined}
            />

            {/* Stats Cards */}
            <DashboardStats stats={stats} userRole={profile?.role} />

            {/* Recent Activity - 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Left Column - Recent Tickets */}
                <RecentTickets tickets={recentTickets} />

                {/* Right Column - Recent Notifications */}
                <RecentNotifications notifications={recentNotifications} />
            </div>
        </div>
    );
}
