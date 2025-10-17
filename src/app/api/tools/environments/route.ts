import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    executeQuery,
    AuthenticatedUser
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";
import { encrypt, decrypt } from "@/lib/encryption";

export const GET = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (id) {
        // Get single environment
        const query = supabase
            .from("api_environments")
            .select("*")
            .eq("id", id)
            .single();
        
        const { data, error } = await executeQuery(query, "fetching environment");
        
        if (error) return error;
        
        // Decrypt passwords for display (masked)
        if (data) {
            if (data.pass_master) {
                try {
                    decrypt(data.pass_master); // Validate it can be decrypted
                    data.pass_master = "********"; // Don't send actual password
                } catch {
                    data.pass_master = null;
                }
            }
            if (data.pass_root) {
                try {
                    decrypt(data.pass_root);
                    data.pass_root = "********";
                } catch {
                    data.pass_root = null;
                }
            }
        }
        
        return createSuccessResponse(data, "Environment fetched successfully");
    }
    
    // Get all environments
    const query = supabase
        .from("api_environments")
        .select("*")
        .order("created_at", { ascending: false });
    
    const { data, error } = await executeQuery(query, "fetching environments");
    
    if (error) return error;
    
    // Mask passwords in list view
    const maskedData = (data as any[])?.map(env => ({
        ...env,
        pass_master: env.pass_master ? "********" : null,
        pass_root: env.pass_root ? "********" : null,
    }));
    
    return createSuccessResponse(maskedData, "Environments fetched successfully");
});

export const POST = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
    const body = await request.json();
    const { name, description, host, headers, base_params, user_code, pass_master, pass_root, is_active } = body;
    
    console.log("[POST /api/tools/environments] Creating environment:", { name, host });
    
    // Validate required fields
    const validation = validateRequiredFields(body, ["name", "host"]);
    if (!validation.isValid) {
        console.error("[POST /api/tools/environments] Validation failed:", validation.error);
        return validation.error!;
    }
    
    // Validate and parse JSON fields
    let parsedHeaders = {};
    let parsedBaseParams = {};
    
    try {
        if (headers && typeof headers === 'string') {
            parsedHeaders = JSON.parse(headers);
        } else if (headers && typeof headers === 'object') {
            parsedHeaders = headers;
        }
    } catch (error) {
        return NextResponse.json({ error: "Invalid JSON format for headers" }, { status: 400 });
    }
    
    try {
        if (base_params && typeof base_params === 'string') {
            parsedBaseParams = JSON.parse(base_params);
        } else if (base_params && typeof base_params === 'object') {
            parsedBaseParams = base_params;
        }
    } catch (error) {
        return NextResponse.json({ error: "Invalid JSON format for base_params" }, { status: 400 });
    }
    
    // Encrypt passwords
    const encryptedPassMaster = pass_master ? encrypt(pass_master) : null;
    const encryptedPassRoot = pass_root ? encrypt(pass_root) : null;
    
    // Create environment
    const environmentData = {
        name,
        description: description || null,
        host,
        headers: parsedHeaders,
        base_params: parsedBaseParams,
        user_code: user_code || null,
        pass_master: encryptedPassMaster,
        pass_root: encryptedPassRoot,
        is_active: is_active !== undefined ? is_active : true,
        created_by: user.id,
    };
    
    console.log("[POST /api/tools/environments] Environment data:", { ...environmentData, pass_master: '***', pass_root: '***' });
    
    const insertQuery = supabase.from("api_environments").insert(environmentData).select().single();
    const { data, error } = await executeQuery(insertQuery, "creating environment");
    
    if (error) {
        console.error("[POST /api/tools/environments] Creation failed:", error);
        return error;
    }
    
    // Mask passwords in response
    const responseData = {
        ...data,
        pass_master: data.pass_master ? "********" : null,
        pass_root: data.pass_root ? "********" : null,
    };
    
    console.log("[POST /api/tools/environments] Environment created successfully");
    return createSuccessResponse(responseData, "Environment created successfully");
});

export const PUT = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
    const body = await request.json();
    const { id, name, description, host, headers, base_params, user_code, pass_master, pass_root, is_active } = body;
    
    console.log("[PUT /api/tools/environments] Updating environment:", { id, name });
    
    // Validate required fields
    const validation = validateRequiredFields(body, ["id", "name", "host"]);
    if (!validation.isValid) {
        console.error("[PUT /api/tools/environments] Validation failed:", validation.error);
        return validation.error!;
    }
    
    // Validate and parse JSON fields
    let parsedHeaders = {};
    let parsedBaseParams = {};
    
    try {
        if (headers && typeof headers === 'string') {
            parsedHeaders = JSON.parse(headers);
        } else if (headers && typeof headers === 'object') {
            parsedHeaders = headers;
        }
    } catch (error) {
        return NextResponse.json({ error: "Invalid JSON format for headers" }, { status: 400 });
    }
    
    try {
        if (base_params && typeof base_params === 'string') {
            parsedBaseParams = JSON.parse(base_params);
        } else if (base_params && typeof base_params === 'object') {
            parsedBaseParams = base_params;
        }
    } catch (error) {
        return NextResponse.json({ error: "Invalid JSON format for base_params" }, { status: 400 });
    }
    
    // Build update data
    const updateData: any = {
        name,
        description: description || null,
        host,
        headers: parsedHeaders,
        base_params: parsedBaseParams,
        user_code: user_code || null,
        is_active: is_active !== undefined ? is_active : true,
    };
    
    // Only encrypt and update passwords if they are provided and not masked
    if (pass_master && pass_master !== "********") {
        updateData.pass_master = encrypt(pass_master);
    }
    if (pass_root && pass_root !== "********") {
        updateData.pass_root = encrypt(pass_root);
    }
    
    const updateQuery = supabase
        .from("api_environments")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
    
    const { data, error } = await executeQuery(updateQuery, "updating environment");
    
    if (error) {
        console.error("[PUT /api/tools/environments] Update failed:", error);
        return error;
    }
    
    // Mask passwords in response
    const responseData = {
        ...data,
        pass_master: data.pass_master ? "********" : null,
        pass_root: data.pass_root ? "********" : null,
    };
    
    console.log("[PUT /api/tools/environments] Environment updated successfully");
    return createSuccessResponse(responseData, "Environment updated successfully");
});

export const DELETE = withAdmin(async (request: NextRequest, user: AuthenticatedUser, supabase: TypedSupabaseClient) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    console.log("[DELETE /api/tools/environments] Deleting environment:", id);
    
    if (!id) {
        return NextResponse.json({ error: "Environment ID is required" }, { status: 400 });
    }
    
    const deleteQuery = supabase
        .from("api_environments")
        .delete()
        .eq("id", id);
    
    const { error } = await executeQuery(deleteQuery, "deleting environment");
    
    if (error) {
        console.error("[DELETE /api/tools/environments] Delete failed:", error);
        return error;
    }
    
    console.log("[DELETE /api/tools/environments] Environment deleted successfully");
    return createSuccessResponse({ id }, "Environment deleted successfully");
});
