"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import RichTextEditor from "@/components/common/RichTextEditor";
import HtmlContent from "@/components/common/HtmlContent";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/types/database";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];

interface OrganizationWithDetails extends Organization {
    assigned_admin?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

interface Admin {
    id: string;
    full_name: string | null;
}

interface Props {
    organization: OrganizationWithDetails;
    onUpdate: () => void;
}

export default function OrganizationOverview({ organization, onUpdate }: Props) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [formData, setFormData] = useState({
        name: organization.name,
        description: organization.description || "",
        status: organization.status,
        assigned_admin_id: organization.assigned_admin_id || "",
    });
    const [submitting, setSubmitting] = useState(false);

    // Update form data when organization changes
    useEffect(() => {
        setFormData({
            name: organization.name,
            description: organization.description || "",
            status: organization.status,
            assigned_admin_id: organization.assigned_admin_id || "",
        });
    }, [organization]);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const response = await fetch("/api/users?role=admin&limit=100");
            const result = await response.json();
            if (response.ok) {
                setAdmins(result.data || []);
            } else {
                console.error("Error fetching admins:", result);
                toast({
                    title: "Lỗi",
                    description: result.error || "Không thể tải danh sách admin",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error fetching admins:", error);
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách admin",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const response = await fetch("/api/organizations", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: organization.id,
                    ...formData,
                    assigned_admin_id: formData.assigned_admin_id || null,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to update organization");
            }

            toast({
                title: "Thành công",
                description: "Đã cập nhật thông tin đơn vị",
            });
            setIsEditing(false);
            onUpdate();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Thông tin đơn vị</CardTitle>
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                            Chỉnh sửa
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên đơn vị *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Trạng thái *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, status: value as "active" | "inactive" | "pending" })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Hoạt động</SelectItem>
                                    <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assigned_admin">Admin phụ trách</Label>
                            <Select
                                value={formData.assigned_admin_id || "unassigned"}
                                onValueChange={(value) => 
                                    setFormData({ 
                                        ...formData, 
                                        assigned_admin_id: value === "unassigned" ? "" : value 
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn admin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Không phân công</SelectItem>
                                    {admins.map((admin) => (
                                        <SelectItem key={admin.id} value={admin.id}>
                                            {admin.full_name || "No name"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Mô tả</Label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(value) => setFormData({ ...formData, description: value })}
                                placeholder="Mô tả về đơn vị"
                                minHeight="min-h-32"
                            />
                        </div>

                        <div className="flex space-x-2">
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                        name: organization.name,
                                        description: organization.description || "",
                                        status: organization.status,
                                        assigned_admin_id: organization.assigned_admin_id || "",
                                    });
                                }}
                            >
                                Hủy
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <Label className="text-gray-600">Tên đơn vị</Label>
                            <p className="mt-1 text-gray-900">{organization.name}</p>
                        </div>

                        <div>
                            <Label className="text-gray-600">Trạng thái</Label>
                            <p className="mt-1 text-gray-900">
                                {organization.status === "active"
                                    ? "Hoạt động"
                                    : organization.status === "inactive"
                                    ? "Ngừng hoạt động"
                                    : "Chờ xử lý"}
                            </p>
                        </div>

                        <div>
                            <Label className="text-gray-600">Admin phụ trách</Label>
                            <p className="mt-1 text-gray-900">
                                {organization.assigned_admin?.full_name || "Chưa phân công"}
                            </p>
                        </div>

                        <div>
                            <Label className="text-gray-600">Mô tả</Label>
                            {organization.description ? (
                                <div className="mt-1">
                                    <HtmlContent content={organization.description} />
                                </div>
                            ) : (
                                <p className="mt-1 text-gray-400 italic">Chưa có mô tả</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <Label className="text-gray-600">Ngày tạo</Label>
                                <p className="mt-1 text-gray-900">
                                    {new Date(organization.created_at).toLocaleDateString("vi-VN")}
                                </p>
                            </div>
                            <div>
                                <Label className="text-gray-600">Cập nhật lần cuối</Label>
                                <p className="mt-1 text-gray-900">
                                    {new Date(organization.updated_at).toLocaleDateString("vi-VN")}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
