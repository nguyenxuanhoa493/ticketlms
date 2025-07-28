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
import ImageCropper from "@/components/ImageCropper";
import {
    User,
    Mail,
    Phone,
    Building,
    Shield,
    Calendar,
    Save,
} from "lucide-react";

interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: string;
    organization_id: string;
    avatar_url?: string;
    organizations?: {
        id: string;
        name: string;
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
            const response = await fetch("/api/current-user");
            if (!response.ok) {
                console.error(
                    "Profile API failed:",
                    response.status,
                    response.statusText
                );
                throw new Error("Failed to fetch profile");
            }

            const data = await response.json();
            setProfile(data);
            setFormData({
                full_name: data.full_name || "",
                role: data.role || "",
                organization_id: data.organization_id || "",
                avatar_url: data.avatar_url || "",
            });
        } catch (error) {
            console.error("Error fetching profile:", error);
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
                console.error("Organizations API failed:", response.status);
                setOrganizations([]);
            }
        } catch (error) {
            console.error("Error fetching organizations:", error);
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

            if (!response.ok) {
                const responseText = await response.text();
                console.error("API Error - Status:", response.status);
                console.error("API Error - Response:", responseText);

                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(
                        errorData.error || "Failed to update profile"
                    );
                } catch (parseError) {
                    console.error(
                        "Failed to parse error response:",
                        parseError
                    );
                    throw new Error(
                        `HTTP ${response.status}: ${
                            responseText || "Failed to update profile"
                        }`
                    );
                }
            }

            toast({
                title: "Thành công",
                description: "Cập nhật thông tin thành công",
            });

            // Refresh profile data
            await fetchProfile();

            // Trigger navigation bar update
            window.dispatchEvent(new CustomEvent("profileUpdated"));
        } catch (error) {
            console.error("Error updating profile:", error);
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
                                Ảnh đại diện sẽ được tự động lưu khi upload
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <ImageCropper
                                    currentAvatar={
                                        formData.avatar_url || undefined
                                    }
                                    onAvatarChange={(avatarUrl) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            avatar_url: avatarUrl || "",
                                        }));
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
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
