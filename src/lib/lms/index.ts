/**
 * LMS Client - Modular exports
 */

export * from "./base-client";

// Export function-based APIs
export * from "./program";
export * from "./syllabus";
export * from "./admin";
export * from "./question-bank";
export * from "./user";

// Main client - simple base client without inheritance
import { LmsBaseClient, LmsEnvironment } from "./base-client";

export class LmsClient extends LmsBaseClient {
    constructor(environment: LmsEnvironment) {
        super(environment);
    }
}
