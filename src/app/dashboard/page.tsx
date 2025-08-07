import { Suspense } from "react";
import { getServerClient } from "@/lib/supabase/server-client";
import type { Metadata } from "next";
import {
    DashboardHeader,
    DashboardStats,
    RecentTickets,
    RecentNotifications,
} from "@/components/dashboard";
import {
    getDashboardStats,
    getRecentTickets,
    getRecentNotifications,
} from "@/lib/dashboard-utils";
import { DashboardClientWrapper } from "./DashboardClientWrapper";

export const metadata: Metadata = {
    title: "Tổng quan - TicketLMS",
    description: "Bảng điều khiển hệ thống quản lý ticket",
    icons: {
        icon: "/favicon.png",
        shortcut: "/favicon.png",
        apple: "/favicon.png",
    },
};

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );
}

async function DashboardContent() {
    const supabase = await getServerClient();

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
        // Profile not found, will create during next operation
    }

    // Get dashboard data using utility functions
    const [stats, recentTickets, recentNotifications] = await Promise.all([
        getDashboardStats(user.id, profile?.role, profile?.organization_id),
        getRecentTickets(profile?.role, profile?.organization_id),
        getRecentNotifications(user.id),
    ]);

    return (
        <DashboardClientWrapper
            stats={stats}
            recentTickets={recentTickets}
            recentNotifications={recentNotifications}
            profile={profile}
            user={user}
        />
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <DashboardContent />
        </Suspense>
    );
}
