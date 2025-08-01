import React from "react";
import { Badge } from "@/components/ui/badge";
import {
    TicketStatus,
    getStatusLabel,
    getStatusBadgeClasses,
} from "@/lib/ticket-utils";

interface TicketStatusBadgeProps {
    status: TicketStatus;
    className?: string;
    showIcon?: boolean;
    showLabel?: boolean;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "outline" | "solid";
}

export function TicketStatusBadge({
    status,
    className = "",
    showIcon = true,
    showLabel = true,
    size = "md",
    variant = "default",
}: TicketStatusBadgeProps) {
    const label = getStatusLabel(status);
    const customClasses = getStatusBadgeClasses(status);

    // Render SVG icon cho từng trạng thái
    const renderIcon = () => {
        const iconColor = getIconColor(status);
        const iconSize =
            size === "sm"
                ? "w-3 h-3"
                : size === "lg"
                  ? "w-4 h-4"
                  : "w-3.5 h-3.5";

        switch (status) {
            case "open":
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
                        className={iconSize}
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 12h8" />
                        <path d="M12 8v8" />
                    </svg>
                );
            case "in_progress":
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
                        className={`${iconSize} animate-spin`}
                    >
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                );
            case "closed":
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
                        className={iconSize}
                    >
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                );
            default:
                return null;
        }
    };

    // Lấy màu icon dựa trên trạng thái
    const getIconColor = (status: TicketStatus): string => {
        switch (status) {
            case "open":
                return "#3b82f6"; // blue-500
            case "in_progress":
                return "#f59e0b"; // amber-500
            case "closed":
                return "#10b981"; // emerald-500
            default:
                return "#6b7280"; // gray-500
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

    // Lấy variant classes
    const getVariantClasses = () => {
        if (variant === "outline") {
            switch (status) {
                case "open":
                    return "border-blue-200 text-blue-700 bg-blue-50";
                case "in_progress":
                    return "border-amber-200 text-amber-700 bg-amber-50";
                case "closed":
                    return "border-emerald-200 text-emerald-700 bg-emerald-50";
                default:
                    return "";
            }
        } else if (variant === "solid") {
            switch (status) {
                case "open":
                    return "bg-blue-500 text-white border-blue-500";
                case "in_progress":
                    return "bg-amber-500 text-white border-amber-500";
                case "closed":
                    return "bg-emerald-500 text-white border-emerald-500";
                default:
                    return "";
            }
        }
        return customClasses;
    };

    const sizeClasses = getSizeClasses();
    const variantClasses = getVariantClasses();

    return (
        <Badge
            className={`
                inline-flex items-center gap-1.5 
                ${sizeClasses}
                ${customClasses}
                hover:no-underline 
                transition-all duration-200
                hover:scale-105
                ${className}
            `}
            title={`Trạng thái: ${label}`}
        >
            {showIcon && renderIcon()}
            {showLabel && <span className="font-medium">{label}</span>}
        </Badge>
    );
}
