#!/usr/bin/env node

const fs = require("fs");

// Fix final errors for successful deployment
const fixes = [
    // Fix remaining any errors
    {
        file: "src/app/users/page.tsx",
        search: "} catch (error: any) {",
        replace: "} catch (error: unknown) {",
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
    // Fix unescaped entities
    {
        file: "src/app/organizations/page.tsx",
        search: 'Bạn có chắc chắn muốn xóa đơn vị "',
        replace: "Bạn có chắc chắn muốn xóa đơn vị &quot;",
    },
    {
        file: "src/app/organizations/page.tsx",
        search: '" ? Hành động này không thể hoàn tác.',
        replace: "&quot; ? Hành động này không thể hoàn tác.",
    },
    {
        file: "src/app/tickets/page.tsx",
        search: 'Bạn có chắc chắn muốn xóa ticket "',
        replace: "Bạn có chắc chắn muốn xóa ticket &quot;",
    },
    {
        file: "src/app/tickets/page.tsx",
        search: '" ? Hành động này không thể hoàn tác.',
        replace: "&quot; ? Hành động này không thể hoàn tác.",
    },
    {
        file: "src/app/users/page.tsx",
        search: 'Bạn có chắc chắn muốn xóa người dùng "',
        replace: "Bạn có chắc chắn muốn xóa người dùng &quot;",
    },
    {
        file: "src/app/users/page.tsx",
        search: '" ? Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn tài khoản.',
        replace:
            "&quot; ? Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn tài khoản.",
    },
    // Fix empty interface
    {
        file: "src/components/ui/textarea.tsx",
        search: "export interface TextareaProps\n    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {\n    // Additional props can be added here if needed\n}",
        replace:
            "export interface TextareaProps\n    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {\n    // Additional props can be added here if needed\n    className?: string;\n}",
    },
];

console.log("🔧 Đang fix lỗi cuối cùng...");

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

console.log("🎯 Hoàn tất fix lỗi cuối cùng!");
