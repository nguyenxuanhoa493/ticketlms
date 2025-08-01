"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import ImageModal from "./ImageModal";

interface HtmlContentProps {
    content: string;
    className?: string;
}

// Helper function to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
};

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
        let processed = content;

        // Check if content is HTML-encoded and decode it
        if (
            processed.includes("&lt;") ||
            processed.includes("&gt;") ||
            processed.includes("&amp;")
        ) {
            processed = decodeHtmlEntities(processed);
        }

        // First, handle plain text URLs that are not already in HTML tags
        // This regex looks for URLs that are not inside any HTML tags
        const plainTextUrlRegex =
            /(?<!<[^>]*)(https?:\/\/[^\s<>"{}|\\^`\[\]]+)(?![^<]*>)/gi;
        processed = processed.replace(plainTextUrlRegex, (url) => {
            // Check if URL is an image
            const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;
            const imageHostingServices =
                /(imgur\.com|flickr\.com|500px\.com|unsplash\.com|pexels\.com|pixabay\.com|via\.placeholder\.com)/i;

            if (imageExtensions.test(url) || imageHostingServices.test(url)) {
                return `<img src="${url}" alt="Image" style="max-width: 250px; max-height: 250px; cursor: pointer; border-radius: 4px; transition: transform 0.2s ease; object-fit: contain;">`;
            }
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="auto-link">${url}</a>`;
        });

        // Convert image links to actual images
        processed = processed.replace(
            /<a\s+([^>]*?)href="([^"]*\.(jpg|jpeg|png|gif|webp|svg|bmp|ico))"[^>]*>([^<]*)<\/a>/gi,
            (match, attributes, url, extension, linkText) => {
                return `<img src="${url}" alt="${linkText || "Image"}" style="max-width: 250px; max-height: 250px; cursor: pointer; border-radius: 4px; transition: transform 0.2s ease; object-fit: contain;">`;
            }
        );

        // Also convert links to image hosting services
        processed = processed.replace(
            /<a\s+([^>]*?)href="([^"]*(imgur\.com|flickr\.com|500px\.com|unsplash\.com|pexels\.com|pixabay\.com|via\.placeholder\.com)[^"]*)"[^>]*>([^<]*)<\/a>/gi,
            (match, attributes, url, service, linkText) => {
                return `<img src="${url}" alt="${linkText || "Image"}" style="max-width: 250px; max-height: 250px; cursor: pointer; border-radius: 4px; transition: transform 0.2s ease; object-fit: contain;">`;
            }
        );

        // Ensure all remaining links open in new tab
        processed = processed.replace(
            /<a\s+([^>]*?)>/gi,
            (match, attributes) => {
                // If target="_blank" is already present, don't add it again
                if (attributes.includes('target="_blank"')) {
                    return match;
                }
                // Add target="_blank" and rel="noopener noreferrer" if not present
                return `<a ${attributes} target="_blank" rel="noopener noreferrer">`;
            }
        );

        // Add image styling if not already present
        processed = processed.replace(
            /<img([^>]*?)>/gi,
            (match, attributes) => {
                // If style is already present, don't add it again
                if (attributes.includes("style=")) {
                    return match;
                }
                return `<img${attributes} style="max-width: 250px; max-height: 250px; cursor: pointer; border-radius: 4px; transition: transform 0.2s ease; object-fit: contain;">`;
            }
        );

        return processed;
    }, [content]);

    // Memoize event handlers to prevent unnecessary re-attachments
    const handleImageClick = useCallback((event: Event) => {
        const target = event.target as HTMLElement;

        // Only handle image clicks, let links work normally
        if (target.tagName === "IMG") {
            event.preventDefault();
            event.stopPropagation();

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

            // Add hover effects and error handling to images
            const images = contentElement.querySelectorAll("img");
            images.forEach((img) => {
                // Add hover effect with memoized handlers
                img.addEventListener("mouseenter", () => handleMouseEnter(img));
                img.addEventListener("mouseleave", () => handleMouseLeave(img));

                // Add error handling for images
                img.addEventListener("error", () => {
                    // If image fails to load, convert back to link
                    const imgParent = img.parentElement;
                    if (imgParent) {
                        const link = document.createElement("a");
                        link.href = img.src;
                        link.textContent = img.src;
                        link.target = "_blank";
                        link.rel = "noopener noreferrer";
                        link.className = "auto-link";
                        imgParent.replaceChild(link, img);
                    }
                });
            });

            // Ensure all links open in new tab
            const links = contentElement.querySelectorAll("a");
            links.forEach((link) => {
                if (!link.target) {
                    link.target = "_blank";
                }
                if (!link.rel) {
                    link.rel = "noopener noreferrer";
                }
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
                className={`rich-text-content ${className}`}
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
