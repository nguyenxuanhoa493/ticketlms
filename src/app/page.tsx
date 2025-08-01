import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trang chủ - TicketLMS",
    description: "Hệ thống quản lý ticket và hỗ trợ khách hàng",
    icons: {
        icon: "/favicon.png",
        shortcut: "/favicon.png",
        apple: "/favicon.png",
    },
};

export default async function HomePage() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Redirect to dashboard if already logged in
    if (user) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            TicketLMS
                        </h1>
                        <div className="space-x-4">
                            <Link href="/login">
                                <Button>Đăng nhập</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">
                        Hệ thống quản lý ticket hiệu quả
                    </h2>
                    <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
                        Quản lý, theo dõi và giải quyết các yêu cầu hỗ trợ một
                        cách chuyên nghiệp. Phân quyền rõ ràng theo đơn vị, tăng
                        hiệu quả làm việc.
                    </p>

                    <div className="space-x-4 mb-16">
                        <Link href="/login">
                            <Button size="lg" className="text-lg px-8 py-3">
                                Đăng nhập hệ thống
                            </Button>
                        </Link>
                    </div>

                    {/* Notice */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                        <div className="flex items-center">
                            <svg
                                className="h-5 w-5 text-yellow-400 mr-2"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <p className="text-sm text-yellow-800">
                                Tài khoản được cấp bởi quản trị viên
                            </p>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-8 mt-16">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <svg
                                    className="w-6 h-6 text-blue-600 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Quản lý ticket
                            </CardTitle>
                            <CardDescription>
                                Tạo, theo dõi và giải quyết các yêu cầu hỗ trợ
                                một cách có hệ thống
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>
                                    • Phân loại ticket theo loại và mức độ ưu
                                    tiên
                                </li>
                                <li>• Theo dõi trạng thái và tiến độ xử lý</li>
                                <li>• Lưu trữ lịch sử và bình luận</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <svg
                                    className="w-6 h-6 text-green-600 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                Phân quyền theo đơn vị
                            </CardTitle>
                            <CardDescription>
                                Quản lý người dùng và phân quyền theo từng đơn
                                vị tổ chức
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Phân quyền admin, manager, user</li>
                                <li>• Quản lý theo đơn vị tổ chức</li>
                                <li>• Bảo mật thông tin nội bộ</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <svg
                                    className="w-6 h-6 text-purple-600 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                                Báo cáo và thống kê
                            </CardTitle>
                            <CardDescription>
                                Theo dõi hiệu suất và tạo báo cáo chi tiết
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Thống kê ticket theo trạng thái</li>
                                <li>• Báo cáo hiệu suất xử lý</li>
                                <li>• Tổng quan hệ thống</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center text-gray-600">
                        <p>&copy; 2024 TicketLMS. Tất cả quyền được bảo lưu.</p>
                        <div className="flex items-center space-x-4 mt-4 md:mt-0">
                            <Link
                                href="/changelog"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                                Lịch sử
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
