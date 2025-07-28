const fs = require("fs");
const { execSync } = require("child_process");

// Lấy thông tin git
function getGitInfo() {
    try {
        const commitHash = execSync("git rev-parse --short HEAD", {
            encoding: "utf8",
        }).trim();
        const commitDate = execSync("git log -1 --format=%cd --date=iso", {
            encoding: "utf8",
        }).trim();
        const branch = execSync("git rev-parse --abbrev-ref HEAD", {
            encoding: "utf8",
        }).trim();

        return {
            commitHash,
            commitDate,
            branch,
        };
    } catch (error) {
        console.log("Không thể lấy thông tin git:", error.message);
        return {
            commitHash: "unknown",
            commitDate: new Date().toISOString(),
            branch: "unknown",
        };
    }
}

// Tạo file .env.local với thông tin build
function createBuildInfo() {
    const gitInfo = getGitInfo();
    const buildTime = new Date().toISOString();

    // Tạo version từ timestamp và commit hash
    const version = `1.0.${Date.now()}`;

    const envContent = `# Build Information - Auto generated
NEXT_PUBLIC_VERSION=${version}
NEXT_PUBLIC_COMMIT_HASH=${gitInfo.commitHash}
NEXT_PUBLIC_BUILD_TIME=${buildTime}
NEXT_PUBLIC_BRANCH=${gitInfo.branch}
NEXT_PUBLIC_COMMIT_DATE=${gitInfo.commitDate}
`;

    fs.writeFileSync(".env.local", envContent);
    console.log("✅ Đã tạo file .env.local với thông tin build");
    console.log(`📦 Version: ${version}`);
    console.log(`🔗 Commit: ${gitInfo.commitHash}`);
    console.log(
        `⏰ Build time: ${new Date(buildTime).toLocaleString("vi-VN")}`
    );
}

// Tạo file version.json để có thể truy cập từ client
function createVersionJson() {
    const gitInfo = getGitInfo();
    const buildTime = new Date().toISOString();
    const version = `1.0.${Date.now()}`;

    const versionInfo = {
        version,
        commitHash: gitInfo.commitHash,
        buildTime,
        branch: gitInfo.branch,
        commitDate: gitInfo.commitDate,
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
        nextVersion: "14.x",
    };

    // Tạo thư mục public nếu chưa có
    if (!fs.existsSync("public")) {
        fs.mkdirSync("public");
    }

    fs.writeFileSync(
        "public/version.json",
        JSON.stringify(versionInfo, null, 2)
    );
    console.log("✅ Đã tạo file public/version.json");
}

// Chạy script
console.log("🚀 Đang cập nhật thông tin version...");
createBuildInfo();
createVersionJson();
console.log("✅ Hoàn tất cập nhật version!");
