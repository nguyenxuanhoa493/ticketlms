"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { 
    ArrowLeft, Building2, Activity, StickyNote, ListTodo, 
    Clock, ExternalLink, Plus, Pin, Edit, Trash2 
} from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor";
import HtmlContent from "@/components/common/HtmlContent";
import { Database } from "@/types/database";
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

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationActivity = Database["public"]["Tables"]["organization_activities"]["Row"];
type OrganizationNote = Database["public"]["Tables"]["organization_notes"]["Row"];
type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface OrganizationWithDetails extends Organization {
    assigned_admin?: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

interface ActivityWithUser extends OrganizationActivity {
    user?: {
        full_name: string | null;
    } | null;
}

interface NoteWithUser extends OrganizationNote {
    user?: {
        full_name: string | null;
    } | null;
}

interface TicketWithUsers extends Ticket {
    created_user?: {
        full_name: string | null;
    } | null;
    assigned_user?: {
        full_name: string | null;
    } | null;
}

interface Admin {
    id: string;
    full_name: string | null;
}

export default function OrganizationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    
    // Organization state
    const [organization, setOrganization] = useState<OrganizationWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "active" as "active" | "inactive" | "pending",
        assigned_admin_id: "",
    });
    const [submitting, setSubmitting] = useState(false);
    
    // Activities state
    const [activities, setActivities] = useState<ActivityWithUser[]>([]);
    
    // Notes and Tickets combined state for timeline
    const [notes, setNotes] = useState<NoteWithUser[]>([]);
    const [tickets, setTickets] = useState<TicketWithUsers[]>([]);
    const [timelineLoading, setTimelineLoading] = useState(true);
    
    // Note editing state
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [newNote, setNewNote] = useState("");
    const [editNoteContent, setEditNoteContent] = useState("");
    const [noteSubmitting, setNoteSubmitting] = useState(false);

    useEffect(() => {
        fetchOrganization();
        fetchActivities();
        fetchTimelineData();
        fetchAdmins();
    }, [params.id]);

    useEffect(() => {
        if (organization) {
            setFormData({
                name: organization.name,
                description: organization.description || "",
                status: organization.status,
                assigned_admin_id: organization.assigned_admin_id || "",
            });
        }
    }, [organization]);

    const fetchOrganization = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/organizations/${params.id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch organization");
            }

            setOrganization(data.organization);
        } catch (error: unknown) {
            console.error("Error fetching organization:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to load organization";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
            router.push("/organizations");
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            const response = await fetch(`/api/organizations/${params.id}/activities`);
            const data = await response.json();

            if (response.ok) {
                setActivities(data.activities || []);
            }
        } catch (error) {
            console.error("Error fetching activities:", error);
        }
    };

    const fetchTimelineData = async () => {
        try {
            setTimelineLoading(true);
            const [notesRes, ticketsRes] = await Promise.all([
                fetch(`/api/organizations/${params.id}/notes`),
                fetch(`/api/tickets?organization_id=${params.id}&limit=50`),
            ]);

            const notesData = await notesRes.json();
            const ticketsData = await ticketsRes.json();

            console.log("[OrganizationDetail] Notes response:", notesData);
            console.log("[OrganizationDetail] Tickets response:", ticketsData);

            if (notesRes.ok) {
                setNotes(notesData.notes || []);
            }
            if (ticketsRes.ok) {
                // API trả về { tickets: [...], pagination: {...} }
                const ticketsArray = ticketsData.tickets || ticketsData.data || [];
                console.log("[OrganizationDetail] Setting tickets:", ticketsArray);
                setTickets(ticketsArray);
            }
        } catch (error) {
            console.error("Error fetching timeline data:", error);
        } finally {
            setTimelineLoading(false);
        }
    };

    const fetchAdmins = async () => {
        try {
            const response = await fetch("/api/users?role=admin&limit=100");
            const result = await response.json();
            if (response.ok) {
                setAdmins(result.data || []);
            }
        } catch (error) {
            console.error("Error fetching admins:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const response = await fetch("/api/organizations", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: organization?.id,
                    ...formData,
                    assigned_admin_id: formData.assigned_admin_id || null,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to update organization");
            }

            toast({
                title: "Thành công",
                description: "Đã cập nhật thông tin đơn vị",
            });
            setIsEditing(false);
            fetchOrganization();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) {
            toast({
                title: "Lỗi",
                description: "Nội dung ghi chú không được để trống",
                variant: "destructive",
            });
            return;
        }

        try {
            setNoteSubmitting(true);
            const response = await fetch(`/api/organizations/${params.id}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newNote }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to create note");
            }

            toast({
                title: "Thành công",
                description: "Đã thêm ghi chú",
            });
            setNewNote("");
            setIsAddingNote(false);
            fetchTimelineData();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể thêm ghi chú";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setNoteSubmitting(false);
        }
    };

    const handleUpdateNote = async (noteId: string, content: string) => {
        try {
            setNoteSubmitting(true);
            const response = await fetch(`/api/organizations/${params.id}/notes`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: noteId, content }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to update note");
            }

            toast({
                title: "Thành công",
                description: "Đã cập nhật ghi chú",
            });
            setEditingNoteId(null);
            fetchTimelineData();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật ghi chú";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setNoteSubmitting(false);
        }
    };

    const handleTogglePin = async (noteId: string, isPinned: boolean) => {
        try {
            const response = await fetch(`/api/organizations/${params.id}/notes`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: noteId, is_pinned: !isPinned }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to update note");
            }

            fetchTimelineData();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            const response = await fetch(`/api/organizations/${params.id}/notes?id=${noteId}`, {
                method: "DELETE",
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to delete note");
            }

            toast({
                title: "Thành công",
                description: "Đã xóa ghi chú",
            });
            fetchTimelineData();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Không thể xóa ghi chú";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
            active: { variant: "default", label: "Hoạt động" },
            inactive: { variant: "secondary", label: "Ngừng hoạt động" },
            pending: { variant: "destructive", label: "Chờ xử lý" },
        };
        const config = variants[status] || variants.active;
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const getTicketStatusBadge = (status: string) => {
        const variants: Record<string, { color: string; label: string }> = {
            open: { color: "bg-blue-100 text-blue-800", label: "Mở" },
            in_progress: { color: "bg-yellow-100 text-yellow-800", label: "Đang xử lý" },
            closed: { color: "bg-green-100 text-green-800", label: "Đã đóng" },
        };
        const config = variants[status] || variants.open;
        return (
            <Badge className={`text-xs ${config.color}`} variant="secondary">
                {config.label}
            </Badge>
        );
    };

    const getTicketPriorityBadge = (priority: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
            low: { variant: "secondary", label: "Thấp" },
            medium: { variant: "default", label: "Trung bình" },
            high: { variant: "destructive", label: "Cao" },
        };
        const config = variants[priority] || variants.medium;
        return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
    };

    const getActivityIcon = (type: string) => {
        const icons: Record<string, string> = {
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

    // Combine and sort notes and tickets by updated_at
    const timelineItems = [
        ...notes.map(note => ({ type: 'note' as const, item: note, date: note.updated_at })),
        ...tickets.map(ticket => ({ type: 'ticket' as const, item: ticket, date: ticket.updated_at })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const pinnedNotes = notes.filter(n => n.is_pinned);

    console.log("[OrganizationDetail] Render state:", {
        notesCount: notes.length,
        ticketsCount: tickets.length,
        timelineItemsCount: timelineItems.length,
        timelineLoading,
        tickets,
        notes,
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!organization) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster />

            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" size="icon" onClick={() => router.push("/organizations")}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <div className="flex items-center space-x-3">
                                    <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
                                    {getStatusBadge(organization.status)}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    {organization.assigned_admin?.full_name
                                        ? `Phụ trách: ${organization.assigned_admin.full_name}`
                                        : "Chưa phân công"}
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => router.push(`/tickets?organization_id=${organization.id}`)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo Ticket
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content - Split Layout */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column - Info & Activities (1/3) */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Organization Info */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center space-x-2">
                                        <Building2 className="h-5 w-5" />
                                        <span>Thông tin đơn vị</span>
                                    </CardTitle>
                                    {!isEditing && (
                                        <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isEditing ? (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Tên đơn vị *</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status">Trạng thái *</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value) =>
                                                    setFormData({ ...formData, status: value as "active" | "inactive" | "pending" })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Hoạt động</SelectItem>
                                                    <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                                                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="assigned_admin">Admin phụ trách</Label>
                                            <Select
                                                value={formData.assigned_admin_id || "unassigned"}
                                                onValueChange={(value) => 
                                                    setFormData({ 
                                                        ...formData, 
                                                        assigned_admin_id: value === "unassigned" ? "" : value 
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn admin..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">Không phân công</SelectItem>
                                                    {admins.map((admin) => (
                                                        <SelectItem key={admin.id} value={admin.id}>
                                                            {admin.full_name || "No name"}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Mô tả</Label>
                                            <RichTextEditor
                                                value={formData.description}
                                                onChange={(value) => setFormData({ ...formData, description: value })}
                                                placeholder="Mô tả về đơn vị"
                                                minHeight="min-h-24"
                                            />
                                        </div>

                                        <div className="flex space-x-2">
                                            <Button type="submit" disabled={submitting} size="sm">
                                                {submitting ? "Đang lưu..." : "Lưu"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setFormData({
                                                        name: organization.name,
                                                        description: organization.description || "",
                                                        status: organization.status,
                                                        assigned_admin_id: organization.assigned_admin_id || "",
                                                    });
                                                }}
                                            >
                                                Hủy
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-gray-600 text-xs">Tên đơn vị</Label>
                                            <p className="mt-1 text-sm font-medium text-gray-900">{organization.name}</p>
                                        </div>

                                        <div>
                                            <Label className="text-gray-600 text-xs">Trạng thái</Label>
                                            <p className="mt-1">
                                                {organization.status === "active"
                                                    ? "Hoạt động"
                                                    : organization.status === "inactive"
                                                    ? "Ngừng hoạt động"
                                                    : "Chờ xử lý"}
                                            </p>
                                        </div>

                                        <div>
                                            <Label className="text-gray-600 text-xs">Admin phụ trách</Label>
                                            <p className="mt-1 text-sm">
                                                {organization.assigned_admin?.full_name || "Chưa phân công"}
                                            </p>
                                        </div>

                                        {organization.description && (
                                            <div>
                                                <Label className="text-gray-600 text-xs">Mô tả</Label>
                                                <div className="mt-1 text-sm">
                                                    <HtmlContent content={organization.description} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t">
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <Label className="text-gray-600">Ngày tạo</Label>
                                                    <p className="mt-1 text-gray-900">
                                                        {new Date(organization.created_at).toLocaleDateString("vi-VN")}
                                                    </p>
                                                </div>
                                                <div>
                                                    <Label className="text-gray-600">Cập nhật</Label>
                                                    <p className="mt-1 text-gray-900">
                                                        {new Date(organization.updated_at).toLocaleDateString("vi-VN")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Activities */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Activity className="h-5 w-5" />
                                    <span>Hoạt động gần đây</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {activities.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Activity className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                                        <p className="text-sm">Chưa có hoạt động nào</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activities.slice(0, 10).map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="flex space-x-3 pb-3 border-b last:border-b-0"
                                            >
                                                <div className="flex-shrink-0 text-lg">
                                                    {getActivityIcon(activity.activity_type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {activity.title}
                                                    </p>
                                                    {activity.description && (
                                                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                                            {activity.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{formatDate(activity.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Timeline (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Pinned Notes */}
                        {pinnedNotes.length > 0 && (
                            <Card className="bg-yellow-50 border-yellow-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-yellow-900">
                                        <Pin className="h-5 w-5" />
                                        <span>Ghi chú đã ghim</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {pinnedNotes.map((note) => (
                                        <div key={note.id} className="bg-white border border-yellow-200 rounded-lg p-4">
                                            {editingNoteId === note.id ? (
                                                <>
                                                    <RichTextEditor
                                                        value={editNoteContent}
                                                        onChange={setEditNoteContent}
                                                        placeholder="Nhập nội dung ghi chú..."
                                                        minHeight="min-h-20"
                                                    />
                                                    <div className="flex space-x-2 mt-3">
                                                        <Button
                                                            onClick={() => handleUpdateNote(note.id, editNoteContent)}
                                                            disabled={noteSubmitting}
                                                            size="sm"
                                                        >
                                                            {noteSubmitting ? "Đang lưu..." : "Lưu"}
                                                        </Button>
                                                        <Button
                                                            onClick={() => setEditingNoteId(null)}
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            Hủy
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <HtmlContent content={note.content} />
                                                    <div className="flex items-center justify-between pt-3 mt-3 border-t text-xs text-gray-500">
                                                        <div>
                                                            <span>{note.user?.full_name || "Unknown"}</span>
                                                            <span className="mx-2">•</span>
                                                            <span>{formatDate(note.updated_at)}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Button
                                                                onClick={() => handleTogglePin(note.id, note.is_pinned)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2"
                                                            >
                                                                <Pin className="h-4 w-4 fill-yellow-600 text-yellow-600" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    setEditingNoteId(note.id);
                                                                    setEditNoteContent(note.content);
                                                                }}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 px-2 text-red-600"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Bạn có chắc chắn muốn xóa ghi chú này? Hành động này không thể hoàn tác.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDeleteNote(note.id)}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                        >
                                                                            Xóa
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Add Note Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center space-x-2">
                                        <StickyNote className="h-5 w-5" />
                                        <span>Thêm ghi chú mới</span>
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!isAddingNote ? (
                                    <Button onClick={() => setIsAddingNote(true)} variant="outline" className="w-full">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Thêm ghi chú
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <RichTextEditor
                                            value={newNote}
                                            onChange={setNewNote}
                                            placeholder="Nhập nội dung ghi chú..."
                                            minHeight="min-h-24"
                                        />
                                        <div className="flex space-x-2">
                                            <Button onClick={handleAddNote} disabled={noteSubmitting} size="sm">
                                                {noteSubmitting ? "Đang lưu..." : "Lưu"}
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setIsAddingNote(false);
                                                    setNewNote("");
                                                }}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Hủy
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Timeline - Notes & Tickets */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center space-x-2">
                                        <Clock className="h-5 w-5" />
                                        <span>Tickets & Ghi chú ({timelineItems.length})</span>
                                    </CardTitle>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <ListTodo className="h-4 w-4" />
                                        <span>{tickets.length} tickets</span>
                                        <span>•</span>
                                        <StickyNote className="h-4 w-4" />
                                        <span>{notes.filter(n => !n.is_pinned).length} ghi chú</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {timelineLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : timelineItems.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <ListTodo className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p>Chưa có ticket hoặc ghi chú nào</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {timelineItems.map((item, index) => (
                                            <div key={`${item.type}-${item.item.id}`} className="border-b last:border-b-0 pb-4 last:pb-0">
                                                {item.type === 'note' ? (
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <Badge variant="secondary" className="text-xs">
                                                                <StickyNote className="h-3 w-3 mr-1" />
                                                                Ghi chú
                                                            </Badge>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(item.item.updated_at)}
                                                            </span>
                                                        </div>
                                                        {editingNoteId === item.item.id ? (
                                                            <>
                                                                <RichTextEditor
                                                                    value={editNoteContent}
                                                                    onChange={setEditNoteContent}
                                                                    placeholder="Nhập nội dung ghi chú..."
                                                                    minHeight="min-h-20"
                                                                />
                                                                <div className="flex space-x-2 mt-3">
                                                                    <Button
                                                                        onClick={() => handleUpdateNote(item.item.id, editNoteContent)}
                                                                        disabled={noteSubmitting}
                                                                        size="sm"
                                                                    >
                                                                        {noteSubmitting ? "Đang lưu..." : "Lưu"}
                                                                    </Button>
                                                                    <Button
                                                                        onClick={() => setEditingNoteId(null)}
                                                                        variant="outline"
                                                                        size="sm"
                                                                    >
                                                                        Hủy
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <HtmlContent content={item.item.content} />
                                                                <div className="flex items-center justify-between pt-3 mt-3 border-t text-xs text-gray-500">
                                                                    <span>{item.item.user?.full_name || "Unknown"}</span>
                                                                    <div className="flex items-center space-x-1">
                                                                        {!item.item.is_pinned && (
                                                                            <Button
                                                                                onClick={() => handleTogglePin(item.item.id, item.item.is_pinned)}
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-7 px-2"
                                                                            >
                                                                                <Pin className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            onClick={() => {
                                                                                setEditingNoteId(item.item.id);
                                                                                setEditNoteContent(item.item.content);
                                                                            }}
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-7 px-2"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <AlertDialog>
                                                                            <AlertDialogTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-7 px-2 text-red-600"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </AlertDialogTrigger>
                                                                            <AlertDialogContent>
                                                                                <AlertDialogHeader>
                                                                                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                                                                    <AlertDialogDescription>
                                                                                        Bạn có chắc chắn muốn xóa ghi chú này? Hành động này không thể hoàn tác.
                                                                                    </AlertDialogDescription>
                                                                                </AlertDialogHeader>
                                                                                <AlertDialogFooter>
                                                                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                                                    <AlertDialogAction
                                                                                        onClick={() => handleDeleteNote(item.item.id)}
                                                                                        className="bg-red-600 hover:bg-red-700"
                                                                                    >
                                                                                        Xóa
                                                                                    </AlertDialogAction>
                                                                                </AlertDialogFooter>
                                                                            </AlertDialogContent>
                                                                        </AlertDialog>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div 
                                                        className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                                        onClick={() => router.push(`/tickets/${item.item.id}`)}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center space-x-2">
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <ListTodo className="h-3 w-3 mr-1" />
                                                                    Ticket
                                                                </Badge>
                                                                {getTicketStatusBadge(item.item.status)}
                                                                {getTicketPriorityBadge(item.item.priority)}
                                                            </div>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(item.item.updated_at)}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-medium text-gray-900 mb-1">{item.item.title}</h3>
                                                        {item.item.description && (
                                                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                                {item.item.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                                            <span>
                                                                {item.item.assigned_user?.full_name ? (
                                                                    `Phụ trách: ${item.item.assigned_user.full_name}`
                                                                ) : (
                                                                    <span className="italic">Chưa phân công</span>
                                                                )}
                                                            </span>
                                                            <ExternalLink className="h-3 w-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
