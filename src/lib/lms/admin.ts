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

        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to fetch domain groups",
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

        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to create domain",
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
