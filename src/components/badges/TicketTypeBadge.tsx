import React from "react";
import { Badge } from "@/components/ui/badge";
import {
    TicketType,
    getTicketTypeLabel,
    getTicketTypeBadgeClasses,
} from "@/lib/ticket-utils";

interface TicketTypeBadgeProps {
    type: TicketType;
    className?: string;
    showIcon?: boolean;
    showLabel?: boolean;
}

export function TicketTypeBadge({
    type,
    className = "",
    showIcon = true,
    showLabel = true,
}: TicketTypeBadgeProps) {
    const label = getTicketTypeLabel(type);
    const customClasses = getTicketTypeBadgeClasses(type);

    // Render SVG icon trực tiếp
    const renderIcon = () => {
        const iconColor =
            type === "bug"
                ? "#991b1b"
                : type === "task"
                  ? "#ffffff"
                  : "#6b21a8";

        switch (type) {
            case "bug":
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
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                );
            case "task":
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
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                );
            case "feature":
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
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <Badge
            className={`inline-flex items-center gap-1.5 ${customClasses} hover:no-underline ${className}`}
        >
            {showIcon && renderIcon()}
            {showLabel && <span>{label}</span>}
        </Badge>
    );
}
