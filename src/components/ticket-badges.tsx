/**
 * Ticket Badge Components
 * Các component badge để hiển thị thông tin ticket một cách gọn gàng
 */

export { TicketTypeBadge } from "./TicketTypeBadge";
export { TicketStatusBadge } from "./TicketStatusBadge";
export { TicketPriorityBadge } from "./TicketPriorityBadge";
export { PlatformBadge } from "./PlatformBadge";
export { TicketBadges } from "./TicketBadges";
export { JiraBadge } from "./JiraBadge";

// Re-export types và functions để dễ sử dụng
export type {
    TicketType,
    TicketStatus,
    TicketPriority,
} from "@/lib/ticket-utils";

export {
    getTicketTypeBadgeClasses,
    getStatusBadgeClasses,
    getPriorityBadgeClasses,
} from "@/lib/ticket-utils";
