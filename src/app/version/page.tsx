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
        // Silent error handling
    }

    return {
        version: process.env.NEXT_PUBLIC_VERSION || "1.0.0",
        commitHash: process.env.NEXT_PUBLIC_COMMIT_HASH || "development",
        buildTime:
            process.env.NEXT_PUBLIC_BUILD_TIME || "2024-01-01T00:00:00.000Z",
        environment: process.env.NODE_ENV || "development",
    };
}

export default async function VersionPage() {
    const versionInfo = await getVersionInfo();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full mx-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        TicketLMS
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Hệ thống quản lý ticket
                    </p>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">
                                Phiên bản:
                            </span>
                            <span className="text-blue-600 font-mono text-sm">
                                {versionInfo.version}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">
                                Commit:
                            </span>
                            <span className="text-green-600 font-mono text-sm">
                                {versionInfo.commitHash}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">
                                Build:
                            </span>
                            <span className="text-purple-600 font-mono text-sm">
                                {new Date(versionInfo.buildTime).toLocaleString(
                                    "vi-VN"
                                )}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">
                                Môi trường:
                            </span>
                            <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                    versionInfo.environment === "production"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                }`}
                            >
                                {versionInfo.environment}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            © 2024 TicketLMS - Hỗ trợ: Nguyễn Xuân Hòa -
                            0962369231
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
