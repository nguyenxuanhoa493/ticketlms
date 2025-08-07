import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server-client";
import { DashboardNav } from "@/components/navigation/dashboard-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Thông báo - TicketLMS",
    description: "Quản lý thông báo và cập nhật trong hệ thống",
    icons: {
        icon: "/favicon.png",
        shortcut: "/favicon.png",
        apple: "/favicon.png",
    },
};

export default async function NotificationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await getServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get user profile with organization info
    const { data: profile } = await supabase
        .from("profiles")
        .select(
            `
            *,
            organizations:organization_id (
                id,
                name
            )
        `
        )
        .eq("id", user.id)
        .single();

    if (!profile) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation */}
            <DashboardNav user={{ id: user.id, email: user.email!, profile }} />

            {/* Main content with top padding for fixed nav */}
            <main className="pt-16">
                <div className="py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
