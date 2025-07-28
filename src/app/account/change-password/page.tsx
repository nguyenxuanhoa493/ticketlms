"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

import { Lock, Eye, EyeOff } from "lucide-react";
import { signOut } from "@/lib/auth";

export default function ChangePasswordPage() {
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords
        if (formData.newPassword !== formData.confirmPassword) {
            toast({
                title: "Lỗi",
                description: "Mật khẩu mới và xác nhận mật khẩu không khớp",
                variant: "destructive",
            });
            return;
        }

        if (formData.newPassword.length < 6) {
            toast({
                title: "Lỗi",
                description: "Mật khẩu mới phải có ít nhất 6 ký tự",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/users/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to change password");
            }

            toast({
                title: "Thành công",
                description:
                    "Đổi mật khẩu thành công. Bạn sẽ được chuyển về trang đăng nhập.",
            });

            // Wait a moment for toast to show
            setTimeout(async () => {
                try {
                    // Sign out user to refresh auth session
                    await signOut();

                    // Redirect to login with success message
                    router.push("/login?message=password-changed");
                } catch (signOutError) {
                    console.error("Error signing out:", signOutError);
                    // Force redirect even if signout fails
                    router.push("/login?message=password-changed");
                }
            }, 1500);
        } catch (error: unknown) {
            console.error("Error changing password:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Đổi mật khẩu thất bại";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    return (
        <div className="py-6">
            <Toaster />

            {/* Header */}
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    Đổi mật khẩu
                </h1>
                <p className="text-sm text-gray-600 mt-2">
                    Thay đổi mật khẩu đăng nhập của bạn
                </p>
            </div>

            {/* Change Password Form */}
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Đổi mật khẩu
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Current Password */}
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">
                                Mật khẩu hiện tại *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={
                                        showPasswords.current
                                            ? "text"
                                            : "password"
                                    }
                                    value={formData.currentPassword}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            currentPassword: e.target.value,
                                        }))
                                    }
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() =>
                                        togglePasswordVisibility("current")
                                    }
                                >
                                    {showPasswords.current ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">Mật khẩu mới *</Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    type={
                                        showPasswords.new ? "text" : "password"
                                    }
                                    value={formData.newPassword}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            newPassword: e.target.value,
                                        }))
                                    }
                                    required
                                    minLength={6}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() =>
                                        togglePasswordVisibility("new")
                                    }
                                >
                                    {showPasswords.new ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Mật khẩu phải có ít nhất 6 ký tự
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Xác nhận mật khẩu mới *
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={
                                        showPasswords.confirm
                                            ? "text"
                                            : "password"
                                    }
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            confirmPassword: e.target.value,
                                        }))
                                    }
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() =>
                                        togglePasswordVisibility("confirm")
                                    }
                                >
                                    {showPasswords.confirm ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={saving}
                            className="w-full"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            {saving ? "Đang xử lý..." : "Đổi mật khẩu"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
