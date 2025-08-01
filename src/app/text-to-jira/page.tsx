"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextEditor from "@/components/RichTextEditor";
import {
    convertHtmlToJiraADF,
    convertHtmlToPlainText,
} from "@/lib/jira-adf-converter";

export default function TextToJiraPage() {
    const [htmlInput, setHtmlInput] = useState(
        `Khi bấm mở modal/dropdown để lựa chọn (những modal không có nút close), sau đó bấm ra ngoài hoặc lựa chọn khác thì modal/dropdown không tự động đóng lại<div>Video :&nbsp;<a href="https://drive.google.com/file/d/1QNrzk-3WOah15tLE5MwNcyk6QyCfss0h/view?usp=drive_link" target="_blank" rel="noopener noreferrer" style="color: rgb(37, 99, 235); text-decoration: underline;">https://drive.google.com/file/d/1QNrzk-3WOah15tLE5MwNcyk6QyCfss0h/view?usp=drive_link</a></div><div>Hình ảnh:</div><div><img src="https://i.ibb.co/N6CgCryF/0-Jh35z-PAo1.png" alt="Pasted Image" style="max-width: 250px; max-height: 250px; width: auto; height: auto; margin: 8px 0px; border-radius: 4px; border: 1px solid rgb(229, 231, 235); object-fit: contain;"></div>`
    );

    // Sample templates for testing
    const sampleTemplates = {
        current: `Khi bấm mở modal/dropdown để lựa chọn (những modal không có nút close), sau đó bấm ra ngoài hoặc lựa chọn khác thì modal/dropdown không tự động đóng lại<div>Video :&nbsp;<a href="https://drive.google.com/file/d/1QNrzk-3WOah15tLE5MwNcyk6QyCfss0h/view?usp=drive_link" target="_blank" rel="noopener noreferrer" style="color: rgb(37, 99, 235); text-decoration: underline;">https://drive.google.com/file/d/1QNrzk-3WOah15tLE5MwNcyk6QyCfss0h/view?usp=drive_link</a></div><div>Hình ảnh:</div><div><img src="https://i.ibb.co/N6CgCryF/0-Jh35z-PAo1.png" alt="Pasted Image" style="max-width: 250px; max-height: 250px; width: auto; height: auto; margin: 8px 0px; border-radius: 4px; border: 1px solid rgb(229, 231, 235); object-fit: contain;"></div>`,
        old: `<img src="https://kffuylebxyifkimtcvxh.supabase.co/storage/v1/object/public/ticket-attachments/images/88578f89-b87b-4d88-b58b-e2c1ea0e10f5_1753956948278.png" alt="CleanShot 2025-07-31 at 17.15.43@2x.png" style="max-width: 100%; height: auto; margin: 8px 0px; border-radius: 4px;"><div>tich<br><a href="https://localhost:3000/tickets" target="_blank" rel="noopener noreferrer" style="color: rgb(37, 99, 235); text-decoration: underline;">https://localhost:3000/tickets</a><br><ul><li><span style="color: rgb(10, 10, 10); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Noto Sans&quot;, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;;">Điều 1</span></li><li><span style="color: rgb(10, 10, 10); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Noto Sans&quot;, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;;">điều 2</span></li><li><span style="color: rgb(10, 10, 10); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Noto Sans&quot;, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;;">điều 3</span></li><li><span style="color: rgb(10, 10, 10); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Noto Sans&quot;, Ubuntu, Cantarell, &quot;Helvetica Neue&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;;"><a href="http://localhost:3000/tickets/3e06e16e-7312-4ede-8db8-2bdfea7eb7b2" target="_blank" rel="noopener noreferrer" style="color: rgb(37, 99, 235); text-decoration: underline;">http://localhost:3000/tickets/3e06e16e-7312-4ede-8db8-2bdfea7eb7b2</a><br></span></li></ul><img src="https://kffuylebxyifkimtcvxh.supabase.co/storage/v1/object/public/ticket-attachments/images/3403c560-3892-442c-bd60-c84b65e8ef22_1754033858869.png" alt="CleanShot 2025-08-01 at 14.37.18@2x.png" style="max-width: 250px; max-height: 250px; width: auto; height: auto; margin: 8px 0px; border-radius: 4px; border: 1px solid rgb(229, 231, 235); object-fit: contain;"><br></div>`,
    };
    const [jiraOutput, setJiraOutput] = useState("");
    const [plainText, setPlainText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleConvert = () => {
        setIsLoading(true);
        try {
            // Get plain text for debug display
            const plainTextResult = convertHtmlToPlainText(htmlInput);
            setPlainText(plainTextResult);

            // Convert to JIRA ADF using shared utility
            const result = convertHtmlToJiraADF(htmlInput);
            setJiraOutput(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error("Error converting HTML to JIRA ADF:", error);
            setJiraOutput("Error: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">
                HTML to JIRA ADF Converter
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>HTML Input</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2 mb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setHtmlInput(sampleTemplates.current)
                                }
                            >
                                Load Current Sample
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setHtmlInput(sampleTemplates.old)
                                }
                            >
                                Load Old Sample
                            </Button>
                        </div>
                        <div className="min-h-[400px] border rounded-md">
                            <RichTextEditor
                                value={htmlInput}
                                onChange={setHtmlInput}
                                placeholder="Enter content here..."
                            />
                        </div>
                        <Button
                            onClick={handleConvert}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading
                                ? "Converting..."
                                : "Convert to JIRA ADF"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Output Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>JIRA ADF Output</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">
                                Plain Text (Debug):
                            </h3>
                            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-32">
                                {plainText}
                            </pre>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">JIRA ADF:</h3>
                            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">
                                {jiraOutput || "Click 'Convert' to see output"}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
