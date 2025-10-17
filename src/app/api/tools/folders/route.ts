import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";
import {
    validateRequiredFields,
    createSuccessResponse,
    AuthenticatedUser,
} from "@/lib/api-utils";
import { TypedSupabaseClient } from "@/types/supabase";
import { ApiTemplateFolder, FolderTreeNode, ApiRequestTemplate } from "@/types";

// GET - Get all folders with tree structure
export const GET = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient
    ) => {
        try {
            // Fetch all folders for current user
            const { data: folders, error: foldersError } = await supabase
                .from("api_template_folders")
                .select("*")
                .eq("created_by", user.id)
                .order("name", { ascending: true });

            if (foldersError) {
                console.error("[GET /api/tools/folders] Error:", foldersError);
                return NextResponse.json(
                    { error: foldersError.message },
                    { status: 500 }
                );
            }

            // Fetch all templates for current user
            const { data: templates, error: templatesError } = await supabase
                .from("api_request_templates")
                .select("*")
                .eq("created_by", user.id);

            if (templatesError) {
                console.error("[GET /api/tools/folders] Templates error:", templatesError);
                return NextResponse.json(
                    { error: templatesError.message },
                    { status: 500 }
                );
            }

            // Build folder tree
            const folderTree = buildFolderTree(folders || [], templates || []);

            return createSuccessResponse(
                { folders: folders || [], tree: folderTree, templates: templates || [] },
                "Folders fetched successfully"
            );
        } catch (error) {
            console.error("[GET /api/tools/folders] Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
);

// POST - Create new folder
export const POST = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient
    ) => {
        try {
            const body = await request.json();
            const { name, description, parent_id } = body;

            // Validate required fields
            const validation = validateRequiredFields(body, ["name"]);
            if (!validation.isValid) {
                return NextResponse.json({ error: validation.error }, { status: 400 });
            }

            // Insert folder
            const { data: folder, error: insertError } = await supabase
                .from("api_template_folders")
                .insert({
                    name,
                    description: description || null,
                    parent_id: parent_id || null,
                    created_by: user.id,
                })
                .select()
                .single();

            if (insertError) {
                console.error("[POST /api/tools/folders] Insert error:", insertError);
                return NextResponse.json(
                    { error: insertError.message || "Failed to create folder" },
                    { status: 500 }
                );
            }

            return createSuccessResponse(folder, "Folder created successfully");
        } catch (error) {
            console.error("[POST /api/tools/folders] Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
);

// PUT - Update folder
export const PUT = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient
    ) => {
        try {
            const body = await request.json();
            const { id, ...updates } = body;

            if (!id) {
                return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
            }

            // Update folder
            const { data: folder, error: updateError } = await supabase
                .from("api_template_folders")
                .update(updates)
                .eq("id", id)
                .eq("created_by", user.id)
                .select()
                .single();

            if (updateError) {
                console.error("[PUT /api/tools/folders] Update error:", updateError);
                return NextResponse.json(
                    { error: updateError.message || "Failed to update folder" },
                    { status: 500 }
                );
            }

            if (!folder) {
                return NextResponse.json(
                    { error: "Folder not found or access denied" },
                    { status: 404 }
                );
            }

            return createSuccessResponse(folder, "Folder updated successfully");
        } catch (error) {
            console.error("[PUT /api/tools/folders] Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
);

// DELETE - Delete folder
export const DELETE = withAuth(
    async (
        request: NextRequest,
        user: AuthenticatedUser,
        supabase: TypedSupabaseClient
    ) => {
        try {
            const { searchParams } = new URL(request.url);
            const id = searchParams.get("id");

            if (!id) {
                return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
            }

            // Check if folder has templates
            const { data: templates, error: checkError } = await supabase
                .from("api_request_templates")
                .select("id")
                .eq("folder_id", id)
                .eq("created_by", user.id);

            if (checkError) {
                console.error("[DELETE /api/tools/folders] Check error:", checkError);
                return NextResponse.json(
                    { error: checkError.message },
                    { status: 500 }
                );
            }

            if (templates && templates.length > 0) {
                return NextResponse.json(
                    { error: `Cannot delete folder with ${templates.length} template(s). Move or delete templates first.` },
                    { status: 400 }
                );
            }

            // Delete folder
            const { error: deleteError } = await supabase
                .from("api_template_folders")
                .delete()
                .eq("id", id)
                .eq("created_by", user.id);

            if (deleteError) {
                console.error("[DELETE /api/tools/folders] Delete error:", deleteError);
                return NextResponse.json(
                    { error: deleteError.message },
                    { status: 500 }
                );
            }

            return createSuccessResponse(null, "Folder deleted successfully");
        } catch (error) {
            console.error("[DELETE /api/tools/folders] Error:", error);
            return NextResponse.json(
                { error: error instanceof Error ? error.message : "Internal server error" },
                { status: 500 }
            );
        }
    }
);

// Helper function to build folder tree
function buildFolderTree(
    folders: ApiTemplateFolder[],
    templates: ApiRequestTemplate[]
): FolderTreeNode[] {
    const folderMap = new Map<string, FolderTreeNode>();
    const rootFolders: FolderTreeNode[] = [];

    // Create folder nodes
    folders.forEach((folder) => {
        const node: FolderTreeNode = {
            id: folder.id,
            name: folder.name,
            description: folder.description,
            parent_id: folder.parent_id,
            children: [],
            templates: [],
            templateCount: 0,
        };
        folderMap.set(folder.id, node);
    });

    // Assign templates to folders
    templates.forEach((template) => {
        if (template.folder_id) {
            const folder = folderMap.get(template.folder_id);
            if (folder) {
                folder.templates.push(template);
                folder.templateCount++;
            }
        }
    });

    // Build tree hierarchy
    folders.forEach((folder) => {
        const node = folderMap.get(folder.id);
        if (!node) return;

        if (folder.parent_id) {
            const parent = folderMap.get(folder.parent_id);
            if (parent) {
                parent.children.push(node);
                // Propagate template count up
                parent.templateCount += node.templateCount;
            }
        } else {
            rootFolders.push(node);
        }
    });

    return rootFolders;
}
