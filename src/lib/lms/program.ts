/**
 * LMS Program APIs - Function-based pattern
 * Consistent with syllabus.ts and admin.ts
 */

import { LmsClient } from "./index";

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

export interface GetListProgramResult {
    success: boolean;
    programs?: Program[];
    error?: string;
}

export interface CloneProgramOptions {
    program_iid: number;
    clone_master_data?: number;
    clone_rubric_even_exist?: number;
    rubric_name_suffix?: string;
}

export interface CloneProgramResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Get list of programs
 */
export async function getListProgram(
    client: LmsClient,
    options: GetListProgramOptions = {}
): Promise<GetListProgramResult> {
    const {
        status = ["approved", "queued"],
        iid_organizations,
        include_sub_organizations = 1,
        page = 1,
        items_per_page = -1,
    } = options;

    try {
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

        const result = await client.send({
            path: "/path/search",
            payload,
            method: "POST",
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to get program list",
            };
        }

        // Check LMS API response success field
        if (result.data?.success === false) {
            return {
                success: false,
                error: result.data?.message || result.data?.msg || "API returned success=false",
            };
        }

        const programs = result.data?.result || [];

        return {
            success: true,
            programs,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Clone a program
 */
export async function cloneProgram(
    client: LmsClient,
    options: CloneProgramOptions
): Promise<CloneProgramResult> {
    const {
        program_iid,
        clone_master_data = 1,
        clone_rubric_even_exist = 0,
        rubric_name_suffix = "",
    } = options;

    try {
        const payload = {
            program_iid,
            clone_master_data,
            clone_rubric_even_exist,
            rubric_name_suffix,
        };

        const result = await client.send({
            path: "/program/api/deep-clone",
            payload,
            method: "POST",
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to clone program",
            };
        }

        // Check LMS API response success field
        if (result.data?.success === false) {
            return {
                success: false,
                error: result.data?.message || result.data?.msg || "API returned success=false",
            };
        }

        return {
            success: true,
            data: result.data,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
