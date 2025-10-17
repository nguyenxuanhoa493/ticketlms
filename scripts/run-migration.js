const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        // Read the migration file
        const migrationPath = path.join(
            __dirname,
            "..",
            "supabase",
            "migrations",
            "create_api_request_templates.sql"
        );

        const sql = fs.readFileSync(migrationPath, "utf8");

        console.log("Running migration: create_api_request_templates.sql");
        console.log("SQL Preview:", sql.substring(0, 200) + "...\n");

        // Execute the SQL
        const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

        if (error) {
            // If the RPC function doesn't exist, we need to run SQL directly
            // Try using REST API directly
            console.log(
                "Note: exec_sql RPC not available. You need to run this SQL manually in Supabase SQL Editor:"
            );
            console.log("\n" + sql + "\n");
            console.log(
                "\nGo to: https://supabase.com/dashboard/project/kffuylebxyifkimtcvxh/sql/new"
            );
        } else {
            console.log("✅ Migration completed successfully!");
            if (data) console.log("Result:", data);
        }
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
}

runMigration();
