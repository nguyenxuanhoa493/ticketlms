import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ key: string }> }
) {
    try {
        const { key } = await params;

        // Get environment variables
        const jiraUrl = process.env.JIRA_URL;
        const apiToken = process.env.API_TOKEN;
        const email = process.env.EMAIL;

        if (!jiraUrl || !apiToken || !email) {
            return NextResponse.json(
                { error: "JIRA configuration is missing" },
                { status: 500 }
            );
        }

        // Construct JIRA API URL
        const apiUrl = `${jiraUrl}/rest/api/3/issue/${key}`;

        // Create Basic Auth header
        const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json(
                    { error: "JIRA issue not found" },
                    { status: 404 }
                );
            }
            throw new Error(`JIRA API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract relevant fields
        const issue = {
            key: data.key,
            fields: {
                summary: data.fields.summary,
                status: {
                    name: data.fields.status.name,
                    statusCategory: {
                        colorName: data.fields.status.statusCategory.colorName,
                    },
                },
                assignee: data.fields.assignee
                    ? {
                          displayName: data.fields.assignee.displayName,
                          avatarUrls: data.fields.assignee.avatarUrls,
                      }
                    : null,
                updated: data.fields.updated,
            },
        };

        return NextResponse.json(issue);
    } catch (error) {
        console.error("Error fetching JIRA issue:", error);
        return NextResponse.json(
            { error: "Failed to fetch JIRA issue" },
            { status: 500 }
        );
    }
}
