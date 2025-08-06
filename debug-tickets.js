const { createClient } = require("@supabase/supabase-js");

// Khởi tạo Supabase client với service role key để có thể truy cập trực tiếp database
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key"
);

async function debugTickets() {
    console.log("🔍 Debugging tickets and user roles...\n");

    try {
        // 1. Kiểm tra tất cả tickets có only_show_in_admin = true
        console.log("1. Tickets với only_show_in_admin = true:");
        const { data: adminTickets, error: adminTicketsError } = await supabase
            .from("tickets")
            .select(
                "id, title, only_show_in_admin, organization_id, created_by"
            )
            .eq("only_show_in_admin", true);

        if (adminTicketsError) {
            console.error(
                "❌ Error fetching admin tickets:",
                adminTicketsError
            );
        } else {
            console.log(`✅ Found ${adminTickets.length} admin-only tickets:`);
            adminTickets.forEach((ticket) => {
                console.log(
                    `   - ID: ${ticket.id}, Title: "${ticket.title}", Org: ${ticket.organization_id}`
                );
            });
        }

        // 2. Kiểm tra tất cả users và role của họ
        console.log("\n2. Users và roles:");
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, role, organization_id");

        if (profilesError) {
            console.error("❌ Error fetching profiles:", profilesError);
        } else {
            console.log(`✅ Found ${profiles.length} users:`);
            profiles.forEach((profile) => {
                console.log(
                    `   - ID: ${profile.id}, Name: "${profile.full_name}", Role: ${profile.role}, Org: ${profile.organization_id}`
                );
            });
        }

        // 3. Kiểm tra tickets theo organization
        console.log("\n3. Tickets theo organization:");
        const { data: orgTickets, error: orgTicketsError } = await supabase
            .from("tickets")
            .select("id, title, only_show_in_admin, organization_id")
            .order("organization_id");

        if (orgTicketsError) {
            console.error("❌ Error fetching org tickets:", orgTicketsError);
        } else {
            const orgMap = {};
            orgTickets.forEach((ticket) => {
                if (!orgMap[ticket.organization_id]) {
                    orgMap[ticket.organization_id] = { total: 0, adminOnly: 0 };
                }
                orgMap[ticket.organization_id].total++;
                if (ticket.only_show_in_admin) {
                    orgMap[ticket.organization_id].adminOnly++;
                }
            });

            Object.entries(orgMap).forEach(([orgId, stats]) => {
                console.log(
                    `   - Org ${orgId}: ${stats.total} tickets (${stats.adminOnly} admin-only)`
                );
            });
        }

        // 4. Test API logic cho từng user role
        console.log("\n4. Testing API logic cho từng user:");
        for (const profile of profiles || []) {
            console.log(
                `\n   Testing user: ${profile.full_name} (${profile.role})`
            );

            // Simulate API logic
            let query = supabase
                .from("tickets")
                .select("id, title, only_show_in_admin");

            if (profile.role !== "admin") {
                if (profile.organization_id) {
                    query = query.eq(
                        "organization_id",
                        profile.organization_id
                    );
                    query = query.eq("only_show_in_admin", false);
                    console.log(
                        `     ✅ Applied filters: org=${profile.organization_id}, only_show_in_admin=false`
                    );
                } else {
                    console.log(
                        `     ❌ No organization_id, should return empty result`
                    );
                    continue;
                }
            } else {
                console.log(`     ✅ Admin user, no filters applied`);
            }

            const { data: userTickets, error: userTicketsError } = await query;

            if (userTicketsError) {
                console.error(`     ❌ Error:`, userTicketsError);
            } else {
                const adminOnlyCount = userTickets.filter(
                    (t) => t.only_show_in_admin
                ).length;
                console.log(
                    `     📊 Result: ${userTickets.length} tickets (${adminOnlyCount} admin-only)`
                );

                if (profile.role !== "admin" && adminOnlyCount > 0) {
                    console.log(
                        `     ⚠️  WARNING: Non-admin user can see ${adminOnlyCount} admin-only tickets!`
                    );
                }
            }
        }
    } catch (error) {
        console.error("❌ General error:", error);
    }
}

// Chạy debug
debugTickets();
