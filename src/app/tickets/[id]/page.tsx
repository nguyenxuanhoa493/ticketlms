"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import RichTextEditor from "@/components/RichTextEditor";
import HtmlContent from "@/components/HtmlContent";
import {
    ArrowLeft,
    Save,
    MessageCircle,
    Send,
    Edit,
    Trash2,
    Reply,
    Check,
    X,
    Eye,
} from "lucide-react";

interface Ticket {
    id: string;
    title: string;
    description: string | null;
    ticket_type: "bug" | "task";
    status: "open" | "in_progress" | "closed";
    priority: "low" | "medium" | "high";
    platform: "web" | "app" | "all";
    organization_id: string;
    expected_completion_date: string | null;
    closed_at: string | null;
    created_at: string;
    updated_at: string;
    organizations?: {
        id: string;
        name: string;
    };
    created_user?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

interface Organization {
    id: string;
    name: string;
}

interface CurrentUser {
    id: string;
    role: "admin" | "manager" | "user";
    organization_id: string | null;
}

interface Comment {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    parent_id: string | null;
    user: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
    replies?: Comment[];
}

export default function TicketDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const ticketId = params?.id as string;

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [editingComment, setEditingComment] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // Format time ago function
    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 1) return "Vừa xong";
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} giờ trước`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} ngày trước`;

        return date.toLocaleDateString("vi-VN");
    };

    // Form data
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        ticket_type: "task" as "bug" | "task",
        status: "open" as "open" | "in_progress" | "closed",
        priority: "medium" as "low" | "medium" | "high",
        organization_id: "",
        expected_completion_date: "",
        closed_at: "",
    });

    useEffect(() => {
        if (ticketId) {
            fetchTicket();
            fetchOrganizations();
            fetchCurrentUser();
            fetchComments();
        }
    }, [ticketId]);

    const fetchTicket = async () => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch ticket");
            }

            const ticketData = data.ticket;
            setTicket(ticketData);

            // Populate form
            setFormData({
                title: ticketData.title || "",
                description: ticketData.description || "",
                ticket_type: ticketData.ticket_type || "task",
                status: ticketData.status || "open",
                priority: ticketData.priority || "medium",
                organization_id: ticketData.organization_id || "",
                expected_completion_date:
                    ticketData.expected_completion_date || "",
                closed_at: formatDateTimeForDisplay(ticketData.closed_at || ""),
            });
        } catch (error: unknown) {
            console.error("Error fetching ticket:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Không thể tải thông tin ticket";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        try {
            const response = await fetch("/api/organizations");
            const data = await response.json();
            if (response.ok) {
                setOrganizations(data.organizations || []);
            }
        } catch (error) {
            console.error("Error fetching organizations:", error);
            setOrganizations([]);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const response = await fetch("/api/current-user");
            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data); // Fix: API returns data directly, not data.user
            }
        } catch (error) {
            console.error("Error getting current user:", error);
        }
    };

    const fetchComments = async () => {
        try {
            console.log(`Fetching comments for ticket ${ticketId}`);
            const response = await fetch(`/api/tickets/${ticketId}/comments`);
            const data = await response.json();

            console.log("Comments API response:", {
                status: response.status,
                ok: response.ok,
                dataKeys: Object.keys(data),
                commentsCount: data.comments?.length || 0,
                sampleComment: data.comments?.[0],
            });

            if (response.ok) {
                // Organize comments into nested structure
                const organized = organizeComments(data.comments);
                console.log(`Organized ${organized.length} root comments`);
                setComments(organized);
            } else {
                console.error("Error fetching comments:", data.error);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    const organizeComments = (flatComments: Comment[]): Comment[] => {
        const commentMap = new Map<string, Comment>();
        const rootComments: Comment[] = [];

        // First pass: create all comments with empty replies arrays
        flatComments.forEach((comment) => {
            commentMap.set(comment.id, { ...comment, replies: [] });
        });

        // Second pass: organize into parent-child relationships
        flatComments.forEach((comment) => {
            const commentWithReplies = commentMap.get(comment.id)!;

            if (comment.parent_id) {
                // This is a reply
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.replies!.push(commentWithReplies);
                }
            } else {
                // This is a root comment
                rootComments.push(commentWithReplies);
            }
        });

        return rootComments;
    };

    // Helper functions for ticket type display
    const getTicketTypeIcon = (type: string) => {
        switch (type) {
            case "bug":
                return (
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                );
            case "task":
                return (
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getTicketTypeBadgeVariant = (type: string) => {
        switch (type) {
            case "bug":
                return "destructive" as const;
            case "task":
                return "outline" as const;
            default:
                return "outline" as const;
        }
    };

    const getTicketTypeLabel = (type: string) => {
        switch (type) {
            case "bug":
                return "Bug";
            case "task":
                return "Task";
            default:
                return "Unknown";
        }
    };

    const handleAddComment = async (e: React.FormEvent, parentId?: string) => {
        e.preventDefault();

        const content = parentId ? replyContent : newComment;
        // Strip HTML tags for validation but keep original content for saving
        const textContent = content.replace(/<[^>]*>/g, "").trim();
        if (!textContent) {
            toast({
                title: "Lỗi",
                description: "Nội dung comment không được để trống",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmittingComment(true);

            console.log("Creating comment:", {
                ticketId,
                parentId: parentId || null,
                contentLength: content.length,
            });

            const response = await fetch(`/api/tickets/${ticketId}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: content,
                    parent_id: parentId || null,
                }),
            });

            const result = await response.json();
            console.log("Create comment response:", {
                status: response.status,
                ok: response.ok,
                result,
            });

            if (!response.ok) {
                throw new Error(result.error || "Failed to add comment");
            }

            // Refresh comments to get updated nested structure
            console.log("Refreshing comments after creation...");
            await fetchComments();

            if (parentId) {
                setReplyContent("");
                setReplyingTo(null);
            } else {
                setNewComment("");
            }

            toast({
                title: "Thành công",
                description: parentId ? "Đã thêm trả lời" : "Đã thêm comment",
            });
        } catch (error: any) {
            console.error("Error adding comment:", error);
            toast({
                title: "Lỗi",
                description: error.message || "Không thể thêm comment",
                variant: "destructive",
            });
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleEditComment = async (commentId: string) => {
        if (!editContent.trim()) {
            toast({
                title: "Lỗi",
                description: "Nội dung comment không được để trống",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch(
                `/api/tickets/${ticketId}/comments/${commentId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: editContent,
                    }),
                }
            );

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to update comment");
            }

            // Refresh comments
            await fetchComments();
            setEditingComment(null);
            setEditContent("");

            toast({
                title: "Thành công",
                description: "Đã cập nhật comment",
            });
        } catch (error: any) {
            console.error("Error updating comment:", error);
            toast({
                title: "Lỗi",
                description: error.message || "Không thể cập nhật comment",
                variant: "destructive",
            });
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa comment này?")) {
            return;
        }

        try {
            const response = await fetch(
                `/api/tickets/${ticketId}/comments/${commentId}`,
                {
                    method: "DELETE",
                }
            );

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to delete comment");
            }

            // Refresh comments
            await fetchComments();

            toast({
                title: "Thành công",
                description: "Đã xóa comment",
            });
        } catch (error: any) {
            console.error("Error deleting comment:", error);
            toast({
                title: "Lỗi",
                description: error.message || "Không thể xóa comment",
                variant: "destructive",
            });
        }
    };

    const startEdit = (comment: Comment) => {
        setEditingComment(comment.id);
        setEditContent(comment.content);
    };

    const cancelEdit = () => {
        setEditingComment(null);
        setEditContent("");
    };

    const startReply = (commentId: string) => {
        setReplyingTo(commentId);
        setReplyContent("");
    };

    const cancelReply = () => {
        setReplyingTo(null);
        setReplyContent("");
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleSave = async (e: React.FormEvent) => {
        await handleSubmit(e);
        setIsEditing(false);
    };

    const handleCancel = () => {
        // Reset form to original values
        if (ticket) {
            setFormData({
                title: ticket.title,
                description: ticket.description || "",
                ticket_type: ticket.ticket_type,
                status: ticket.status,
                priority: ticket.priority,
                organization_id: ticket.organization_id,
                expected_completion_date: ticket.expected_completion_date
                    ? ticket.expected_completion_date.split("T")[0]
                    : "",
                closed_at: ticket.closed_at
                    ? formatDateTimeForDisplay(ticket.closed_at)
                    : "",
            });
        }
        setIsEditing(false);
    };

    const renderComment = (
        comment: Comment,
        depth: number = 0
    ): React.ReactNode => {
        const isOwner = currentUser?.id === comment.user_id;
        const canEdit = isOwner || currentUser?.role === "admin";
        const canDelete = isOwner || currentUser?.role === "admin";
        const maxDepth = 3; // Limit nesting depth

        return (
            <div key={comment.id} className={`${depth > 0 ? "ml-4 mt-3" : ""}`}>
                <div className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded-r-lg">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 overflow-hidden">
                            {comment.user.avatar_url ? (
                                <img
                                    src={comment.user.avatar_url}
                                    alt={comment.user.full_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                comment.user.full_name?.charAt(0) || "U"
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm text-gray-900">
                                        {comment.user.full_name ||
                                            "Unknown User"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatTimeAgo(comment.created_at)}
                                    </p>
                                    {comment.updated_at !==
                                        comment.created_at && (
                                        <p className="text-xs text-gray-400 italic">
                                            (đã chỉnh sửa)
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {depth < maxDepth && (
                                        <button
                                            onClick={() =>
                                                startReply(comment.id)
                                            }
                                            className="text-gray-500 hover:text-blue-600 p-1"
                                            title="Trả lời"
                                        >
                                            <Reply className="w-3 h-3" />
                                        </button>
                                    )}
                                    {canEdit && (
                                        <button
                                            onClick={() => startEdit(comment)}
                                            className="text-gray-500 hover:text-blue-600 p-1"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit className="w-3 h-3" />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() =>
                                                handleDeleteComment(comment.id)
                                            }
                                            className="text-gray-500 hover:text-red-600 p-1"
                                            title="Xóa"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Comment Content */}
                            {editingComment === comment.id ? (
                                <div className="space-y-2">
                                    <RichTextEditor
                                        value={editContent}
                                        onChange={setEditContent}
                                        placeholder="Chỉnh sửa comment..."
                                        minHeight="min-h-20"
                                        className="text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                handleEditComment(comment.id)
                                            }
                                        >
                                            <Check className="w-3 h-3 mr-1" />
                                            Lưu
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={cancelEdit}
                                        >
                                            <X className="w-3 h-3 mr-1" />
                                            Hủy
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="text-sm text-gray-700 break-words leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                        __html: comment.content,
                                    }}
                                />
                            )}

                            {/* Reply Form */}
                            {replyingTo === comment.id && (
                                <div className="mt-2 space-y-2">
                                    <RichTextEditor
                                        value={replyContent}
                                        onChange={setReplyContent}
                                        placeholder="Nhập trả lời của bạn..."
                                        minHeight="min-h-20"
                                        className="text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={(e) =>
                                                handleAddComment(e, comment.id)
                                            }
                                            disabled={
                                                submittingComment ||
                                                !replyContent.trim()
                                            }
                                        >
                                            <Send className="w-3 h-3 mr-1" />
                                            {submittingComment
                                                ? "Đang gửi..."
                                                : "Trả lời"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={cancelReply}
                                        >
                                            <X className="w-3 h-3 mr-1" />
                                            Hủy
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Render Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-1">
                        {comment.replies.map((reply) =>
                            renderComment(reply, depth + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Helper function to format datetime from DB for display (UTC to GMT+7)
    const formatDateTimeForDisplay = (isoString: string) => {
        if (!isoString || isoString.trim() === "") return "";

        try {
            // Parse UTC datetime from database
            const utcDate = new Date(isoString);

            // Check if date is valid
            if (isNaN(utcDate.getTime())) {
                console.warn("Invalid ISO string:", isoString);
                return "";
            }

            // Add 7 hours to convert UTC to GMT+7
            const gmt7Date = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);

            // Format for datetime-local input (use regular methods, not UTC methods)
            const year = gmt7Date.getFullYear();
            const month = String(gmt7Date.getMonth() + 1).padStart(2, "0");
            const day = String(gmt7Date.getDate()).padStart(2, "0");
            const hour = String(gmt7Date.getHours()).padStart(2, "0");
            const minute = String(gmt7Date.getMinutes()).padStart(2, "0");

            return `${year}-${month}-${day}T${hour}:${minute}`;
        } catch (error) {
            console.error(
                "Error formatting datetime for display:",
                error,
                isoString
            );
            return "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast({
                title: "Lỗi",
                description: "Tiêu đề ticket không được để trống",
                variant: "destructive",
            });
            return;
        }

        try {
            setSaving(true);

            const response = await fetch("/api/tickets", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: ticketId,
                    title: formData.title,
                    description: formData.description,
                    ticket_type: formData.ticket_type,
                    priority: formData.priority,
                    status: formData.status,
                    expected_completion_date:
                        formData.expected_completion_date || null,
                    closed_at: formData.closed_at || null,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to update ticket");
            }

            toast({
                title: "Thành công",
                description: "Đã cập nhật ticket",
            });

            // Refresh ticket data
            fetchTicket();
        } catch (error: any) {
            console.error("Error updating ticket:", error);
            toast({
                title: "Lỗi",
                description: error.message || "Không thể cập nhật ticket",
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

    if (!ticket) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Ticket không tồn tại
                    </h1>
                    <Button onClick={() => router.push("/tickets")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại danh sách
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <Toaster />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                    {/* Left Side - Ticket Form */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push("/tickets")}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Quay lại
                                    </Button>
                                    <div className="flex gap-2">
                                        {!isEditing ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleEditToggle}
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Chỉnh sửa
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleCancel}
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Hủy
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    size="sm"
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                >
                                                    <Save className="w-4 h-4 mr-2" />
                                                    {saving
                                                        ? "Đang lưu..."
                                                        : "Lưu"}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!isEditing ? (
                                    // View Mode
                                    <div className="space-y-6">
                                        {/* Row 1 - Loại ticket và Tiêu đề */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            <div className="space-y-2 md:col-span-3">
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Loại ticket
                                                </Label>
                                                <div>
                                                    <Badge
                                                        variant={getTicketTypeBadgeVariant(
                                                            ticket?.ticket_type ||
                                                                ""
                                                        )}
                                                        className={
                                                            ticket?.ticket_type ===
                                                            "task"
                                                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                                                : ""
                                                        }
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {getTicketTypeIcon(
                                                                ticket?.ticket_type ||
                                                                    ""
                                                            )}
                                                            {getTicketTypeLabel(
                                                                ticket?.ticket_type ||
                                                                    ""
                                                            )}
                                                        </div>
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-2 md:col-span-9">
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Tiêu đề
                                                </Label>
                                                <p className="text-sm text-gray-900 font-bold">
                                                    {ticket?.title}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Row 2 - Đơn vị, Ưu tiên, Thời hạn */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Đơn vị
                                                </Label>
                                                <p className="text-sm text-gray-900">
                                                    {ticket?.organizations
                                                        ?.name ||
                                                        "Không xác định"}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Ưu tiên
                                                </Label>
                                                <div>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            ticket?.priority ===
                                                            "high"
                                                                ? "bg-red-100 text-red-800 border-red-200"
                                                                : ticket?.priority ===
                                                                  "medium"
                                                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                                : "bg-green-100 text-green-800 border-green-200"
                                                        }
                                                    >
                                                        {ticket?.priority ===
                                                        "high"
                                                            ? "Cao"
                                                            : ticket?.priority ===
                                                              "medium"
                                                            ? "T.bình"
                                                            : "Thấp"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Thời hạn
                                                </Label>
                                                <p className="text-sm text-gray-900">
                                                    {ticket?.expected_completion_date
                                                        ? new Date(
                                                              ticket.expected_completion_date
                                                          ).toLocaleDateString(
                                                              "vi-VN"
                                                          )
                                                        : "Chưa xác định"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Row 3 - Nền tảng, Trạng thái và Thời gian đóng */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Nền tảng
                                                </Label>
                                                <div>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            ticket?.platform ===
                                                            "web"
                                                                ? "bg-green-100 text-green-800 border-green-200"
                                                                : ticket?.platform ===
                                                                  "app"
                                                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                                                : "bg-gray-100 text-gray-800 border-gray-200"
                                                        }
                                                    >
                                                        {ticket?.platform ===
                                                        "web"
                                                            ? "Web"
                                                            : ticket?.platform ===
                                                              "app"
                                                            ? "App"
                                                            : "Tất cả"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Trạng thái
                                                </Label>
                                                <div>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            ticket?.status ===
                                                            "open"
                                                                ? ""
                                                                : ticket?.status ===
                                                                  "in_progress"
                                                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                                : "bg-green-100 text-green-800 border-green-200"
                                                        }
                                                    >
                                                        {ticket?.status ===
                                                        "open"
                                                            ? "Mở"
                                                            : ticket?.status ===
                                                              "in_progress"
                                                            ? "Đang xử lý"
                                                            : "Đã đóng"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Thời gian đóng
                                                </Label>
                                                <p className="text-sm text-gray-900">
                                                    {ticket?.closed_at
                                                        ? new Date(
                                                              ticket.closed_at
                                                          ).toLocaleString(
                                                              "vi-VN",
                                                              {
                                                                  timeZone:
                                                                      "Asia/Ho_Chi_Minh",
                                                              }
                                                          )
                                                        : "Chưa đóng"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-500">
                                                Nội dung
                                            </Label>
                                            <div className="p-3 bg-gray-50 rounded-md border">
                                                <HtmlContent
                                                    content={
                                                        ticket?.description ||
                                                        "<p class='text-gray-500 italic'>Không có mô tả</p>"
                                                    }
                                                    className="text-sm text-gray-900"
                                                />
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Người tạo
                                                </Label>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 overflow-hidden">
                                                        {ticket?.created_user
                                                            ?.avatar_url ? (
                                                            <img
                                                                src={
                                                                    ticket
                                                                        .created_user
                                                                        .avatar_url
                                                                }
                                                                alt={
                                                                    ticket
                                                                        .created_user
                                                                        .full_name ||
                                                                    "User"
                                                                }
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            ticket?.created_user?.full_name?.charAt(
                                                                0
                                                            ) || "U"
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-900">
                                                        {ticket?.created_user
                                                            ?.full_name ||
                                                            "Không xác định"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Ngày tạo
                                                </Label>
                                                <p className="text-sm text-gray-900">
                                                    {ticket &&
                                                        new Date(
                                                            ticket.created_at
                                                        ).toLocaleString(
                                                            "vi-VN",
                                                            {
                                                                timeZone:
                                                                    "Asia/Ho_Chi_Minh",
                                                            }
                                                        )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Edit Mode
                                    <form className="space-y-6">
                                        {/* Row 1 - Loại ticket và Tiêu đề */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            <div className="space-y-2 md:col-span-3">
                                                <Label htmlFor="ticket_type">
                                                    Loại ticket
                                                </Label>
                                                <Select
                                                    value={formData.ticket_type}
                                                    onValueChange={(
                                                        value: "bug" | "task"
                                                    ) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            ticket_type: value,
                                                        }))
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="task">
                                                            Task
                                                        </SelectItem>
                                                        <SelectItem value="bug">
                                                            Bug
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2 md:col-span-9">
                                                <Label htmlFor="title">
                                                    Tiêu đề *
                                                </Label>
                                                <Input
                                                    id="title"
                                                    value={formData.title}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            title: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    placeholder="Nhập tiêu đề ticket"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Row 2 - Đơn vị, Ưu tiên, Thời hạn */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="organization_id">
                                                    Đơn vị
                                                </Label>
                                                <Select
                                                    value={
                                                        formData.organization_id
                                                    }
                                                    onValueChange={(value) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            organization_id:
                                                                value,
                                                        }))
                                                    }
                                                    disabled={
                                                        currentUser?.role !==
                                                        "admin"
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Chọn đơn vị" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {organizations.map(
                                                            (org) => (
                                                                <SelectItem
                                                                    key={org.id}
                                                                    value={
                                                                        org.id
                                                                    }
                                                                >
                                                                    {org.name}
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="priority">
                                                    Ưu tiên
                                                </Label>
                                                <Select
                                                    value={formData.priority}
                                                    onValueChange={(
                                                        value:
                                                            | "low"
                                                            | "medium"
                                                            | "high"
                                                    ) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            priority: value,
                                                        }))
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="low">
                                                            Thấp
                                                        </SelectItem>
                                                        <SelectItem value="medium">
                                                            T.bình
                                                        </SelectItem>
                                                        <SelectItem value="high">
                                                            Cao
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="expected_completion_date">
                                                    Thời hạn
                                                </Label>
                                                <Input
                                                    id="expected_completion_date"
                                                    type="date"
                                                    value={
                                                        formData.expected_completion_date
                                                    }
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            expected_completion_date:
                                                                e.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* Row 3 - Trạng thái và Thời gian đóng */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="status">
                                                    Trạng thái
                                                </Label>
                                                <Select
                                                    value={formData.status}
                                                    onValueChange={(
                                                        value:
                                                            | "open"
                                                            | "in_progress"
                                                            | "closed"
                                                    ) => {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            status: value,
                                                            // Auto-fill closed_at when status changes to closed
                                                            closed_at:
                                                                value ===
                                                                "closed"
                                                                    ? (() => {
                                                                          if (
                                                                              prev.closed_at &&
                                                                              prev.status ===
                                                                                  "closed"
                                                                          ) {
                                                                              return prev.closed_at;
                                                                          }

                                                                          const now =
                                                                              new Date();
                                                                          const utcNow =
                                                                              now.getTime();
                                                                          const gmt7Now =
                                                                              new Date(
                                                                                  utcNow +
                                                                                      7 *
                                                                                          60 *
                                                                                          60 *
                                                                                          1000
                                                                              );

                                                                          const year =
                                                                              gmt7Now.getUTCFullYear();
                                                                          const month =
                                                                              String(
                                                                                  gmt7Now.getUTCMonth() +
                                                                                      1
                                                                              ).padStart(
                                                                                  2,
                                                                                  "0"
                                                                              );
                                                                          const day =
                                                                              String(
                                                                                  gmt7Now.getUTCDate()
                                                                              ).padStart(
                                                                                  2,
                                                                                  "0"
                                                                              );
                                                                          const hour =
                                                                              String(
                                                                                  gmt7Now.getUTCHours()
                                                                              ).padStart(
                                                                                  2,
                                                                                  "0"
                                                                              );
                                                                          const minute =
                                                                              String(
                                                                                  gmt7Now.getUTCMinutes()
                                                                              ).padStart(
                                                                                  2,
                                                                                  "0"
                                                                              );

                                                                          return `${year}-${month}-${day}T${hour}:${minute}`;
                                                                      })()
                                                                    : prev.closed_at,
                                                        }));
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="open">
                                                            Mở
                                                        </SelectItem>
                                                        <SelectItem value="in_progress">
                                                            Đang xử lý
                                                        </SelectItem>
                                                        <SelectItem value="closed">
                                                            Đã đóng
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="closed_at">
                                                    Thời gian đóng
                                                </Label>
                                                <Input
                                                    id="closed_at"
                                                    type="datetime-local"
                                                    value={formData.closed_at}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            closed_at:
                                                                e.target.value,
                                                        }))
                                                    }
                                                    onFocus={(e) => {
                                                        if (
                                                            !formData.closed_at
                                                        ) {
                                                            const now =
                                                                new Date();
                                                            const utcNow =
                                                                now.getTime();
                                                            const gmt7Now =
                                                                new Date(
                                                                    utcNow +
                                                                        7 *
                                                                            60 *
                                                                            60 *
                                                                            1000
                                                                );

                                                            const year =
                                                                gmt7Now.getUTCFullYear();
                                                            const month =
                                                                String(
                                                                    gmt7Now.getUTCMonth() +
                                                                        1
                                                                ).padStart(
                                                                    2,
                                                                    "0"
                                                                );
                                                            const day = String(
                                                                gmt7Now.getUTCDate()
                                                            ).padStart(2, "0");
                                                            const hour = String(
                                                                gmt7Now.getUTCHours()
                                                            ).padStart(2, "0");
                                                            const minute =
                                                                String(
                                                                    gmt7Now.getUTCMinutes()
                                                                ).padStart(
                                                                    2,
                                                                    "0"
                                                                );

                                                            const formattedTime = `${year}-${month}-${day}T${hour}:${minute}`;

                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    closed_at:
                                                                        formattedTime,
                                                                })
                                                            );
                                                        }
                                                    }}
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Thời gian ticket được đóng
                                                    (tùy chọn)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <Label htmlFor="description">
                                                Nội dung
                                            </Label>
                                            <RichTextEditor
                                                value={
                                                    formData.description || ""
                                                }
                                                onChange={(value) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        description: value,
                                                    }))
                                                }
                                                placeholder="Mô tả chi tiết ticket"
                                                minHeight="min-h-32"
                                            />
                                        </div>

                                        {/* Metadata */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Người tạo
                                                </Label>
                                                <p className="text-sm text-gray-900">
                                                    {ticket.created_user
                                                        ?.full_name ||
                                                        "Không xác định"}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">
                                                    Ngày tạo
                                                </Label>
                                                <p className="text-sm text-gray-900">
                                                    {new Date(
                                                        ticket.created_at
                                                    ).toLocaleString("vi-VN", {
                                                        timeZone:
                                                            "Asia/Ho_Chi_Minh",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side - Comments Section */}
                    <div className="lg:col-span-1">
                        <Card className="h-fit max-h-[90vh] flex flex-col">
                            <CardHeader className="flex-shrink-0">
                                <CardTitle className="flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5" />
                                    Comments ({comments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col min-h-0 p-2">
                                {/* Comments List */}
                                <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
                                    {comments.length === 0 ? (
                                        <p className="text-gray-500 text-sm italic">
                                            Chưa có comment nào. Hãy là người
                                            đầu tiên bình luận!
                                        </p>
                                    ) : (
                                        comments.map((comment) =>
                                            renderComment(comment, 0)
                                        )
                                    )}
                                </div>

                                {/* Add Comment Form */}
                                <div className="flex-shrink-0 border-t pt-4 px-2">
                                    <form
                                        onSubmit={handleAddComment}
                                        className="space-y-4"
                                    >
                                        <Label
                                            htmlFor="new-comment"
                                            className="text-sm font-medium"
                                        >
                                            Thêm comment
                                        </Label>
                                        <RichTextEditor
                                            value={newComment}
                                            onChange={setNewComment}
                                            placeholder="Nhập comment của bạn..."
                                            minHeight="min-h-24"
                                        />
                                        <div className="flex justify-end">
                                            <Button
                                                type="submit"
                                                disabled={
                                                    submittingComment ||
                                                    !newComment.trim()
                                                }
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                {submittingComment
                                                    ? "Đang gửi..."
                                                    : "Gửi comment"}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
