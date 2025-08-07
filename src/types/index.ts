// Export all types from ticket.ts
export * from "./ticket";

// Export database types if needed
export * from "./database";
import { Database } from "./database";

// Extended types for API responses
export type Organization =
    Database["public"]["Tables"]["organizations"]["Row"] & {
        openTicketsCount?: number;
    };

export type CurrentUser = Database["public"]["Tables"]["profiles"]["Row"] & {
    email?: string;
};
