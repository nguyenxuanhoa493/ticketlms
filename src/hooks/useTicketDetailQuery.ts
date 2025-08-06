import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
    Ticket,
    CurrentUser,
    Organization,
    Comment,
    TicketFormData,
} from "@/types";

// API functions
const fetchTicketDetail = async (ticketId: string) => {
    const response = await fetch(`/api/tickets/${ticketId}`);
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Ticket not found");
        }
        throw new Error(`Failed to fetch ticket: ${response.status}`);
    }
    const data = await response.json();
    return data.ticket || data;
};

const fetchTicketComments = async (ticketId: string) => {
    const response = await fetch(`/api/tickets/${ticketId}/comments`);
    if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
    }
    const data = await response.json();
    return data.comments || data || [];
};

const createComment = async ({
    ticketId,
    content,
    parentId,
}: {
    ticketId: string;
    content: string;
    parentId?: string;
}) => {
    const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content,
            parent_id: parentId,
        }),
    });
    if (!response.ok) {
        throw new Error("Failed to add comment");
    }
    return response.json();
};

const updateComment = async ({
    ticketId,
    commentId,
    content,
}: {
    ticketId: string;
    commentId: string;
    content: string;
}) => {
    const response = await fetch(
        `/api/tickets/${ticketId}/comments/${commentId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
        }
    );
    if (!response.ok) {
        throw new Error("Failed to edit comment");
    }
    return response.json();
};

const deleteComment = async ({
    ticketId,
    commentId,
}: {
    ticketId: string;
    commentId: string;
}) => {
    const response = await fetch(
        `/api/tickets/${ticketId}/comments/${commentId}`,
        {
            method: "DELETE",
        }
    );
    if (!response.ok) {
        throw new Error("Failed to delete comment");
    }
    return response.json();
};

const updateTicket = async ({
    ticketId,
    data,
}: {
    ticketId: string;
    data: Partial<TicketFormData>;
}) => {
    const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error("Failed to update ticket");
    }
    return response.json();
};

const createJiraIssue = async ({
    ticketId,
    title,
    description,
}: {
    ticketId: string;
    title?: string;
    description?: string;
}) => {
    const response = await fetch("/api/jira/create-issue", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            ticket_id: ticketId,
            title,
            description,
        }),
    });
    if (!response.ok) {
        throw new Error("Failed to create JIRA issue");
    }
    return response.json();
};

// Organize comments into tree structure
const organizeComments = (flatComments: Comment[]): Comment[] => {
    if (!Array.isArray(flatComments)) {
        console.warn("flatComments is not an array:", flatComments);
        return [];
    }

    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    // Create a map of all comments
    flatComments.forEach((comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Organize into tree structure
    flatComments.forEach((comment) => {
        const commentWithReplies = commentMap.get(comment.id)!;
        if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
                parent.replies!.push(commentWithReplies);
            }
        } else {
            rootComments.push(commentWithReplies);
        }
    });

    return rootComments;
};

export function useTicketDetailQuery(ticketId: string) {
    const router = useRouter();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State cho UI
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<TicketFormData>({
        title: "",
        description: "",
        ticket_type: "task",
        priority: "medium",
        platform: "web",
        status: "open",
        organization_id: "",
        expected_completion_date: null,
        closed_at: null,
        jira_link: "",
        only_show_in_admin: false,
    });

    // React Query hooks
    const {
        data: ticket,
        isLoading: ticketLoading,
        error: ticketError,
    } = useQuery({
        queryKey: ["ticket", ticketId],
        queryFn: () => fetchTicketDetail(ticketId),
        enabled: !!ticketId,
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
        retry: (failureCount, error) => {
            if (error.message.includes("Ticket not found")) {
                return false; // Không retry nếu ticket không tồn tại
            }
            return failureCount < 2;
        },
    });

    const {
        data: comments = [],
        isLoading: commentsLoading,
        error: commentsError,
    } = useQuery({
        queryKey: ["ticket-comments", ticketId],
        queryFn: () => fetchTicketComments(ticketId),
        enabled: !!ticketId,
        staleTime: 2 * 60 * 1000, // 2 phút
        gcTime: 5 * 60 * 1000, // 5 phút
        select: organizeComments, // Transform comments to tree structure
    });

    const { data: currentUser } = useQuery({
        queryKey: ["currentUser"],
        queryFn: async () => {
            const response = await fetch("/api/current-user");
            if (!response.ok) {
                throw new Error("Failed to fetch current user");
            }
            return response.json();
        },
        staleTime: 10 * 60 * 1000, // 10 phút
        gcTime: 30 * 60 * 1000, // 30 phút
    });

    const { data: organizations = [] } = useQuery({
        queryKey: ["organizations"],
        queryFn: async () => {
            const response = await fetch("/api/organizations");
            if (!response.ok) {
                throw new Error("Failed to fetch organizations");
            }
            const data = await response.json();
            return data.organizations || data || [];
        },
        staleTime: 10 * 60 * 1000, // 10 phút
        gcTime: 30 * 60 * 1000, // 30 phút
    });

    // Mutations
    const createCommentMutation = useMutation({
        mutationFn: createComment,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["ticket-comments", ticketId],
            });
            toast({
                title: "Thành công",
                description: "Comment đã được thêm.",
            });
        },
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể thêm comment.",
                variant: "destructive",
            });
        },
    });

    const updateCommentMutation = useMutation({
        mutationFn: updateComment,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["ticket-comments", ticketId],
            });
            toast({
                title: "Thành công",
                description: "Comment đã được cập nhật.",
            });
        },
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể cập nhật comment.",
                variant: "destructive",
            });
        },
    });

    const deleteCommentMutation = useMutation({
        mutationFn: deleteComment,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["ticket-comments", ticketId],
            });
            toast({
                title: "Thành công",
                description: "Comment đã được xóa.",
            });
        },
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể xóa comment.",
                variant: "destructive",
            });
        },
    });

    const updateTicketMutation = useMutation({
        mutationFn: updateTicket,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
            queryClient.invalidateQueries({ queryKey: ["tickets"] }); // Invalidate tickets list
            setIsEditing(false);
            toast({
                title: "Thành công",
                description: "Ticket đã được cập nhật.",
            });
        },
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể cập nhật ticket.",
                variant: "destructive",
            });
        },
    });

    const createJiraMutation = useMutation({
        mutationFn: createJiraIssue,
        onSuccess: async (data) => {
            // Update ticket with JIRA link
            await updateTicketMutation.mutateAsync({
                ticketId,
                data: { jira_link: data.jiraLink },
            });
            toast({
                title: "Thành công",
                description: "JIRA issue đã được tạo và link đã được cập nhật.",
            });
        },
        onError: (error) => {
            toast({
                title: "Lỗi",
                description: error.message || "Không thể tạo JIRA issue.",
                variant: "destructive",
            });
        },
    });

    // Initialize form data when ticket loads
    useEffect(() => {
        if (ticket && !isEditing) {
            setFormData({
                title: ticket.title || "",
                description: ticket.description || "",
                ticket_type: ticket.ticket_type || "task",
                priority: ticket.priority || "medium",
                platform: ticket.platform || "web",
                status: ticket.status || "open",
                organization_id: ticket.organization_id || "",
                expected_completion_date: ticket.expected_completion_date || null,
                closed_at: ticket.closed_at || null,
                jira_link: ticket.jira_link || "",
                only_show_in_admin: ticket.only_show_in_admin || false,
            });
        }
    }, [ticket, isEditing]);

    // Handle ticket not found
    if (ticketError?.message === "Ticket not found") {
        router.push("/tickets");
        return null;
    }

    // Handlers
    const handleAddComment = async (
        content: string,
        parentId?: string
    ): Promise<void> => {
        await createCommentMutation.mutateAsync({
            ticketId,
            content,
            parentId,
        });
    };

    const handleEditComment = async (
        commentId: string,
        content: string
    ): Promise<void> => {
        await updateCommentMutation.mutateAsync({
            ticketId,
            commentId,
            content,
        });
    };

    const handleDeleteComment = async (commentId: string): Promise<void> => {
        await deleteCommentMutation.mutateAsync({ ticketId, commentId });
    };

    const handleSave = () => {
        updateTicketMutation.mutate({ ticketId, data: formData });
    };

    const handleCreateJiraIssue = () => {
        createJiraMutation.mutate({
            ticketId,
            title: ticket?.title,
            description: ticket?.description,
        });
    };

    const handleEditToggle = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        // Form data will be reset by useEffect when isEditing changes
    };

    return {
        // State
        ticket,
        currentUser,
        organizations,
        comments,
        isEditing,
        saving: updateTicketMutation.isPending,
        creatingJira: createJiraMutation.isPending,
        loading: ticketLoading || commentsLoading,
        formData,
        hasError: ticketError || commentsError,

        // Actions
        setFormData,
        handleSave,
        handleEditToggle,
        handleCancel,
        handleCreateJiraIssue,
        handleAddComment,
        handleEditComment,
        handleDeleteComment,
    };
}
