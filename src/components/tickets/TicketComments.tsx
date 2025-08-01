import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
    MessageCircle,
    Send,
    Edit,
    Trash2,
    Reply,
    Check,
    X,
} from "lucide-react";
import { Comment } from "@/types";
import RichTextEditor from "@/components/RichTextEditor";
import HtmlContent from "@/components/HtmlContent";

interface TicketCommentsProps {
    comments: Comment[];
    ticketId: string;
    currentUserId: string;
    onAddComment: (content: string, parentId?: string) => Promise<void>;
    onEditComment: (commentId: string, content: string) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
}

export function TicketComments({
    comments,
    ticketId,
    currentUserId,
    onAddComment,
    onEditComment,
    onDeleteComment,
}: TicketCommentsProps) {
    const { toast } = useToast();
    const [newComment, setNewComment] = useState("");
    const [editingComment, setEditingComment] = useState<Comment | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const commentDate = new Date(dateString);
        const diffMs = now.getTime() - commentDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return commentDate.toLocaleDateString("vi-VN");
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        // Remove HTML tags and check if content is empty
        const textContent = newComment.replace(/<[^>]*>/g, "").trim();
        if (!textContent) return;

        setSubmitting(true);
        try {
            await onAddComment(newComment);
            setNewComment("");
            toast({
                title: "Thành công",
                description: "Bình luận đã được thêm.",
            });
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể thêm bình luận.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();
        // Remove HTML tags and check if content is empty
        const textContent = replyContent.replace(/<[^>]*>/g, "").trim();
        if (!textContent || !replyingTo) return;

        setSubmitting(true);
        try {
            await onAddComment(replyContent, replyingTo);
            setReplyContent("");
            setReplyingTo(null);
            toast({
                title: "Thành công",
                description: "Phản hồi đã được thêm.",
            });
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể thêm phản hồi.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingComment || !editingComment.content.trim()) return;

        setSubmitting(true);
        try {
            await onEditComment(editingComment.id, editingComment.content);
            setEditingComment(null);
            toast({
                title: "Thành công",
                description: "Bình luận đã được cập nhật.",
            });
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể cập nhật bình luận.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) return;

        try {
            await onDeleteComment(commentId);
            toast({
                title: "Thành công",
                description: "Bình luận đã được xóa.",
            });
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể xóa bình luận.",
                variant: "destructive",
            });
        }
    };

    const renderComment = (
        comment: Comment,
        depth: number = 0
    ): React.ReactNode => {
        const isOwner = comment.user_id === currentUserId;
        const isEditing = editingComment?.id === comment.id;
        const isReplying = replyingTo === comment.id;

        return (
            <div
                key={comment.id}
                className={`${depth > 0 ? "ml-8 border-l-2 border-gray-200 pl-4" : ""}`}
            >
                <Card className="mb-4">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                                {comment.user.avatar_url ? (
                                    <img
                                        src={comment.user.avatar_url}
                                        alt={comment.user.full_name}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    comment.user.full_name?.charAt(0) || "U"
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-medium text-sm">
                                        {comment.user.full_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {formatTimeAgo(comment.created_at)}
                                    </span>
                                </div>

                                {isEditing ? (
                                    <form
                                        onSubmit={handleEditSubmit}
                                        className="space-y-2"
                                    >
                                        <RichTextEditor
                                            value={editingComment.content}
                                            onChange={(value) =>
                                                setEditingComment((prev) =>
                                                    prev
                                                        ? {
                                                              ...prev,
                                                              content: value,
                                                          }
                                                        : null
                                                )
                                            }
                                            placeholder="Chỉnh sửa bình luận..."
                                            minHeight="min-h-24"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={submitting}
                                            >
                                                <Check className="w-4 h-4 mr-1" />
                                                Lưu
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setEditingComment(null)
                                                }
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Hủy
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <HtmlContent content={comment.content} />
                                )}

                                {!isEditing && (
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setReplyingTo(comment.id)
                                            }
                                        >
                                            <Reply className="w-4 h-4 mr-1" />
                                            Phản hồi
                                        </Button>
                                        {isOwner && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setEditingComment(
                                                            comment
                                                        )
                                                    }
                                                >
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    Chỉnh sửa
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(comment.id)
                                                    }
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1" />
                                                    Xóa
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}

                                {isReplying && (
                                    <form
                                        onSubmit={handleSubmitReply}
                                        className="mt-4 space-y-2"
                                    >
                                        <RichTextEditor
                                            value={replyContent}
                                            onChange={(value) =>
                                                setReplyContent(value)
                                            }
                                            placeholder="Viết phản hồi..."
                                            minHeight="min-h-24"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={submitting}
                                            >
                                                <Send className="w-4 h-4 mr-1" />
                                                Gửi phản hồi
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setReplyingTo(null);
                                                    setReplyContent("");
                                                }}
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Hủy
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Render replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-2">
                        {comment.replies?.map((reply) =>
                            renderComment(reply, depth + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Bình luận</h3>
            </div>

            {/* Add new comment */}
            <form onSubmit={handleSubmitComment} className="space-y-3">
                <RichTextEditor
                    value={newComment}
                    onChange={(value) => setNewComment(value)}
                    placeholder="Viết bình luận..."
                    minHeight="min-h-32"
                />
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        disabled={
                            submitting ||
                            !newComment.replace(/<[^>]*>/g, "").trim()
                        }
                    >
                        <Send className="w-4 h-4 mr-2" />
                        {submitting ? "Đang gửi..." : "Gửi bình luận"}
                    </Button>
                </div>
            </form>

            {/* Comments list */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                    </p>
                ) : (
                    comments?.map((comment) => renderComment(comment))
                )}
            </div>
        </div>
    );
}
