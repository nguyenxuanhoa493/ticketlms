#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Pattern để tìm các file cần migrate
const patterns = [
    "src/app/**/*.tsx",
    "src/app/**/*.ts",
    "src/lib/**/*.ts",
    "src/middleware.ts",
];

// Danh sách các file đã được migrate
const migratedFiles = [
    "src/app/page.tsx",
    "src/app/dashboard/layout.tsx",
    "src/app/tickets/layout.tsx",
    "src/lib/api-utils.ts",
    "src/lib/supabase.ts",
];

// Function để migrate một file
function migrateFile(filePath) {
    if (migratedFiles.includes(filePath)) {
        console.log(`✅ ${filePath} - đã được migrate`);
        return;
    }

    let content = fs.readFileSync(filePath, "utf8");
    let hasChanges = false;

    // Pattern 1: Import createServerClient và cookies
    const importPattern =
        /import\s+\{\s*createServerClient\s*\}\s+from\s+["']@supabase\/ssr["'];\s*\nimport\s+\{\s*cookies\s*\}\s+from\s+["']next\/headers["'];/g;
    if (importPattern.test(content)) {
        content = content.replace(
            importPattern,
            'import { getServerClient } from "@/lib/supabase/client";'
        );
        hasChanges = true;
    }

    // Pattern 2: Chỉ import createServerClient
    const singleImportPattern =
        /import\s+\{\s*createServerClient\s*\}\s+from\s+["']@supabase\/ssr["'];/g;
    if (singleImportPattern.test(content)) {
        content = content.replace(
            singleImportPattern,
            'import { getServerClient } from "@/lib/supabase/client";'
        );
        hasChanges = true;
    }

    // Pattern 3: Chỉ import cookies
    const cookiesImportPattern =
        /import\s+\{\s*cookies\s*\}\s+from\s+["']next\/headers["'];/g;
    if (cookiesImportPattern.test(content)) {
        content = content.replace(cookiesImportPattern, "");
        hasChanges = true;
    }

    // Pattern 4: Thay thế createServerClient usage
    const usagePattern =
        /const\s+cookieStore\s*=\s*await\s+cookies\(\);\s*\n\s*const\s+supabase\s*=\s*createServerClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\s*\{\s*cookies:\s*\{\s*get\(name:\s*string\)\s*\{\s*return\s+cookieStore\.get\(name\)\?\.value;\s*\}\s*,\s*\}\s*,\s*\}\);/g;
    if (usagePattern.test(content)) {
        content = content.replace(
            usagePattern,
            "const supabase = await getServerClient();"
        );
        hasChanges = true;
    }

    // Pattern 5: Thay thế createServerClient với service role key
    const adminUsagePattern =
        /const\s+supabase\s*=\s*createServerClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.SUPABASE_SERVICE_ROLE_KEY!,\s*\{\s*cookies:\s*\{\s*get\(name:\s*string\)\s*\{\s*return\s+cookieStore\.get\(name\)\?\.value;\s*\}\s*,\s*\}\s*,\s*auth:\s*\{\s*autoRefreshToken:\s*false,\s*persistSession:\s*false,\s*\}\s*,\s*\}\);/g;
    if (adminUsagePattern.test(content)) {
        content = content.replace(
            adminUsagePattern,
            "const supabase = getAdminClient();"
        );
        hasChanges = true;
    }

    if (hasChanges) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✅ ${filePath} - đã migrate thành công`);
    } else {
        console.log(`⏭️  ${filePath} - không cần migrate`);
    }
}

// Main function
function main() {
    console.log("🚀 Bắt đầu migrate Supabase singleton pattern...\n");

    patterns.forEach((pattern) => {
        const files = glob.sync(pattern);
        files.forEach((file) => {
            migrateFile(file);
        });
    });

    console.log("\n🎉 Hoàn thành migration!");
    console.log("\n📝 Lưu ý:");
    console.log("- Kiểm tra lại các file đã migrate");
    console.log("- Chạy test để đảm bảo không có lỗi");
    console.log(
        "- Xem file src/lib/supabase/README.md để biết cách sử dụng mới"
    );
}

main();
