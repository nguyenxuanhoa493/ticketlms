import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DashboardNav } from "@/components/navigation/dashboard-nav";

export default async function ChangelogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

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
