"use client";

import React from "react";

interface HtmlContentProps {
    content: string;
    className?: string;
}

const HtmlContent: React.FC<HtmlContentProps> = ({
    content,
    className = "",
}) => {
    return (
        <div
            className={`prose prose-sm max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default HtmlContent;
