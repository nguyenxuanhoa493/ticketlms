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
            <CardHeader>
                <CardTitle>Tasks Gần Đây</CardTitle>
                <CardDescription>
                    5 tickets được tạo mới nhất
                </CardDescription>
            </CardHeader>
            <CardContent>
                {tickets && tickets.length > 0 ? (
                    <div className="space-y-2">
                        {tickets.map((ticket) => (
                            <Link
                                key={ticket.id}
                                href={`/tickets/${ticket.id}`}
                                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 px-2 -mx-2 rounded transition-colors cursor-pointer"
                            >
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