/**
 * Utility functions to convert HTML to JIRA Atlassian Document Format (ADF)
 * This ensures consistency between text-to-jira page and JIRA API
 */

export interface JiraADFContent {
    type: "doc";
    version: 1;
    content: Array<{
        type: "paragraph";
        content: Array<{
            type: "text" | "inlineCard";
            text?: string;
            attrs?: {
                url: string;
            };
        }>;
    }>;
}

/**
 * Convert HTML to plain text for debug display
 * This function extracts text content from HTML while preserving structure
 */
export function convertHtmlToPlainText(html: string): string {
    if (!html) return "";
    
    // Convert img tags to URLs
    let result = html.replace(
        /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi,
        "$1"
    );
    
    // Convert link tags to URLs
    result = result.replace(
        /<a[^>]+href\s*=\s*["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi,
        "$1"
    );
    
    // Clean HTML tags
    result = result
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<p[^>]*>/gi, "")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<ul[^>]*>/gi, "")
        .replace(/<\/ul>/gi, "\n")
        .replace(/<ol[^>]*>/gi, "")
        .replace(/<\/ol>/gi, "\n")
        .replace(/<li[^>]*>/gi, "* ")
        .replace(/<\/li>/gi, "\n")
        .replace(/<div[^>]*>/gi, "\n")
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
    
    // Remove remaining HTML tags
    result = result.replace(/<[^>]*>/g, "");
    
    // Clean HTML entities and spacing
    result = result
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/\n\s*\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s+/g, "\n")
        .replace(/\s+\n/g, "\n")
        .trim();
    
    return result;
}

export function convertHtmlToJiraADF(html: string): JiraADFContent {
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
    console.log("Original HTML:", html);
    const plainTextResult = convertHtmlToPlainText(html);
    console.log("Final plain text:", plainTextResult);

    // Step 3: Extract images and links from plain text
    const images: string[] = [];
    const links: string[] = [];

    // Extract image URLs from plain text
    const imgUrlRegex = /https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp|svg)/gi;
    let imgMatch;
    while ((imgMatch = imgUrlRegex.exec(plainTextResult)) !== null) {
        images.push(imgMatch[0]);
        console.log("Found image URL:", imgMatch[0]);
    }

    // Extract link URLs from plain text
    const linkUrlRegex = /https?:\/\/[^\s]+/gi;
    let linkMatch;
    while ((linkMatch = linkUrlRegex.exec(plainTextResult)) !== null) {
        const url = linkMatch[0];
        // Skip if it's already an image URL
        if (!images.includes(url)) {
            links.push(url);
            console.log("Found link URL:", url);
        }
    }

    // Step 4: Process the plain text to create ADF content
    const lines = plainTextResult.split("\n");
    let currentParagraph = "";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) {
            // Empty line - add accumulated paragraph if any
            if (currentParagraph.trim()) {
                content.push({
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: currentParagraph.trim(),
                        },
                    ],
                });
                currentParagraph = "";
            }
            continue;
        }

        // Check if line contains only image URL
        const isOnlyImageUrl = images.some((imgUrl) => line === imgUrl);
        if (isOnlyImageUrl) {
            // Add accumulated paragraph first
            if (currentParagraph.trim()) {
                content.push({
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: currentParagraph.trim(),
                        },
                    ],
                });
                currentParagraph = "";
            }

            // Add image as inlineCard
            const imgUrl = images.find((imgUrl) => line === imgUrl);
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

        // Check if line contains only link URL
        const isOnlyLinkUrl = links.some((linkUrl) => line === linkUrl);
        if (isOnlyLinkUrl) {
            // Add accumulated paragraph first
            if (currentParagraph.trim()) {
                content.push({
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: currentParagraph.trim(),
                        },
                    ],
                });
                currentParagraph = "";
            }

            // Add link as inlineCard
            const linkUrl = links.find((linkUrl) => line === linkUrl);
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

        // Check if line contains text with embedded URLs
        let processedLine = line;
        const paragraphContent = [];

        // Process image URLs in the line
        for (const imgUrl of images) {
            if (line.includes(imgUrl)) {
                // Split the line by image URL
                const parts = line.split(imgUrl);
                for (let j = 0; j < parts.length; j++) {
                    if (parts[j].trim()) {
                        paragraphContent.push({
                            type: "text",
                            text: parts[j].trim(),
                        });
                    }
                    if (j < parts.length - 1) {
                        paragraphContent.push({
                            type: "inlineCard",
                            attrs: {
                                url: imgUrl,
                            },
                        });
                    }
                }
                processedLine = "";
                break;
            }
        }

        // Process link URLs in the line (if no images were found)
        if (processedLine) {
            for (const linkUrl of links) {
                if (line.includes(linkUrl)) {
                    // Split the line by link URL
                    const parts = line.split(linkUrl);
                    for (let j = 0; j < parts.length; j++) {
                        if (parts[j].trim()) {
                            paragraphContent.push({
                                type: "text",
                                text: parts[j].trim(),
                            });
                        }
                        if (j < parts.length - 1) {
                            paragraphContent.push({
                                type: "inlineCard",
                                attrs: {
                                    url: linkUrl,
                                },
                            });
                        }
                    }
                    processedLine = "";
                    break;
                }
            }
        }

        // If no URLs found in the line, treat as regular text
        if (processedLine) {
            if (currentParagraph) {
                currentParagraph += "\n" + processedLine;
            } else {
                currentParagraph = processedLine;
            }
        } else if (paragraphContent.length > 0) {
            // Add accumulated paragraph first
            if (currentParagraph.trim()) {
                content.push({
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: currentParagraph.trim(),
                        },
                    ],
                });
                currentParagraph = "";
            }

            // Add the paragraph with mixed content
            content.push({
                type: "paragraph",
                content: paragraphContent,
            });
        }
    }

    // Add any remaining paragraph
    if (currentParagraph.trim()) {
        content.push({
            type: "paragraph",
            content: [
                {
                    type: "text",
                    text: currentParagraph.trim(),
                },
            ],
        });
    }

    const result: JiraADFContent = {
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
} 