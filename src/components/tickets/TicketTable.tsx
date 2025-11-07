import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    TicketTypeBadge,
    TicketStatusBadge,
    TicketPriorityBadge,
    PlatformBadge,
    JiraBadge,
} from "@/components/badges";
import { Pagination } from "@/components/ui/pagination";
import { Ticket, CurrentUser } from "@/types";
import { ExternalLink, Trash2 } from "lucide-react";
import { TicketDetailSheet } from "./TicketDetailSheet";
import { JiraStatusBadge } from "@/components/badges";

interface TicketTableProps {
    tickets: Ticket[];
    currentUser: CurrentUser | null;
    onDelete: (id: string, title: string) => Promise<void>;
    getDeadlineCountdown: (expectedDate: string | null, status: string) => { text: string; color: string; isOverdue: boolean } | null;
    // Pagination props
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
}

export function TicketTable({
    tickets,
    currentUser,
    onDelete,
    getDeadlineCountdown,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
}: TicketTableProps) {
    const router = useRouter();
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [jiraStatuses, setJiraStatuses] = useState<Record<string, { status: string; statusCategory: string }>>({});
    const [loadingJira, setLoadingJira] = useState(false);

    // Fetch Jira statuses for all tickets with jira_link
    useEffect(() => {
        const ticketsWithJira = tickets.filter((t) => t.jira_link);
        if (ticketsWithJira.length === 0) {
            setJiraStatuses({});
            return;
        }

        // Debounce to prevent multiple calls
        let isCancelled = false;
        const timeoutId = setTimeout(() => {
            const fetchJiraStatuses = async () => {
                if (isCancelled) return;

                setLoadingJira(true);
                try {
                    const response = await fetch("/api/jira/batch-status", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            jiraLinks: ticketsWithJira.map((t) => t.jira_link),
                        }),
                    });

                    if (response.ok && !isCancelled) {
                        const data = await response.json();
                        setJiraStatuses(data.statuses || {});
                    }
                } catch (error) {
                    if (!isCancelled) {
                        console.error("Failed to fetch Jira statuses:", error);
                    }
                } finally {
                    if (!isCancelled) {
                        setLoadingJira(false);
                    }
                }
            };

            fetchJiraStatuses();
        }, 300); // 300ms debounce

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [tickets]);

    const handleTicketClick = (ticketId: string) => {
        setSelectedTicketId(ticketId);
        setSheetOpen(true);
    };

    const handleOpenInNewTab = (ticketId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`/tickets/${ticketId}`, "_blank");
    };

    return (
        <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border w-full">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">STT</TableHead>
                            {currentUser?.role === "admin" && (
                                <TableHead className="w-auto">Đơn vị</TableHead>
                            )}
                            <TableHead className="w-auto">Loại</TableHead>
                            <TableHead className="w-auto">Nền tảng</TableHead>
                            <TableHead className="w-full">Tiêu đề</TableHead>
                            {currentUser?.role === "admin" && (
                                <TableHead className="w-auto">JIRA</TableHead>
                            )}

                            <TableHead className="w-auto">Ưu tiên</TableHead>
                            <TableHead className="w-auto">Thời hạn</TableHead>
                            <TableHead className="w-auto">Trạng thái</TableHead>
                            <TableHead className="w-auto">
                                T.gian đóng
                            </TableHead>
                            <TableHead className="w-auto">T.gian làm</TableHead>
                            <TableHead className="text-right w-auto">
                                Thao tác
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets?.map((ticket, index) => {
                            const jiraStatus = ticket.jira_link ? jiraStatuses[ticket.jira_link] : null;
                            const isJiraDone = jiraStatus?.statusCategory?.toLowerCase() === "done";
                            return (
                            <TableRow
                                key={ticket.id}
                                className={`cursor-pointer transition-colors ${
                                    isJiraDone 
                                        ? "bg-green-50 hover:bg-green-100" 
                                        : "hover:bg-gray-50"
                                }`}
                                onClick={() => handleTicketClick(ticket.id)}
                            >
                                <TableCell className="py-2 text-center w-12">
                                    {(currentPage - 1) * itemsPerPage +
                                        index +
                                        1}
                                </TableCell>
                                {currentUser?.role === "admin" && (
                                    <TableCell className="py-2 w-auto">
                                        <Badge
                                            variant="outline"
                                            className="bg-gray-100 text-gray-800 border-gray-200 text-xs"
                                        >
                                            {ticket.organizations?.name ||
                                                "N/A"}
                                        </Badge>
                                    </TableCell>
                                )}
                                <TableCell className="py-2 w-auto">
                                    <TicketTypeBadge
                                        type={ticket.ticket_type}
                                    />
                                </TableCell>
                                <TableCell className="py-2 w-auto">
                                    <PlatformBadge
                                        platform={ticket.platform}
                                        size="md"
                                    />
                                </TableCell>
                                <TableCell className="font-medium py-2 w-full">
                                    <div className="break-words">
                                        {ticket.title}
                                    </div>
                                </TableCell>
                                {currentUser?.role === "admin" && (
                                    <TableCell className="py-2 w-auto">
                                        {ticket.jira_link ? (
                                            <JiraStatusBadge
                                                status={jiraStatus?.status}
                                                statusCategory={jiraStatus?.statusCategory}
                                                jiraLink={ticket.jira_link}
                                                loading={loadingJira && !jiraStatus}
                                            />
                                        ) : (
                                            <JiraBadge
                                                jiraLink={ticket.jira_link}
                                                size="sm"
                                            />
                                        )}
                                    </TableCell>
                                )}

                                <TableCell className="py-2 w-auto">
                                    <TicketPriorityBadge
                                        priority={ticket.priority}
                                        size="sm"
                                    />
                                </TableCell>
                                <TableCell className="py-2 w-auto">
                                    {ticket.expected_completion_date ? (
                                        <div className="space-y-1">
                                            <div className="text-sm">
                                                {new Date(
                                                    ticket.expected_completion_date
                                                ).toLocaleDateString("vi-VN")}
                                            </div>
                                            {(() => {
                                                const countdown =
                                                    getDeadlineCountdown(
                                                        ticket.expected_completion_date,
                                                        ticket.status
                                                    );
                                                if (!countdown) return null;

                                                let bgColor = "bg-gray-100";
                                                if (countdown.isOverdue) {
                                                    bgColor = "bg-red-100";
                                                } else if (countdown.color.includes("orange") || countdown.color.includes("yellow")) {
                                                    bgColor = "bg-orange-100";
                                                }

                                                return (
                                                    <div
                                                        className={`text-xs px-2 py-1 rounded-full ${bgColor} ${countdown.color} font-medium`}
                                                    >
                                                        {countdown.text}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">
                                            -
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="py-2 w-auto">
                                    <TicketStatusBadge
                                        status={ticket.status}
                                        size="sm"
                                    />
                                </TableCell>
                                <TableCell className="py-2 w-auto">
                                    {ticket.closed_at ? (
                                        <div className="space-y-1">
                                            <div className="text-sm font-medium">
                                                {new Date(
                                                    ticket.closed_at
                                                ).toLocaleDateString("vi-VN", {
                                                    timeZone:
                                                        "Asia/Ho_Chi_Minh",
                                                    year: "numeric",
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                })}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(
                                                    ticket.closed_at
                                                ).toLocaleTimeString("vi-VN", {
                                                    timeZone:
                                                        "Asia/Ho_Chi_Minh",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">
                                            -
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="py-2 w-auto">
                                    {ticket.closed_at && ticket.created_at ? (
                                        (() => {
                                            const created = new Date(
                                                ticket.created_at
                                            );
                                            const closed = new Date(
                                                ticket.closed_at
                                            );
                                            const diffMs =
                                                closed.getTime() -
                                                created.getTime();
                                            const diffDays = Math.floor(
                                                diffMs / (1000 * 60 * 60 * 24)
                                            );
                                            const diffHours = Math.floor(
                                                (diffMs %
                                                    (1000 * 60 * 60 * 24)) /
                                                    (1000 * 60 * 60)
                                            );
                                            const diffMinutes = Math.floor(
                                                (diffMs % (1000 * 60 * 60)) /
                                                    (1000 * 60)
                                            );

                                            if (diffDays > 0) {
                                                return `${diffDays}d ${diffHours}h`;
                                            } else if (diffHours > 0) {
                                                return `${diffHours}h ${diffMinutes}m`;
                                            } else {
                                                return `${diffMinutes}m`;
                                            }
                                        })()
                                    ) : (
                                        <span className="text-gray-400 text-sm">
                                            -
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right py-2 w-auto">
                                    <div
                                        className="flex items-center justify-end space-x-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(
                                                    `/tickets/${ticket.id}`,
                                                    "_blank"
                                                );
                                            }}
                                            title="Mở trong tab mới"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                        {currentUser?.role === "admin" && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(
                                                        ticket.id,
                                                        ticket.title
                                                    );
                                                }}
                                                title="Xóa ticket"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-2 px-2">
                {tickets?.map((ticket, index) => {
                    const jiraStatus = ticket.jira_link ? jiraStatuses[ticket.jira_link] : null;
                    const isJiraDone = jiraStatus?.statusCategory?.toLowerCase() === "done";
                    
                    return (
                        <div
                            key={ticket.id}
                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                isJiraDone 
                                    ? "bg-green-50 hover:bg-green-100 border-green-200" 
                                    : "bg-white hover:bg-gray-50"
                            }`}
                            onClick={() => handleTicketClick(ticket.id)}
                        >
                            {/* Line 1: Title */}
                            <div className="font-medium text-sm mb-2 line-clamp-2">
                                <span className="text-gray-500 mr-2">#{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                {ticket.title}
                            </div>

                            {/* Line 2: Tags */}
                            <div className="flex flex-wrap gap-1.5 items-center">
                                {currentUser?.role === "admin" && ticket.organizations?.name && (
                                    <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 text-xs px-1.5 py-0">
                                        {ticket.organizations.name}
                                    </Badge>
                                )}
                                <TicketTypeBadge type={ticket.ticket_type} />
                                <PlatformBadge platform={ticket.platform} size="sm" />
                                <TicketPriorityBadge priority={ticket.priority} size="sm" />
                                <TicketStatusBadge status={ticket.status} size="sm" />
                                
                                {currentUser?.role === "admin" && ticket.jira_link && (
                                    <JiraStatusBadge
                                        status={jiraStatus?.status}
                                        statusCategory={jiraStatus?.statusCategory}
                                        jiraLink={ticket.jira_link}
                                        loading={loadingJira && !jiraStatus}
                                    />
                                )}

                                {ticket.expected_completion_date && (() => {
                                    const countdown = getDeadlineCountdown(ticket.expected_completion_date, ticket.status);
                                    if (!countdown) return null;

                                    let bgColor = "bg-gray-100";
                                    if (countdown.isOverdue) {
                                        bgColor = "bg-red-100";
                                    } else if (countdown.color.includes("orange") || countdown.color.includes("yellow")) {
                                        bgColor = "bg-orange-100";
                                    }

                                    return (
                                        <div className={`text-xs px-1.5 py-0.5 rounded ${bgColor} ${countdown.color} font-medium`}>
                                            {countdown.text}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
                onItemsPerPageChange={onItemsPerPageChange}
            />

            {/* Ticket Detail Sheet */}
            <TicketDetailSheet
                ticketId={selectedTicketId}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                jiraStatuses={jiraStatuses}
            />
        </div>
    );
}
