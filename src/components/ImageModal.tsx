"use client";

import React from "react";
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
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative max-w-4xl max-h-full">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 hover:bg-black/20 z-10"
                >
                    <X className="w-5 h-5" />
                </Button>
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
}
