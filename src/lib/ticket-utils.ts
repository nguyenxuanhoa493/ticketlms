/**
 * Utility functions for ticket status, priority, and badge styling
 * Centralized logic for consistent display across the application
 */

export type TicketStatus = "open" | "in_progress" | "closed";
export type TicketPriority = "high" | "medium" | "low";
export type TicketType = "bug" | "task" | "feature";

/**
 * Get badge variant for ticket status
 */
export function getStatusBadgeVariant(status: TicketStatus): string {
    switch (status) {
        case "open":
            return "default";
        case "in_progress":
            return "secondary";
        case "closed":
            return "outline";
        default:
            return "default";
    }
}

/**
 * Get badge variant for ticket priority
 */
export function getPriorityBadgeVariant(priority: TicketPriority): string {
    switch (priority) {
        case "high":
            return "destructive";
        case "medium":
            return "default";
        case "low":
            return "secondary";
        default:
            return "default";
    }
}

/**
 * Get badge variant for ticket type
 */
export function getTicketTypeBadgeVariant(type: TicketType): string {
    switch (type) {
        case "bug":
            return "destructive";
        case "task":
            return "secondary";
        case "feature":
            return "default";
        default:
            return "outline";
    }
}

/**
 * Get Vietnamese label for ticket status
 */
export function getStatusLabel(status: TicketStatus): string {
    switch (status) {
        case "open":
            return "Mở";
        case "in_progress":
            return "Đang làm";
        case "closed":
            return "Đã đóng";
        default:
            return status;
    }
}

/**
 * Get Vietnamese label for ticket priority
 */
export function getPriorityLabel(priority: TicketPriority): string {
    switch (priority) {
        case "high":
            return "Cao";
        case "medium":
            return "T.bình";
        case "low":
            return "Thấp";
        default:
            return priority;
    }
}

/**
 * Get Vietnamese label for ticket type
 */
export function getTicketTypeLabel(type: TicketType): string {
    switch (type) {
        case "bug":
            return "Bug";
        case "task":
            return "Task";
        case "feature":
            return "Feature";
        default:
            return type;
    }
}

/**
 * Get CSS classes for status badge styling
 */
export function getStatusBadgeClasses(status: TicketStatus): string {
    switch (status) {
        case "in_progress":
            return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
        case "closed":
            return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
        default:
            return "";
    }
}

/**
 * Get CSS classes for priority badge styling
 */
export function getPriorityBadgeClasses(priority: TicketPriority): string {
    switch (priority) {
        case "high":
            return "bg-red-100 text-red-800 border-red-200";
        case "medium":
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "low":
            return "bg-green-100 text-green-800 border-green-200";
        default:
            return "";
    }
}

/**
 * Get icon for ticket type
 */
export function getTicketTypeIcon(type: TicketType): string {
    switch (type) {
        case "bug":
            return "🐛";
        case "task":
            return "📋";
        case "feature":
            return "✨";
        default:
            return "📄";
    }
}

/**
 * Get color for JIRA status (used in JiraInfo component)
 */
export function getJiraStatusColor(statusName: string): string {
    switch (statusName.toLowerCase()) {
        case "done":
        case "closed":
        case "resolved":
            return "bg-green-100 text-green-800 border-green-200";
        case "in progress":
        case "in review":
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "to do":
        case "open":
        case "backlog":
            return "bg-gray-100 text-gray-800 border-gray-200";
        default:
            return "bg-blue-100 text-blue-800 border-blue-200";
    }
}
