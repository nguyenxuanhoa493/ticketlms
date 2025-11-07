import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    TicketTypeBadge,
    TicketStatusBadge,
    TicketPriorityBadge,
} from "@/components/badges";

interface Ticket {
    id: string;
    title: string;
    ticket_type: "bug" | "task";
    status: "open" | "in_progress" | "closed";
    priority: "low" | "medium" | "high";
    platform: "web" | "app" | "all";
    created_at: string;
    organizations?: {
        name: string;
    };
}

interface RecentTicketsProps {
    tickets: Ticket[];
}

export function RecentTickets({ tickets }: RecentTicketsProps) {
    return (
        <Card>
            <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-base md:text-lg">Tasks Gần Đây</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                    5 tickets được tạo mới nhất
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
                {tickets && tickets.length > 0 ? (
                    <div className="space-y-0 md:space-y-2">
                        {tickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/tickets/${ticket.id}`}
                                className="block py-2.5 md:py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 px-3 md:px-2 md:-mx-2 rounded transition-colors cursor-pointer"
                            >
                                {/* Desktop Layout */}
                                <div className="hidden md:flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="mb-1">
                                            <span className="text-sm font-medium text-gray-900 truncate block">
                                                {ticket.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <TicketTypeBadge
                                                type={ticket.ticket_type}
                                            />

                                            <span className="text-gray-500">
                                                •
                                            </span>
                                            <span className="text-gray-500">
                                                {ticket.organizations
                                                    ?.name ||
                                                    "Chưa xác định"}
                                            </span>
                                            <span className="text-gray-500">
                                                •
                                            </span>
                                            <span className="text-gray-500">
                                                {new Date(
                                                    ticket.created_at
                                                ).toLocaleDateString(
                                                    "vi-VN"
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-3">
                                        <TicketPriorityBadge
                                            priority={ticket.priority}
                                            className="text-xs"
                                        />
                                        <TicketStatusBadge
                                            status={ticket.status}
                                            className="text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Mobile Layout - 2 lines */}
                                <div className="md:hidden">
                                    {/* Line 1: Title */}
                                    <div className="mb-1.5">
                                        <span className="text-sm font-medium text-gray-900 line-clamp-2">
                                            {ticket.title}
                                        </span>
                                    </div>
                                    
                                    {/* Line 2: Tags */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {ticket.organizations?.name && (
                                            <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                                                {ticket.organizations.name}
                                            </span>
                                        )}
                                        <TicketTypeBadge type={ticket.ticket_type} />
                                        <TicketPriorityBadge
                                            priority={ticket.priority}
                                            className="text-xs"
                                        />
                                        <TicketStatusBadge
                                            status={ticket.status}
                                            className="text-xs"
                                        />
                                        <span className="text-xs text-gray-500">
                                            {new Date(ticket.created_at).toLocaleDateString("vi-VN")}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
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
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            Chưa có tickets
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Bắt đầu bằng cách tạo ticket đầu tiên.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 