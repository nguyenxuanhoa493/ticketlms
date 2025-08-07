import { NextRequest, NextResponse } from "next/server";
import { withFileUpload } from "@/lib/api-middleware";
import {
    validateFileUpload,
    generateUniqueFileName,
    createSuccessResponse,
    AuthenticatedUser
} from "@/lib/api-utils";

export const POST = withFileUpload(async (request: NextRequest, user: AuthenticatedUser, supabase: any, file: File) => {
    // Validate file
    const validation = validateFileUpload(file);
    if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    // Generate unique filename
    const fileName = generateUniqueFileName(file, "avatars/");
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file);
    
    if (uploadError) {
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
    
    return createSuccessResponse({ 
        url: publicUrl, 
        filename: fileName,
        size: file.size,
        type: file.type
    }, "File uploaded successfully");
});
