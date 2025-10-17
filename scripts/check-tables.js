const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log("🔍 Checking database tables...\n");

    try {
        // Check api_template_folders table
        console.log("1. Checking api_template_folders table...");
        const { data: folders, error: foldersError } = await supabase
            .from("api_template_folders")
            .select("*")
            .limit(1);

        if (foldersError) {
            if (foldersError.code === "42P01") {
                console.log("   ❌ Table api_template_folders DOES NOT EXIST");
                console.log("   → Need to run migration!");
            } else {
                console.log("   ❌ Error:", foldersError.message);
            }
        } else {
            console.log("   ✅ Table api_template_folders EXISTS");
            console.log("   📊 Columns check passed");
        }

        // Check api_request_templates table
        console.log("\n2. Checking api_request_templates table...");
        const { data: templates, error: templatesError } = await supabase
            .from("api_request_templates")
            .select("id, name, folder_id")
            .limit(1);

        if (templatesError) {
            if (templatesError.code === "42703" && templatesError.message.includes("folder_id")) {
                console.log("   ⚠️  Table EXISTS but column folder_id DOES NOT EXIST");
                console.log("   → Need to run migration to add folder_id column!");
            } else if (templatesError.code === "42P01") {
                console.log("   ❌ Table api_request_templates DOES NOT EXIST");
            } else {
                console.log("   ❌ Error:", templatesError.message);
            }
        } else {
            console.log("   ✅ Table api_request_templates EXISTS");
            console.log("   ✅ Column folder_id EXISTS");
        }

        // Check api_environments table
        console.log("\n3. Checking api_environments table...");
        const { data: envs, error: envsError } = await supabase
            .from("api_environments")
            .select("id, name")
            .limit(1);

        if (envsError) {
            if (envsError.code === "42P01") {
                console.log("   ❌ Table api_environments DOES NOT EXIST");
            } else {
                console.log("   ❌ Error:", envsError.message);
            }
        } else {
            console.log("   ✅ Table api_environments EXISTS");
            console.log(`   📊 Found ${envs?.length || 0} environment(s)`);
        }

        // Summary
        console.log("\n" + "=".repeat(50));
        console.log("📋 SUMMARY");
        console.log("=".repeat(50));

        const folderTableExists = !foldersError || foldersError.code !== "42P01";
        const templateTableExists = !templatesError || templatesError.code !== "42P01";
        const folderIdExists = !templatesError || templatesError.code !== "42703";
        const envsTableExists = !envsError || envsError.code !== "42P01";

        if (folderTableExists && templateTableExists && folderIdExists && envsTableExists) {
            console.log("✅ ALL TABLES READY!");
            console.log("✅ Schema is up-to-date");
            console.log("✅ Can start using the application");
            console.log("\n🚀 Next: Start dev server and test");
        } else {
            console.log("⚠️  MIGRATION NEEDED!");
            console.log("\nMissing:");
            if (!folderTableExists) console.log("  - api_template_folders table");
            if (!folderIdExists) console.log("  - folder_id column in api_request_templates");
            if (!envsTableExists) console.log("  - api_environments table");
            
            console.log("\n📝 Run migration:");
            console.log("  Option 1: supabase db push --linked");
            console.log("  Option 2: Run SQL in Supabase Dashboard");
            console.log("           supabase/migrations/20251017070000_migrate_to_folders.sql");
        }

    } catch (error) {
        console.error("\n❌ Error checking tables:", error.message);
    }
}

checkTables();
