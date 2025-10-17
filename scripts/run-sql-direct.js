const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const sqlPath = path.join(
        __dirname,
        "..",
        "supabase",
        "migrations",
        "20251017071000_create_templates_table.sql"
    );

    console.log("📖 Reading SQL file...");
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    console.log("🚀 Running migration via Supabase Management API...\n");
    
    // Split SQL into individual statements
    const statements = sql
        .split(";")
        .map(s => s.trim())
        .filter(s => s && !s.startsWith("--"));

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ";";
        
        // Skip comments
        if (statement.startsWith("--")) continue;
        
        // Get first line for logging
        const firstLine = statement.split("\n")[0].substring(0, 60);
        console.log(`[${i + 1}/${statements.length}] ${firstLine}...`);
        
        try {
            const { error } = await supabase.rpc("exec_sql", { 
                sql_query: statement 
            });
            
            if (error) {
                // Try alternative approach
                console.log("   ⚠️  RPC failed, this is expected. SQL must be run in Dashboard.");
            } else {
                console.log("   ✅ Success");
                successCount++;
            }
        } catch (err) {
            console.log(`   ⚠️  ${err.message}`);
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📋 MIGRATION STATUS");
    console.log("=".repeat(60));
    console.log("\n⚠️  Supabase JS client cannot execute DDL statements directly.");
    console.log("📝 You need to run the SQL in Supabase Dashboard:\n");
    console.log("1. Go to: https://supabase.com/dashboard/project/kffuylebxyifkimtcvxh/sql/new");
    console.log("2. Copy SQL from:");
    console.log("   supabase/migrations/20251017071000_create_templates_table.sql");
    console.log("3. Paste and click RUN ▶️\n");
    console.log("Or copy-paste this command to view the SQL:");
    console.log(`   cat ${sqlPath}`);
}

runMigration();
