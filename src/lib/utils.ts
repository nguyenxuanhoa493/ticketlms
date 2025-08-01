import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export all utility functions for easy importing
export * from "./date-utils";
export * from "./ticket-utils";
export * from "./validation-utils";
export * from "./jira-adf-converter";
