/**
 * LMS Admin APIs - Domain management and admin operations
 */

import { LmsClient } from "./index";

export interface DomainGroup {
    value: string;
    name: string;
}

export interface GetDomainGroupsResult {
    success: boolean;
    data?: DomainGroup[];
    error?: string;
}

export interface CreateDomainParams {
    slug: string;
    domainGroup: string;
    language?: string;
    type?: string;
}

export interface CreateDomainResult {
    success: boolean;
    data?: any;
    error?: string;
    requestHistory?: any[];
}

/**
 * Get list of domain groups
 */
export async function getDomainGroups(
    client: LmsClient
): Promise<GetDomainGroupsResult> {
    try {
        const result = await client.send({
            path: "/site/api/get-domain-groups",
            method: "POST",
            payload: {
                formid: "new_school",
            },
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to fetch domain groups",
            };
        }

        // Check LMS API response success field
        if (result.data?.success === false) {
            return {
                success: false,
                error: result.data?.message || result.data?.msg || "API returned success=false",
            };
        }

        // Parse domain groups from response
        const groups = result.data?.result || [];

        return {
            success: true,
            data: groups,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export interface UpdateInfoParams {
    ntype: string;
    iid?: string[];
    id?: string[];
    data_set?: Record<string, any>;
    fields_unset?: string[];
}

export interface UpdateInfoResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Update data by conditions (universal update API)
 */
export async function updateInfo(
    client: LmsClient,
    params: UpdateInfoParams
): Promise<UpdateInfoResult> {
    const { ntype, iid, id, data_set, fields_unset } = params;

    try {
        const payload: Record<string, any> = {
            ntype,
        };

        if (iid && iid.length > 0) {
            payload.iid = iid;
        }
        if (id && id.length > 0) {
            payload.id = id;
        }
        if (data_set && Object.keys(data_set).length > 0) {
            payload.data_set = data_set;
        }
        if (fields_unset && fields_unset.length > 0) {
            payload.fields_unset = fields_unset;
        }

        const result = await client.send({
            path: "/site/api/update-data-by-conditions",
            method: "POST",
            payload,
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to update data",
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

/**
 * Create a new domain
 */
export async function createDomain(
    client: LmsClient,
    params: CreateDomainParams
): Promise<CreateDomainResult> {
    const { slug, domainGroup, language = "vn", type = "enterprise" } = params;

    try {
        const result = await client.send({
            path: "/school/new",
            method: "POST",
            payload: {
                _sand_domain_group: domainGroup,
                language,
                slug,
                type,
            },
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to create domain",
                requestHistory: result.requestHistory,
            };
        }

        // Check LMS API response success field
        if (result.data?.success === false) {
            return {
                success: false,
                error: result.data?.message || result.data?.msg || "API returned success=false",
                requestHistory: result.requestHistory,
            };
        }

        return {
            success: true,
            data: result.data,
            requestHistory: result.requestHistory,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
