"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import RichTextEditor from "@/components/RichTextEditor";

import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    User,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Bug,
} from "lucide-react";

interface Organization {
    id: string;
    name: string;
    openTicketsCount?: number;
}

interface Profile {
    id: string;
    full_name: string | null;
    role: string;
    organization_id?: string | null;
    avatar_url?: string | null;
}

interface Ticket {
    id: string;
    title: string;
    description: string | null;
    ticket_type: "bug" | "task";
    status: "open" | "in_progress" | "closed";
    priority: "low" | "medium" | "high";
    platform: "web" | "app" | "all";
    organization_id: string | null;
    expected_completion_date: string | null;
    closed_at: string | null;
    response: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
    organizations?: Organization;
    created_user?: Profile;
}

interface TicketFormData {
    title: string;
    description: string;
    ticket_type: "bug" | "task";
    priority: "low" | "medium" | "high";
    platform: "web" | "app" | "all";
    status: "open" | "in_progress" | "closed";
    organization_id: string;
    expected_completion_date: string;
    closed_at: string;
}

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [currentUser, setCurrentUser] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
    const [formData, setFormData] = useState<TicketFormData>({
        title: "",
        description: "",
        ticket_type: "bug",
        priority: "medium",
        platform: "all",
        status: "open",
        organization_id: "",
        expected_completion_date: "",
        closed_at: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    // Filter states
    const [filterOrganization, setFilterOrganization] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [searchText, setSearchText] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    // Helper function to format datetime for timestamptz (GMT+7 to UTC)
    const formatDateTimeForDB = (datetimeLocal: string) => {
        if (!datetimeLocal || datetimeLocal.trim() === "") return null;

        try {
            // datetime-local format: "2024-01-15T14:30"
            // Validate format first
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeLocal)) {
                console.warn("Invalid datetime format:", datetimeLocal);
                return null;
            }

            // Treat as GMT+7 and convert to UTC
            const dateTime = datetimeLocal + ":00"; // Add seconds
            const localDate = new Date(dateTime); // Browser interprets as local time

            // Check if date is valid
            if (isNaN(localDate.getTime())) {
                console.warn("Invalid date value:", datetimeLocal);
                return null;
            }

            // Subtract 7 hours to convert GMT+7 to UTC
            const utcDate = new Date(localDate.getTime() - 7 * 60 * 60 * 1000);

            return utcDate.toISOString();
        } catch (error) {
            console.error(
                "Error formatting datetime for DB:",
                error,
                datetimeLocal
            );
            return null;
        }
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
    const router = useRouter();

    useEffect(() => {
        const filters: any = {};
        if (filterStatus !== "all") filters.status = filterStatus;
        if (searchText) filters.search = searchText;

        fetchTickets(currentPage, filters);
        fetchOrganizations();
        getCurrentUser();
    }, [currentPage, filterStatus, searchText]);

    // Server-side filtering is now handled by the API
    const filteredTickets = tickets;

    const getCurrentUser = async () => {
        try {
            // Get current user from server (simplified - in real app get from auth session)
            const response = await fetch("/api/current-user");
            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data); // Fix: API returns data directly, not data.user
            }
        } catch (error) {
            console.error("Error getting current user:", error);
        }
    };

    const fetchTickets = async (page = 1, filters = {}) => {
        try {
            setLoading(true);

            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                ...filters,
            });

            const response = await fetch(`/api/tickets?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch tickets");
            }

            setTickets(data.tickets);
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (error: unknown) {
            console.error("Error fetching tickets:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to fetch tickets";
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
        }
    };

    // Removed fetchUsers function as we don't need assigned_to anymore

    const handleOpenDialog = (ticket?: Ticket) => {
        if (ticket) {
            setEditingTicket(ticket);
            setFormData({
                title: ticket.title,
                description: ticket.description || "",
                ticket_type: ticket.ticket_type,
                priority: ticket.priority,
                platform: ticket.platform,
                status: ticket.status,
                organization_id: ticket.organization_id || "",
                expected_completion_date: ticket.expected_completion_date || "",
                closed_at: formatDateTimeForDisplay(ticket.closed_at || ""),
            });
        } else {
            setEditingTicket(null);
            // Nếu user/manager tạo ticket mới, tự động set organization
            const defaultOrgId =
                currentUser?.role === "admin"
                    ? ""
                    : currentUser?.organization_id || "";
            setFormData({
                title: "",
                description: "",
                ticket_type: "task", // Mặc định là task
                priority: "medium",
                platform: "all",
                status: "open",
                organization_id: defaultOrgId,
                expected_completion_date: "",
                closed_at: "",
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingTicket(null);
        setFormData({
            title: "",
            description: "",
            ticket_type: "bug",
            priority: "medium",
            platform: "all",
            status: "open",
            organization_id: "",
            expected_completion_date: "",
            closed_at: "",
        });
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
            setSubmitting(true);

            if (editingTicket) {
                // Update existing ticket
                const response = await fetch("/api/tickets", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: editingTicket.id,
                        title: formData.title,
                        description: formData.description,
                        ticket_type: formData.ticket_type,
                        priority: formData.priority,
                        platform: formData.platform,
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
            } else {
                // Create new ticket
                const response = await fetch("/api/tickets", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: formData.title,
                        description: formData.description,
                        ticket_type: formData.ticket_type,
                        priority: formData.priority,
                        platform: formData.platform,
                        organization_id: formData.organization_id || null,
                        expected_completion_date:
                            formData.expected_completion_date || null,
                        created_by: currentUser?.id || "unknown",
                    }),
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || "Failed to create ticket");
                }

                toast({
                    title: "Thành công",
                    description: "Đã tạo ticket mới",
                });
            }

            handleCloseDialog();
            fetchTickets();
        } catch (error: any) {
            console.error("Error saving ticket:", error);
            toast({
                title: "Lỗi",
                description: error.message || "Không thể lưu thông tin ticket",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        try {
            const response = await fetch(`/api/tickets?id=${id}`, {
                method: "DELETE",
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to delete ticket");
            }

            toast({
                title: "Thành công",
                description: `Đã xóa ticket "${title}"`,
            });

            fetchTickets();
        } catch (error: any) {
            console.error("Error deleting ticket:", error);
            toast({
                title: "Lỗi",
                description: error.message || "Không thể xóa ticket",
                variant: "destructive",
            });
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "open":
                return "default";
            case "in_progress":
                return "secondary";
            case "closed":
                return "outline";
            default:
                return "default";
        }
    };

    const getPriorityBadgeVariant = (priority: string) => {
        switch (priority) {
            case "high":
                return "destructive";
            case "medium":
                return "default";
            case "low":
                return "secondary";
            default:
                return "default";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "open":
                return "Mở";
            case "in_progress":
                return "Đang xử lý";
            case "closed":
                return "Đã đóng";
            default:
                return status;
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case "high":
                return "Cao";
            case "medium":
                return "T.bình";
            case "low":
                return "Thấp";
            default:
                return priority;
        }
    };

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
                return "destructive";
            case "task":
                return "secondary";
            default:
                return "outline";
        }
    };

    const getTicketTypeLabel = (type: string) => {
        switch (type) {
            case "bug":
                return "Bug";
            case "task":
                return "Task";
            default:
                return type;
        }
    };

    return (
        <div className="h-screen flex flex-col bg-white">
            <Toaster />

            {/* Header */}
            <div className="flex justify-between items-center p-6 flex-shrink-0 mx-[5%]">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quản lý Tickets
                    </h1>
                    <p className="text-sm text-gray-600">
                        Quản lý và theo dõi các tickets trong hệ thống
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Tạo Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingTicket
                                    ? "Sửa thông tin ticket"
                                    : "Tạo ticket mới"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Tiêu đề *</Label>
                                    <Input
                                        id="title"
                                        placeholder="Nhập tiêu đề ticket"
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                title: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Mô tả</Label>
                                    <RichTextEditor
                                        value={formData.description}
                                        onChange={(value) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                description: value,
                                            }))
                                        }
                                        placeholder="Mô tả chi tiết về ticket..."
                                        minHeight="min-h-32"
                                        maxHeight="max-h-64"
                                    />
                                </div>
                                {/* Ticket Type và Priority */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
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
                                                <SelectValue placeholder="Chọn loại ticket" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bug">
                                                    Bug
                                                </SelectItem>
                                                <SelectItem value="task">
                                                    Task
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">
                                            Độ ưu tiên
                                        </Label>
                                        <Select
                                            value={formData.priority}
                                            onValueChange={(
                                                value: "low" | "medium" | "high"
                                            ) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    priority: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn độ ưu tiên" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">
                                                    Thấp
                                                </SelectItem>
                                                <SelectItem value="medium">
                                                    Trung bình
                                                </SelectItem>
                                                <SelectItem value="high">
                                                    Cao
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Nền tảng, Đơn vị, Thời hạn */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="platform">
                                            Nền tảng
                                        </Label>
                                        <Select
                                            value={formData.platform}
                                            onValueChange={(
                                                value: "web" | "app" | "all"
                                            ) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    platform: value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn nền tảng" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="web">
                                                    Web
                                                </SelectItem>
                                                <SelectItem value="app">
                                                    App
                                                </SelectItem>
                                                <SelectItem value="all">
                                                    Tất cả
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Organization selection - chỉ admin mới có thể chọn */}
                                    {currentUser?.role === "admin" ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="organization">
                                                Đơn vị
                                            </Label>
                                            <Select
                                                value={
                                                    formData.organization_id ||
                                                    "none"
                                                }
                                                onValueChange={(value) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        organization_id:
                                                            value === "none"
                                                                ? ""
                                                                : value,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn đơn vị (tùy chọn)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        Không thuộc đơn vị nào
                                                    </SelectItem>
                                                    {organizations.map(
                                                        (org) => (
                                                            <SelectItem
                                                                key={org.id}
                                                                value={org.id}
                                                            >
                                                                {org.name}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label htmlFor="organization">
                                                Đơn vị
                                            </Label>
                                            <Input
                                                value={
                                                    organizations.find(
                                                        (org) =>
                                                            org.id ===
                                                            currentUser?.organization_id
                                                    )?.name || "Đơn vị của bạn"
                                                }
                                                disabled
                                                className="bg-gray-50"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Ticket sẽ được tạo trong đơn vị
                                                của bạn
                                            </p>
                                        </div>
                                    )}

                                    {/* Expected completion date */}
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

                                {/* Status và Closed Date - chỉ hiển thị khi editing */}
                                {editingTicket && (
                                    <div className="grid grid-cols-2 gap-4">
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
                                                        // Tự động set thời gian đóng khi status = closed (GMT+7)
                                                        closed_at:
                                                            value === "closed"
                                                                ? (() => {
                                                                      // Nếu đã có closed_at và đang chuyển về closed, giữ nguyên
                                                                      if (
                                                                          prev.closed_at &&
                                                                          prev.status ===
                                                                              "closed"
                                                                      ) {
                                                                          return prev.closed_at;
                                                                      }

                                                                      // Set GMT+7 current time khi chuyển từ other status -> closed
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

                                                                      // Format for datetime-local input using UTC methods
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
                                                    <SelectValue placeholder="Chọn trạng thái" />
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

                                        {/* Closed date - hiển thị khi edit ticket */}
                                        <div className="space-y-2">
                                            <Label htmlFor="closed_at">
                                                Thời gian đóng
                                            </Label>
                                            <Input
                                                id="closed_at"
                                                type="datetime-local"
                                                value={formData.closed_at}
                                                onFocus={(e) => {
                                                    // Chỉ set default khi field trống và user click vào
                                                    if (!formData.closed_at) {
                                                        // Get current time in GMT+7
                                                        const now = new Date();
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

                                                        // Format for datetime-local input
                                                        const year =
                                                            gmt7Now.getUTCFullYear();
                                                        const month = String(
                                                            gmt7Now.getUTCMonth() +
                                                                1
                                                        ).padStart(2, "0");
                                                        const day = String(
                                                            gmt7Now.getUTCDate()
                                                        ).padStart(2, "0");
                                                        const hour = String(
                                                            gmt7Now.getUTCHours()
                                                        ).padStart(2, "0");
                                                        const minute = String(
                                                            gmt7Now.getUTCMinutes()
                                                        ).padStart(2, "0");
                                                        const formattedTime = `${year}-${month}-${day}T${hour}:${minute}`;

                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            closed_at:
                                                                formattedTime,
                                                        }));
                                                    }
                                                }}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        closed_at:
                                                            e.target.value,
                                                    }))
                                                }
                                            />
                                            <p className="text-xs text-gray-500">
                                                Thời gian ticket được đóng (tùy
                                                chọn)
                                            </p>
                                        </div>
                                    </div>
                                )}
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
                                        : editingTicket
                                        ? "Cập nhật"
                                        : "Tạo mới"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tickets Table */}
            <div className="flex-1 flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0 mx-[5%]">
                    {/* Filter Bar */}
                    <div className="flex gap-4 items-center flex-wrap">
                        {/* Organization Filter (Admin only) */}
                        {currentUser?.role === "admin" && (
                            <div className="min-w-48">
                                <Label
                                    htmlFor="filter-organization"
                                    className="text-sm font-medium"
                                >
                                    Đơn vị
                                </Label>
                                <Select
                                    value={filterOrganization}
                                    onValueChange={setFilterOrganization}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Tất cả đơn vị" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Tất cả đơn vị{" "}
                                            {organizations.length > 0 &&
                                                `(${organizations.reduce(
                                                    (total, org) =>
                                                        total +
                                                        (org.openTicketsCount ||
                                                            0),
                                                    0
                                                )})`}
                                        </SelectItem>
                                        {organizations.map((org) => (
                                            <SelectItem
                                                key={org.id}
                                                value={org.id}
                                            >
                                                {org.name}
                                                {org.openTicketsCount !==
                                                undefined
                                                    ? ` (${org.openTicketsCount})`
                                                    : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Status Filter */}
                        <div className="min-w-40">
                            <Label
                                htmlFor="filter-status"
                                className="text-sm font-medium"
                            >
                                Trạng thái
                            </Label>
                            <Select
                                value={filterStatus}
                                onValueChange={setFilterStatus}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Tất cả trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tất cả trạng thái
                                    </SelectItem>
                                    <SelectItem value="open">Mở</SelectItem>
                                    <SelectItem value="in_progress">
                                        Đang xử lý
                                    </SelectItem>
                                    <SelectItem value="closed">
                                        Đã đóng
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Text Search */}
                        <div className="flex-1 min-w-64">
                            <Label
                                htmlFor="search-text"
                                className="text-sm font-medium"
                            >
                                Tìm kiếm
                            </Label>
                            <Input
                                id="search-text"
                                type="text"
                                placeholder="Tìm trong tiêu đề, nội dung, phản hồi..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Clear Filters */}
                        {((filterOrganization &&
                            filterOrganization !== "all") ||
                            (filterStatus && filterStatus !== "all") ||
                            searchText) && (
                            <div className="pt-6">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setFilterOrganization("all");
                                        setFilterStatus("all");
                                        setSearchText("");
                                    }}
                                >
                                    Xóa bộ lọc
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-12">
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
                                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14H4a1 1 0 00-1 1v3a2 2 0 002 2h1a2 2 0 002-2v-3a1 1 0 00-1-1H5z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {tickets.length === 0
                                ? "Chưa có ticket nào"
                                : "Không tìm thấy ticket"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {tickets.length === 0
                                ? "Bắt đầu bằng cách tạo ticket đầu tiên."
                                : "Thử điều chỉnh bộ lọc để tìm thấy ticket phù hợp."}
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto mx-[5%]">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-12">STT</TableHead>
                                    {currentUser?.role === "admin" && (
                                        <TableHead className="w-32">
                                            Đơn vị
                                        </TableHead>
                                    )}
                                    <TableHead className="w-20">Loại</TableHead>
                                    <TableHead className="w-24">
                                        Nền tảng
                                    </TableHead>
                                    <TableHead className="w-48">
                                        Tiêu đề
                                    </TableHead>
                                    <TableHead className="w-24">
                                        Ưu tiên
                                    </TableHead>
                                    <TableHead className="w-28">
                                        Thời hạn
                                    </TableHead>
                                    <TableHead className="w-32">
                                        Người tạo
                                    </TableHead>
                                    <TableHead className="w-36">
                                        Trạng thái
                                    </TableHead>
                                    <TableHead className="w-40">
                                        Thời gian đóng
                                    </TableHead>
                                    <TableHead className="w-32">
                                        T.gian xử lý
                                    </TableHead>
                                    <TableHead className="w-24 text-right">
                                        Thao tác
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTickets.map((ticket, index) => (
                                    <TableRow
                                        key={ticket.id}
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() =>
                                            router.push(`/tickets/${ticket.id}`)
                                        }
                                    >
                                        <TableCell className="text-center">
                                            {index + 1}
                                        </TableCell>
                                        {currentUser?.role === "admin" && (
                                            <TableCell>
                                                {ticket.organizations?.name ||
                                                    "Không xác định"}
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Badge
                                                variant={getTicketTypeBadgeVariant(
                                                    ticket.ticket_type
                                                )}
                                                className={
                                                    ticket.ticket_type ===
                                                    "task"
                                                        ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
                                                        : ""
                                                }
                                            >
                                                <div className="flex items-center gap-1">
                                                    {getTicketTypeIcon(
                                                        ticket.ticket_type
                                                    )}
                                                    {getTicketTypeLabel(
                                                        ticket.ticket_type
                                                    )}
                                                </div>
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    ticket.platform === "web"
                                                        ? "bg-green-100 text-green-800 border-green-200"
                                                        : ticket.platform ===
                                                          "app"
                                                        ? "bg-purple-100 text-purple-800 border-purple-200"
                                                        : "bg-gray-100 text-gray-800 border-gray-200"
                                                }
                                            >
                                                {ticket.platform === "web"
                                                    ? "Web"
                                                    : ticket.platform === "app"
                                                    ? "App"
                                                    : "Tất cả"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            <div className="max-w-48 break-words">
                                                {ticket.title}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getPriorityBadgeVariant(
                                                    ticket.priority
                                                )}
                                                className={
                                                    ticket.priority === "medium"
                                                        ? "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
                                                        : ""
                                                }
                                            >
                                                {getPriorityLabel(
                                                    ticket.priority
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {ticket.expected_completion_date
                                                ? new Date(
                                                      ticket.expected_completion_date
                                                  ).toLocaleDateString("vi-VN")
                                                : "Chưa đặt"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 overflow-hidden">
                                                    {ticket.created_user
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
                                                        ticket.created_user?.full_name?.charAt(
                                                            0
                                                        ) || "U"
                                                    )}
                                                </div>
                                                <span className="text-sm">
                                                    {ticket.created_user
                                                        ?.full_name ||
                                                        "Không xác định"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getStatusBadgeVariant(
                                                    ticket.status
                                                )}
                                                className={
                                                    ticket.status ===
                                                    "in_progress"
                                                        ? "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
                                                        : ticket.status ===
                                                          "closed"
                                                        ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                                        : ""
                                                }
                                            >
                                                {getStatusLabel(ticket.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {ticket.closed_at
                                                ? new Date(
                                                      ticket.closed_at
                                                  ).toLocaleString("vi-VN", {
                                                      timeZone:
                                                          "Asia/Ho_Chi_Minh",
                                                      year: "numeric",
                                                      month: "2-digit",
                                                      day: "2-digit",
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                  })
                                                : "Chưa đóng"}
                                        </TableCell>
                                        <TableCell>
                                            {ticket.closed_at &&
                                            ticket.created_at
                                                ? (() => {
                                                      const created = new Date(
                                                          ticket.created_at
                                                      );
                                                      const closed = new Date(
                                                          ticket.closed_at
                                                      );
                                                      const diffMs =
                                                          closed.getTime() -
                                                          created.getTime();
                                                      const diffDays =
                                                          Math.floor(
                                                              diffMs /
                                                                  (1000 *
                                                                      60 *
                                                                      60 *
                                                                      24)
                                                          );
                                                      const diffHours =
                                                          Math.floor(
                                                              (diffMs %
                                                                  (1000 *
                                                                      60 *
                                                                      60 *
                                                                      24)) /
                                                                  (1000 *
                                                                      60 *
                                                                      60)
                                                          );
                                                      const diffMinutes =
                                                          Math.floor(
                                                              (diffMs %
                                                                  (1000 *
                                                                      60 *
                                                                      60)) /
                                                                  (1000 * 60)
                                                          );

                                                      if (diffDays > 0) {
                                                          return `${diffDays}d ${diffHours}h`;
                                                      } else if (
                                                          diffHours > 0
                                                      ) {
                                                          return `${diffHours}h ${diffMinutes}m`;
                                                      } else {
                                                          return `${diffMinutes}m`;
                                                      }
                                                  })()
                                                : "Chưa hoàn thành"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div
                                                className="flex items-center justify-end space-x-2"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(
                                                            `/tickets/${ticket.id}`
                                                        );
                                                    }}
                                                >
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
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                    Sửa
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
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
                                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                />
                                                            </svg>
                                                            Xóa
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Xác nhận xóa
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Bạn có chắc chắn
                                                                muốn xóa ticket{" "}
                                                                <strong>
                                                                    "
                                                                    {
                                                                        ticket.title
                                                                    }
                                                                    "
                                                                </strong>
                                                                ? Hành động này
                                                                không thể hoàn
                                                                tác.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Hủy
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(
                                                                        ticket.id,
                                                                        ticket.title
                                                                    );
                                                                }}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                Xóa
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-700">
                            Hiển thị{" "}
                            {(pagination.page - 1) * pagination.limit + 1} -{" "}
                            {Math.min(
                                pagination.page * pagination.limit,
                                pagination.total
                            )}{" "}
                            của {pagination.total} tickets
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                            >
                                Trước
                            </Button>
                            <span className="text-sm text-gray-700">
                                Trang {currentPage} của {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage(
                                        Math.min(
                                            pagination.totalPages,
                                            currentPage + 1
                                        )
                                    )
                                }
                                disabled={currentPage === pagination.totalPages}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
