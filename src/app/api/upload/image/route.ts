import { NextRequest, NextResponse } from "next/server";
import { withFileUpload } from "@/lib/api-middleware";
import { createSuccessResponse } from "@/lib/api-utils";

export const POST = withFileUpload(
    async (request: NextRequest, user: any, supabase: any, file: File) => {
        try {
            console.log("=== Image Upload API Called ===");
            console.log("Image upload - File received:", {
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
            });

            console.log("Image upload - User:", {
                id: user.id,
                email: user.email,
                role: user.role,
            });

            console.log("Supabase client:", !!supabase);
            console.log("Supabase storage:", !!supabase?.storage);

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExt =
                file.name.split(".").pop() || file.type.split("/")[1] || "png";
            const fileName = `images/${timestamp}_${randomString}.${fileExt}`;

            console.log("Generated filename:", fileName);
            console.log("Attempting to upload to bucket: ticket-attachments");

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } =
                await supabase.storage
                    .from("ticket-attachments")
                    .upload(fileName, file);

            if (uploadError) {
                console.error("Storage upload error:", uploadError);
                console.error("Upload error details:", {
                    message: uploadError.message,
                    statusCode: uploadError.statusCode,
                    error: uploadError.error,
                    details: uploadError.details,
                });
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
                    message: "Image upload successful",
                },
                "File uploaded successfully"
            );
        } catch (error) {
            console.error("Image upload error:", error);
            return NextResponse.json(
                { error: "Image upload failed", details: error },
                { status: 500 }
            );
        }
    }
);
