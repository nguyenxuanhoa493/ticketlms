/**
 * Legacy LMS Client - For backward compatibility
 * New code should use: import { LmsClient } from "@/lib/lms"
 */

import { LmsClient as NewLmsClient } from "./lms";

// Re-export types for backward compatibility
export type {
    LmsEnvironment,
    LmsLoginResult,
    LmsSendOptions,
    LmsRequestHistory,
    LmsSendResult,
} from "./lms/base-client";

// Re-export main client
export { LmsClient } from "./lms";

// Keep old class as alias for backward compatibility
export class LmsClientLegacy extends NewLmsClient {
    constructor(environment: any) {
        super(environment);
    }
}

// All implementation moved to ./lms/ modules
