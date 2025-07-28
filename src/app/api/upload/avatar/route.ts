import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        // Authenticate user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Get the uploaded file
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "File must be an image" },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File size must be less than 5MB" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split(".").pop() || "png";
        const fileName = `${user.id}_${timestamp}.${fileExtension}`;
        const filePath = `avatars/${fileName}`;

        // Upload to Supabase Storage
        console.log(`Uploading to: ${filePath}`);
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("ticket-attachments")
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true, // Allow overwrite
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return NextResponse.json(
                {
                    error: "Failed to upload file",
                    details: uploadError.message,
                    code: uploadError.name,
                },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from("ticket-attachments")
            .getPublicUrl(filePath);

        if (!publicUrlData?.publicUrl) {
            return NextResponse.json(
                { error: "Failed to get public URL" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            url: publicUrlData.publicUrl,
            path: filePath,
        });
    } catch (error: any) {
        console.error("Avatar upload error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
