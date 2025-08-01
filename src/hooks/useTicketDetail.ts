import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
    Ticket,
    CurrentUser,
    Organization,
    Comment,
    TicketFormData,
} from "@/types";

export function useTicketDetail(ticketId: string) {
    const router = useRouter();
    const { toast } = useToast();

    // State
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [creatingJira, setCreatingJira] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form data
    const [formData, setFormData] = useState<TicketFormData>({
        title: "",
        description: "",
        ticket_type: "task",
        priority: "medium",
        platform: "web",
        status: "open",
        organization_id: "",
        expected_completion_date: "",
        closed_at: "",
        jira_link: "",
    });

    // Fetch ticket data
    const fetchTicket = async () => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    router.push("/tickets");
                    return;
                }
                throw new Error("Failed to fetch ticket");
            }
            const data = await response.json();
            console.log("Ticket API Response:", data); // Debug log

            // Handle different response formats
            let ticketData = data;
            if (data && data.ticket) {
                ticketData = data.ticket;
            }

            console.log("Ticket data:", ticketData); // Debug log
            console.log("Ticket created_at:", ticketData.created_at); // Debug log
            console.log("Ticket created_user:", ticketData.created_user); // Debug log
            setTicket(ticketData);

            // Initialize form data
            setFormData({
                title: ticketData.title || "",
                description: ticketData.description || "",
                ticket_type: ticketData.ticket_type || "task",
                priority: ticketData.priority || "medium",
                platform: ticketData.platform || "web",
                status: ticketData.status || "open",
                organization_id: ticketData.organization_id || "",
                expected_completion_date:
                    ticketData.expected_completion_date || "",
                closed_at: ticketData.closed_at || "",
                jira_link: ticketData.jira_link || "",
            });
        } catch (error) {
            console.error("Error fetching ticket:", error);
            toast({
                title: "Lỗi",
                description: "Không thể tải thông tin ticket.",
                variant: "destructive",
            });
        }
    };

    // Fetch organizations
    const fetchOrganizations = async () => {
        try {
            const response = await fetch("/api/organizations");
            if (response.ok) {
                const data = await response.json();
                console.log("Organizations API Response:", data); // Debug log

                // Handle different response formats
                let organizationsArray = [];
                if (Array.isArray(data)) {
                    organizationsArray = data;
                } else if (data && Array.isArray(data.organizations)) {
                    organizationsArray = data.organizations;
                } else if (data && data.organizations) {
                    organizationsArray = [data.organizations];
                }

                console.log("Organizations array:", organizationsArray); // Debug log
                setOrganizations(organizationsArray);
            }
        } catch (error) {
            console.error("Error fetching organizations:", error);
            setOrganizations([]);
        }
    };

    // Fetch current user
    const fetchCurrentUser = async () => {
        try {
            const response = await fetch("/api/current-user");
            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data);
            }
        } catch (error) {
            console.error("Error fetching current user:", error);
        }
    };

    // Fetch comments
    const fetchComments = async () => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}/comments`);
            if (response.ok) {
                const data = await response.json();
                console.log("Comments API Response:", data); // Debug log

                // Handle different response formats
                let commentsArray = [];
                if (Array.isArray(data)) {
                    commentsArray = data;
                } else if (data && Array.isArray(data.comments)) {
                    commentsArray = data.comments;
                } else if (data && data.comments) {
                    commentsArray = [data.comments];
                }

                console.log("Comments array:", commentsArray); // Debug log
                setComments(organizeComments(commentsArray));
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
            setComments([]);
        }
    };

    // Organize comments into tree structure
    const organizeComments = (flatComments: Comment[]): Comment[] => {
        // Ensure flatComments is an array
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

    // Add comment
    const handleAddComment = async (content: string, parentId?: string) => {
        try {
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

            if (!response.ok) throw new Error("Failed to add comment");

            // Refresh comments
            await fetchComments();
        } catch (error) {
            console.error("Error adding comment:", error);
            throw error;
        }
    };

    // Edit comment
    const handleEditComment = async (commentId: string, content: string) => {
        try {
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

            if (!response.ok) throw new Error("Failed to edit comment");

            // Refresh comments
            await fetchComments();
        } catch (error) {
            console.error("Error editing comment:", error);
            throw error;
        }
    };

    // Delete comment
    const handleDeleteComment = async (commentId: string) => {
        try {
            const response = await fetch(
                `/api/tickets/${ticketId}/comments/${commentId}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) throw new Error("Failed to delete comment");

            // Refresh comments
            await fetchComments();
        } catch (error) {
            console.error("Error deleting comment:", error);
            throw error;
        }
    };

    // Save ticket changes
    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to update ticket");

            const updatedTicket = await response.json();
            setTicket(updatedTicket);
            setIsEditing(false);

            toast({
                title: "Thành công",
                description: "Ticket đã được cập nhật.",
            });
        } catch (error) {
            console.error("Error saving ticket:", error);
            toast({
                title: "Lỗi",
                description: "Không thể cập nhật ticket.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    // Create JIRA issue
    const handleCreateJiraIssue = async () => {
        setCreatingJira(true);
        try {
            const response = await fetch("/api/jira/create-issue", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ticket_id: ticketId,
                    title: ticket?.title,
                    description: ticket?.description,
                }),
            });

            if (!response.ok) throw new Error("Failed to create JIRA issue");

            const data = await response.json();

            // Update ticket with JIRA link
            setTicket((prev) =>
                prev ? { ...prev, jira_link: data.jira_link } : null
            );
            setFormData((prev) => ({ ...prev, jira_link: data.jira_link }));

            toast({
                title: "Thành công",
                description: "JIRA issue đã được tạo.",
            });
        } catch (error) {
            console.error("Error creating JIRA issue:", error);
            toast({
                title: "Lỗi",
                description: "Không thể tạo JIRA issue.",
                variant: "destructive",
            });
        } finally {
            setCreatingJira(false);
        }
    };

    // Toggle edit mode
    const handleEditToggle = () => {
        setIsEditing(true);
    };

    // Cancel edit
    const handleCancel = () => {
        setIsEditing(false);
        // Reset form data to original ticket data
        if (ticket) {
            setFormData({
                title: ticket.title || "",
                description: ticket.description || "",
                ticket_type: ticket.ticket_type || "task",
                priority: ticket.priority || "medium",
                platform: ticket.platform || "web",
                status: ticket.status || "open",
                organization_id: ticket.organization_id || "",
                expected_completion_date: ticket.expected_completion_date || "",
                closed_at: ticket.closed_at || "",
                jira_link: ticket.jira_link || "",
            });
        }
    };

    // Initialize data
    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            await Promise.all([
                fetchTicket(),
                fetchOrganizations(),
                fetchCurrentUser(),
            ]);
            setLoading(false);
        };

        if (ticketId) {
            initializeData();
        }
    }, [ticketId]);

    // Fetch comments after ticket is loaded
    useEffect(() => {
        if (ticket) {
            fetchComments();
        }
    }, [ticket]);

    return {
        // State
        ticket,
        currentUser,
        organizations,
        comments,
        isEditing,
        saving,
        creatingJira,
        loading,
        formData,

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
