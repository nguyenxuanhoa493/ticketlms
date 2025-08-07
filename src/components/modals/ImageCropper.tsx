"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageCropperProps {
    currentAvatar?: string;
    onAvatarChange: (avatarUrl: string | null) => void;
    disabled?: boolean;
}

export default function ImageCropper({
    currentAvatar,
    onAvatarChange,
    disabled,
}: ImageCropperProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const { toast } = useToast();

    const handleFileSelect = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith("image/")) {
                toast({
                    title: "Lỗi",
                    description: "Vui lòng chọn file ảnh",
                    variant: "destructive",
                });
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "Lỗi",
                    description:
                        "File ảnh quá lớn. Vui lòng chọn file nhỏ hơn 5MB",
                    variant: "destructive",
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        },
        [toast]
    );

    const cropAndUpload = useCallback(async () => {
        if (!selectedImage || !canvasRef.current || !imageRef.current) return;

        setUploading(true);
        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Cannot get canvas context");

            // Set canvas size to 100x100
            canvas.width = 100;
            canvas.height = 100;

            const img = imageRef.current;

            // Calculate crop dimensions to maintain aspect ratio
            const size = Math.min(img.naturalWidth, img.naturalHeight);
            const startX = (img.naturalWidth - size) / 2;
            const startY = (img.naturalHeight - size) / 2;

            // Draw cropped and resized image
            ctx.drawImage(
                img,
                startX,
                startY,
                size,
                size, // source
                0,
                0,
                100,
                100 // destination
            );

            // Convert canvas to blob
            canvas.toBlob(
                async (blob) => {
                    if (!blob) throw new Error("Failed to create blob");

                    // Create form data for upload
                    const formData = new FormData();
                    formData.append("file", blob, "avatar.png");

                    // Upload to server
                    console.log("Uploading avatar...");
                    const response = await fetch("/api/upload?type=avatar", {
                        method: "POST",
                        body: formData,
                    });

                    const result = await response.json();
                    console.log("Upload response:", {
                        status: response.status,
                        result,
                    });

                    if (!response.ok) {
                        console.error("Upload failed:", result);
                        throw new Error(result.error || "Upload failed");
                    }

                    // Notify parent component
                    onAvatarChange(result.data?.url || result.url);
                    setSelectedImage(null);

                    toast({
                        title: "Thành công",
                        description: "Đã cập nhật avatar",
                    });
                },
                "image/png",
                0.9
            );
        } catch (error: unknown) {
            console.error("Upload error:", error);

            // Show more detailed error message
            let errorMessage = "Không thể upload ảnh";
            if (error instanceof Error && error.message) {
                errorMessage = error.message;
            }

            toast({
                title: "Lỗi upload avatar",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    }, [selectedImage, onAvatarChange, toast]);

    const handleRemoveAvatar = () => {
        onAvatarChange(null);
        setSelectedImage(null);
        toast({
            title: "Thành công",
            description: "Đã xóa avatar",
        });
    };

    const cancelCrop = () => {
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-4">
            {/* Current/Preview Avatar */}
            <div className="space-y-4">
                {/* Avatar preview and info */}
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                            {currentAvatar ? (
                                <img
                                    src={currentAvatar}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Upload className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                    </div>

                    <div className="flex-1">
                        <p className="text-sm font-medium">Avatar</p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-center space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || uploading}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Chọn ảnh
                    </Button>

                    {currentAvatar && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            disabled={disabled || uploading}
                            className="text-red-600 hover:text-red-800"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Crop Preview */}
            {selectedImage && (
                <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="text-sm font-medium mb-2">Preview:</div>

                    <div className="space-y-4">
                        {/* Original image (hidden) */}
                        <img
                            ref={imageRef}
                            src={selectedImage}
                            alt="Selected"
                            className="hidden"
                            onLoad={() => {
                                // Auto-trigger crop preview when image loads
                                if (canvasRef.current && imageRef.current) {
                                    const canvas = canvasRef.current;
                                    const ctx = canvas.getContext("2d");
                                    if (ctx) {
                                        canvas.width = 100;
                                        canvas.height = 100;

                                        const img = imageRef.current;
                                        const size = Math.min(
                                            img.naturalWidth,
                                            img.naturalHeight
                                        );
                                        const startX =
                                            (img.naturalWidth - size) / 2;
                                        const startY =
                                            (img.naturalHeight - size) / 2;

                                        ctx.drawImage(
                                            img,
                                            startX,
                                            startY,
                                            size,
                                            size,
                                            0,
                                            0,
                                            100,
                                            100
                                        );
                                    }
                                }
                            }}
                        />

                        {/* Crop preview */}
                        <div className="flex justify-center">
                            <div className="w-24 h-24 border-2 border-blue-500 rounded-full overflow-hidden bg-white">
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-full"
                                />
                            </div>
                        </div>

                        {/* Crop actions */}
                        <div className="flex justify-center space-x-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={cropAndUpload}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                {uploading ? "Đang upload..." : "Xác nhận"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={cancelCrop}
                                disabled={uploading}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
