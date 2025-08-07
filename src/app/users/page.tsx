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
import {
    Plus,
    Search,
    Edit,
    Trash2,
    User,
    Building,
    Shield,
    Filter,
    X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Organization {
    id: string;
    name: string;
}

interface User {
    id: string;
    full_name: string | null;
    role: "admin" | "manager" | "user";
    organization_id: string | null;
    created_at: string;
    updated_at: string;
    email?: string;
    avatar_url?: string | null;
    organizations?: Organization;
}

interface CurrentUser {
    id: string;
    email: string;
    role: "admin" | "manager" | "user";
    organization_id: string | null;
    full_name: string | null;
    organizations?: Organization;
}

interface UserFormData {
    email: string;
    full_name: string;
    role: "admin" | "manager" | "user";
    organization_id: string;
    password: string;
}

interface FilterState {
    search: string;
    role: string;
    organization: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(
        null
    );
    const [formData, setFormData] = useState<UserFormData>({
        email: "",
        full_name: "",
        role: "user",
        organization_id: "",
        password: "",
    });
    const [newPassword, setNewPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        search: "",
        role: "",
        organization: "all",
    });
    const [showFilters, setShowFilters] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchCurrentUser();
        fetchUsers();
        fetchOrganizations();
    }, []);

    // Filter users whenever users or filters change
    useEffect(() => {
        let filtered = [...users];

        // Search filter
        if (filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(
                (user) =>
                    user.full_name?.toLowerCase().includes(searchTerm) ||
                    user.email?.toLowerCase().includes(searchTerm)
            );
        }

        // Organization filter (only for admin)
        if (
            currentUser?.role === "admin" &&
            filters.organization &&
            filters.organization !== "all"
        ) {
            if (filters.organization === "none") {
                filtered = filtered.filter((user) => !user.organization_id);
            } else {
                filtered = filtered.filter(
                    (user) => user.organization_id === filters.organization
                );
            }
        }

        setFilteredUsers(filtered);
    }, [users, filters.search, filters.organization]);

    const clearFilters = () => {
        setFilters({
            search: "",
            role: "",
            organization: "all",
        });
    };

    const hasActiveFilters = () => {
        const hasSearchFilter = filters.search.trim() !== "";
        const hasOrgFilter =
            currentUser?.role === "admin" &&
            filters.organization !== "" &&
            filters.organization !== "all";

        return hasSearchFilter || hasOrgFilter;
    };

    const fetchCurrentUser = async () => {
        try {
            const response = await fetch("/api/current-user");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch current user");
            }

            setCurrentUser(data); // Fix: API returns data directly, not data.user
        } catch (error: unknown) {
            toast({
                title: "Lỗi",
                description: "Không thể lấy thông tin người dùng hiện tại",
                variant: "destructive",
            });
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);

            const response = await fetch("/api/users");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch users");
            }

            setUsers(data.users);
        } catch (error: any) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to fetch users";
            toast({
                title: "Lỗi",
                description:
                    error.message || "Không thể tải danh sách người dùng",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const { data, error } = await supabase
                .from("organizations")
                .select("id, name")
                .order("name");

            if (error) throw error;
            setOrganizations(data || []);
        } catch (error) {
            // Silent error handling
        }
    };

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                email: user.email || "",
                full_name: user.full_name || "",
                role: user.role,
                organization_id: user.organization_id || "",
                password: "", // Don't show existing password
            });
        } else {
            setEditingUser(null);
            // Nếu manager tạo user mới, tự động set organization và role
            const defaultOrgId =
                currentUser?.role === "manager"
                    ? currentUser.organization_id || ""
                    : "";
            setFormData({
                email: "",
                full_name: "",
                role: "user", // Manager chỉ có thể tạo user thường
                organization_id: defaultOrgId,
                password: "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingUser(null);
        setFormData({
            email: "",
            full_name: "",
            role: "user",
            organization_id: "",
            password: "",
        });
    };

    const handleOpenResetPassword = (user: User) => {
        setResetPasswordUser(user);
        setNewPassword("");
        setIsResetPasswordOpen(true);
    };

    const handleCloseResetPassword = () => {
        setIsResetPasswordOpen(false);
        setResetPasswordUser(null);
        setNewPassword("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email.trim() || !formData.full_name.trim()) {
            toast({
                title: "Lỗi",
                description: "Email và họ tên không được để trống",
                variant: "destructive",
            });
            return;
        }

        if (!editingUser && !formData.password.trim()) {
            toast({
                title: "Lỗi",
                description:
                    "Mật khẩu không được để trống khi tạo người dùng mới",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);

            if (editingUser) {
                // Update existing user
                const response = await fetch("/api/users", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: editingUser.id,
                        email: formData.email,
                        password: formData.password || undefined,
                        full_name: formData.full_name,
                        role: formData.role,
                        organization_id: formData.organization_id || null,
                    }),
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || "Failed to update user");
                }

                toast({
                    title: "Thành công",
                    description: "Đã cập nhật thông tin người dùng",
                });
            } else {
                // Create new user
                const response = await fetch("/api/users", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                        full_name: formData.full_name,
                        role: formData.role,
                        organization_id: formData.organization_id || null,
                    }),
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || "Failed to create user");
                }

                toast({
                    title: "Thành công",
                    description: "Đã tạo người dùng mới",
                });
            }

            handleCloseDialog();
            fetchUsers();
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description:
                    error.message || "Không thể lưu thông tin người dùng",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập mật khẩu mới",
                variant: "destructive",
            });
            return;
        }

        if (!resetPasswordUser) return;

        try {
            setSubmitting(true);

            const response = await fetch("/api/users/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: resetPasswordUser.id,
                    newPassword: newPassword,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to reset password");
            }

            toast({
                title: "Thành công",
                description: `Đã reset mật khẩu cho ${resetPasswordUser.full_name}`,
            });

            handleCloseResetPassword();
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể reset mật khẩu",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        try {
            const response = await fetch(`/api/users?id=${id}`, {
                method: "DELETE",
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to delete user");
            }

            toast({
                title: "Thành công",
                description: `Đã xóa người dùng "${name}"`,
            });

            fetchUsers();
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể xóa người dùng",
                variant: "destructive",
            });
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "admin":
                return "destructive";
            case "manager":
                return "default";
            case "user":
                return "secondary";
            default:
                return "secondary";
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case "admin":
                return "Quản trị viên";
            case "manager":
                return "Quản lý";
            case "user":
                return "Người dùng";
            default:
                return role;
        }
    };

    return (
        <div className="space-y-6">
            <Toaster />

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý Người dùng
                    </h1>
                    <p className="text-sm text-gray-600">
                        Quản lý tài khoản người dùng trong hệ thống
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
                            Thêm Người dùng
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingUser
                                    ? "Sửa thông tin người dùng"
                                    : "Thêm người dùng mới"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingUser
                                    ? "Cập nhật thông tin người dùng"
                                    : "Tạo tài khoản người dùng mới trong hệ thống"}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@example.com"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                email: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">
                                        Họ và tên *
                                    </Label>
                                    <Input
                                        id="full_name"
                                        placeholder="Nhập họ và tên"
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
                                {/* Role selection - chỉ admin mới có thể chọn */}
                                {currentUser?.role === "admin" ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Vai trò *</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(
                                                value:
                                                    | "admin"
                                                    | "manager"
                                                    | "user"
                                            ) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    role: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">
                                                    Người dùng
                                                </SelectItem>
                                                <SelectItem value="manager">
                                                    Quản lý
                                                </SelectItem>
                                                <SelectItem value="admin">
                                                    Quản trị viên
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Vai trò</Label>
                                        <Input
                                            value="Người dùng"
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Manager chỉ có thể tạo tài khoản
                                            người dùng thường
                                        </p>
                                    </div>
                                )}
                                {/* Organization selection - manager không thể chọn */}
                                {currentUser?.role === "admin" ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="organization">
                                            Đơn vị
                                        </Label>
                                        <Select
                                            value={
                                                formData.organization_id ||
                                                "none"
                                            }
                                            onValueChange={(value) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    organization_id:
                                                        value === "none"
                                                            ? ""
                                                            : value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn đơn vị (tùy chọn)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    Không thuộc đơn vị nào
                                                </SelectItem>
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
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="organization">
                                            Đơn vị
                                        </Label>
                                        <Input
                                            value={
                                                currentUser?.organizations
                                                    ?.name ||
                                                "Không thuộc đơn vị nào"
                                            }
                                            disabled
                                            className="bg-gray-50"
                                        />
                                        <p className="text-xs text-gray-500">
                                            User sẽ được tạo trong đơn vị của
                                            bạn
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="password">
                                        {editingUser
                                            ? "Mật khẩu mới (để trống nếu không đổi)"
                                            : "Mật khẩu *"}
                                    </Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                password: e.target.value,
                                            }))
                                        }
                                        required={!editingUser}
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
                                        : editingUser
                                          ? "Cập nhật"
                                          : "Tạo mới"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Reset Password Dialog */}
            <Dialog
                open={isResetPasswordOpen}
                onOpenChange={setIsResetPasswordOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Mật khẩu</DialogTitle>
                        <DialogDescription>
                            Đặt mật khẩu mới cho {resetPasswordUser?.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new_password">Mật khẩu mới *</Label>
                            <Input
                                id="new_password"
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseResetPassword}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleResetPassword}
                            disabled={submitting}
                        >
                            {submitting ? "Đang cập nhật..." : "Reset Mật khẩu"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Users Table */}
            <div className="bg-white shadow-sm rounded-lg border">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">
                                Danh sách người dùng ({filteredUsers.length}/
                                {users.length})
                            </h2>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Tìm kiếm theo tên hoặc email..."
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            search: e.target.value,
                                        }))
                                    }
                                    className="pl-10"
                                />
                            </div>
                            {currentUser?.role === "admin" && (
                                <Select
                                    value={filters.organization}
                                    onValueChange={(value) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            organization: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger className="w-full sm:w-48">
                                        <SelectValue placeholder="Tất cả đơn vị" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Tất cả đơn vị
                                        </SelectItem>
                                        <SelectItem value="none">
                                            Không thuộc đơn vị nào
                                        </SelectItem>
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
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                            />
                            <circle cx="9" cy="7" r="4" />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M23 21v-2a4 4 0 00-3-3.87"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 3.13a4 4 0 010 7.75"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            Chưa có người dùng nào
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Bắt đầu bằng cách tạo người dùng đầu tiên.
                        </p>
                    </div>
                ) : filteredUsers.length === 0 && hasActiveFilters() ? (
                    <div className="text-center py-12">
                        <Search className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            Không tìm thấy kết quả
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {currentUser?.role === "admin"
                                ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc đơn vị."
                                : "Thử thay đổi từ khóa tìm kiếm."}
                        </p>
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="mt-4"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Xóa bộ lọc
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Vai trò</TableHead>
                                <TableHead>Đơn vị</TableHead>
                                <TableHead>Ngày tạo</TableHead>
                                <TableHead className="text-right">
                                    Thao tác
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 overflow-hidden">
                                                {user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt={
                                                            user.full_name ||
                                                            "User"
                                                        }
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    user.full_name?.charAt(0) ||
                                                    "U"
                                                )}
                                            </div>
                                            <span>
                                                {user.full_name ||
                                                    "Chưa có tên"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getRoleBadgeVariant(
                                                user.role
                                            )}
                                        >
                                            {getRoleLabel(user.role)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.organizations?.name ? (
                                            <span className="text-gray-600">
                                                {user.organizations.name}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">
                                                Chưa phân đơn vị
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            user.created_at
                                        ).toLocaleDateString("vi-VN")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleOpenDialog(user)
                                                }
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                    />
                                                </svg>
                                                Sửa
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleOpenResetPassword(
                                                        user
                                                    )
                                                }
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                                                    />
                                                </svg>
                                                Đổi mật khẩu
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                        Xóa
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Xác nhận xóa
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Bạn có chắc chắn
                                                            muốn xóa người dùng{" "}
                                                            <strong>
                                                                "
                                                                {user.full_name}
                                                                "
                                                            </strong>
                                                            ? Hành động này
                                                            không thể hoàn tác
                                                            và sẽ xóa vĩnh viễn
                                                            tài khoản.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Hủy
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() =>
                                                                handleDelete(
                                                                    user.id,
                                                                    user.full_name ||
                                                                        user.email ||
                                                                        "Unknown"
                                                                )
                                                            }
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
