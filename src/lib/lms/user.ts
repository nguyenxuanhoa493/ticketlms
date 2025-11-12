/**
 * LMS User APIs - User search and learning data management
 */

import { LmsClient } from "./index";

export interface User {
    iid: number;
    id: string;
    code: string;
    name: string;
    mail: string;
    phone?: string;
    __expand?: {
        user_organizations?: Array<{
            name: string;
            [key: string]: any;
        }>;
    };
    assigned_enrolment_plans?: any[];
    [key: string]: any;
}

export interface GetUserByCodeParams {
    userCode: string;
    iidOrganizations?: number;
}

export interface GetUserByCodeResult {
    success: boolean;
    data?: User;
    error?: string;
}

export interface MergeDataLearningUserParams {
    fromUserIid: number;
    toUserIid: number;
}

export interface MergeDataLearningUserResult {
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
}

/**
 * Get user by code
 */
export async function getUserByCode(
    client: LmsClient,
    params: GetUserByCodeParams
): Promise<GetUserByCodeResult> {
    const { userCode, iidOrganizations } = params;

    try {
        const payload: Record<string, any> = {
            textOp: "$like",
            include_sub_organizations: 1,
            ntype: "user",
            _sand_step: "students",
            all_accounts: 1,
            codes: userCode,
        };

        // Add organization filter if provided
        if (iidOrganizations) {
            payload["user_organizations[0]"] = iidOrganizations;
            payload["orgIids[0]"] = iidOrganizations;
        }

        const result = await client.send({
            path: "/user/api/search",
            method: "POST",
            payload,
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to search user",
            };
        }

        // Check LMS API response success field
        if (result.data?.success === false) {
            return {
                success: false,
                error: result.data?.message || result.data?.msg || "API returned success=false",
            };
        }

        const users = result.data?.result || [];
        const user = users[0] || null;

        if (!user) {
            return {
                success: false,
                error: "User not found",
            };
        }

        return {
            success: true,
            data: user,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Merge learning data from one user to another
 */
export async function mergeDataLearningUser(
    client: LmsClient,
    params: MergeDataLearningUserParams
): Promise<MergeDataLearningUserResult> {
    const { fromUserIid, toUserIid } = params;

    try {
        const result = await client.send({
            path: "/user/learning-data/copy-user-learning-data",
            method: "POST",
            payload: {
                from_user_iid: fromUserIid,
                to_user_iid: toUserIid,
            },
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to merge learning data",
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
            message: result.data?.message || "Learning data merged successfully",
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
