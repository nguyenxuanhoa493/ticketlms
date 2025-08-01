import React from "react";
import { TicketTypeBadge } from "./TicketTypeBadge";
import { TicketStatusBadge } from "./TicketStatusBadge";
import { TicketPriorityBadge } from "./TicketPriorityBadge";
import { TicketType, TicketStatus, TicketPriority } from "@/lib/ticket-utils";

interface TicketBadgesProps {
    type: TicketType;
    status: TicketStatus;
    priority: TicketPriority;
    className?: string;
    showType?: boolean;
    showStatus?: boolean;
    showPriority?: boolean;
    layout?: "horizontal" | "vertical";
    // Status badge options
    statusSize?: "sm" | "md" | "lg";
    statusVariant?: "default" | "outline" | "solid";
    statusShowIcon?: boolean;
    statusShowLabel?: boolean;
    // Type badge options
    typeShowIcon?: boolean;
    typeShowLabel?: boolean;
    // Priority badge options
    prioritySize?: "sm" | "md" | "lg";
}

export function TicketBadges({
    type,
    status,
    priority,
    className = "",
    showType = true,
    showStatus = true,
    showPriority = true,
    layout = "horizontal",
    // Status badge options
    statusSize = "md",
    statusVariant = "default",
    statusShowIcon = true,
    statusShowLabel = true,
    // Type badge options
    typeShowIcon = true,
    typeShowLabel = true,
    // Priority badge options
    prioritySize = "md",
}: TicketBadgesProps) {
    const containerClasses = layout === "horizontal" 
        ? "flex flex-wrap items-center gap-2" 
        : "flex flex-col items-start gap-1";

    return (
        <div className={`${containerClasses} ${className}`}>
            {showType && (
                <TicketTypeBadge 
                    type={type} 
                    showIcon={typeShowIcon}
                    showLabel={typeShowLabel}
                />
            )}
            {showStatus && (
                <TicketStatusBadge 
                    status={status} 
                    size={statusSize}
                    variant={statusVariant}
                    showIcon={statusShowIcon}
                    showLabel={statusShowLabel}
                />
            )}
            {showPriority && (
                <TicketPriorityBadge 
                    priority={priority} 
                    size={prioritySize}
                />
            )}
        </div>
    );
} 