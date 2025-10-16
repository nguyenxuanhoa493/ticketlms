import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface JiraStatusBadgeProps {
    status?: string | null;
    statusCategory?: string | null;
    jiraLink: string | null;
    loading?: boolean;
}

export function JiraStatusBadge({
    status,
    statusCategory,
    jiraLink,
    loading = false,
}: JiraStatusBadgeProps) {
    if (!jiraLink) return null;

    // Determine badge color based on status category
    const getBadgeColor = () => {
        if (loading) {
            return "bg-gray-100 text-gray-800 border-gray-200 animate-pulse";
        }

        if (!status || !statusCategory) {
            return "bg-gray-100 text-gray-800 border-gray-200";
        }

        switch (statusCategory.toLowerCase()) {
            case "done":
                return "bg-green-100 text-green-800 border-green-200";
            case "indeterminate":
            case "inprogress":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "new":
            case "todo":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Badge
                variant="outline"
                className={getBadgeColor()}
                title={status ? `Jira Status: ${status}` : "Loading Jira status..."}
            >
                <span className="flex items-center gap-1">
                    {loading ? "Loading..." : status || "N/A"}
                </span>
            </Badge>
            {jiraLink && (
                <a
                    href={jiraLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                    title="Mở Jira issue"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
            )}
        </div>
    );
}
