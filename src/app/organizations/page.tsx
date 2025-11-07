"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/common/RichTextEditor";
import HtmlContent from "@/components/common/HtmlContent";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Plus, Search, Edit, Trash2, Building } from "lucide-react";
import { useProfileUpdate } from "@/hooks/useProfileUpdate";

interface Organization {
    id: string;
    name: string;
    description: string | null;
    status: "active" | "inactive" | "pending";
    assigned_admin_id: string | null;
    created_at: string;
    updated_at: string;
    assigned_admin?: {
        id: string;
        full_name: string | null;
    } | null;
}

export default function OrganizationsPage() {
    const router = useRouter();
    useProfileUpdate();

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "" });
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const { toast } = useToast();

    useEffect(() => {
        fetchOrganizations();
    }, []);

    useEffect(() => {
        let filtered = organizations;

        if (searchQuery) {
            filtered = filtered.filter((org) =>
                org.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter((org) => org.status === statusFilter);
        }

        setFilteredOrgs(filtered);
    }, [organizations, searchQuery, statusFilter]);

    const fetchOrganizations = async () => {
        try {
            setLoading(true);

            const response = await fetch("/api/organizations");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch organizations");
            }

            setOrganizations(data.organizations || []);
        } catch (error: unknown) {
            console.error("Error fetching organizations:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to fetch organizations";
            setOrganizations([]); // Ensure empty array on error
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (org?: Organization) => {
        if (org) {
            setEditingOrg(org);
            setFormData({ name: org.name, description: org.description || "" });
        } else {
            setEditingOrg(null);
            setFormData({ name: "", description: "" });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingOrg(null);
        setFormData({ name: "", description: "" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast({
                title: "Lỗi",
                description: "Tên đơn vị không được để trống",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);

            if (editingOrg) {
                // Update existing organization
                const response = await fetch("/api/organizations", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: editingOrg.id,
                        name: formData.name,
                        description: formData.description,
                    }),
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(
                        result.error || "Failed to update organization"
                    );
                }

                toast({
                    title: "Thành công",
                    description: "Đã cập nhật đơn vị",
                });
            } else {
                // Create new organization
                const response = await fetch("/api/organizations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        description: formData.description,
                    }),
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(
                        result.error || "Failed to create organization"
                    );
                }

                toast({
                    title: "Thành công",
                    description: "Đã tạo đơn vị mới",
                });
            }

            handleCloseDialog();
            fetchOrganizations();
        } catch (error: unknown) {
            console.error("Error saving organization:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Không thể lưu thông tin đơn vị";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        try {
            const response = await fetch(`/api/organizations?id=${id}`, {
                method: "DELETE",
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to delete organization"
                );
            }

            toast({
                title: "Thành công",
                description: `Đã xóa đơn vị "${name}"`,
            });

            fetchOrganizations();
        } catch (error: unknown) {
            console.error("Error deleting organization:", error);
            const deleteErrorMessage =
                error instanceof Error ? error.message : "Không thể xóa đơn vị";
            toast({
                title: "Lỗi",
                description: deleteErrorMessage,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <Toaster />

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý Đơn vị
                    </h1>
                    <p className="text-sm text-gray-600">
                        Quản lý các đơn vị/phòng ban trong hệ thống
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Thêm Đơn vị
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingOrg ? "Sửa đơn vị" : "Thêm đơn vị mới"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingOrg
                                    ? "Cập nhật thông tin đơn vị"
                                    : "Tạo một đơn vị/phòng ban mới trong hệ thống"}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên đơn vị *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Nhập tên đơn vị"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Mô tả</Label>
                                    <RichTextEditor
                                        value={formData.description}
                                        onChange={(value) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                description: value,
                                            }))
                                        }
                                        placeholder="Mô tả về đơn vị (tùy chọn)"
                                        minHeight="min-h-24"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCloseDialog}
                                >
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting
                                        ? "Đang lưu..."
                                        : editingOrg
                                        ? "Cập nhật"
                                        : "Tạo mới"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Tìm kiếm đơn vị..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-md"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <Button
                                variant={statusFilter === "all" ? "default" : "outline"}
                                onClick={() => setStatusFilter("all")}
                                size="sm"
                            >
                                Tất cả
                            </Button>
                            <Button
                                variant={statusFilter === "active" ? "default" : "outline"}
                                onClick={() => setStatusFilter("active")}
                                size="sm"
                            >
                                Hoạt động
                            </Button>
                            <Button
                                variant={statusFilter === "inactive" ? "default" : "outline"}
                                onClick={() => setStatusFilter("inactive")}
                                size="sm"
                            >
                                Ngừng hoạt động
                            </Button>
                            <Button
                                variant={statusFilter === "pending" ? "default" : "outline"}
                                onClick={() => setStatusFilter("pending")}
                                size="sm"
                            >
                                Chờ xử lý
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Organizations Table */}
            <div className="bg-white shadow-sm rounded-lg border">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">
                        Danh sách đơn vị ({filteredOrgs.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredOrgs.length === 0 ? (
                    <div className="text-center py-12">
                        <Building className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {organizations.length === 0 ? "Chưa có đơn vị nào" : "Không tìm thấy đơn vị"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {organizations.length === 0
                                ? "Bắt đầu bằng cách tạo đơn vị đầu tiên."
                                : "Thử thay đổi bộ lọc hoặc tìm kiếm."}
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên đơn vị</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Admin phụ trách</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="text-right">
                                    Thao tác
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrgs.map((org) => (
                                <TableRow
                                    key={org.id}
                                    className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => router.push(`/organizations/${org.id}`)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center space-x-2">
                                            <Building className="h-4 w-4 text-gray-400" />
                                            <span>{org.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {org.status === "active" ? (
                                            <Badge variant="default">Hoạt động</Badge>
                                        ) : org.status === "inactive" ? (
                                            <Badge variant="secondary">Ngừng hoạt động</Badge>
                                        ) : (
                                            <Badge variant="destructive">Chờ xử lý</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {org.assigned_admin?.full_name || (
                                            <span className="text-gray-400 italic">Chưa phân công</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(org.created_at).toLocaleDateString("vi-VN")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenDialog(org);
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Xác nhận xóa
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Bạn có chắc chắn
                                                            muốn xóa đơn vị{" "}
                                                            <strong>
                                                                &quot;{org.name}&quot;
                                                            </strong>
                                                            ? Hành động này
                                                            không thể hoàn tác.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                                                            Hủy
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(org.id, org.name);
                                                            }}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Xóa
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
