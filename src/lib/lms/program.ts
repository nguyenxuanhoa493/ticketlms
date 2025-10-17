/**
 * LMS Program APIs
 */

import { LmsBaseClient, LmsSendResult } from "./base-client";

export interface Program {
    iid: number;
    name: string;
    code: string;
    status: string;
    [key: string]: any;
}

export interface GetListProgramOptions {
    status?: string[];
    iid_organizations?: number;
    include_sub_organizations?: number;
    page?: number;
    items_per_page?: number;
}

export interface CloneProgramOptions {
    program_iid: number;
    clone_master_data?: number;
    clone_rubric_even_exist?: number;
    rubric_name_suffix?: string;
}

export class LmsProgramClient extends LmsBaseClient {
    /**
     * Get list of programs
     */
    async getListProgram(options: GetListProgramOptions = {}): Promise<LmsSendResult> {
        const {
            status = ["approved", "queued"],
            iid_organizations,
            include_sub_organizations = 1,
            page = 1,
            items_per_page = -1,
        } = options;

        const payload: Record<string, any> = {
            "program_type[]": "program",
            type: "program",
            page,
            items_per_page,
            status,
        };

        // Add organization filter if provided
        if (iid_organizations) {
            payload["organizations[]"] = iid_organizations;
            payload.include_sub_organizations = include_sub_organizations;
        }

        console.log("[LmsProgramClient] Getting list of programs...", payload);

        const result = await this.send({
            path: "/path/search",
            payload,
            method: "POST",
        });

        // Extract programs from result
        if (result.success && result.data) {
            const programs = result.data.result || [];
            return {
                ...result,
                data: {
                    ...result.data,
                    programs, // Make programs easily accessible
                },
            };
        }

        return result;
    }

    /**
     * Clone a program
     */
    async cloneProgram(options: CloneProgramOptions): Promise<LmsSendResult> {
        const {
            program_iid,
            clone_master_data = 1,
            clone_rubric_even_exist = 0,
            rubric_name_suffix = "",
        } = options;

        console.log(`[LmsProgramClient] Cloning program ${program_iid}...`);

        const payload = {
            program_iid,
            clone_master_data,
            clone_rubric_even_exist,
            rubric_name_suffix,
        };

        const result = await this.send({
            path: "/program/api/deep-clone",
            payload,
            method: "POST",
        });

        if (result.success) {
            console.log("[LmsProgramClient] Program cloned successfully", result.data);
        } else {
            console.error("[LmsProgramClient] Failed to clone program:", result.error);
        }

        return result;
    }
}
