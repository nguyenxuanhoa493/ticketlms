import { NextRequest, NextResponse } from "next/server";
import { withFileUpload } from "@/lib/api-middleware";
import { createSuccessResponse, AuthenticatedUser } from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";

export const POST = withFileUpload(
    async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient, file: File) => {
        try {
            console.log("=== Unified Upload API Called ===");
            console.log("File received:", {
                name: file.name,
                type: file.type,
                size: file.size,
            });

            console.log("User:", {
                id: user.id,
                email: user.email,
                role: user.role,
            });

            // Get upload type from query params
            const url = new URL(request.url);
            const uploadType = url.searchParams.get("type") || "image"; // "avatar" or "image"
            const shouldCrop = uploadType === "avatar";

            console.log("Upload type:", uploadType, "Should crop:", shouldCrop);

            // Validate file type
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp",
            ];

            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    {
                        error: `Invalid file type. Allowed types: ${allowedTypes.join(
                            ", "
                        )}`,
                    },
                    { status: 400 }
                );
            }

            // Validate file size (5MB for images, 2MB for avatars)
            const maxSize = shouldCrop ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
            if (file.size > maxSize) {
                return NextResponse.json(
                    {
                        error: `File too large. Maximum size is ${
                            shouldCrop ? "2MB" : "5MB"
                        }`,
                    },
                    { status: 400 }
                );
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExt =
                file.name.split(".").pop() || file.type.split("/")[1] || "png";

            // Determine folder based on upload type
            const folder = shouldCrop ? "avatars" : "images";
            const fileName = `${folder}/${timestamp}_${randomString}.${fileExt}`;

            console.log("Generated filename:", fileName);
            console.log("Attempting to upload to bucket: ticket-attachments");

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } =
                await supabase.storage
                    .from("ticket-attachments")
                    .upload(fileName, file);

            if (uploadError) {
                console.error("Storage upload error:", uploadError);
                return NextResponse.json(
                    {
                        error: "Failed to upload file to storage",
                        details: uploadError.message,
                    },
                    { status: 500 }
                );
            }

            console.log("Upload successful, uploadData:", uploadData);

            // Get public URL
            const {
                data: { publicUrl },
            } = supabase.storage
                .from("ticket-attachments")
                .getPublicUrl(fileName);

            return createSuccessResponse(
                {
                    url: publicUrl,
                    filename: fileName,
                    size: file.size,
                    type: file.type,
                    uploadType: uploadType,
                    message: `${uploadType} upload successful`,
                },
                `${uploadType} uploaded successfully`
            );
        } catch (error) {
            console.error("Upload error:", error);
            return NextResponse.json(
                { error: "Upload failed", details: error },
                { status: 500 }
            );
        }
    }
);
