import { NextRequest, NextResponse } from "next/server";
import { withFileUpload } from "@/lib/api-middleware";
import { createSuccessResponse } from "@/lib/api-utils";

export const POST = withFileUpload(
    async (request: NextRequest, user: any, supabase: any, file: File) => {
        try {
            console.log("=== Avatar Upload API Called ===");
            console.log(
                "Request headers:",
                Object.fromEntries(request.headers.entries())
            );
            console.log("Request method:", request.method);
            console.log("Avatar file received:", {
                name: file.name,
                type: file.type,
                size: file.size,
            });

            console.log("User:", {
                id: user.id,
                email: user.email,
                role: user.role,
            });

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

            // Validate file size (5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                return NextResponse.json(
                    { error: "File too large. Maximum size is 5MB" },
                    { status: 400 }
                );
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 15);
            const fileExt =
                file.name.split(".").pop() || file.type.split("/")[1] || "png";
            const fileName = `avatars/${timestamp}_${randomString}.${fileExt}`;

            console.log("Generated avatar filename:", fileName);
            console.log("Attempting to upload to bucket: ticket-attachments");

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } =
                await supabase.storage
                    .from("ticket-attachments")
                    .upload(fileName, file);

            if (uploadError) {
                console.error("Avatar upload error:", uploadError);
                console.error("Upload error details:", {
                    message: uploadError.message,
                    statusCode: uploadError.statusCode,
                    error: uploadError.error,
                    details: uploadError.details,
                });
                return NextResponse.json(
                    {
                        error: "Failed to upload avatar",
                        details: uploadError.message,
                    },
                    { status: 500 }
                );
            }

            console.log("Avatar upload successful, uploadData:", uploadData);

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
                    message: "Avatar upload successful",
                },
                "Avatar uploaded successfully"
            );
        } catch (error) {
            console.error("Avatar upload error:", error);
            return NextResponse.json(
                { error: "Avatar upload failed", details: error },
                { status: 500 }
            );
        }
    }
);
