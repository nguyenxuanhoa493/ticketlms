#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Danh sách các file cần sửa
const filesToFix = [
    "src/app/auth/callback/route.ts",
    "src/app/changelog/layout.tsx",
    "src/app/notifications/layout.tsx",
    "src/app/organizations/layout.tsx",
    "src/app/reports/layout.tsx",
    "src/app/users/layout.tsx",
    "src/app/api/reports/tickets-simple/route.ts",
];

// Function để sửa một file
function fixFile(filePath) {
    console.log(`🔧 Đang sửa ${filePath}...`);

    let content = fs.readFileSync(filePath, "utf8");
    let hasChanges = false;

    // Pattern 1: Thay thế import và usage cho layout files
    const layoutPattern =
        /const\s+cookieStore\s*=\s*await\s+cookies\(\);\s*\n\s*const\s+supabase\s*=\s*createServerClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\s*\{\s*cookies:\s*\{\s*get\(name:\s*string\)\s*\{\s*return\s+cookieStore\.get\(name\)\?\.value;\s*\}\s*,\s*\}\s*,\s*\}\);/g;

    if (layoutPattern.test(content)) {
        content = content.replace(
            layoutPattern,
            "const supabase = await getServerClient();"
        );
        hasChanges = true;
    }

    // Pattern 2: Thay thế import createServerClient và cookies
    const importPattern =
        /import\s+\{\s*createServerClient\s*\}\s+from\s+["']@supabase\/ssr["'];\s*\nimport\s+\{\s*cookies\s*\}\s+from\s+["']next\/headers["'];/g;
    if (importPattern.test(content)) {
        content = content.replace(
            importPattern,
            'import { getServerClient } from "@/lib/supabase/client";'
        );
        hasChanges = true;
    }

    // Pattern 3: Chỉ import createServerClient
    const singleImportPattern =
        /import\s+\{\s*createServerClient\s*\}\s+from\s+["']@supabase\/ssr["'];/g;
    if (singleImportPattern.test(content)) {
        content = content.replace(
            singleImportPattern,
            'import { getServerClient } from "@/lib/supabase/client";'
        );
        hasChanges = true;
    }

    // Pattern 4: Chỉ import cookies
    const cookiesImportPattern =
        /import\s+\{\s*cookies\s*\}\s+from\s+["']next\/headers["'];/g;
    if (cookiesImportPattern.test(content)) {
        content = content.replace(cookiesImportPattern, "");
        hasChanges = true;
    }

    // Pattern 5: Sửa cho API routes
    const apiPattern =
        /const\s+cookieStore\s*=\s*await\s+cookies\(\);\s*\n\s*const\s+supabase\s*=\s*createServerClient\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!,\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\s*\{\s*cookies:\s*\{\s*get\(name:\s*string\)\s*\{\s*return\s+cookieStore\.get\(name\)\?\.value;\s*\}\s*,\s*\}\s*,\s*\}\);/g;
    if (apiPattern.test(content)) {
        content = content.replace(
            apiPattern,
            "const supabase = await getServerClient();"
        );
        hasChanges = true;
    }

    if (hasChanges) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log(`✅ ${filePath} - đã sửa thành công`);
    } else {
        console.log(`⏭️  ${filePath} - không cần sửa`);
    }
}

// Main function
function main() {
    console.log("🔧 Bắt đầu sửa các file còn lại...\n");

    filesToFix.forEach((file) => {
        if (fs.existsSync(file)) {
            fixFile(file);
        } else {
            console.log(`❌ ${file} - không tồn tại`);
        }
    });

    console.log("\n🎉 Hoàn thành sửa các file!");
}

main();
