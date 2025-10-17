import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server-client";
import { DashboardNav } from "@/components/navigation/dashboard-nav";
import { ToolsSidebar } from "@/components/tools/ToolsSidebar";

export default async function ToolsLayout({
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

    // Get user profile to check role
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Only admin can access tools
    if (profile?.role !== "admin") {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardNav
                user={{
                    id: user.id,
                    email: user.email!,
                    profile: profile,
                }}
            />
            <div className="pt-16 flex">
                {/* Sidebar */}
                <ToolsSidebar userRole={profile?.role || "user"} />
                
                {/* Main content */}
                <main className="flex-1 min-w-0">
                    <div className="py-3">
                        <div className="max-w-[1600px] mx-auto px-2 sm:px-3">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
