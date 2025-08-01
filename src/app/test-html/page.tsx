"use client";

import React, { useState } from "react";
import HtmlContent from "@/components/HtmlContent";
import RichTextEditor from "@/components/RichTextEditor";
import { StatusBadgeDemo } from "@/components/StatusBadgeDemo";
import { TicketBadgeUsageDemo } from "@/components/TicketBadgeUsageDemo";

export default function TestHtmlPage() {
    const [content, setContent] = useState(`
        <p>Test content with images and links:</p>
        <img src="https://kffuylebxyifkimtcvxh.supabase.co/storage/v1/object/public/ticket-attachments/images/88578f89-b87b-4d88-b58b-e2c1ea0e10f5_1753956948278.png" alt="Test Image" />
        <p>Plain text URL: http://localhost:3000/tickets</p>
        <p>Another URL: https://example.com</p>
        <p>Image URL as text: https://via.placeholder.com/300x200.png</p>
        <p>Image link: <a href="https://via.placeholder.com/400x300.jpg">Click to see image</a></p>
        <ul>
            <li>Điều 1</li>
            <li>điều 2</li>
            <li>điều 3</li>
        </ul>
        <p>More content here...</p>
    `);

    return (
        <div className="container mx-auto p-8 space-y-8">
            <h1 className="text-2xl font-bold mb-4">
                Test HtmlContent & RichTextEditor
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* RichTextEditor */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">RichTextEditor</h2>
                    <RichTextEditor
                        value={content}
                        onChange={setContent}
                        placeholder="Nhập nội dung..."
                        className="min-h-64"
                    />
                </div>

                {/* HtmlContent Preview */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        HtmlContent Preview
                    </h2>
                    <div className="border rounded-md p-4 bg-gray-50">
                        <HtmlContent content={content} className="text-sm" />
                    </div>
                </div>
            </div>

            {/* Raw HTML */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Raw HTML</h2>
                <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-64">
                    {content}
                </pre>
            </div>
            <StatusBadgeDemo />
            <div className="mt-12">
                <TicketBadgeUsageDemo />
            </div>
        </div>
    );
}
