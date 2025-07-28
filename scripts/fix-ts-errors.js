#!/usr/bin/env node

const fs = require("fs");

// Fix all remaining TypeScript errors
const fixes = [
    // Fix error is of type 'unknown' errors
    {
        file: "src/app/organizations/page.tsx",
        search: 'console.error("Error deleting organization:", error);',
        replace:
            'console.error("Error deleting organization:", error);\n        const errorMessage = error instanceof Error ? error.message : "Failed to delete organization";',
    },
    {
        file: "src/app/organizations/page.tsx",
        search: 'return NextResponse.json(\n            { error: error.message || "Failed to delete organization" },\n            { status: 500 }\n        );',
        replace:
            "return NextResponse.json(\n            { error: errorMessage },\n            { status: 500 }\n        );",
    },
    {
        file: "src/app/tickets/[id]/page.tsx",
        search: 'console.error("Error adding comment:", error);',
        replace:
            'console.error("Error adding comment:", error);\n            const errorMessage = error instanceof Error ? error.message : "Không thể thêm bình luận";',
    },
    {
        file: "src/app/tickets/[id]/page.tsx",
        search: 'description: error instanceof Error ? error.message : "Không thể thêm bình luận",',
        replace: "description: errorMessage,",
    },
    {
        file: "src/app/tickets/[id]/page.tsx",
        search: 'console.error("Error editing comment:", error);',
        replace:
            'console.error("Error editing comment:", error);\n            const errorMessage = error instanceof Error ? error.message : "Không thể sửa bình luận";',
    },
    {
        file: "src/app/tickets/[id]/page.tsx",
        search: 'description: error instanceof Error ? error.message : "Không thể sửa bình luận",',
        replace: "description: errorMessage,",
    },
    {
        file: "src/app/tickets/[id]/page.tsx",
        search: 'console.error("Error deleting comment:", error);',
        replace:
            'console.error("Error deleting comment:", error);\n            const errorMessage = error instanceof Error ? error.message : "Không thể xóa bình luận";',
    },
    {
        file: "src/app/tickets/[id]/page.tsx",
        search: 'description: error instanceof Error ? error.message : "Không thể xóa bình luận",',
        replace: "description: errorMessage,",
    },
    {
        file: "src/app/tickets/[id]/page.tsx",
        search: 'console.error("Error saving ticket:", error);',
        replace:
            'console.error("Error saving ticket:", error);\n            const errorMessage = error instanceof Error ? error.message : "Không thể lưu ticket";',
    },
    {
        file: "src/app/tickets/[id]/page.tsx",
        search: 'description: error instanceof Error ? error.message : "Không thể lưu ticket",',
        replace: "description: errorMessage,",
    },
    {
        file: "src/app/tickets/page.tsx",
        search: 'console.error("Error saving ticket:", error);',
        replace:
            'console.error("Error saving ticket:", error);\n        const errorMessage = error instanceof Error ? error.message : "Không thể lưu ticket";',
    },
    {
        file: "src/app/tickets/page.tsx",
        search: 'description: error instanceof Error ? error.message : "Không thể lưu ticket",',
        replace: "description: errorMessage,",
    },
    {
        file: "src/app/tickets/page.tsx",
        search: 'console.error("Error deleting ticket:", error);',
        replace:
            'console.error("Error deleting ticket:", error);\n        const errorMessage = error instanceof Error ? error.message : "Không thể xóa ticket";',
    },
    {
        file: "src/app/tickets/page.tsx",
        search: 'description: error instanceof Error ? error.message : "Không thể xóa ticket",',
        replace: "description: errorMessage,",
    },
    {
        file: "src/app/users/page.tsx",
        search: 'console.error("Error saving user:", error);',
        replace:
            'console.error("Error saving user:", error);\n        const errorMessage = error instanceof Error ? error.message : "Không thể lưu người dùng";',
    },
    {
        file: "src/app/users/page.tsx",
        search: 'description: error instanceof Error ? error.message : "Không thể lưu người dùng",',
        replace: "description: errorMessage,",
    },
    {
        file: "src/app/users/page.tsx",
        search: 'console.error("Error deleting user:", error);',
        replace:
            'console.error("Error deleting user:", error);\n        const errorMessage = error instanceof Error ? error.message : "Không thể xóa người dùng";',
    },
    {
        file: "src/app/users/page.tsx",
        search: 'description: error instanceof Error ? error.message : "Không thể xóa người dùng",',
        replace: "description: errorMessage,",
    },
    {
        file: "src/app/users/page.tsx",
        search: 'console.error("Error resetting password:", error);',
        replace:
            'console.error("Error resetting password:", error);\n        const errorMessage = error instanceof Error ? error.message : "Không thể reset mật khẩu";',
    },
    {
        file: "src/app/users/page.tsx",
        search: 'description: error instanceof Error ? error.message : "Không thể reset mật khẩu",',
        replace: "description: errorMessage,",
    },
    // Fix variable redeclaration errors
    {
        file: "src/app/users/page.tsx",
        search: 'const errorMessage = error instanceof Error ? error.message : "Không thể lưu người dùng";',
        replace:
            'const saveErrorMessage = error instanceof Error ? error.message : "Không thể lưu người dùng";',
    },
    {
        file: "src/app/users/page.tsx",
        search: "description: errorMessage,",
        replace: "description: saveErrorMessage,",
    },
    {
        file: "src/app/users/page.tsx",
        search: 'const errorMessage = error instanceof Error ? error.message : "Không thể xóa người dùng";',
        replace:
            'const deleteErrorMessage = error instanceof Error ? error.message : "Không thể xóa người dùng";',
    },
    {
        file: "src/app/users/page.tsx",
        search: "description: errorMessage,",
        replace: "description: deleteErrorMessage,",
    },
    {
        file: "src/app/users/page.tsx",
        search: 'const errorMessage = error instanceof Error ? error.message : "Không thể reset mật khẩu";',
        replace:
            'const resetErrorMessage = error instanceof Error ? error.message : "Không thể reset mật khẩu";',
    },
    {
        file: "src/app/users/page.tsx",
        search: "description: errorMessage,",
        replace: "description: resetErrorMessage,",
    },
];

console.log("🔧 Đang fix tất cả lỗi TypeScript...");

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

console.log("🎯 Hoàn tất fix lỗi TypeScript!");
