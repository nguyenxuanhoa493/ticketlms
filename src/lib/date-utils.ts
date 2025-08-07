/**
 * Utility functions for date/time formatting and conversion
 * Handles GMT+7 to UTC conversion for database operations
 */

/**
 * Convert datetime-local format to UTC ISO string for database storage
 * Treats input as GMT+7 and converts to UTC
 */
export function formatDateTimeForDB(datetimeLocal: string): string | null {
    if (!datetimeLocal || datetimeLocal.trim() === "") return null;

    try {
        // datetime-local format: "2024-01-15T14:30"
        // Validate format first
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeLocal)) {
            return null;
        }

        // Treat as GMT+7 and convert to UTC
        const dateTime = datetimeLocal + ":00"; // Add seconds
        const localDate = new Date(dateTime); // Browser interprets as local time

        // Check if date is valid
        if (isNaN(localDate.getTime())) {
            return null;
        }

        // Subtract 7 hours to convert GMT+7 to UTC
        const utcDate = new Date(localDate.getTime() - 7 * 60 * 60 * 1000);

        return utcDate.toISOString();
    } catch (error) {
        return null;
    }
}

/**
 * Convert UTC ISO string from database to datetime-local format for display
 * Converts UTC to GMT+7 for display
 */
export function formatDateTimeForDisplay(isoString: string): string {
    if (!isoString || isoString.trim() === "") return "";

    try {
        // Parse UTC datetime from database
        const utcDate = new Date(isoString);

        // Check if date is valid
        if (isNaN(utcDate.getTime())) {
            return "";
        }

        // Add 7 hours to convert UTC to GMT+7
        const gmt7Date = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);

        // Format for datetime-local input (use regular methods, not UTC methods)
        const year = gmt7Date.getFullYear();
        const month = String(gmt7Date.getMonth() + 1).padStart(2, "0");
        const day = String(gmt7Date.getDate()).padStart(2, "0");
        const hour = String(gmt7Date.getHours()).padStart(2, "0");
        const minute = String(gmt7Date.getMinutes()).padStart(2, "0");

        return `${year}-${month}-${day}T${hour}:${minute}`;
    } catch (error) {
        return "";
    }
}

/**
 * Convert any datetime format to UTC ISO string for database storage
 * Handles both ISO strings and datetime-local format
 */
export function convertToUTCISO(datetime: string): string | null {
    if (!datetime || datetime.trim() === "") return null;

    try {
        let utcDate: Date;

        // Check if it's already an ISO string (ends with Z or has timezone)
        if (datetime.includes("Z") || /\+\d{2}:\d{2}$/.test(datetime)) {
            // Already UTC ISO string, use directly
            utcDate = new Date(datetime);
            if (isNaN(utcDate.getTime())) {
                throw new Error(`Invalid ISO date: ${datetime}`);
            }
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetime)) {
            // datetime-local format: "2024-01-15T14:30" - treat as GMT+7
            const dateTime = datetime + ":00"; // Add seconds
            const localDate = new Date(dateTime); // Browser treats as local time

            if (isNaN(localDate.getTime())) {
                throw new Error(`Invalid date value: ${datetime}`);
            }

            // Convert GMT+7 to UTC by subtracting 7 hours
            utcDate = new Date(localDate.getTime() - 7 * 60 * 60 * 1000);
        } else {
            throw new Error(`Invalid datetime format: ${datetime}`);
        }

        return utcDate.toISOString();
    } catch (error) {
        return null;
    }
}

/**
 * Format date for display in Vietnamese locale
 */
export function formatDateForDisplay(date: string | Date): string {
    try {
        const dateObj = typeof date === "string" ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) {
            return "";
        }

        // Add 7 hours to convert UTC to GMT+7 for display
        const gmt7Date = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);

        return gmt7Date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (error) {
        return "";
    }
}
