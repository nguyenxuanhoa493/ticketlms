#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Files that need to be fixed
const filesToFix = [
    "src/app/notifications/page.tsx",
    "src/app/organizations/page.tsx",
    "src/app/register/page.tsx",
    "src/app/tickets/[id]/page.tsx",
    "src/app/tickets/page.tsx",
    "src/app/users/page.tsx",
    "src/components/NotificationDropdown.tsx",
    "src/components/RichTextEditor.tsx",
    "src/components/dashboard-nav.tsx",
    "src/components/login-form.tsx",
    "src/hooks/use-toast.ts",
    "src/lib/permissions.ts",
    "src/middleware.ts",
];

console.log("🔧 Đang fix các unused imports...");

filesToFix.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");

        // Remove unused imports from lucide-react
        const lucideImports = [
            "CardHeader",
            "CardTitle",
            "Table",
            "TableBody",
            "TableCell",
            "TableHead",
            "TableHeader",
            "TableRow",
            "Clock",
            "AlertCircle",
            "MessageCircle",
            "EyeOff",
            "Calendar",
            "User",
            "Building",
            "useRouter",
            "Textarea",
            "Badge",
            "Card",
            "CardContent",
            "Plus",
            "Search",
            "Edit",
            "Trash2",
            "CardDescription",
            "DialogDescription",
            "Filter",
            "Eye",
            "CheckCircle",
            "XCircle",
            "Bug",
            "CardHeader",
            "CardContent",
            "CardTitle",
            "Plus",
            "Search",
            "Edit",
            "Trash2",
            "Building",
            "Shield",
            "Textarea",
            "Eye",
            "X",
            "saveSelection",
            "routerError",
            "err",
            "actionTypes",
            "userOrgId",
            "targetOrgId",
            "session",
        ];

        lucideImports.forEach((importName) => {
            // Remove from import statements
            const importRegex = new RegExp(
                `\\b${importName}\\b\\s*,?\\s*`,
                "g"
            );
            content = content.replace(importRegex, "");

            // Clean up empty import statements
            content = content.replace(
                /import\s*{\s*}\s*from\s*["'][^"']+["']\s*;?\s*/g,
                ""
            );
            content = content.replace(
                /import\s*{\s*,+\s*}\s*from\s*["'][^"']+["']\s*;?\s*/g,
                ""
            );
        });

        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed: ${filePath}`);
    } else {
        console.log(`❌ File not found: ${filePath}`);
    }
});

console.log("🎯 Hoàn tất fix unused imports!");
