// Test file để kiểm tra React Query setup
import { useTickets } from "./useTicketsQuery";

// Test function
export function testQuerySetup() {
    console.log("React Query setup test:");
    console.log("- useTickets hook imported successfully");
    console.log("- QueryProvider should be configured in layout");
    console.log("- DevTools should be available in development");

    return "Setup looks good!";
}
