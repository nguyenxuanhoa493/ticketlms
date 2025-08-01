import React from "react";
import { Badge } from "@/components/ui/badge";

interface PlatformBadgeProps {
    platform: "web" | "app" | "all";
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function PlatformBadge({
    platform,
    size = "md",
    showLabel = true,
}: PlatformBadgeProps) {
    const getPlatformConfig = (
        platform: "web" | "app" | "all"
    ): {
        label: string;
        className: string;
        icon: React.ReactElement;
    } => {
        switch (platform) {
            case "web":
                return {
                    label: "Web",
                    className:
                        "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
                    icon: (
                        <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                        </svg>
                    ),
                };
            case "app":
                return {
                    label: "App",
                    className:
                        "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
                    icon: (
                        <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
                        </svg>
                    ),
                };
            case "all":
                return {
                    label: "All",
                    className:
                        "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
                    icon: (
                        <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    ),
                };
            default:
                return {
                    label: "Unknown",
                    className: "bg-gray-100 text-gray-800 border-gray-200",
                    icon: (
                        <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    ),
                };
        }
    };

    const config = getPlatformConfig(platform);
    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
    };

    return (
        <Badge
            className={`${config.className} ${sizeClasses[size]} font-medium inline-flex items-center gap-1.5`}
            title={config.label}
        >
            {config.icon}
            {showLabel && <span>{config.label}</span>}
        </Badge>
    );
}
