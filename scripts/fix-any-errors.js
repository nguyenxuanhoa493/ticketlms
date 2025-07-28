#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Files that need to be fixed
const filesToFix = [
    "src/app/api/tickets/[id]/comments/[commentId]/route.ts",
    "src/app/api/tickets/[id]/comments/route.ts",
    "src/app/api/tickets/[id]/route.ts",
    "src/app/api/upload/avatar/route.ts",
    "src/app/api/users/reset-password/route.ts",
    "src/app/api/users/route.ts",
    "src/app/dashboard/page.tsx",
    "src/app/organizations/page.tsx",
    "src/app/tickets/[id]/page.tsx",
    "src/app/tickets/page.tsx",
    "src/app/users/page.tsx",
];

console.log("🔧 Đang fix các lỗi any...");

filesToFix.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");

        // Replace catch (error: any) with catch (error: unknown)
        content = content.replace(
            /catch \(error: any\)/g,
            "catch (error: unknown)"
        );

        // Replace error.message with proper error handling
        content = content.replace(
            /error\.message \|\|/g,
            "error instanceof Error ? error.message :"
        );
        content = content.replace(
            /error\.message \|\|/g,
            "error instanceof Error ? error.message :"
        );

        // Fix specific patterns
        content = content.replace(
            /const errorMessage = error\.message \|\|/g,
            "const errorMessage = error instanceof Error ? error.message :"
        );

        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed: ${filePath}`);
    } else {
        console.log(`❌ File not found: ${filePath}`);
    }
});

console.log("🎯 Hoàn tất fix lỗi any!");
