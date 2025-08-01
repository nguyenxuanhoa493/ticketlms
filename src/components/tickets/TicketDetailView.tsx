import React from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    TicketTypeBadge,
    TicketStatusBadge,
    TicketPriorityBadge,
    PlatformBadge,
} from "@/components/ticket-badges";
import HtmlContent from "@/components/HtmlContent";
import JiraInfo from "@/components/JiraInfo";
import { Ticket, CurrentUser } from "@/types";

interface TicketDetailViewProps {
    ticket: Ticket;
    currentUser: CurrentUser | null;
}

export function TicketDetailView({
    ticket,
    currentUser,
}: TicketDetailViewProps) {
    return (
        <div className="space-y-6">
            {/* Row 1 - Đơn vị và Tiêu đề */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="space-y-2 md:col-span-3">
                    <Label className="text-sm font-medium text-gray-500">
                        Đơn vị
                    </Label>
                    <p className="text-sm text-gray-900">
                        {ticket?.organizations?.name || "Không xác định"}
                    </p>
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

            {/* Row 2 - Loại ticket, Ưu tiên, Thời hạn */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">
                        Loại ticket
                    </Label>
                    <div>
                        <TicketTypeBadge type={ticket?.ticket_type || "task"} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">
                        Ưu tiên
                    </Label>
                    <div>
                        <TicketPriorityBadge
                            priority={ticket?.priority || "medium"}
                            size="md"
                        />
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
                              ).toLocaleDateString("vi-VN")
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
                        <PlatformBadge
                            platform={ticket?.platform || "all"}
                            size="md"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">
                        Trạng thái
                    </Label>
                    <div>
                        <TicketStatusBadge
                            status={ticket?.status || "open"}
                            size="md"
                            variant="default"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-500">
                        Thời gian đóng
                    </Label>
                    <p className="text-sm text-gray-900">
                        {ticket?.closed_at
                            ? new Date(ticket.closed_at).toLocaleString(
                                  "vi-VN",
                                  {
                                      timeZone: "Asia/Ho_Chi_Minh",
                                  }
                              )
                            : "Chưa đóng"}
                    </p>
                </div>
            </div>

            {/* JIRA Info - Only for admin users */}
            {ticket?.jira_link && currentUser?.role === "admin" && (
                <JiraInfo jiraLink={ticket.jira_link} />
            )}

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
                            {ticket?.created_user?.avatar_url ? (
                                <img
                                    src={ticket.created_user.avatar_url}
                                    alt={
                                        ticket.created_user.full_name || "User"
                                    }
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                ticket?.created_user?.full_name?.charAt(0) ||
                                "U"
                            )}
                        </div>
                        <span className="text-sm text-gray-900">
                            {ticket?.created_user?.full_name ||
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
                            new Date(ticket.created_at).toLocaleString(
                                "vi-VN",
                                {
                                    timeZone: "Asia/Ho_Chi_Minh",
                                }
                            )}
                    </p>
                </div>
            </div>
        </div>
    );
}
