import React from "react";
import { Badge } from "@/components/ui/badge";

interface JiraBadgeProps {
    jiraLink: string | null;
    size?: "sm" | "md" | "lg";
}

export function JiraBadge({ jiraLink, size = "md" }: JiraBadgeProps) {
    if (!jiraLink) {
        return <span className="text-gray-400 text-sm">-</span>;
    }

    const getJiraKey = (link: string) => {
        const match = link.match(/\/browse\/([A-Z]+-\d+)/);
        if (match) {
            const numberPart = match[1].split("-")[1];
            return numberPart || match[1];
        }
        return "JIRA";
    };

    const sizeClasses = {
        sm: "text-xs px-2 py-1",
        md: "text-sm px-2.5 py-1",
        lg: "text-base px-3 py-1.5",
    };

    return (
        <div className="flex items-center gap-1">
            <Badge
                className={`bg-blue-100 text-blue-800 border-blue-200 font-mono ${sizeClasses[size]} font-medium`}
            >
                <a
                    href={jiraLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Mở trong JIRA"
                >
                    {getJiraKey(jiraLink)}
                    <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                    </svg>
                </a>
            </Badge>
        </div>
    );
}
