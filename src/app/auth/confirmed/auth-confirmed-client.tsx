"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthConfirmedClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    const success = searchParams.get("success") === "true";
    const error = searchParams.get("error") === "true";

    useEffect(() => {
        if (success && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (success && countdown === 0) {
            router.push("/dashboard");
        }
    }, [success, countdown, router]);

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg
                                    className="h-6 w-6 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                            <h3 className="mt-2 text-lg font-medium text-gray-900">
                                Email đã được xác nhận!
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Tài khoản của bạn đã được kích hoạt thành công.
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                Tự động chuyển đến tổng quan sau {countdown}{" "}
                                giây...
                            </p>
                            <div className="mt-4">
                                <Link href="/dashboard">
                                    <Button>Đi đến Tổng quan ngay</Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg
                                    className="h-6 w-6 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </div>
                            <h3 className="mt-2 text-lg font-medium text-gray-900">
                                Có lỗi xảy ra
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Không thể xác nhận email. Link có thể đã hết
                                hạn.
                            </p>
                            <div className="mt-4 space-y-2">
                                <Link href="/register">
                                    <Button className="w-full">
                                        Đăng ký lại
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Đi đến trang đăng nhập
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                            Đang làm...
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Vui lòng chờ trong giây lát.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
