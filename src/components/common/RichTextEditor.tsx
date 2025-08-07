import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Bold,
    Italic,
    Underline,
    List,
    Link,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Image,
    Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabase/browser-client";
import LinkModal from "../modals/LinkModal";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
    maxHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = "Nhập nội dung...",
    className = "",
    minHeight = "min-h-32",
    maxHeight,
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedText, setSelectedText] = useState("");
    const [savedSelection, setSavedSelection] = useState<Range | null>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const formatText = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        e.preventDefault();

        const clipboardData = e.clipboardData;

        // Check if there are images in clipboard
        const items = Array.from(clipboardData.items);
        const imageItem = items.find((item) => item.type.startsWith("image/"));

        if (imageItem) {
            // Handle image paste
            const file = imageItem.getAsFile();
            if (file) {
                await handleImageUpload(file);
                return;
            }
        }

        // Handle text paste - check if it's a URL
        const text = clipboardData.getData("text/plain").trim();

        // Check if the pasted text is a URL
        const urlRegex = /^https?:\/\/[^\s]+$/i;
        if (urlRegex.test(text)) {
            // Check if it's an image URL
            const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i;
            const imageHostingServices =
                /(imgur\.com|flickr\.com|500px\.com|unsplash\.com|pexels\.com|pixabay\.com|via\.placeholder\.com)/i;

            if (imageExtensions.test(text) || imageHostingServices.test(text)) {
                // If it's an image URL, insert as image
                insertImage(text, "Pasted Image");
            } else {
                // If it's a regular URL, insert as clickable link
                insertLink(text, text);
            }
        } else {
            // Regular text paste
            document.execCommand("insertText", false, text);
        }

        handleInput();
    };

    const saveSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            return selection.getRangeAt(0).cloneRange();
        }
        return null;
    };

    const restoreSelection = (range: Range) => {
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
    };

    const openLinkModal = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const text = range.toString().trim();

            // Save the current selection
            setSavedSelection(range.cloneRange());
            setSelectedText(text);
        } else {
            setSavedSelection(null);
            setSelectedText("");
        }

        setShowLinkModal(true);
    };

    const insertLink = (url: string, text: string) => {
        editorRef.current?.focus();

        if (savedSelection) {
            // Restore the saved selection
            restoreSelection(savedSelection);

            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                // Create link element
                const link = document.createElement("a");
                link.href = url;
                link.textContent = text;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.style.color = "#2563eb";
                link.style.textDecoration = "underline";

                // Replace selected content with link
                range.deleteContents();
                range.insertNode(link);

                // Move cursor after link
                range.setStartAfter(link);
                range.setEndAfter(link);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        } else {
            // No selection, insert at cursor position
            const link = document.createElement("a");
            link.href = url;
            link.textContent = text;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.style.color = "#2563eb";
            link.style.textDecoration = "underline";

            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.insertNode(link);

                // Move cursor after link
                range.setStartAfter(link);
                range.setEndAfter(link);
                selection.removeAllRanges();
                selection.addRange(range);
            } else {
                // Fallback: append to editor
                editorRef.current?.appendChild(link);
            }
        }

        handleInput();
    };

    const handleImageUpload = async (file: File) => {
        setUploading(true);
        try {
            // Get current user session
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session) {
                alert("Bạn cần đăng nhập để upload ảnh");
                return;
            }

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload/image", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                // Insert image into editor
                insertImage(result.url, file.name);
            } else {
                alert(result.error || "Lỗi upload ảnh");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Lỗi upload ảnh");
        } finally {
            setUploading(false);
        }
    };

    const insertImage = (url: string, alt: string = "") => {
        const img = document.createElement("img");
        img.src = url;
        img.alt = alt;
        img.style.maxWidth = "250px";
        img.style.maxHeight = "250px";
        img.style.width = "auto";
        img.style.height = "auto";
        img.style.margin = "8px 0";
        img.style.borderRadius = "4px";
        img.style.border = "1px solid #e5e7eb";
        img.style.objectFit = "contain";

        // Insert image at cursor position
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);

            // Move cursor after image
            range.setStartAfter(img);
            range.setEndAfter(img);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // Fallback: append to editor
            editorRef.current?.appendChild(img);
        }

        editorRef.current?.focus();
        handleInput();
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/gif",
                "image/webp",
            ];
            if (!allowedTypes.includes(file.type)) {
                alert("Chỉ hỗ trợ file ảnh: JPEG, PNG, GIF, WebP");
                return;
            }

            // Validate file size (5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                alert("File quá lớn. Tối đa 5MB");
                return;
            }

            handleImageUpload(file);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const openImageUpload = () => {
        fileInputRef.current?.click();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Handle Tab key
        if (e.key === "Tab") {
            e.preventDefault();
            document.execCommand("insertText", false, "\t");
            handleInput();
            return;
        }

        // Handle Enter key in lists
        if (e.key === "Enter") {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;

                // Check if we're inside a list item
                const listItem =
                    container.nodeType === Node.ELEMENT_NODE
                        ? (container as Element).closest("li")
                        : container.parentElement?.closest("li");

                if (listItem) {
                    const list = listItem.parentElement;
                    if (
                        list &&
                        (list.tagName === "UL" || list.tagName === "OL")
                    ) {
                        // If the list item is empty, create a new list item
                        if (listItem.textContent?.trim() === "") {
                            e.preventDefault();
                            document.execCommand("outdent", false);
                            handleInput();
                            return;
                        }
                    }
                }
            }
        }

        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case "b":
                    e.preventDefault();
                    formatText("bold");
                    break;
                case "i":
                    e.preventDefault();
                    formatText("italic");
                    break;
                case "u":
                    e.preventDefault();
                    formatText("underline");
                    break;
            }
        }
    };

    const toggleBulletList = () => {
        // Focus the editor first
        editorRef.current?.focus();

        // Check if current selection is already in a list
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;

            // Check if we're inside a list
            let listElement =
                container.nodeType === Node.ELEMENT_NODE
                    ? (container as Element).closest("ul, ol")
                    : container.parentElement?.closest("ul, ol");

            if (listElement) {
                // If already in a list, remove the list formatting
                document.execCommand("outdent", false);
            } else {
                // If not in a list, create a new bullet list
                document.execCommand("insertUnorderedList", false);
            }
        } else {
            // No selection, just insert a new list
            document.execCommand("insertUnorderedList", false);
        }

        // Force a re-render to ensure proper styling
        setTimeout(() => {
            handleInput();
        }, 10);
    };

    return (
        <div className={`border rounded-md ${className}`}>
            {/* Toolbar */}
            <div className="border-b p-2 flex flex-wrap gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("bold")}
                    className="h-8 w-8 p-0"
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("italic")}
                    className="h-8 w-8 p-0"
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("underline")}
                    className="h-8 w-8 p-0"
                    title="Underline (Ctrl+U)"
                >
                    <Underline className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("justifyLeft")}
                    className="h-8 w-8 p-0"
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("justifyCenter")}
                    className="h-8 w-8 p-0"
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatText("justifyRight")}
                    className="h-8 w-8 p-0"
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleBulletList}
                    className="h-8 w-8 p-0"
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={openLinkModal}
                    className="h-8 w-8 p-0"
                    title="Insert Link"
                >
                    <Link className="w-4 h-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={openImageUpload}
                    disabled={uploading}
                    className="h-8 w-8 p-0"
                    title="Upload Image"
                >
                    {uploading ? (
                        <Upload className="w-4 h-4 animate-spin" />
                    ) : (
                        <Image className="w-4 h-4" />
                    )}
                </Button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        if (editorRef.current) {
                            editorRef.current.innerHTML = "";
                            handleInput();
                        }
                    }}
                    className="h-8 px-2 text-xs"
                    title="Clear All Content"
                >
                    Clear
                </Button>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className={`rich-text-content p-3 focus:outline-none ${minHeight} ${
                    maxHeight || ""
                } overflow-y-auto`}
                style={{
                    minHeight: "80px",
                }}
                suppressContentEditableWarning={true}
                data-placeholder={placeholder}
            />

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
            />

            {/* Link Modal */}
            <LinkModal
                isOpen={showLinkModal}
                onClose={() => setShowLinkModal(false)}
                onConfirm={insertLink}
                selectedText={selectedText}
            />

            <style jsx global>{`
                .rich-text-content {
                    line-height: 1.6;
                }

                .rich-text-content a {
                    color: #2563eb;
                    text-decoration: underline;
                    word-break: break-all;
                }

                .rich-text-content a:hover {
                    color: #1d4ed8;
                }

                .rich-text-content .auto-link {
                    color: #2563eb;
                    text-decoration: underline;
                    word-break: break-all;
                }

                .rich-text-content .auto-link:hover {
                    color: #1d4ed8;
                }

                .rich-text-content ul {
                    margin: 8px 0;
                    padding-left: 20px;
                    list-style-type: disc;
                    list-style-position: outside;
                }

                .rich-text-content ol {
                    margin: 8px 0;
                    padding-left: 20px;
                    list-style-type: decimal;
                    list-style-position: outside;
                }

                .rich-text-content li {
                    margin: 4px 0;
                    display: list-item;
                    padding-left: 4px;
                }

                .rich-text-content li::marker {
                    color: #6b7280;
                }

                .rich-text-content img {
                    max-width: 250px !important;
                    max-height: 250px !important;
                    height: auto;
                    margin: 8px 0;
                    border-radius: 4px;
                    border: 1px solid #e5e7eb;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                    object-fit: contain;
                }

                .rich-text-content img:hover {
                    transform: scale(1.02);
                }

                .rich-text-content p {
                    margin: 8px 0;
                }

                /* Editor specific styles */
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }

                [contenteditable].rich-text-content img {
                    max-width: 250px !important;
                    max-height: 250px !important;
                }
            `}</style>
        </div>
    );
};

export default RichTextEditor;
