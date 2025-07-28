require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("🔍 Debug Info:");
console.log("URL exists:", !!supabaseUrl);
console.log("URL format:", supabaseUrl ? "https://...supabase.co" : "MISSING");
console.log("Service Key exists:", !!supabaseServiceKey);
console.log(
    "Service Key starts with:",
    supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + "..." : "MISSING"
);

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables!");
    console.error("Make sure .env.local contains:");
    console.error("- NEXT_PUBLIC_SUPABASE_URL");
    console.error("- SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

if (!supabaseUrl.includes("supabase.co")) {
    console.error("❌ Invalid Supabase URL format!");
    console.error("Expected: https://your-project.supabase.co");
    process.exit(1);
}

if (!supabaseServiceKey.startsWith("eyJ")) {
    console.error("❌ Invalid Service Role Key format!");
    console.error('Service role key should start with "eyJ"');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function createAdminUser() {
    console.log("🚀 Creating admin user...");

    const adminCredentials = {
        email: "admin@ticketlms.com",
        password: "Admin@123456",
        full_name: "System Administrator",
    };

    try {
        // 1. Create auth user
        console.log("1️⃣ Creating auth user...");
        const { data: authData, error: authError } =
            await supabase.auth.admin.createUser({
                email: adminCredentials.email,
                password: adminCredentials.password,
                email_confirm: true, // Skip email confirmation
                user_metadata: {
                    full_name: adminCredentials.full_name,
                },
            });

        if (authError) {
            if (authError.message.includes("already registered")) {
                console.log(
                    "👤 Admin user already exists, updating profile..."
                );

                // Get existing user
                const { data: users } = await supabase.auth.admin.listUsers();
                const existingUser = users.users?.find(
                    (u) => u.email === adminCredentials.email
                );

                if (existingUser) {
                    await updateAdminProfile(existingUser.id);
                }
                return;
            }
            throw authError;
        }

        const userId = authData.user.id;
        console.log(`✅ Auth user created with ID: ${userId}`);

        // 2. Create/update profile
        await updateAdminProfile(userId);

        console.log("\n🎉 Admin user created successfully!");
        console.log("\n📋 Login Credentials:");
        console.log(`Email: ${adminCredentials.email}`);
        console.log(`Password: ${adminCredentials.password}`);
        console.log(
            "\n⚠️  IMPORTANT: Please change the password after first login!"
        );
    } catch (error) {
        console.error("❌ Error creating admin user:", error.message);
        if (error.message.includes("JWT")) {
            console.error("💡 This looks like a JWT/API key issue");
            console.error(
                "🔑 Make sure you copied the SERVICE_ROLE key (not anon key)"
            );
        }
        process.exit(1);
    }
}

async function updateAdminProfile(userId) {
    console.log("2️⃣ Creating admin profile...");

    const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        role: "admin",
        full_name: "System Administrator",
        organization_id: null, // Admin không thuộc đơn vị nào
    });

    if (profileError) {
        throw profileError;
    }

    console.log("✅ Admin profile created/updated");
}

// Run the script
createAdminUser();
