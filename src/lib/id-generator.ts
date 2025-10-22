/**
 * Unique ID Generator
 * Generates unique IDs for request history items to avoid React key conflicts
 */

let counter = 0;

/**
 * Generate a unique ID combining timestamp and counter
 * Format: {timestamp}-{counter}
 * This ensures uniqueness even when multiple IDs are generated at the same millisecond
 */
export function generateUniqueId(): string {
    counter = (counter + 1) % 10000; // Reset counter after 10000 to keep IDs reasonable length
    return `${Date.now()}-${counter}`;
}

/**
 * Reset counter (useful for testing)
 */
export function resetIdCounter(): void {
    counter = 0;
}
