#!/usr/bin/env node

const fs = require("fs");

// Fix specific files with basic errors
const fixes = [
    {
        file: "src/app/register/page.tsx",
        search: "CardDescription, CardHeader, CardTitle",
        replace: "",
    },
    {
        file: "src/app/account/change-password/page.tsx",
        search: "Save, ArrowLeft",
        replace: "",
    },
    {
        file: "src/app/account/profile/page.tsx",
        search: "Mail, Phone, Building, Shield, Calendar",
        replace: "",
    },
    {
        file: "src/app/api/notifications/mark-all-read/route.ts",
        search: "export async function POST(request: NextRequest) {",
        replace: "export async function POST() {",
    },
    {
        file: "src/app/api/tickets/route.ts",
        search: 'import { canAccessOrganizationData } from "@/lib/permissions";',
        replace: "",
    },
    {
        file: "src/app/api/upload/avatar/route.ts",
        search: "const { data: uploadData, error: uploadError } = await supabase.storage",
        replace: "const { error: uploadError } = await supabase.storage",
    },
    {
        file: "src/app/api/upload/image/route.ts",
        search: "const { data, error } = await supabase.storage",
        replace: "const { error } = await supabase.storage",
    },
    {
        file: "src/app/auth/callback/route.ts",
        search: 'const next = searchParams.get("next") ?? "/dashboard";',
        replace: "",
    },
];

console.log("🔧 Đang fix các lỗi cơ bản...");

fixes.forEach(({ file, search, replace }) => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, "utf8");

        if (search && replace !== undefined) {
            content = content.replace(search, replace);
        }

        // Clean up empty import statements
        content = content.replace(
            /import\s*{\s*}\s*from\s*["'][^"']+["']\s*;?\s*/g,
            ""
        );
        content = content.replace(
            /import\s*{\s*,+\s*}\s*from\s*["'][^"']+["']\s*;?\s*/g,
            ""
        );

        fs.writeFileSync(file, content);
        console.log(`✅ Fixed: ${file}`);
    } else {
        console.log(`❌ File not found: ${file}`);
    }
});

console.log("🎯 Hoàn tất fix lỗi cơ bản!");
