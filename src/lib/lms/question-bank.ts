/**
 * LMS Question Bank APIs - Question bank and question management
 */

import { LmsClient } from "./index";

export interface QuestionBank {
    iid: string;
    id: string;
    name: string;
    [key: string]: any;
}

export interface Question {
    iid: string;
    id: string;
    mark_video_question_files?: Array<{
        name: string;
        link: string;
        [key: string]: any;
    }>;
    kpi_time?: number;
    [key: string]: any;
}

export interface SearchQuestionBankParams {
    name: string;
    page?: number;
    items_per_page?: number;
}

export interface SearchQuestionBankResult {
    success: boolean;
    data?: QuestionBank[];
    error?: string;
}

export interface GetQuestionByTagParams {
    iid_question_banks: string[];
    tag?: string;
    page?: number;
    items_per_page?: number;
}

export interface GetQuestionByTagResult {
    success: boolean;
    data?: Question[];
    total?: number;
    error?: string;
}

/**
 * Search question banks by name
 */
export async function searchQuestionBank(
    client: LmsClient,
    params: SearchQuestionBankParams
): Promise<SearchQuestionBankResult> {
    const { name, page = 1, items_per_page = -1 } = params;

    try {
        const result = await client.send({
            path: "/question-bank/index/search",
            method: "POST",
            payload: {
                name,
                page,
                items_per_page,
            },
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to search question banks",
            };
        }

        // Check LMS API response success field
        if (result.data?.success === false) {
            return {
                success: false,
                error: result.data?.message || result.data?.msg || "API returned success=false",
            };
        }

        const questionBanks = result.data?.result || [];

        return {
            success: true,
            data: questionBanks,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get questions by tag from question banks
 */
export async function getQuestionByTag(
    client: LmsClient,
    params: GetQuestionByTagParams
): Promise<GetQuestionByTagResult> {
    const {
        iid_question_banks,
        tag = "",
        page = 1,
        items_per_page = -1,
    } = params;

    try {
        const result = await client.send({
            path: "/question/index/search",
            method: "POST",
            payload: {
                _sand_get_total: 1,
                page,
                items_per_page,
                question_bank: iid_question_banks,
                tags: tag,
            },
        });

        // Check HTTP request success
        if (!result.success) {
            return {
                success: false,
                error: result.error || "Failed to get questions",
            };
        }

        // Check LMS API response success field
        if (result.data?.success === false) {
            return {
                success: false,
                error: result.data?.message || result.data?.msg || "API returned success=false",
            };
        }

        const questions = result.data?.result || [];
        const total = result.data?.total || questions.length;

        return {
            success: true,
            data: questions,
            total,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
