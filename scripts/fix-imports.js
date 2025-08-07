#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Danh sách các file cần sửa import
const filesToFix = [
    "src/app/account/layout.tsx",
    "src/app/api/reports/tickets-simple/route.ts",
    "src/app/changelog/layout.tsx",
    "src/app/dashboard/layout.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/notifications/layout.tsx",
    "src/app/organizations/layout.tsx",
    "src/app/page.tsx",
    "src/app/reports/layout.tsx",
    "src/app/tickets/layout.tsx",
    "src/app/users/layout.tsx",
    "src/lib/api-utils.ts",
    "src/lib/dashboard-utils.ts",
];

// Function để sửa một file
function fixFile(filePath) {
    console.log(`🔧 Đang sửa ${filePath}...`);

    let content = fs.readFileSync(filePath, "utf8");
    let hasChanges = false;

    // Pattern 1: Thay thế import getServerClient từ client.ts sang server-client.ts
    const serverClientPattern =
        /import\s+\{\s*getServerClient\s*\}\s+from\s+["']@\/lib\/supabase\/client["'];/g;
    if (serverClientPattern.test(content)) {
        content = content.replace(
            serverClientPattern,
            'import { getServerClient } from "@/lib/supabase/server-client";'
        );
        hasChanges = true;
    }

    // Pattern 2: Thay thế import createApiClient và createAdminApiClient
    const apiClientPattern =
        /import\s+\{\s*createApiClient,\s*createAdminApiClient\s*\}\s+from\s+["']\.\/supabase\/client["'];/g;
    if (apiClientPattern.test(content)) {
        content = content.replace(
            apiClientPattern,
            'import { createApiClient, createAdminApiClient } from "./supabase/server-client";'
        );
        hasChanges = true;
    }

    // Pattern 3: Thay thế import getAdminClient
    const adminClientPattern =
        /import\s+\{\s*getAdminClient\s*\}\s+from\s+["']@\/lib\/supabase\/client["'];/g;
    if (adminClientPattern.test(content)) {
        content = content.replace(
            adminClientPattern,
            'import { getAdminClient } from "@/lib/supabase/server-client";'
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
    console.log("🔧 Bắt đầu sửa các import...\n");

    filesToFix.forEach((file) => {
        if (fs.existsSync(file)) {
            fixFile(file);
        } else {
            console.log(`❌ ${file} - không tồn tại`);
        }
    });

    console.log("\n🎉 Hoàn thành sửa các import!");
}

main();
