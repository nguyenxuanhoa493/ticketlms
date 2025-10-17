"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Plus, Edit, Trash2, Server } from "lucide-react";
import { ApiEnvironment, ApiEnvironmentFormData } from "@/types";

export default function EnvironmentsPage() {
    const [environments, setEnvironments] = useState<ApiEnvironment[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingEnv, setEditingEnv] = useState<ApiEnvironment | null>(null);
    const [envToDelete, setEnvToDelete] = useState<{ id: string; name: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<ApiEnvironmentFormData>({
        name: "",
        host: "",
        pass_master: "",
        pass_root: "",
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchEnvironments();
    }, []);

    const fetchEnvironments = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/tools/environments");
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to fetch environments");
            }

            setEnvironments(result.data || []);
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể tải danh sách môi trường",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (env?: ApiEnvironment) => {
        if (env) {
            setEditingEnv(env);
            setFormData({
                name: env.name,
                host: env.host,
                pass_master: "", // Don't populate encrypted passwords
                pass_root: "",
            });
        } else {
            setEditingEnv(null);
            setFormData({
                name: "",
                host: "",
                pass_master: "",
                pass_root: "",
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingEnv(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSubmitting(true);

            const url = editingEnv
                ? "/api/tools/environments"
                : "/api/tools/environments";

            const method = editingEnv ? "PUT" : "POST";

            const body = editingEnv
                ? { id: editingEnv.id, ...formData }
                : formData;

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to save environment");
            }

            toast({
                title: "Thành công",
                description: editingEnv
                    ? "Đã cập nhật môi trường"
                    : "Đã tạo môi trường mới",
            });

            handleCloseDialog();
            fetchEnvironments();
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể lưu môi trường",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        setEnvToDelete({ id, name });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!envToDelete) return;

        try {
            const response = await fetch(`/api/tools/environments?id=${envToDelete.id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to delete environment");
            }

            toast({
                title: "Thành công",
                description: `Đã xóa môi trường "${envToDelete.name}"`,
            });

            setDeleteDialogOpen(false);
            setEnvToDelete(null);
            fetchEnvironments();
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể xóa môi trường",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toaster />

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Cấu hình Môi trường
                    </h1>
                    <p className="text-sm text-gray-600">
                        Quản lý các môi trường API cho automation tools
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Môi trường
                </Button>
            </div>

            {/* Environments Grid */}
            {environments.length === 0 ? (
                <Card className="border-dashed border-2">
                    <CardContent className="py-16">
                        <div className="text-center">
                            <Server className="mx-auto h-16 w-16 text-gray-400" />
                            <h3 className="mt-4 text-lg font-medium text-gray-900">
                                Chưa có môi trường nào
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                                Bắt đầu bằng cách tạo môi trường đầu tiên để quản lý API configurations.
                            </p>
                            <Button onClick={() => handleOpenDialog()} className="mt-6">
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo môi trường đầu tiên
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {environments.map((env) => (
                        <Card key={env.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Server className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        <CardTitle className="text-base truncate">
                                            {env.name}
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleOpenDialog(env)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(env.id, env.name)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Host */}
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Host</p>
                                    <p className="text-xs font-mono bg-gray-50 px-2 py-1.5 rounded truncate">
                                        {env.host}
                                    </p>
                                </div>

                                {/* Credentials Status */}
                                <div className="flex items-center gap-3 pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${env.pass_master ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span className="text-xs text-gray-600">
                                            Master {env.pass_master ? '✓' : '✗'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${env.pass_root ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span className="text-xs text-gray-600">
                                            Root {env.pass_root ? '✓' : '✗'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEnv ? "Sửa môi trường" : "Thêm môi trường mới"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingEnv
                                ? "Cập nhật thông tin môi trường"
                                : "Tạo môi trường mới cho automation tools"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="name">Tên môi trường *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        placeholder="Production, Staging, Development..."
                                        required
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="host">Host *</Label>
                                    <Input
                                        id="host"
                                        type="url"
                                        value={formData.host}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                host: e.target.value,
                                            }))
                                        }
                                        placeholder="https://api.example.com"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pass_master">Pass Master</Label>
                                    <Input
                                        id="pass_master"
                                        type="password"
                                        value={formData.pass_master}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                pass_master: e.target.value,
                                            }))
                                        }
                                        placeholder={editingEnv ? "Để trống nếu không đổi" : "••••••••"}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pass_root">Pass Root</Label>
                                    <Input
                                        id="pass_root"
                                        type="password"
                                        value={formData.pass_root}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                pass_root: e.target.value,
                                            }))
                                        }
                                        placeholder={editingEnv ? "Để trống nếu không đổi" : "••••••••"}
                                    />
                                </div>
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
                                    : editingEnv
                                    ? "Cập nhật"
                                    : "Tạo mới"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa môi trường{" "}
                            <strong>"{envToDelete?.name}"</strong>? Hành động này không
                            thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
