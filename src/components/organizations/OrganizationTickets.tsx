"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ListTodo, Plus, ExternalLink, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { Database } from "@/types/database";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

interface TicketWithUsers extends Ticket {
    created_user?: {
        full_name: string | null;
    } | null;
    assigned_user?: {
        full_name: string | null;
    } | null;
}

interface Props {
    organizationId: string;
}

export default function OrganizationTickets({ organizationId }: Props) {
    const router = useRouter();
    const { toast } = useToast();
    const [tickets, setTickets] = useState<TicketWithUsers[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<TicketWithUsers[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");

    useEffect(() => {
        fetchTickets();
    }, [organizationId]);

    useEffect(() => {
        let filtered = tickets;

        console.log("[OrganizationTickets] Filtering:", {
            totalTickets: tickets.length,
            statusFilter,
            priorityFilter,
        });

        if (statusFilter !== "all") {
            filtered = filtered.filter((t) => t.status === statusFilter);
        }

        if (priorityFilter !== "all") {
            filtered = filtered.filter((t) => t.priority === priorityFilter);
        }

        console.log("[OrganizationTickets] Filtered result:", filtered.length);
        setFilteredTickets(filtered);
    }, [tickets, statusFilter, priorityFilter]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/tickets?organization_id=${organizationId}&limit=100`);
            const result = await response.json();

            console.log("[OrganizationTickets] API response:", result);

            if (!response.ok) {
                throw new Error(result.error || "Failed to fetch tickets");
            }

            // API trả về { data: [...], pagination: {...} }
            const ticketsData = result.data || [];
            console.log("[OrganizationTickets] Tickets count:", ticketsData.length);
            
            setTickets(ticketsData);
        } catch (error: unknown) {
            console.error("[OrganizationTickets] Error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to load tickets";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
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

    const getPriorityBadge = (priority: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
            low: { variant: "secondary", label: "Thấp" },
            medium: { variant: "default", label: "Trung bình" },
            high: { variant: "destructive", label: "Cao" },
        };
        const config = variants[priority] || variants.medium;
        return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
    };

    const openTickets = filteredTickets.filter((t) => t.status !== "closed");
    const closedTickets = filteredTickets.filter((t) => t.status === "closed");

    console.log("[OrganizationTickets] Render:", {
        loading,
        totalTickets: tickets.length,
        filteredTickets: filteredTickets.length,
        openTickets: openTickets.length,
        closedTickets: closedTickets.length,
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                        <ListTodo className="h-5 w-5" />
                        <span>Tickets ({openTickets.length} đang mở)</span>
                    </CardTitle>
                    <Button onClick={() => router.push(`/tickets?organization_id=${organizationId}`)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo ticket
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex space-x-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="open">Mở</SelectItem>
                            <SelectItem value="in_progress">Đang xử lý</SelectItem>
                            <SelectItem value="closed">Đã đóng</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
                            <SelectItem value="low">Thấp</SelectItem>
                            <SelectItem value="medium">Trung bình</SelectItem>
                            <SelectItem value="high">Cao</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <ListTodo className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>
                            {tickets.length === 0
                                ? "Chưa có ticket nào"
                                : "Không tìm thấy ticket với bộ lọc này"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Open Tickets */}
                        {openTickets.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                    Đang mở ({openTickets.length})
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tiêu đề</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Độ ưu tiên</TableHead>
                                            <TableHead>Người phụ trách</TableHead>
                                            <TableHead>Ngày tạo</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {openTickets.map((ticket) => (
                                            <TableRow key={ticket.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">
                                                    {ticket.title}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                                <TableCell>
                                                    {ticket.assigned_user?.full_name || (
                                                        <span className="text-gray-400 italic">
                                                            Chưa phân công
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {new Date(ticket.created_at).toLocaleDateString("vi-VN")}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.push(`/tickets/${ticket.id}`)}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Closed Tickets */}
                        {closedTickets.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                    Đã đóng ({closedTickets.length})
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tiêu đề</TableHead>
                                            <TableHead>Độ ưu tiên</TableHead>
                                            <TableHead>Người phụ trách</TableHead>
                                            <TableHead>Ngày đóng</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {closedTickets.map((ticket) => (
                                            <TableRow key={ticket.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium text-gray-600">
                                                    {ticket.title}
                                                </TableCell>
                                                <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                                <TableCell className="text-gray-600">
                                                    {ticket.assigned_user?.full_name || (
                                                        <span className="text-gray-400 italic">
                                                            Chưa phân công
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {ticket.closed_at
                                                        ? new Date(ticket.closed_at).toLocaleDateString("vi-VN")
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.push(`/tickets/${ticket.id}`)}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
