"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, User, Clock } from "lucide-react";

interface JiraInfoProps {
    jiraLink: string;
}

interface JiraIssue {
    key: string;
    fields: {
        summary: string;
        status: {
            name: string;
            statusCategory: {
                colorName: string;
            };
        };
        assignee: {
            displayName: string;
            avatarUrls: {
                "24x24": string;
            };
        } | null;
        updated: string;
    };
}

export default function JiraInfo({ jiraLink }: JiraInfoProps) {
    const [jiraIssue, setJiraIssue] = useState<JiraIssue | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Extract JIRA key from link
    const extractJiraKey = (link: string): string | null => {
        const match = link.match(/\/browse\/([A-Z]+-\d+)/);
        return match ? match[1] : null;
    };

    const jiraKey = extractJiraKey(jiraLink);

    useEffect(() => {
        if (!jiraKey) {
            setError("Không thể trích xuất JIRA key từ link");
            setLoading(false);
            return;
        }

        const fetchJiraIssue = async () => {
            try {
                const response = await fetch(`/api/jira/issue/${jiraKey}`);
                if (!response.ok) {
                    throw new Error("Không thể tải thông tin JIRA");
                }
                const data = await response.json();
                setJiraIssue(data);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Lỗi không xác định"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchJiraIssue();
    }, [jiraKey]);

    if (!jiraKey) {
        return null;
    }

    if (loading) {
        return (
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-sm text-gray-600">
                            Đang tải thông tin JIRA...
                        </span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !jiraIssue) {
        return (
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-gray-100">
                                {jiraKey}
                            </Badge>
                            <span className="text-sm text-gray-600">
                                Không thể tải thông tin
                            </span>
                        </div>
                        <a
                            href={jiraLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Xem trên JIRA
                        </a>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getStatusColor = (statusName: string) => {
        switch (statusName.toLowerCase()) {
            case "done":
            case "closed":
            case "resolved":
                return "bg-green-100 text-green-800 border-green-200";
            case "in progress":
            case "in review":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "to do":
            case "open":
            case "backlog":
                return "bg-gray-100 text-gray-800 border-gray-200";
            default:
                return "bg-blue-100 text-blue-800 border-blue-200";
        }
    };

    return (
        <Card className="mb-6">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 border-blue-200 font-mono"
                        >
                            {jiraIssue.key}
                        </Badge>
                        <span className="text-sm text-gray-600">•</span>
                        <Badge
                            variant="outline"
                            className={getStatusColor(
                                jiraIssue.fields.status.name
                            )}
                        >
                            {jiraIssue.fields.status.name}
                        </Badge>
                    </div>
                    <a
                        href={jiraLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Xem trên JIRA
                    </a>
                </div>

                {/* Issue Title */}
                <div className="mb-3">
                    <h3 className="text-base font-medium text-gray-900">
                        {jiraIssue.fields.summary}
                    </h3>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {jiraIssue.fields.assignee ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <img
                                        src={
                                            jiraIssue.fields.assignee
                                                .avatarUrls["24x24"]
                                        }
                                        alt={
                                            jiraIssue.fields.assignee
                                                .displayName
                                        }
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <span className="text-sm text-gray-700">
                                        {jiraIssue.fields.assignee.displayName}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                                <User className="w-4 h-4" />
                                <span className="text-sm">Chưa phân công</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                            Cập nhật:{" "}
                            {new Date(
                                jiraIssue.fields.updated
                            ).toLocaleDateString("vi-VN")}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
