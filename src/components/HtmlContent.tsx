"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import ImageModal from "./ImageModal";

interface HtmlContentProps {
    content: string;
    className?: string;
}

export default function HtmlContent({
    content,
    className = "",
}: HtmlContentProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [modalImage, setModalImage] = useState<{
        src: string;
        alt: string;
    } | null>(null);

    // Memoize processed content to avoid unnecessary re-processing
    const processedContent = React.useMemo(() => {
        return content.replace(
            /<img/g,
            '<img style="max-width: 250px; max-height: 250px; cursor: pointer; border-radius: 4px; transition: transform 0.2s ease; object-fit: contain;"'
        );
    }, [content]);

    // Memoize event handlers to prevent unnecessary re-attachments
    const handleImageClick = useCallback((event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        const target = event.target as HTMLElement;
        if (target.tagName === "IMG") {
            const img = target as HTMLImageElement;
            setModalImage({
                src: img.src,
                alt: img.alt || "Image",
            });
        }
    }, []);

    const handleMouseEnter = useCallback((img: HTMLImageElement) => {
        img.style.transform = "scale(1.02)";
    }, []);

    const handleMouseLeave = useCallback((img: HTMLImageElement) => {
        img.style.transform = "scale(1)";
    }, []);

    useEffect(() => {
        const contentElement = contentRef.current;
        if (contentElement) {
            // Use event delegation instead of attaching to each image
            contentElement.addEventListener("click", handleImageClick);

            // Add hover effects to images
            const images = contentElement.querySelectorAll("img");
            images.forEach((img) => {
                // Add hover effect with memoized handlers
                img.addEventListener("mouseenter", () => handleMouseEnter(img));
                img.addEventListener("mouseleave", () => handleMouseLeave(img));
            });

            // Cleanup function
            return () => {
                contentElement.removeEventListener("click", handleImageClick);
                images.forEach((img) => {
                    img.removeEventListener("mouseenter", () =>
                        handleMouseEnter(img)
                    );
                    img.removeEventListener("mouseleave", () =>
                        handleMouseLeave(img)
                    );
                });
            };
        }
    }, [content, handleImageClick, handleMouseEnter, handleMouseLeave]);

    const closeModal = useCallback(() => {
        setModalImage(null);
    }, []);

    return (
        <>
            <div
                ref={contentRef}
                className={className}
                dangerouslySetInnerHTML={{ __html: processedContent }}
            />
            <ImageModal
                isOpen={modalImage !== null}
                onClose={closeModal}
                imageSrc={modalImage?.src || ""}
                imageAlt={modalImage?.alt || ""}
            />
        </>
    );
}
