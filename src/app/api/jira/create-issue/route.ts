import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description } = body;

        if (!title?.trim()) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

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

        // Convert HTML description to JIRA format
        const convertHtmlToJira = (html: string): string => {
            if (!html) return "";

            // First, handle images - convert them to JIRA image format
            let jiraText = html.replace(
                /<img[^>]+src="([^"]+)"[^>]*>/gi,
                (match, src) => {
                    // Extract alt text if available
                    const altMatch = match.match(/alt="([^"]*)"/i);
                    const alt = altMatch ? altMatch[1] : "Image";

                    // JIRA image format: !image_url|alt_text!
                    return `\n!${src}|${alt}!\n`;
                }
            );

            // Then handle other HTML tags
            jiraText = jiraText
                // Convert <p> tags to newlines
                .replace(/<p[^>]*>/gi, "")
                .replace(/<\/p>/gi, "\n\n")
                // Convert <br> tags to newlines
                .replace(/<br\s*\/?>/gi, "\n")
                // Convert <strong> and <b> to *bold*
                .replace(/<(strong|b)[^>]*>/gi, "*")
                .replace(/<\/(strong|b)>/gi, "*")
                // Convert <em> and <i> to _italic_
                .replace(/<(em|i)[^>]*>/gi, "_")
                .replace(/<\/(em|i)>/gi, "_")
                // Convert <h1> to h1.
                .replace(/<h1[^>]*>/gi, "h1. ")
                .replace(/<\/h1>/gi, "\n")
                // Convert <h2> to h2.
                .replace(/<h2[^>]*>/gi, "h2. ")
                .replace(/<\/h2>/gi, "\n")
                // Convert <h3> to h3.
                .replace(/<h3[^>]*>/gi, "h3. ")
                .replace(/<\/h3>/gi, "\n")
                // Convert <ul> and <ol> to lists
                .replace(/<ul[^>]*>/gi, "")
                .replace(/<\/ul>/gi, "\n")
                .replace(/<ol[^>]*>/gi, "")
                .replace(/<\/ol>/gi, "\n")
                // Convert <li> to *
                .replace(/<li[^>]*>/gi, "* ")
                .replace(/<\/li>/gi, "\n")
                // Remove remaining HTML tags
                .replace(/<[^>]*>/g, "")
                // Decode HTML entities
                .replace(/&nbsp;/g, " ")
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                // Clean up multiple newlines
                .replace(/\n\s*\n\s*\n/g, "\n\n")
                .trim();

            return jiraText;
        };

        // Convert HTML to JIRA Atlassian Document Format (ADF)
        const convertToJiraADF = (html: string) => {
            if (!html) {
                return {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: "",
                                },
                            ],
                        },
                    ],
                };
            }

            const content: any[] = [];

            // Step 1: Convert HTML to plain text first
            const convertHtmlToPlainText = (htmlContent: string) => {
                // Step 1: Convert img tags to URLs FIRST (before any other processing)
                let result = htmlContent.replace(
                    /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi,
                    "$1"
                );

                // Step 2: Convert link tags to URLs
                result = result.replace(
                    /<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi,
                    "$1"
                );

                // Step 3: Clean other HTML tags
                result = result
                    .replace(/<br\s*\/?>/gi, "\n") // Convert <br> to \n
                    .replace(/<p[^>]*>/gi, "")
                    .replace(/<\/p>/gi, "\n\n")
                    .replace(/<ul[^>]*>/gi, "")
                    .replace(/<\/ul>/gi, "\n")
                    .replace(/<ol[^>]*>/gi, "")
                    .replace(/<\/ol>/gi, "\n")
                    .replace(/<li[^>]*>/gi, "* ")
                    .replace(/<\/li>/gi, "\n")
                    .replace(/<div[^>]*>/gi, "")
                    .replace(/<\/div>/gi, "\n")
                    .replace(/<span[^>]*>/gi, "")
                    .replace(/<\/span>/gi, "")
                    .replace(/<(strong|b)[^>]*>/gi, "*")
                    .replace(/<\/(strong|b)>/gi, "*")
                    .replace(/<(em|i)[^>]*>/gi, "_")
                    .replace(/<\/(em|i)>/gi, "_")
                    .replace(/<h1[^>]*>/gi, "h1. ")
                    .replace(/<\/h1>/gi, "\n")
                    .replace(/<h2[^>]*>/gi, "h2. ")
                    .replace(/<\/h2>/gi, "\n")
                    .replace(/<h3[^>]*>/gi, "h3. ")
                    .replace(/<\/h3>/gi, "\n");

                // Step 4: Remove any remaining HTML tags
                result = result.replace(/<[^>]*>/g, "");

                // Step 5: Clean HTML entities
                result = result
                    .replace(/&nbsp;/g, " ")
                    .replace(/&amp;/g, "&")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&apos;/g, "'")
                    .replace(/\n\s*\n/g, "\n") // Remove multiple newlines
                    .replace(/[ \t]+/g, " ") // Replace multiple spaces/tabs with single space, but keep \n
                    .trim();

                return result;
            };

            // Step 2: Convert HTML to plain text (including image URLs)
            const plainText = convertHtmlToPlainText(html);
            console.log("Plain text:", plainText);

            // Step 3: Extract images and links from plain text
            const images: string[] = [];
            const links: string[] = [];

            // Extract image URLs from plain text
            const imgUrlRegex =
                /https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp|svg)/gi;
            let imgMatch;
            while ((imgMatch = imgUrlRegex.exec(plainText)) !== null) {
                images.push(imgMatch[0]);
                console.log("Found image URL:", imgMatch[0]);
            }

            // Extract link URLs from plain text
            const linkUrlRegex = /https?:\/\/[^\s]+/gi;
            let linkMatch;
            while ((linkMatch = linkUrlRegex.exec(plainText)) !== null) {
                const url = linkMatch[0];
                // Skip if it's already an image URL
                if (!images.includes(url)) {
                    links.push(url);
                    console.log("Found link URL:", url);
                }
            }

            // Step 4: Split text by lines and process
            const lines = plainText.split("\n");
            let currentText = "";

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                if (!line) {
                    // Empty line - add accumulated text if any
                    if (currentText.trim()) {
                        content.push({
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: currentText.trim(),
                                },
                            ],
                        });
                        currentText = "";
                    }
                    continue;
                }

                // Check if line contains image URL
                const isImageUrl = images.some((imgUrl) =>
                    line.includes(imgUrl)
                );
                if (isImageUrl) {
                    // Add accumulated text first
                    if (currentText.trim()) {
                        content.push({
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: currentText.trim(),
                                },
                            ],
                        });
                        currentText = "";
                    }

                    // Add image as inlineCard
                    const imgUrl = images.find((imgUrl) =>
                        line.includes(imgUrl)
                    );
                    if (imgUrl) {
                        content.push({
                            type: "paragraph",
                            content: [
                                {
                                    type: "inlineCard",
                                    attrs: {
                                        url: imgUrl,
                                    },
                                },
                            ],
                        });
                    }
                    continue;
                }

                // Check if line contains link URL
                const isLinkUrl = links.some((linkUrl) =>
                    line.includes(linkUrl)
                );
                if (isLinkUrl) {
                    // Add accumulated text first
                    if (currentText.trim()) {
                        content.push({
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: currentText.trim(),
                                },
                            ],
                        });
                        currentText = "";
                    }

                    // Add link as inlineCard
                    const linkUrl = links.find((linkUrl) =>
                        line.includes(linkUrl)
                    );
                    if (linkUrl) {
                        content.push({
                            type: "paragraph",
                            content: [
                                {
                                    type: "inlineCard",
                                    attrs: {
                                        url: linkUrl,
                                    },
                                },
                            ],
                        });
                    }
                    continue;
                }

                // Regular text line
                if (currentText) {
                    currentText += "\n" + line;
                } else {
                    currentText = line;
                }
            }

            // Add any remaining text
            if (currentText.trim()) {
                content.push({
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: currentText.trim(),
                        },
                    ],
                });
            }

            const result = {
                type: "doc",
                version: 1,
                content:
                    content.length > 0
                        ? content
                        : [
                              {
                                  type: "paragraph",
                                  content: [
                                      {
                                          type: "text",
                                          text: "",
                                      },
                                  ],
                              },
                          ],
            };

            console.log("JIRA ADF Output:", JSON.stringify(result, null, 2));
            return result;
        };

        // Prepare JIRA issue data - using ADF format
        const jiraIssueData = {
            fields: {
                project: {
                    key: "CLD",
                },
                summary: title.trim(),
                description: convertToJiraADF(description || ""),
                issuetype: {
                    name: "Task",
                },
            },
        };

        console.log(
            "JIRA Request Data:",
            JSON.stringify(jiraIssueData, null, 2)
        );

        // Create JIRA API URL
        const apiUrl = `${jiraUrl}/rest/api/3/issue`;

        // Create Basic Auth header
        const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(jiraIssueData),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("JIRA API error:", response.status, errorData);

            if (response.status === 400) {
                return NextResponse.json(
                    { error: "Invalid JIRA issue data" },
                    { status: 400 }
                );
            } else if (response.status === 403) {
                return NextResponse.json(
                    { error: "Permission denied to create JIRA issue" },
                    { status: 403 }
                );
            } else {
                return NextResponse.json(
                    { error: "Failed to create JIRA issue" },
                    { status: 500 }
                );
            }
        }

        const data = await response.json();

        // Return the created issue data
        const issueData = {
            key: data.key,
            id: data.id,
            self: data.self,
            jiraLink: `${jiraUrl}/browse/${data.key}`,
        };

        return NextResponse.json(issueData);
    } catch (error) {
        console.error("Error creating JIRA issue:", error);
        return NextResponse.json(
            { error: "Failed to create JIRA issue" },
            { status: 500 }
        );
    }
}
