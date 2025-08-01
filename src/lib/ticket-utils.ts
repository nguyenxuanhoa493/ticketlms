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
            return "default";
        case "feature":
            return "default";
        default:
            return "outline";
    }
}

/**
 * Get CSS classes for ticket type badge styling
 */
export function getTicketTypeBadgeClasses(type: TicketType): string {
    switch (type) {
        case "bug":
            return "bg-red-100 text-red-900 border-red-200";
        case "task":
            return "bg-blue-500 text-white border-blue-500";
        case "feature":
            return "bg-purple-100 text-purple-800 border-purple-200";
        default:
            return "";
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
        case "open":
            return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
        case "in_progress":
            return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
        case "closed":
            return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
        default:
            return "";
    }
}

/**
 * Get status color for consistent styling
 */
export function getStatusColor(status: TicketStatus): {
    bg: string;
    text: string;
    border: string;
    icon: string;
} {
    switch (status) {
        case "open":
            return {
                bg: "bg-blue-100",
                text: "text-blue-800",
                border: "border-blue-200",
                icon: "#3b82f6",
            };
        case "in_progress":
            return {
                bg: "bg-yellow-100",
                text: "text-yellow-800",
                border: "border-yellow-200",
                icon: "#f59e0b",
            };
        case "closed":
            return {
                bg: "bg-green-100",
                text: "text-green-800",
                border: "border-green-200",
                icon: "#10b981",
            };
        default:
            return {
                bg: "bg-gray-100",
                text: "text-gray-800",
                border: "border-gray-200",
                icon: "#6b7280",
            };
    }
}

/**
 * Get status description for tooltips and accessibility
 */
export function getStatusDescription(status: TicketStatus): string {
    switch (status) {
        case "open":
            return "Ticket đang chờ xử lý";
        case "in_progress":
            return "Ticket đang được thực hiện";
        case "closed":
            return "Ticket đã hoàn thành";
        default:
            return "Trạng thái không xác định";
    }
}

/**
 * Get CSS classes for priority badge styling
 */
export function getPriorityBadgeClasses(priority: TicketPriority): string {
    switch (priority) {
        case "high":
            return "bg-red-100 text-red-900 border-red-200";
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
            return "/bug-icon.svg";
        case "task":
            return "/task-icon.svg";
        case "feature":
            return "/feature-icon.svg";
        default:
            return "/file.svg";
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
