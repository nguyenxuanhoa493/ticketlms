import React from "react";
import { Badge } from "@/components/ui/badge";
import {
    TicketPriority,
    getPriorityLabel,
    getPriorityBadgeClasses,
} from "@/lib/ticket-utils";

interface TicketPriorityBadgeProps {
    priority: TicketPriority;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function TicketPriorityBadge({
    priority,
    className = "",
    size = "md",
}: TicketPriorityBadgeProps) {
    const label = getPriorityLabel(priority);
    const customClasses = getPriorityBadgeClasses(priority);

    // Render SVG icon cho priority giống JIRA
    const renderPriorityIcon = (priority: TicketPriority) => {
        const iconColor =
            priority === "high"
                ? "#dc2626"
                : priority === "medium"
                  ? "#d97706"
                  : "#3b82f6";

        switch (priority) {
            case "low":
                return (
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={iconColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3"
                    >
                        <path d="M7 13l5 5 5-5" />
                        <path d="M7 6l5 5 5-5" />
                    </svg>
                );
            case "medium":
                return (
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={iconColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3"
                    >
                        <path d="M5 12h14" />
                        <path d="M5 6h14" />
                        <path d="M5 18h14" />
                    </svg>
                );
            case "high":
                return (
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={iconColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-3 h-3"
                    >
                        <path d="M7 11l5-5 5 5" />
                        <path d="M7 18l5-5 5 5" />
                    </svg>
                );
            default:
                return null;
        }
    };

    // Lấy size classes
    const getSizeClasses = () => {
        switch (size) {
            case "sm":
                return "px-2 py-0.5 text-xs";
            case "lg":
                return "px-3 py-1 text-sm";
            default:
                return "px-2.5 py-0.5 text-xs";
        }
    };

    const sizeClasses = getSizeClasses();

    return (
        <Badge
            className={`${customClasses} hover:no-underline ${sizeClasses} ${className}`}
        >
            <span className="mr-1">{renderPriorityIcon(priority)}</span>
            {label}
        </Badge>
    );
}
