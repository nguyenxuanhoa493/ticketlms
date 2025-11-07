export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Enums: {
            notification_type:
                | "ticket_status_changed"
                | "ticket_commented"
                | "comment_replied";
            ticket_priority: "low" | "medium" | "high";
            ticket_status: "open" | "in_progress" | "closed";
            ticket_type: "bug" | "task";
            user_role: "admin" | "manager" | "user";
        };
        Tables: {
            comments: {
                Row: {
                    id: string;
                    ticket_id: string;
                    user_id: string;
                    content: string;
                    parent_id: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    ticket_id: string;
                    user_id: string;
                    content: string;
                    parent_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    ticket_id?: string;
                    user_id?: string;
                    content?: string;
                    parent_id?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            profiles: {
                Row: {
                    id: string;
                    role: "admin" | "manager" | "user";
                    organization_id: string | null;
                    full_name: string | null;
                    avatar_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    role?: "admin" | "manager" | "user";
                    organization_id?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    role?: "admin" | "manager" | "user";
                    organization_id?: string | null;
                    full_name?: string | null;
                    avatar_url?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            organizations: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    status: "active" | "inactive" | "pending";
                    assigned_admin_id: string | null;
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    description?: string | null;
                    status?: "active" | "inactive" | "pending";
                    assigned_admin_id?: string | null;
                    created_by: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    status?: "active" | "inactive" | "pending";
                    assigned_admin_id?: string | null;
                    created_by?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            organization_activities: {
                Row: {
                    id: string;
                    organization_id: string;
                    activity_type:
                        | "created"
                        | "updated"
                        | "status_changed"
                        | "admin_assigned"
                        | "note_added"
                        | "todo_added"
                        | "todo_completed"
                        | "custom";
                    title: string;
                    description: string | null;
                    metadata: Json;
                    created_by: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    organization_id: string;
                    activity_type:
                        | "created"
                        | "updated"
                        | "status_changed"
                        | "admin_assigned"
                        | "note_added"
                        | "todo_added"
                        | "todo_completed"
                        | "custom";
                    title: string;
                    description?: string | null;
                    metadata?: Json;
                    created_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    organization_id?: string;
                    activity_type?:
                        | "created"
                        | "updated"
                        | "status_changed"
                        | "admin_assigned"
                        | "note_added"
                        | "todo_added"
                        | "todo_completed"
                        | "custom";
                    title?: string;
                    description?: string | null;
                    metadata?: Json;
                    created_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            organization_notes: {
                Row: {
                    id: string;
                    organization_id: string;
                    content: string;
                    is_pinned: boolean;
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    organization_id: string;
                    content: string;
                    is_pinned?: boolean;
                    created_by: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    organization_id?: string;
                    content?: string;
                    is_pinned?: boolean;
                    created_by?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };

            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    type:
                        | "ticket_status_changed"
                        | "ticket_commented"
                        | "comment_replied";
                    title: string;
                    message: string;
                    is_read: boolean;
                    ticket_id: string | null;
                    comment_id: string | null;
                    created_by: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    type:
                        | "ticket_status_changed"
                        | "ticket_commented"
                        | "comment_replied";
                    title: string;
                    message: string;
                    is_read?: boolean;
                    ticket_id?: string | null;
                    comment_id?: string | null;
                    created_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    type?:
                        | "ticket_status_changed"
                        | "ticket_commented"
                        | "comment_replied";
                    title?: string;
                    message?: string;
                    is_read?: boolean;
                    ticket_id?: string | null;
                    comment_id?: string | null;
                    created_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            tickets: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    ticket_type: "bug" | "task";
                    status: "open" | "in_progress" | "closed";
                    priority: "low" | "medium" | "high";
                    platform: "web" | "app" | "all";
                    organization_id: string | null;
                    assigned_to: string | null;
                    created_by: string;
                    expected_completion_date: string | null;
                    closed_at: string | null;
                    response: string | null;
                    jira_link: string | null;
                    only_show_in_admin: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    title: string;
                    description?: string | null;
                    ticket_type?: "bug" | "task";
                    status?: "open" | "in_progress" | "closed";
                    priority?: "low" | "medium" | "high";
                    platform?: "web" | "app" | "all";
                    organization_id: string | null;
                    assigned_to?: string | null;
                    created_by: string;
                    expected_completion_date?: string | null;
                    closed_at?: string | null;
                    response?: string | null;
                    jira_link?: string | null;
                    only_show_in_admin?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    title?: string;
                    description?: string | null;
                    ticket_type?: "bug" | "task";
                    status?: "open" | "in_progress" | "closed";
                    priority?: "low" | "medium" | "high";
                    platform?: "web" | "app" | "all";
                    organization_id?: string;
                    assigned_to?: string | null;
                    created_by?: string;
                    expected_completion_date?: string | null;
                    closed_at?: string | null;
                    response?: string | null;
                    jira_link?: string | null;
                    only_show_in_admin?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
