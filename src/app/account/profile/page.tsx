"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import ImageCropper from "@/components/modals/ImageCropper";
import { User, Save } from "lucide-react";

interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    organization_id: string;
    avatar_url?: string;
    created_at?: string;
    updated_at?: string;
    organizations?: {
        id: string;
        name: string;
        description?: string;
    };
}

interface Organization {
    id: string;
    name: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        role: "",
        organization_id: "",
        avatar_url: "",
    });
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        fetchProfile();
        fetchOrganizations();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch("/api/profile");
            if (!response.ok) {
                throw new Error("Failed to fetch profile");
            }

            const data = await response.json();
            setProfile(data.data);
            setFormData({
                full_name: data.data.full_name || "",
                role: data.data.role || "",
                organization_id: data.data.organization_id || "",
                avatar_url: data.data.avatar_url || "",
            });
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tải thông tin người dùng",
                variant: "destructive",
            });
            // Don't redirect on error, stay on the page
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const response = await fetch("/api/organizations");
            if (response.ok) {
                const data = await response.json();
                // Ensure data is always an array
                setOrganizations(data.organizations || []);
            } else {
                setOrganizations([]);
            }
        } catch (error) {
            setOrganizations([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const requestData = {
                full_name: formData.full_name,
                avatar_url: formData.avatar_url,
                // Chỉ admin mới có thể thay đổi role và organization
                ...(profile?.role === "admin" && {
                    role: formData.role,
                    organization_id: formData.organization_id,
                }),
            };

            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to update profile");
            }

            toast({
                title: "Thành công",
                description: result.message || "Cập nhật thông tin thành công",
            });

            // Update profile with new data
            setProfile(result.data);
            setFormData({
                full_name: result.data.full_name || "",
                role: result.data.role || "",
                organization_id: result.data.organization_id || "",
                avatar_url: result.data.avatar_url || "",
            });

            // Trigger navigation bar update
            window.dispatchEvent(new CustomEvent("profileUpdated"));
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Cập nhật thông tin thất bại",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="py-6">
            <Toaster />

            {/* Header */}
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    Thông tin cá nhân
                </h1>
                <p className="text-sm text-gray-600 mt-2">
                    Quản lý thông tin tài khoản của bạn
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Avatar Card */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Avatar
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                Ảnh đại diện sẽ được tự động lưu ngay sau khi
                                upload thành công
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <ImageCropper
                                    currentAvatar={
                                        formData.avatar_url || undefined
                                    }
                                    onAvatarChange={async (avatarUrl) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            avatar_url: avatarUrl || "",
                                        }));

                                        // Auto-save avatar immediately after upload
                                        if (avatarUrl) {
                                            try {
                                                const requestData = {
                                                    full_name:
                                                        formData.full_name,
                                                    avatar_url: avatarUrl,
                                                    // Chỉ admin mới có thể thay đổi role và organization
                                                    ...(profile?.role ===
                                                        "admin" && {
                                                        role: formData.role,
                                                        organization_id:
                                                            formData.organization_id,
                                                    }),
                                                };

                                                const response = await fetch(
                                                    "/api/profile",
                                                    {
                                                        method: "PUT",
                                                        headers: {
                                                            "Content-Type":
                                                                "application/json",
                                                        },
                                                        body: JSON.stringify(
                                                            requestData
                                                        ),
                                                    }
                                                );

                                                const result =
                                                    await response.json();

                                                if (!response.ok) {
                                                    throw new Error(
                                                        result.error ||
                                                            "Failed to update profile"
                                                    );
                                                }

                                                // Update profile with new data
                                                setProfile(result.data);

                                                // Trigger navigation bar update
                                                window.dispatchEvent(
                                                    new CustomEvent(
                                                        "profileUpdated"
                                                    )
                                                );

                                                toast({
                                                    title: "Thành công",
                                                    description:
                                                        "Avatar đã được lưu tự động",
                                                });
                                            } catch (error) {
                                                console.error(
                                                    "Auto-save avatar failed:",
                                                    error
                                                );
                                                toast({
                                                    title: "Lỗi",
                                                    description:
                                                        "Không thể lưu avatar tự động",
                                                    variant: "destructive",
                                                });
                                            }
                                        }
                                    }}
                                    disabled={saving}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Profile Info Card */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Thông tin tài khoản
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">
                                        Họ và tên *
                                    </Label>
                                    <Input
                                        id="full_name"
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                full_name: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>

                                {/* Email (read-only for security) */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profile?.email || ""}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Email không thể thay đổi trực tiếp vì lý
                                        do bảo mật. Liên hệ quản trị viên nếu
                                        cần thay đổi.
                                    </p>
                                </div>

                                {/* User ID (read-only) */}
                                <div className="space-y-2">
                                    <Label htmlFor="user_id">
                                        ID người dùng
                                    </Label>
                                    <Input
                                        id="user_id"
                                        type="text"
                                        value={profile?.id || ""}
                                        disabled
                                        className="bg-gray-50"
                                    />
                                    <p className="text-xs text-gray-500">
                                        ID duy nhất của người dùng trong hệ
                                        thống
                                    </p>
                                </div>

                                {/* Role (chỉ admin mới edit được) */}
                                <div className="space-y-2">
                                    <Label htmlFor="role">Vai trò</Label>
                                    {profile?.role === "admin" ? (
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    role: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">
                                                    Admin
                                                </SelectItem>
                                                <SelectItem value="manager">
                                                    Manager
                                                </SelectItem>
                                                <SelectItem value="user">
                                                    User
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            value={
                                                formData.role === "admin"
                                                    ? "Admin"
                                                    : formData.role ===
                                                      "manager"
                                                    ? "Manager"
                                                    : "User"
                                            }
                                            disabled
                                            className="bg-gray-50"
                                        />
                                    )}
                                </div>

                                {/* Organization (chỉ admin mới edit được) */}
                                <div className="space-y-2">
                                    <Label htmlFor="organization">Đơn vị</Label>
                                    {profile?.role === "admin" ? (
                                        <Select
                                            value={formData.organization_id}
                                            onValueChange={(value) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    organization_id: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn đơn vị" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {organizations.map((org) => (
                                                    <SelectItem
                                                        key={org.id}
                                                        value={org.id}
                                                    >
                                                        {org.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            value={
                                                profile?.organizations?.name ||
                                                "Không xác định"
                                            }
                                            disabled
                                            className="bg-gray-50"
                                        />
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={saving}>
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving
                                            ? "Đang lưu..."
                                            : "Lưu thông tin"}
                                    </Button>
                                </div>

                                {/* Timestamps */}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                                        <div>
                                            <span className="font-medium">
                                                Tạo lúc:
                                            </span>
                                            <br />
                                            {profile?.created_at
                                                ? new Date(
                                                      profile.created_at
                                                  ).toLocaleString("vi-VN")
                                                : "Không xác định"}
                                        </div>
                                        <div>
                                            <span className="font-medium">
                                                Cập nhật lúc:
                                            </span>
                                            <br />
                                            {profile?.updated_at
                                                ? new Date(
                                                      profile.updated_at
                                                  ).toLocaleString("vi-VN")
                                                : "Không xác định"}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
