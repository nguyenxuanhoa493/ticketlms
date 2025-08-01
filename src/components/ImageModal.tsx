"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    imageAlt?: string;
}

export default function ImageModal({
    isOpen,
    onClose,
    imageSrc,
    imageAlt = "Image",
}: ImageModalProps) {
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageError, setImageError] = React.useState(false);

    // Handle ESC key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    // Reset states when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setImageLoaded(false);
            setImageError(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
        setImageError(false);
    };

    const handleImageError = () => {
        setImageError(true);
        setImageLoaded(false);
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-[95%] sm:max-w-[85%] md:max-w-[70%] max-h-[95%] flex items-center justify-center">
                {/* Image container with proper centering */}
                <div className="flex items-center justify-center w-full h-full">
                    {imageError ? (
                        <div className="text-white text-center p-8">
                            <p className="text-lg mb-2">Không thể tải ảnh</p>
                            <p className="text-sm text-gray-300">{imageSrc}</p>
                        </div>
                    ) : (
                        <>
                            {!imageLoaded && (
                                <div className="text-white text-center p-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                                    <p>Đang tải ảnh...</p>
                                </div>
                            )}
                            <div className="relative inline-block">
                                <img
                                    src={imageSrc}
                                    alt={imageAlt}
                                    className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300 border-2 sm:border-4 border-white ${
                                        imageLoaded
                                            ? "opacity-100"
                                            : "opacity-0"
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                    style={{
                                        maxWidth: "95vw",
                                        maxHeight: "95vh",
                                    }}
                                />
                                {/* Close button - positioned absolutely relative to the image */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 text-gray-800 hover:text-red-600 hover:bg-white/90 z-10 rounded-full w-8 h-8 sm:w-10 sm:h-10 p-0 flex items-center justify-center bg-white/90 backdrop-blur-sm border-2 border-gray-300 shadow-lg transition-all duration-200"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
