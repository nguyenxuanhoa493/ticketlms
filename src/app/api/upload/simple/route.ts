import { NextRequest, NextResponse } from "next/server";
import { withFileUpload } from "@/lib/api-middleware";
import { createSuccessResponse } from "@/lib/api-utils";

export const POST = withFileUpload(
    async (request: NextRequest, user: any, supabase: any, file: File) => {
        try {
            console.log("=== Simple Upload API Called ===");
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

            // Convert file to base64 for testing
            const arrayBuffer = await file.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:${file.type};base64,${base64}`;

            return createSuccessResponse(
                {
                    url: dataUrl,
                    filename: file.name,
                    size: file.size,
                    type: file.type,
                    message: "Simple upload successful (base64)",
                },
                "File uploaded successfully"
            );
        } catch (error) {
            console.error("Simple upload error:", error);
            return NextResponse.json(
                { error: "Simple upload failed", details: error },
                { status: 500 }
            );
        }
    }
);
