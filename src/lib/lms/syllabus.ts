/**
 * LMS Syllabus APIs - Syllabus management operations
 */

import { LmsClient } from "./index";

export interface SearchSyllabusParams {
    name?: string;
    type?: string;
    status?: string[];
    sub_type?: string[];
    organizations?: number;
    page?: number;
    items_per_page?: number;
}

export interface SearchSyllabusResult {
    success: boolean;
    data?: any[];
    error?: string;
}

export interface ChangeStatusParams {
    id_syllabus: number;
    status?: "approved" | "queued";
    step?: "status" | "freeze";
}

export interface ChangeStatusResult {
    success: boolean;
    message?: string;
    error?: string;
}

export interface PopulateSequentialParams {
    iid_syllabus: number;
    sequential_learning_type?: "item" | "sco";
    ntypes_to_exclude?: string[];
}

export interface PopulateSequentialResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Search for syllabuses
 */
export async function searchSyllabus(
    client: LmsClient,
    params: SearchSyllabusParams = {}
): Promise<SearchSyllabusResult> {
    const {
        name = "",
        type = "credit",
        status = ["approved", "done_editing", "queued"],
        sub_type = ["syllabus_normal", "syllabus_skill"],
        organizations = 0,
        page = 1,
        items_per_page = -1,
    } = params;

    try {
        const result = await client.send({
            path: "/syllabus/my",
            method: "POST",
            payload: {
                _sand_get_total: 0,
                name,
                "organizations[]": organizations || 0, // Will use client's org if 0
                include_sub_organizations: 1,
                type,
                page,
                items_per_page,
                sub_type,
                status,
            },
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to search syllabuses",
            };
        }

        // Check LMS API response success field
        if (result.data?.success === false) {
            return {
                success: false,
                error: result.data?.message || result.data?.msg || "API returned success=false",
            };
        }

        const syllabuses = result.data?.result || [];

        return {
            success: true,
            data: syllabuses,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Change status of a syllabus
 */
export async function changeStatusSyllabus(
    client: LmsClient,
    params: ChangeStatusParams
): Promise<ChangeStatusResult> {
    const { id_syllabus, status = "approved", step = "status" } = params;

    try {
        const payload: any = {
            id: id_syllabus,
            _sand_step: step,
            type: "credit",
        };

        if (step === "freeze") {
            const status_freeze = status === "queued" ? 0 : 1;
            payload.freeze = status_freeze;
        } else {
            payload.status = status;
        }

        const result = await client.send({
            path: "/syllabus/update",
            method: "POST",
            payload,
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to change syllabus status",
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
            message: result.data?.message || "Status changed successfully",
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Populate syllabus sequential settings
 */
export async function populateSyllabusSequential(
    client: LmsClient,
    params: PopulateSequentialParams
): Promise<PopulateSequentialResult> {
    const {
        iid_syllabus,
        sequential_learning_type = "item",
        ntypes_to_exclude = ["practice", "exercise"],
    } = params;

    try {
        const result = await client.send({
            path: "/syllabus/editor/populate-syllabus-sequential-settings",
            method: "POST",
            payload: {
                sequential_learning_type,
                iid: iid_syllabus,
                ntypes_to_exclude,
            },
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to populate sequential settings",
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
            data: result.data?.result,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
