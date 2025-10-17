/**
 * LMS Client - Modular exports
 */

export * from "./base-client";
export * from "./program";

// Main client that combines all modules
import { LmsProgramClient } from "./program";
import { LmsEnvironment } from "./base-client";

export class LmsClient extends LmsProgramClient {
    constructor(environment: LmsEnvironment) {
        super(environment);
    }
}
