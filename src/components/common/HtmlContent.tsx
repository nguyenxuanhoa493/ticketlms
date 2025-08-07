"use client";

import React, { useState, useEffect, useRef } from "react";
import ImageModal from "../modals/ImageModal";

interface HtmlContentProps {
    content: string;
    className?: string;
}

const HtmlContent: React.FC<HtmlContentProps> = ({
    content,
    className = "",
}) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedImageAlt, setSelectedImageAlt] = useState<string>("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Add click handlers to images after content is rendered
    useEffect(() => {
        const handleImageClick = (event: Event) => {
            const target = event.target as HTMLImageElement;
            if (target.tagName === "IMG") {
                event.preventDefault();
                setSelectedImage(target.src);
                setSelectedImageAlt(target.alt || "Image");
            }
        };

        // Add click event listener to the container
        const container = containerRef.current;
        if (container) {
            container.addEventListener("click", handleImageClick);
        }

        return () => {
            if (container) {
                container.removeEventListener("click", handleImageClick);
            }
        };
    }, [content]);

    const handleCloseModal = () => {
        setSelectedImage(null);
        setSelectedImageAlt("");
    };

    return (
        <>
            <div
                ref={containerRef}
                className={`prose prose-sm max-w-none html-content ${className}`}
                dangerouslySetInnerHTML={{ __html: content }}
                style={{
                    cursor: "default",
                }}
            />

            <style jsx global>{`
                .html-content img {
                    cursor: pointer;
                    transition: transform 0.2s ease;
                    max-width: 250px;
                    max-height: 250px;
                    border-radius: 4px;
                    border: 1px solid #e5e7eb;
                }

                .html-content img:hover {
                    transform: scale(1.02);
                }
            `}</style>

            <ImageModal
                isOpen={!!selectedImage}
                onClose={handleCloseModal}
                imageSrc={selectedImage || ""}
                imageAlt={selectedImageAlt}
            />
        </>
    );
};

export default HtmlContent;
