"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Activity, Clock } from "lucide-react";
import { Database } from "@/types/database";

type OrganizationActivity = Database["public"]["Tables"]["organization_activities"]["Row"];

interface ActivityWithUser extends OrganizationActivity {
    user?: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

interface Props {
    organizationId: string;
}

export default function OrganizationActivities({ organizationId }: Props) {
    const { toast } = useToast();
    const [activities, setActivities] = useState<ActivityWithUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActivities();
    }, [organizationId]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/organizations/${organizationId}/activities`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch activities");
            }

            setActivities(data.activities || []);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed to load activities";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: string) => {
        const icons: Record<string, React.ReactNode> = {
            created: "🎉",
            updated: "✏️",
            status_changed: "🔄",
            admin_assigned: "👤",
            note_added: "📝",
            todo_added: "✅",
            todo_completed: "🎯",
            custom: "📌",
        };
        return icons[type] || "•";
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Lịch sử hoạt động</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Chưa có hoạt động nào</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex space-x-4 pb-4 border-b last:border-b-0"
                            >
                                <div className="flex-shrink-0 text-2xl">
                                    {getActivityIcon(activity.activity_type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{activity.title}</p>
                                            {activity.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {activity.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDate(activity.created_at)}</span>
                                        {activity.user?.full_name && (
                                            <>
                                                <span>•</span>
                                                <span>{activity.user.full_name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
