/**
 * LMS Request History Utilities
 * Helper functions for mapping and formatting LMS request history
 */

import { generateUniqueId } from "./id-generator";
import { LmsClient } from "./lms";

export interface MappedHistoryItem {
    id: string;
    method: string;
    url: string;
    payload: Record<string, any>;
    statusCode: number;
    responseTime: number;
    response: any;
    timestamp: string;
    isLoading: boolean;
    isComplete: boolean;
    hasError: boolean;
}

/**
 * Map LMS client request history to format expected by UI components
 * Adds unique IDs and loading/error states
 */
export function mapRequestHistory(client: LmsClient): MappedHistoryItem[] {
    return client.getRequestHistory().map((item) => ({
        ...item,
        id: generateUniqueId(),
        isLoading: false,
        isComplete: true,
        hasError: item.statusCode !== 200,
    }));
}

/**
 * Map raw history array to format expected by UI components
 * Useful when history comes from API response
 */
export function mapRawHistory(history: any[]): MappedHistoryItem[] {
    return history.map((item) => ({
        ...item,
        id: item.id || generateUniqueId(),
        isLoading: false,
        isComplete: true,
        hasError: item.statusCode !== 200,
    }));
}
