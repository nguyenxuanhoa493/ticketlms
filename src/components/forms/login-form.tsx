"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getBrowserClient } from "@/lib/supabase/browser-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Phone, User } from "lucide-react";

const loginSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    // Memoize URL cleanup to avoid unnecessary re-renders
    const cleanupUrl = useCallback(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("message");
        window.history.replaceState({}, "", url.toString());
    }, []);

    useEffect(() => {
        // Check for success messages from query parameters
        const message = searchParams.get("message");
        if (message === "password-changed") {
            setSuccessMessage(
                "Đổi mật khẩu thành công! Vui lòng đăng nhập lại."
            );
            cleanupUrl();
        }
    }, [searchParams, cleanupUrl]);

    // Memoize redirect function to avoid recreating on every render
    const redirectToDashboard = useCallback(() => {
        try {
            router.push("/dashboard");
            router.refresh();
        } catch (routerError) {
            window.location.href = "/dashboard";
        }
    }, [router]);

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const supabase = getBrowserClient();
            const { data: authData, error } =
                await supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password,
                });

            if (error) {
                setError(`Lỗi đăng nhập: ${error.message}`);
                return;
            }

            if (authData.user && authData.session) {
                // Login successful, redirect immediately
                // The middleware will handle session verification
                redirectToDashboard();
                
                // Fallback redirect
                setTimeout(() => {
                    if (window.location.pathname === "/login") {
                        window.location.href = "/dashboard";
                    }
                }, 1000);
            } else {
                setError("Đăng nhập không thành công. Vui lòng kiểm tra email và mật khẩu.");
            }
        } catch (err) {
            setError("Đã xảy ra lỗi không mong đợi. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCallSupport = useCallback(() => {
        window.location.href = "tel:0962369231";
    }, []);

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
                <CardDescription>
                    Nhập thông tin đăng nhập của bạn
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Nhập email của bạn"
                            autoComplete="email"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-600">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-600">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <p className="text-sm text-green-600">
                                {successMessage}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Chưa có tài khoản?{" "}
                        <span className="text-gray-500">
                            Liên hệ quản trị viên để được cấp tài khoản
                        </span>
                    </p>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800 text-center mb-2">
                        <strong>Hỗ trợ kỹ thuật:</strong>
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-800">
                                Nguyễn Xuân Hòa
                            </span>
                        </div>
                        <button
                            onClick={handleCallSupport}
                            className="flex items-center gap-2 text-xs text-blue-800 hover:text-blue-600 transition-colors"
                            type="button"
                        >
                            <Phone className="w-4 h-4" />
                            <span>0962369231</span>
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
