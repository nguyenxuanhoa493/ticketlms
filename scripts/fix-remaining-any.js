#!/usr/bin/env node

const fs = require("fs");

// Fix remaining any errors
const fixes = [
    {
        file: "src/app/organizations/page.tsx",
        search: "} catch (error: any) {",
        replace: "} catch (error: unknown) {",
    },
    {
        file: "src/app/organizations/page.tsx",
        search: 'console.error("Error fetching organizations:", error);',
        replace:
            'console.error("Error fetching organizations:", error);\n        const errorMessage = error instanceof Error ? error.message : "Failed to fetch organizations";',
    },
    {
        file: "src/app/organizations/page.tsx",
        search: 'return NextResponse.json(\n            { error: error.message || "Failed to fetch organizations" },\n            { status: 500 }\n        );',
        replace:
            "return NextResponse.json(\n            { error: errorMessage },\n            { status: 500 }\n        );",
    },
    {
        file: "src/app/tickets/[id]/page.tsx",
        search: "} catch (error: any) {",
        replace: "} catch (error: unknown) {",
    },
    {
        file: "src/app/tickets/[id]/page.tsx",
        search: 'console.error("Error fetching ticket:", error);',
        replace:
            'console.error("Error fetching ticket:", error);\n            const errorMessage = error instanceof Error ? error.message : "Không thể tải thông tin ticket";',
    },
    {
        file: "src/app/tickets/[id]/page.tsx",
        search: 'description: error instanceof Error ? error.message : "Không thể tải thông tin ticket",',
        replace: "description: errorMessage,",
    },
    {
        file: "src/app/tickets/page.tsx",
        search: "} catch (error: any) {",
        replace: "} catch (error: unknown) {",
    },
    {
        file: "src/app/tickets/page.tsx",
        search: 'console.error("Error fetching tickets:", error);',
        replace:
            'console.error("Error fetching tickets:", error);\n        const errorMessage = error instanceof Error ? error.message : "Failed to fetch tickets";',
    },
    {
        file: "src/app/tickets/page.tsx",
        search: 'return NextResponse.json(\n            { error: error.message || "Failed to fetch tickets" },\n            { status: 500 }\n        );',
        replace:
            "return NextResponse.json(\n            { error: errorMessage },\n            { status: 500 }\n        );",
    },
    {
        file: "src/app/users/page.tsx",
        search: "} catch (error: any) {",
        replace: "} catch (error: unknown) {",
    },
    {
        file: "src/app/users/page.tsx",
        search: 'console.error("Error fetching users:", error);',
        replace:
            'console.error("Error fetching users:", error);\n        const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";',
    },
    {
        file: "src/app/users/page.tsx",
        search: 'return NextResponse.json(\n            { error: error.message || "Failed to fetch users" },\n            { status: 500 }\n        );',
        replace:
            "return NextResponse.json(\n            { error: errorMessage },\n            { status: 500 }\n        );",
    },
];

console.log("🔧 Đang fix các lỗi any còn lại...");

fixes.forEach(({ file, search, replace }) => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, "utf8");
        content = content.replace(search, replace);
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed: ${file}`);
    } else {
        console.log(`❌ File not found: ${file}`);
    }
});

console.log("🎯 Hoàn tất fix lỗi any!");
