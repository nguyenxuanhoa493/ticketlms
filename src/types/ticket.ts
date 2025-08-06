export interface Ticket {
    id: string;
    title: string;
    description: string | null;
    ticket_type: "bug" | "task";
    status: "open" | "in_progress" | "closed";
    priority: "low" | "medium" | "high";
    platform: "web" | "app" | "all";
    organization_id: string;
    expected_completion_date: string | null;
    closed_at: string | null;
    jira_link: string | null;
    only_show_in_admin: boolean;
    created_at: string;
    updated_at: string;
    organizations?: {
        id: string;
        name: string;
    };
    created_user?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
}

export interface Organization {
    id: string;
    name: string;
    openTicketsCount?: number;
}

export interface CurrentUser {
    id: string;
    role: "admin" | "manager" | "user";
    organization_id: string | null;
}

export interface Comment {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    user_id: string;
    parent_id: string | null;
    user: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };
    replies?: Comment[];
}

export interface TicketFormData {
    title: string;
    description: string;
    ticket_type: "bug" | "task";
    priority: "low" | "medium" | "high";
    platform: "web" | "app" | "all";
    status: "open" | "in_progress" | "closed";
    organization_id: string;
    expected_completion_date: string | null;
    closed_at: string | null;
    jira_link: string;
    only_show_in_admin: boolean;
}
