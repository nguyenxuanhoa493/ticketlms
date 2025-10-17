// Export all types from ticket.ts
export * from "./ticket";

// Export database types if needed
export * from "./database";

// Export supabase types
export * from "./supabase";

import { Database } from "./database";

// Extended types for API responses
export type Organization =
    Database["public"]["Tables"]["organizations"]["Row"] & {
        openTicketsCount?: number;
    };

export type CurrentUser = Database["public"]["Tables"]["profiles"]["Row"] & {
    email?: string;
};

// API Environment types
export interface ApiEnvironment {
    id: string;
    name: string;
    description: string | null;
    host: string;
    headers: Record<string, any>;
    base_params: Record<string, any>;
    user_code: string | null;
    pass_master: string | null;
    pass_root: string | null;
    is_active: boolean;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface ApiEnvironmentFormData {
    name: string;
    host: string;
    pass_master: string;
    pass_root: string;
}

// API Template Folder types
export interface ApiTemplateFolder {
    id: string;
    name: string;
    description: string | null;
    parent_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface ApiTemplateFolderFormData {
    name: string;
    description?: string;
    parent_id?: string | null;
}

// API Request Template types
export interface ApiRequestTemplate {
    id: string;
    name: string;
    description: string | null;
    folder_id: string | null;
    environment_id: string | null;
    path: string;
    method: string;
    payload: Record<string, any>;
    dmn: string | null;
    user_code: string | null;
    password: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface ApiRequestTemplateFormData {
    name: string;
    description?: string;
    folder_id?: string | null;
    environment_id?: string;
    path: string;
    method: string;
    payload: Record<string, any>;
    dmn?: string;
    user_code?: string;
    password?: string;
}

export interface FolderTreeNode {
    id: string;
    name: string;
    description: string | null;
    parent_id: string | null;
    children: FolderTreeNode[];
    templates: ApiRequestTemplate[];
    templateCount: number;
}
