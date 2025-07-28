import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Phiên bản - TicketLMS",
    description: "Thông tin phiên bản hệ thống TicketLMS",
    icons: {
        icon: "/favicon.png",
    },
};

async function getVersionInfo() {
    try {
        // Thử đọc từ file version.json
        const response = await fetch(
            `${
                process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
            }/version.json`,
            {
                cache: "no-store",
            }
        );

        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log("Không thể đọc version.json:", error);
    }

    // Fallback values
    return {
        version: process.env.NEXT_PUBLIC_VERSION || "1.0.0",
        commitHash: process.env.NEXT_PUBLIC_COMMIT_HASH || "development",
        buildTime:
            process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
        branch: process.env.NEXT_PUBLIC_BRANCH || "main",
        commitDate:
            process.env.NEXT_PUBLIC_COMMIT_DATE || new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
        nextVersion: "14.x",
    };
}

export default async function VersionPage() {
    const versionInfo = await getVersionInfo();

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                TicketLMS
                            </h1>
                            <p className="text-lg text-gray-600">
                                Hệ thống quản lý ticket
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                                    Thông tin phiên bản
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">
                                            Phiên bản:
                                        </span>
                                        <span className="text-blue-600 font-mono">
                                            {versionInfo.version}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">
                                            Commit Hash:
                                        </span>
                                        <span className="text-blue-600 font-mono text-sm">
                                            {versionInfo.commitHash}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">
                                            Branch:
                                        </span>
                                        <span className="text-blue-600 font-mono text-sm">
                                            {versionInfo.branch}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">
                                            Môi trường:
                                        </span>
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                                versionInfo.environment ===
                                                "production"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                            }`}
                                        >
                                            {versionInfo.environment}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 p-6 rounded-lg">
                                <h2 className="text-xl font-semibold text-green-900 mb-4">
                                    Thông tin build
                                </h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">
                                            Thời gian build:
                                        </span>
                                        <span className="text-green-600 font-mono text-sm">
                                            {new Date(
                                                versionInfo.buildTime
                                            ).toLocaleString("vi-VN")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">
                                            Commit Date:
                                        </span>
                                        <span className="text-green-600 font-mono text-sm">
                                            {new Date(
                                                versionInfo.commitDate
                                            ).toLocaleString("vi-VN")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">
                                            Node.js:
                                        </span>
                                        <span className="text-green-600 font-mono text-sm">
                                            {versionInfo.nodeVersion}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700">
                                            Next.js:
                                        </span>
                                        <span className="text-green-600 font-mono text-sm">
                                            {versionInfo.nextVersion}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Thông tin hệ thống
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-medium text-gray-700 mb-2">
                                        Công nghệ sử dụng:
                                    </h3>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        <li>• Next.js 14 (App Router)</li>
                                        <li>• React 18</li>
                                        <li>• TypeScript</li>
                                        <li>• Tailwind CSS</li>
                                        <li>• Supabase (Database & Auth)</li>
                                        <li>• Shadcn/ui Components</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-700 mb-2">
                                        Tính năng chính:
                                    </h3>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        <li>• Quản lý ticket</li>
                                        <li>• Hệ thống phân quyền</li>
                                        <li>• Upload file & hình ảnh</li>
                                        <li>• Thông báo real-time</li>
                                        <li>• Dashboard thống kê</li>
                                        <li>• Responsive design</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500">
                                © 2024 TicketLMS - Hệ thống quản lý ticket
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Hỗ trợ kỹ thuật: Nguyễn Xuân Hòa - 0962369231
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
