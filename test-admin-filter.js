const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminFiltering() {
    console.log("🧪 Testing Admin Filtering Logic");
    console.log("================================\n");

    try {
        // Get all users
        const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, email, role, organization_id")
            .order("role", { ascending: false });

        if (profilesError) throw profilesError;

        console.log("📊 Found users:");
        profiles.forEach(profile => {
            console.log(`   ${profile.full_name} (${profile.role}) - Org: ${profile.organization_id || 'None'}`);
        });

        console.log("\n🔍 Testing Organizations API Logic:");
        console.log("=====================================");

        for (const profile of profiles) {
            console.log(`\n   Testing user: ${profile.full_name} (${profile.role})`);

            // Simulate organizations API logic
            let orgQuery = supabase.from("organizations").select("*");

            if (profile.role !== "admin" && profile.organization_id) {
                orgQuery = orgQuery.eq("id", profile.organization_id);
                console.log(`     ✅ Applied filter: org_id=${profile.organization_id}`);
            } else if (profile.role === "admin") {
                console.log(`     ✅ Admin user, no filters applied`);
            } else {
                console.log(`     ❌ No organization_id, should return empty result`);
            }

            const { data: userOrgs, error: userOrgsError } = await orgQuery;

            if (userOrgsError) {
                console.error(`     ❌ Error:`, userOrgsError);
            } else {
                console.log(`     📊 Result: ${userOrgs.length} organizations`);
                userOrgs.forEach(org => {
                    console.log(`        - ${org.name} (${org.id})`);
                });
            }
        }

        console.log("\n🔍 Testing Tickets API Logic:");
        console.log("==============================");

        for (const profile of profiles) {
            console.log(`\n   Testing user: ${profile.full_name} (${profile.role})`);

            // Simulate tickets API logic
            let ticketsQuery = supabase
                .from("tickets")
                .select("id, title, organization_id, only_show_in_admin");

            if (profile.role !== "admin" && profile.organization_id) {
                ticketsQuery = ticketsQuery.eq("organization_id", profile.organization_id);
                ticketsQuery = ticketsQuery.eq("only_show_in_admin", false);
                console.log(`     ✅ Applied filters: org=${profile.organization_id}, only_show_in_admin=false`);
            } else if (profile.role === "admin") {
                console.log(`     ✅ Admin user, no filters applied`);
            } else {
                console.log(`     ❌ No organization_id, should return empty result`);
                continue;
            }

            const { data: userTickets, error: userTicketsError } = await ticketsQuery.limit(5);

            if (userTicketsError) {
                console.error(`     ❌ Error:`, userTicketsError);
            } else {
                const adminOnlyCount = userTickets.filter(t => t.only_show_in_admin).length;
                console.log(`     📊 Result: ${userTickets.length} tickets (${adminOnlyCount} admin-only)`);

                if (profile.role !== "admin" && adminOnlyCount > 0) {
                    console.log(`     ⚠️  WARNING: Non-admin user can see ${adminOnlyCount} admin-only tickets!`);
                }
            }
        }

        console.log("\n✅ Test completed successfully!");

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

// Run the test
testAdminFiltering();
