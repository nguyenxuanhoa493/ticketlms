import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TicketStatus, getStatusLabel, getStatusColor, getStatusDescription } from '@/lib/ticket-utils';

interface AnimatedStatusBadgeProps {
    status: TicketStatus;
    className?: string;
    size?: "sm" | "md" | "lg";
    animated?: boolean;
    clickable?: boolean;
    onClick?: () => void;
}

export function AnimatedStatusBadge({
    status,
    className = "",
    size = "md",
    animated = true,
    clickable = false,
    onClick
}: AnimatedStatusBadgeProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    
    const label = getStatusLabel(status);
    const colors = getStatusColor(status);
    const description = getStatusDescription(status);

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

    // Render SVG icon với animation
    const renderIcon = () => {
        const iconSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5";
        const iconColor = colors.icon;

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
                        className={`${iconSize} ${animated ? 'transition-transform duration-200' : ''} ${isHovered ? 'scale-110' : ''}`}
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
                        className={`${iconSize} ${animated ? 'animate-spin' : ''}`}
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
                        className={`${iconSize} ${animated ? 'transition-transform duration-200' : ''} ${isHovered ? 'scale-110' : ''}`}
                    >
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const sizeClasses = getSizeClasses();
    const baseClasses = `
        inline-flex items-center gap-1.5 
        ${sizeClasses}
        ${colors.bg} ${colors.text} ${colors.border}
        font-medium
        transition-all duration-200
        ${animated ? 'hover:scale-105' : ''}
        ${clickable ? 'cursor-pointer hover:shadow-md' : ''}
        ${isPressed ? 'scale-95' : ''}
        ${className}
    `;

    const handleClick = () => {
        if (clickable && onClick) {
            setIsPressed(true);
            setTimeout(() => setIsPressed(false), 150);
            onClick();
        }
    };

    return (
        <Badge
            className={baseClasses}
            title={description}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
        >
            {renderIcon()}
            <span className="font-medium">{label}</span>
        </Badge>
    );
} 