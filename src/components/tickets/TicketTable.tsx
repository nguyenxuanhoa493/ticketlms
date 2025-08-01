import React from "react";
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
} from "@/components/ticket-badges";
import { Pagination } from "@/components/ui/pagination";
import { Ticket, CurrentUser } from "@/types";
import { ExternalLink, Trash2 } from "lucide-react";

interface TicketTableProps {
    tickets: Ticket[];
    currentUser: CurrentUser | null;
    onDelete: (id: string, title: string) => Promise<void>;
    getDeadlineCountdown: (expectedDate: string | null, status: string) => any;
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

    return (
        <div className="space-y-4">
            <div className="rounded-md border w-full">
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
                                Thời gian đóng
                            </TableHead>
                            <TableHead className="w-auto">
                                Thời gian xử lý
                            </TableHead>
                            <TableHead className="text-right w-auto">
                                Thao tác
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets?.map((ticket, index) => (
                            <TableRow
                                key={ticket.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() =>
                                    router.push(`/tickets/${ticket.id}`)
                                }
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
                                        <JiraBadge
                                            jiraLink={ticket.jira_link}
                                            size="sm"
                                        />
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

                                                const isOverdue =
                                                    countdown.days < 0;
                                                const isUrgent =
                                                    countdown.days <= 3 &&
                                                    countdown.days >= 0;
                                                const isWarning =
                                                    countdown.days <= 7 &&
                                                    countdown.days > 3;

                                                let textColor = "text-gray-600";
                                                let bgColor = "bg-gray-100";

                                                if (isOverdue || isUrgent) {
                                                    textColor = "text-red-600";
                                                    bgColor = "bg-red-100";
                                                } else if (isWarning) {
                                                    textColor =
                                                        "text-orange-600";
                                                    bgColor = "bg-orange-100";
                                                }

                                                return (
                                                    <div
                                                        className={`text-xs px-2 py-1 rounded-full ${bgColor} ${textColor} font-medium`}
                                                    >
                                                        {countdown.days > 0
                                                            ? `+${countdown.days} ngày`
                                                            : `${countdown.days} ngày`}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        "Chưa đặt"
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
                                            Chưa đóng
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="py-2 w-auto">
                                    {ticket.closed_at && ticket.created_at
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
                                        : ""}
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
                        ))}
                    </TableBody>
                </Table>
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
        </div>
    );
}
