import { NextRequest, NextResponse } from "next/server";

interface JiraIssue {
    fields: {
        status: {
            name: string;
            statusCategory: {
                key: string;
            };
        };
    };
}

async function fetchJiraStatus(issueKey: string): Promise<{
    status: string;
    statusCategory: string;
} | null> {
    try {
        // Use same env variables as create-issue API
        const jiraUrl = process.env.JIRA_URL;
        const email = process.env.EMAIL;
        const apiToken = process.env.API_TOKEN;

        if (!jiraUrl || !email || !apiToken) {
            console.error("Missing Jira credentials. Need: JIRA_URL, EMAIL, API_TOKEN");
            return null;
        }

        const jiraApiUrl = `${jiraUrl}/rest/api/3/issue/${issueKey}`;
        const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

        const response = await fetch(jiraApiUrl, {
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(`Failed to fetch ${issueKey}: ${response.status}`);
            return null;
        }

        const data = (await response.json()) as JiraIssue;

        return {
            status: data.fields.status.name,
            statusCategory: data.fields.status.statusCategory.key,
        };
    } catch (error) {
        console.error(`Error fetching ${issueKey}:`, error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { jiraLinks } = body as { jiraLinks: string[] };

        if (!jiraLinks || !Array.isArray(jiraLinks)) {
            return NextResponse.json(
                { error: "jiraLinks array is required" },
                { status: 400 }
            );
        }

        // Extract issue keys from Jira links
        const issueKeys = jiraLinks
            .map((link) => {
                const match = link.match(/browse\/([A-Z]+-\d+)/);
                return match ? match[1] : null;
            })
            .filter(Boolean) as string[];

        if (issueKeys.length === 0) {
            return NextResponse.json({ statuses: {} });
        }

        // Fetch all statuses in parallel
        const results = await Promise.all(
            issueKeys.map(async (key) => {
                const status = await fetchJiraStatus(key);
                return { key, status };
            })
        );

        // Build result map: jiraLink -> status
        const statuses: Record<string, { status: string; statusCategory: string }> = {};
        
        results.forEach(({ key, status }, index) => {
            if (status) {
                statuses[jiraLinks[index]] = status;
            }
        });

        return NextResponse.json({ statuses });
    } catch (error) {
        console.error("Error in batch-status:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
