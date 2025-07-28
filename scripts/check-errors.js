#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");

console.log("🔍 Đang quét lỗi...\n");

// 1. ESLint check
console.log("1️⃣ Kiểm tra ESLint...");
try {
    execSync("npm run lint", { stdio: "inherit" });
    console.log("✅ ESLint: OK\n");
} catch (error) {
    console.log("❌ ESLint: Có lỗi\n");
}

// 2. TypeScript check
console.log("2️⃣ Kiểm tra TypeScript...");
try {
    execSync("npx tsc --noEmit", { stdio: "inherit" });
    console.log("✅ TypeScript: OK\n");
} catch (error) {
    console.log("❌ TypeScript: Có lỗi\n");
}

// 3. Build check
console.log("3️⃣ Kiểm tra Build...");
try {
    execSync("npm run build", { stdio: "inherit" });
    console.log("✅ Build: OK\n");
} catch (error) {
    console.log("❌ Build: Có lỗi\n");
}

console.log("🎯 Quét lỗi hoàn tất!");
console.log("\n📝 Hướng dẫn sửa lỗi:");
console.log("- Xóa unused imports");
console.log("- Thay `any` bằng type cụ thể");
console.log("- Escape quotes trong JSX");
console.log("- Thêm dependencies vào useEffect");
console.log("- Sử dụng Next.js Image component");
