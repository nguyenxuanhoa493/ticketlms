"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
    Bell,
    CheckCircle,
    Clock,
    AlertCircle,
    MessageCircle,
    Eye,
    EyeOff,
    Trash2,
    Calendar,
    User,
    Building,
} from "lucide-react";

interface Notification {
    id: string;
    type: "ticket_status_changed" | "ticket_commented" | "comment_replied";
    title: string;
    message: string;
    is_read: boolean;
    ticket_id: string | null;
    comment_id: string | null;
    created_at: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                ...(filter === "unread" && { unread_only: "true" }),
                limit: "100",
            });

            const response = await fetch(`/api/notifications?${params}`);
            const data = await response.json();

            if (response.ok) {
                setNotifications(data.notifications || []);
            } else {
                toast({
                    title: "Lỗi",
                    description: "Không thể tải thông báo",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tải thông báo",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            setActionLoading(notificationId);
            const response = await fetch(
                `/api/notifications/${notificationId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ is_read: true }),
                }
            );

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notificationId ? { ...n, is_read: true } : n
                    )
                );
                toast({
                    title: "Thành công",
                    description: "Đã đánh dấu đã đọc",
                });
            } else {
                throw new Error("Failed to mark as read");
            }
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể đánh dấu đã đọc",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const markAllAsRead = async () => {
        try {
            setActionLoading("mark-all");
            const response = await fetch("/api/notifications/mark-all-read", {
                method: "POST",
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, is_read: true }))
                );
                toast({
                    title: "Thành công",
                    description: "Đã đánh dấu tất cả đã đọc",
                });
            } else {
                throw new Error("Failed to mark all as read");
            }
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể đánh dấu tất cả đã đọc",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            setActionLoading(notificationId);
            const response = await fetch(
                `/api/notifications/${notificationId}`,
                {
                    method: "DELETE",
                }
            );

            if (response.ok) {
                setNotifications((prev) =>
                    prev.filter((n) => n.id !== notificationId)
                );
                toast({
                    title: "Thành công",
                    description: "Đã xóa thông báo",
                });
            } else {
                throw new Error("Failed to delete notification");
            }
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể xóa thông báo",
                variant: "destructive",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const navigateToTicket = async (
        notificationId: string,
        ticketId: string | null
    ) => {
        if (ticketId) {
            // Mark as read when navigating
            await markAsRead(notificationId);
            router.push(`/tickets/${ticketId}`);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "ticket_status_changed":
                return "🔄";
            case "ticket_commented":
                return "💬";
            case "comment_replied":
                return "↩️";
            default:
                return "🔔";
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 1) return "Vừa xong";
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        if (diffInMinutes < 1440)
            return `${Math.floor(diffInMinutes / 60)} giờ trước`;
        return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    };

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                            <Bell className="h-6 w-6" />
                            <span>Thông báo</span>
                        </h1>
                        <p className="text-sm text-gray-600">
                            {unreadCount > 0 &&
                                `${unreadCount} thông báo chưa đọc`}
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={markAllAsRead}
                                disabled={actionLoading === "mark-all"}
                                className="flex items-center space-x-2"
                            >
                                <CheckCircle className="h-4 w-4" />
                                <span>Đánh dấu tất cả đã đọc</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter */}
                <div className="mb-6 flex space-x-2">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        onClick={() => setFilter("all")}
                        size="sm"
                    >
                        Tất cả ({notifications.length})
                    </Button>
                    <Button
                        variant={filter === "unread" ? "default" : "outline"}
                        onClick={() => setFilter("unread")}
                        size="sm"
                    >
                        Chưa đọc ({unreadCount})
                    </Button>
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : notifications.length === 0 ? (
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Không có thông báo
                            </h3>
                            <p className="text-gray-600">
                                {filter === "unread"
                                    ? "Bạn đã đọc tất cả thông báo"
                                    : "Chưa có thông báo nào được gửi"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <Card
                                key={notification.id}
                                className={`transition-all duration-200 hover:shadow-md ${
                                    !notification.is_read
                                        ? "border-l-4 border-l-blue-500 bg-blue-50"
                                        : ""
                                }`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <span className="text-xl">
                                                {getNotificationIcon(
                                                    notification.type
                                                )}
                                            </span>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">
                                                    {notification.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatTimeAgo(
                                                        notification.created_at
                                                    )}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-blue-100 text-blue-800"
                                                >
                                                    Mới
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-1 ml-4">
                                            {notification.ticket_id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        navigateToTicket(
                                                            notification.id,
                                                            notification.ticket_id
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 h-8 w-8 p-0"
                                                    title="Xem ticket"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}

                                            {!notification.is_read && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        markAsRead(
                                                            notification.id
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading ===
                                                        notification.id
                                                    }
                                                    className="text-gray-600 hover:text-gray-800 h-8 w-8 p-0"
                                                    title="Đánh dấu đã đọc"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    deleteNotification(
                                                        notification.id
                                                    )
                                                }
                                                disabled={
                                                    actionLoading ===
                                                    notification.id
                                                }
                                                className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                                                title="Xóa thông báo"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
            <Toaster />
        </div>
    );
}
