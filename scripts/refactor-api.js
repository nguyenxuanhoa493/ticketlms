#!/usr/bin/env node

/**
 * Script tự động refactor API routes
 * Sử dụng: node scripts/refactor-api.js
 */

const fs = require("fs");
const path = require("path");

// Danh sách các API routes cần refactor
const API_ROUTES = [
    "src/app/api/tickets/route.ts",
    "src/app/api/users/route.ts",
    "src/app/api/profile/route.ts",
    "src/app/api/tickets/[id]/route.ts",
    "src/app/api/tickets/[id]/comments/route.ts",
    "src/app/api/tickets/[id]/comments/[commentId]/route.ts",
    "src/app/api/notifications/[id]/route.ts",
    "src/app/api/notifications/mark-all-read/route.ts",
    "src/app/api/users/change-password/route.ts",
    "src/app/api/users/reset-password/route.ts",
    "src/app/api/upload/avatar/route.ts",
    "src/app/api/upload/image/route.ts",
];

// Template cho API route đã refactor
const REFACTORED_TEMPLATE = `import { NextRequest, NextResponse } from "next/server";
import { withAuth, withAdmin, withManager } from "@/lib/api-middleware";
import { 
    validateRequiredFields, 
    createSuccessResponse, 
    parsePaginationParams,
    checkUserPermission,
    checkOrganizationAccess,
    AuthenticatedUser 
} from "@/lib/api-utils";

// TODO: Implement refactored API logic here
export const GET = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
    // Implementation here
});

export const POST = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
    // Implementation here
});

export const PUT = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
    // Implementation here
});

export const DELETE = withAuth(async (request: NextRequest, user: AuthenticatedUser, supabase: any) => {
    // Implementation here
});
`;

function backupFile(filePath) {
    const backupPath = filePath.replace(".ts", ".ts.backup");
    if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, backupPath);
        console.log(`✅ Backup created: ${backupPath}`);
    }
}

function refactorApiRoute(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return;
    }

    console.log(`🔄 Refactoring: ${filePath}`);

    // Backup file gốc
    backupFile(filePath);

    // Tạo file refactor template
    const refactoredContent = REFACTORED_TEMPLATE;

    // Ghi file mới
    fs.writeFileSync(filePath, refactoredContent);
    console.log(`✅ Refactored: ${filePath}`);
}

function main() {
    console.log("🚀 Starting API refactor process...\n");

    API_ROUTES.forEach((route) => {
        refactorApiRoute(route);
    });

    console.log("\n📋 Summary:");
    console.log(`- Total routes processed: ${API_ROUTES.length}`);
    console.log("- Backup files created with .backup extension");
    console.log("- Refactored templates applied");
    console.log("\n⚠️  IMPORTANT:");
    console.log("- Review each refactored file");
    console.log("- Implement the actual logic in each route");
    console.log("- Test thoroughly before deploying");
    console.log("- Remove backup files after verification");
}

if (require.main === module) {
    main();
}

module.exports = { refactorApiRoute, API_ROUTES };
