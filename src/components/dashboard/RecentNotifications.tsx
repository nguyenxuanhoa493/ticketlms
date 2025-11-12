"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "ticket_status_changed" | "ticket_commented" | "comment_replied";
    is_read: boolean;
    created_at: string;
    ticket_id: string | null;
}

interface RecentNotificationsProps {
    notifications: Notification[];
}

export function RecentNotifications({ notifications }: RecentNotificationsProps) {
    const router = useRouter();

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

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.ticket_id) return;

        // Mark as read
        try {
            await fetch(`/api/notifications/${notification.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_read: true }),
            });
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }

        // Navigate to ticket
        router.push(`/tickets/${notification.ticket_id}`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Thông Báo Gần Đây</CardTitle>
                <CardDescription>
                    5 thông báo mới nhất của bạn
                </CardDescription>
            </CardHeader>
            <CardContent>
                {notifications && notifications.length > 0 ? (
                    <div className="space-y-2">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0 px-2 -mx-2 rounded transition-colors ${
                                    notification.ticket_id ? "cursor-pointer" : ""
                                } ${
                                    notification.is_read
                                        ? "hover:bg-gray-50"
                                        : "bg-blue-50 hover:bg-blue-100"
                                }`}
                            >
                                <span className="text-xl flex-shrink-0">
                                    {getNotificationIcon(notification.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                            {notification.title}
                                        </span>
                                        {!notification.is_read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <div 
                                            className="truncate notification-message"
                                            dangerouslySetInnerHTML={{ __html: notification.message }}
                                        />
                                        <span>•</span>
                                        <span className="flex-shrink-0">
                                            {new Date(
                                                notification.created_at
                                            ).toLocaleDateString(
                                                "vi-VN"
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
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
                                d="M15 17h5l-5 5v-5zM4 19h6a2 2 0 002-2V5a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            Chưa có thông báo
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Thông báo sẽ xuất hiện ở đây.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 