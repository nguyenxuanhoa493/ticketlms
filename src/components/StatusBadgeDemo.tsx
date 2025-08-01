import React from "react";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { AnimatedStatusBadge } from "./AnimatedStatusBadge";
import { TicketStatus } from "@/lib/ticket-utils";

export function StatusBadgeDemo() {
    const statuses: TicketStatus[] = ["open", "in_progress", "closed"];

    const handleStatusClick = (status: TicketStatus) => {
        console.log(`Clicked on status: ${status}`);
        // Có thể thêm logic xử lý click ở đây
    };

    return (
        <div className="p-6 space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">
                    Ticket Status Badge Demo
                </h2>
                <p className="text-gray-600 mb-6">
                    Hiển thị các variant và size khác nhau của TicketStatusBadge
                </p>
            </div>

            {/* Animated Status Badges */}
            <div>
                <h3 className="text-lg font-semibold mb-3">
                    Animated Status Badges
                </h3>
                <div className="flex flex-wrap gap-4">
                    {statuses.map((status) => (
                        <div
                            key={status}
                            className="flex flex-col items-center gap-2"
                        >
                            <AnimatedStatusBadge
                                status={status}
                                clickable={true}
                                onClick={() => handleStatusClick(status)}
                            />
                            <span className="text-xs text-gray-500">
                                {status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Default Variants */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Default Variants</h3>
                <div className="flex flex-wrap gap-4">
                    {statuses.map((status) => (
                        <div
                            key={status}
                            className="flex flex-col items-center gap-2"
                        >
                            <TicketStatusBadge status={status} />
                            <span className="text-xs text-gray-500">
                                {status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Outline Variants */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Outline Variants</h3>
                <div className="flex flex-wrap gap-4">
                    {statuses.map((status) => (
                        <div
                            key={status}
                            className="flex flex-col items-center gap-2"
                        >
                            <TicketStatusBadge
                                status={status}
                                variant="outline"
                            />
                            <span className="text-xs text-gray-500">
                                {status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Solid Variants */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Solid Variants</h3>
                <div className="flex flex-wrap gap-4">
                    {statuses.map((status) => (
                        <div
                            key={status}
                            className="flex flex-col items-center gap-2"
                        >
                            <TicketStatusBadge
                                status={status}
                                variant="solid"
                            />
                            <span className="text-xs text-gray-500">
                                {status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Different Sizes */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Different Sizes</h3>
                <div className="space-y-4">
                    {statuses.map((status) => (
                        <div key={status} className="flex items-center gap-4">
                            <span className="w-20 text-sm font-medium">
                                {status}:
                            </span>
                            <div className="flex items-center gap-3">
                                <TicketStatusBadge status={status} size="sm" />
                                <TicketStatusBadge status={status} size="md" />
                                <TicketStatusBadge status={status} size="lg" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Icon Only */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Icon Only</h3>
                <div className="flex flex-wrap gap-4">
                    {statuses.map((status) => (
                        <div
                            key={status}
                            className="flex flex-col items-center gap-2"
                        >
                            <TicketStatusBadge
                                status={status}
                                showLabel={false}
                            />
                            <span className="text-xs text-gray-500">
                                {status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Label Only */}
            <div>
                <h3 className="text-lg font-semibold mb-3">Label Only</h3>
                <div className="flex flex-wrap gap-4">
                    {statuses.map((status) => (
                        <div
                            key={status}
                            className="flex flex-col items-center gap-2"
                        >
                            <TicketStatusBadge
                                status={status}
                                showIcon={false}
                            />
                            <span className="text-xs text-gray-500">
                                {status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Interactive Examples */}
            <div>
                <h3 className="text-lg font-semibold mb-3">
                    Interactive Examples
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <h4 className="font-medium mb-2">Ticket #123</h4>
                        <p className="text-sm text-gray-600 mb-3">
                            Fix login button not working
                        </p>
                        <div className="flex gap-2">
                            <AnimatedStatusBadge
                                status="open"
                                size="sm"
                                clickable={true}
                                onClick={() => handleStatusClick("open")}
                            />
                            <span className="text-xs text-gray-500">
                                2 hours ago
                            </span>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <h4 className="font-medium mb-2">Ticket #124</h4>
                        <p className="text-sm text-gray-600 mb-3">
                            Update user profile page
                        </p>
                        <div className="flex gap-2">
                            <AnimatedStatusBadge
                                status="in_progress"
                                size="sm"
                                clickable={true}
                                onClick={() => handleStatusClick("in_progress")}
                            />
                            <span className="text-xs text-gray-500">
                                1 hour ago
                            </span>
                        </div>
                    </div>

                    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <h4 className="font-medium mb-2">Ticket #125</h4>
                        <p className="text-sm text-gray-600 mb-3">
                            Add dark mode feature
                        </p>
                        <div className="flex gap-2">
                            <AnimatedStatusBadge
                                status="closed"
                                size="sm"
                                clickable={true}
                                onClick={() => handleStatusClick("closed")}
                            />
                            <span className="text-xs text-gray-500">
                                5 minutes ago
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison */}
            <div>
                <h3 className="text-lg font-semibold mb-3">
                    Regular vs Animated
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium mb-3">Regular Badges</h4>
                        <div className="space-y-2">
                            {statuses.map((status) => (
                                <div
                                    key={status}
                                    className="flex items-center gap-2"
                                >
                                    <TicketStatusBadge
                                        status={status}
                                        size="sm"
                                    />
                                    <span className="text-sm">{status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium mb-3">Animated Badges</h4>
                        <div className="space-y-2">
                            {statuses.map((status) => (
                                <div
                                    key={status}
                                    className="flex items-center gap-2"
                                >
                                    <AnimatedStatusBadge
                                        status={status}
                                        size="sm"
                                        clickable={true}
                                        onClick={() =>
                                            handleStatusClick(status)
                                        }
                                    />
                                    <span className="text-sm">{status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
